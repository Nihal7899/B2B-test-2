-- 1. Modify payments constraints for split payments & top-ups
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_order_id_key;
ALTER TABLE public.payments ALTER COLUMN order_id DROP NOT NULL;

-- 2. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency text NOT NULL DEFAULT 'INR',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Create Wallet Transactions Ledger Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  purpose text NOT NULL CHECK (purpose IN ('topup', 'order_payment', 'refund', 'cashback', 'adjustment')),
  reference_id text,
  description text NOT NULL DEFAULT '',
  balance_after numeric NOT NULL CHECK (balance_after >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE,
  CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Enable Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role wallet mutations" ON public.wallets;
CREATE POLICY "Service role wallet mutations"
  ON public.wallets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role wallet transactions mutations" ON public.wallet_transactions;
CREATE POLICY "Service role wallet transactions mutations"
  ON public.wallet_transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref ON public.wallet_transactions(reference_id);

-- 6. Trigger to automatically initialize wallet for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_wallet_created ON public.profiles;
CREATE TRIGGER on_profile_wallet_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- 7. Atomic RPC: Top-up Wallet
CREATE OR REPLACE FUNCTION public.topup_wallet(
  p_amount numeric,
  p_reference_id text,
  p_description text DEFAULT 'Wallet Top-up'
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_wallet record;
  v_new_balance numeric;
  v_tx_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Top-up amount must be greater than zero';
  END IF;

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (v_user_id, p_amount)
    RETURNING * INTO v_wallet;
    v_new_balance := p_amount;
  ELSE
    v_new_balance := v_wallet.balance + p_amount;
    UPDATE public.wallets
    SET balance = v_new_balance, updated_at = now()
    WHERE id = v_wallet.id;
  END IF;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, amount, type, purpose, reference_id, description, balance_after
  ) VALUES (
    v_wallet.id, v_user_id, p_amount, 'credit', 'topup', p_reference_id, p_description, v_new_balance
  ) RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Atomic RPC: Pay with Wallet (Split or Full)
-- 1. Pay with Wallet using status: 'paid'
CREATE OR REPLACE FUNCTION public.pay_with_wallet(
  p_order_id uuid,
  p_amount numeric
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_wallet record;
  v_new_balance numeric;
  v_tx_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  v_new_balance := v_wallet.balance - p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, amount, type, purpose, reference_id, description, balance_after
  ) VALUES (
    v_wallet.id, v_user_id, p_amount, 'debit', 'order_payment', p_order_id::text,
    'Wallet payment for order #' || p_order_id::text, v_new_balance
  ) RETURNING id INTO v_tx_id;

  INSERT INTO public.payments (
    order_id,
    user_id,
    provider,
    amount,
    status
  ) VALUES (
    p_order_id,
    v_user_id,
    'wallet',
    p_amount,
    'paid'
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'debited_amount', p_amount,
    'remaining_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.refund_wallet_payment(
  p_order_id uuid,
  p_reason text DEFAULT 'Order cancelled / Checkout aborted'
)
RETURNS jsonb AS $$
DECLARE
  v_tx record;
  v_wallet record;
  v_new_balance numeric;
BEGIN
  -- 1. Idempotency Check: Prevent duplicate refunds for the same order
  IF EXISTS (
    SELECT 1 
    FROM public.wallet_transactions
    WHERE reference_id = p_order_id::text
      AND type = 'credit'
      AND purpose = 'refund'
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Order wallet deduction has already been refunded');
  END IF;

  -- 2. Check if a valid wallet debit exists for this order
  SELECT * INTO v_tx
  FROM public.wallet_transactions
  WHERE reference_id = p_order_id::text
    AND type = 'debit'
    AND purpose = 'order_payment'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'No wallet deduction found for this order');
  END IF;

  -- 3. Lock user wallet row for update
  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_tx.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Wallet not found');
  END IF;

  v_new_balance := v_wallet.balance + v_tx.amount;

  -- 4. Restore wallet balance
  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet.id;

  -- 5. Record refund credit entry in ledger
  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, amount, type, purpose, reference_id, description, balance_after
  ) VALUES (
    v_wallet.id, v_tx.user_id, v_tx.amount, 'credit', 'refund',
    p_order_id::text, p_reason, v_new_balance
  );

  -- 6. Mark payment record as refunded/cancelled
  UPDATE public.payments
  SET status = 'cancelled', updated_at = now()
  WHERE order_id = p_order_id AND provider = 'wallet';

  RETURN jsonb_build_object(
    'success', true,
    'refunded_amount', v_tx.amount,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.handle_order_cancellation_refund()
RETURNS trigger AS $$
BEGIN
  -- Strict guard: Fire ONLY when transitioning from non-cancelled to cancelled
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    PERFORM public.refund_wallet_payment(
      NEW.id,
      'Auto-refund: Order cancelled (Timeout / Aborted / Admin)'
    );

    UPDATE public.payments
    SET status = 'cancelled', updated_at = now()
    WHERE order_id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_cancellation_wallet_refund ON public.orders;
CREATE TRIGGER trg_order_cancellation_wallet_refund
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_cancellation_refund();





ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'refunded';


CREATE OR REPLACE FUNCTION public.cleanup_stale_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_ids uuid[];
  v_count integer := 0;
BEGIN
  -- 1. Select strictly pending orders older than 15 minutes
  SELECT array_agg(o.id)
  INTO v_order_ids
  FROM public.orders o
  WHERE o.status = 'pending'
    AND o.updated_at < (now() - interval '15 minutes')
    -- Ignore COD orders (fulfilled on delivery)
    AND NOT EXISTS (
      SELECT 1 
      FROM public.payments p_cod 
      WHERE p_cod.order_id = o.id 
        AND p_cod.provider = 'cod'
    )
    -- Ignore orders where Razorpay payment succeeded
    AND NOT EXISTS (
      SELECT 1 
      FROM public.payments p_rzp 
      WHERE p_rzp.order_id = o.id 
        AND p_rzp.provider = 'razorpay' 
        AND p_rzp.status = 'paid'
    )
    -- Ignore orders that are already 100% paid by wallet
    AND COALESCE(
      (SELECT SUM(p_w.amount) 
       FROM public.payments p_w 
       WHERE p_w.order_id = o.id 
         AND p_w.provider = 'wallet' 
         AND p_w.status = 'paid'), 0
    ) < o.total;

  -- 2. Exit if no stale orders found
  IF v_order_ids IS NULL OR array_length(v_order_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- 3. Cancel only orders that are still pending
  -- (Trigger automatically handles the refund once per order)
  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = ANY(v_order_ids)
    AND status = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- 4. Mark pending payment attempts as cancelled
  UPDATE public.payments
  SET status = 'cancelled', updated_at = now()
  WHERE order_id = ANY(v_order_ids)
    AND status = 'pending';

  RETURN v_count;
END;
$$;


-- 1. Drop both competing overloaded signatures
DROP FUNCTION IF EXISTS public.update_order_status(uuid, public.order_status);
DROP FUNCTION IF EXISTS public.update_order_status(uuid, text);

-- 2. Re-create the single clean function accepting text
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status order_status;
BEGIN
  -- Authorization check
  IF NOT (public.is_admin() OR public.has_role('warehouse_manager')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Guard against bypassing stock deduction
  IF p_status = 'confirmed' THEN
    RAISE EXCEPTION 'Use confirm_order() to confirm an order and deduct stock.';
  END IF;

  -- Acquire row lock to prevent concurrency conflicts
  SELECT status INTO v_current_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Update status with explicit enum cast and refresh timestamp
  UPDATE public.orders
  SET status = p_status::order_status,
      updated_at = now()
  WHERE id = p_order_id;
END;
$$;



CREATE OR REPLACE FUNCTION public.confirm_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order public.orders%rowtype;
  v_item record;
  v_current_stock integer;
  v_product_name text;
BEGIN
  -- 1. Authorization check
  IF NOT (public.is_admin() OR public.has_role('warehouse_manager')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 2. Lock order row
  SELECT * INTO v_order 
  FROM public.orders 
  WHERE id = p_order_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status != 'pending' THEN
    RAISE EXCEPTION 'Only pending orders can be confirmed';
  END IF;

  -- 3. Lock & validate stock in deterministic order before updating
  FOR v_item IN 
    SELECT product_id, SUM(quantity)::integer AS quantity 
    FROM public.order_items 
    WHERE order_id = p_order_id 
    GROUP BY product_id 
    ORDER BY product_id ASC 
  LOOP
    -- Fetch and lock the product row to inspect stock
    SELECT stock_quantity, name 
    INTO v_current_stock, v_product_name
    FROM public.products 
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', v_item.product_id;
    END IF;

    -- Validate stock BEFORE the update to prevent CHECK constraint violations
    IF v_current_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%": Available %, Requested %',
        v_product_name, v_current_stock, v_item.quantity;
    END IF;

    -- Safe deduction
    UPDATE public.products
    SET stock_quantity = stock_quantity - v_item.quantity,
        updated_at = now()
    WHERE id = v_item.product_id;
  END LOOP;

  -- 4. Mark order confirmed
  UPDATE public.orders 
  SET status = 'confirmed', 
      updated_at = now() 
  WHERE id = p_order_id;
END;
$$;

-- 1. Grant Delivery Partners access to view payments for orders
DROP POLICY IF EXISTS "Staff and delivery can view payments" ON public.payments;
CREATE POLICY "Staff and delivery can view payments"
  ON public.payments FOR SELECT
  USING (
    auth.uid() = user_id 
    OR public.is_admin() 
    OR public.has_role('warehouse_manager')
    OR public.has_role('delivery_partner')
  );

-- 1. Drop both competing overloaded signatures
DROP FUNCTION IF EXISTS public.complete_delivery(uuid, public.order_status);
DROP FUNCTION IF EXISTS public.complete_delivery(uuid, text);

-- 2. Recreate single definitive function accepting text
CREATE OR REPLACE FUNCTION public.complete_delivery(
  p_assignment_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  -- 1. Verify assignment and lock row
  SELECT order_id INTO v_order_id
  FROM public.delivery_assignments
  WHERE id = p_assignment_id
    AND (delivery_partner_id = auth.uid() OR public.is_admin())
  FOR UPDATE;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Not authorized or assignment not found';
  END IF;

  -- 2. Transition assignment and order
  IF p_status = 'out_for_delivery' THEN
    UPDATE public.delivery_assignments
    SET status = p_status::order_status,
        picked_up_at = COALESCE(picked_up_at, now()),
        updated_at = now()
    WHERE id = p_assignment_id;

    UPDATE public.orders
    SET status = p_status::order_status,
        updated_at = now()
    WHERE id = v_order_id;

  ELSIF p_status = 'delivered' THEN
    UPDATE public.delivery_assignments
    SET status = p_status::order_status,
        delivered_at = now(),
        updated_at = now()
    WHERE id = p_assignment_id;

    UPDATE public.orders
    SET status = p_status::order_status,
        updated_at = now()
    WHERE id = v_order_id;

    -- 3. Automatically settle pending COD payment as paid
    UPDATE public.payments
    SET status = 'paid',
        updated_at = now()
    WHERE order_id = v_order_id
      AND provider = 'cod'
      AND status = 'pending';

  ELSE
    RAISE EXCEPTION 'Invalid delivery status: %', p_status;
  END IF;
END;
$$;


-- Add orders and delivery assignments to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'delivery_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
  END IF;
END $$;

