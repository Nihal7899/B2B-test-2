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
    'completed'
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'debited_amount', p_amount,
    'remaining_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Atomic RPC: Refund Wallet Payment
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
  SELECT * INTO v_tx
  FROM public.wallet_transactions
  WHERE reference_id = p_order_id::text
    AND type = 'debit'
    AND purpose = 'order_payment'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'No wallet deduction found');
  END IF;

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_tx.user_id
  FOR UPDATE;

  v_new_balance := v_wallet.balance + v_tx.amount;

  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, amount, type, purpose, reference_id, description, balance_after
  ) VALUES (
    v_wallet.id, v_tx.user_id, v_tx.amount, 'credit', 'refund',
    p_order_id::text, p_reason, v_new_balance
  );

  UPDATE public.payments
  SET status = 'cancelled'
  WHERE order_id = p_order_id AND provider = 'wallet';

  RETURN jsonb_build_object(
    'success', true,
    'refunded_amount', v_tx.amount,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Option 1 Trigger: Automatic Wallet Refund on Order Cancellation
CREATE OR REPLACE FUNCTION public.handle_order_cancellation_refund()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
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
