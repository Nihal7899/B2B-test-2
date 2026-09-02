-- 1. Ensure current_cod_balance column exists on profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_cod_balance numeric NOT NULL DEFAULT 0 CHECK (current_cod_balance >= 0);

-- 2. Drop existing functions to prevent signature collision (Error 42P13 fix)
DROP FUNCTION IF EXISTS public.get_delivery_partners_cod_summary();
DROP FUNCTION IF EXISTS public.record_cod_settlement(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.complete_delivery(uuid, text);
DROP FUNCTION IF EXISTS public.complete_delivery(uuid, order_status);

-- 3. Atomic transition and COD balance increment RPC
CREATE OR REPLACE FUNCTION public.complete_delivery(
  p_assignment_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_driver_id uuid;
  v_cod_amount numeric := 0;
  v_target_status order_status;
BEGIN
  v_target_status := p_status::order_status;

  SELECT order_id, delivery_partner_id
  INTO v_order_id, v_driver_id
  FROM public.delivery_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Assignment not found';
  END IF;

  UPDATE public.delivery_assignments
  SET status = v_target_status,
      delivered_at = CASE WHEN v_target_status = 'delivered' THEN now() ELSE delivered_at END,
      picked_up_at = CASE WHEN v_target_status = 'out_for_delivery' AND picked_up_at IS NULL THEN now() ELSE picked_up_at END,
      updated_at = now()
  WHERE id = p_assignment_id;

  UPDATE public.orders
  SET status = v_target_status,
      updated_at = now()
  WHERE id = v_order_id;

  IF v_target_status = 'delivered' THEN
    SELECT COALESCE(amount, 0)
    INTO v_cod_amount
    FROM public.payments
    WHERE order_id = v_order_id 
      AND LOWER(provider::text) = 'cod'
    LIMIT 1;

    IF v_cod_amount > 0 THEN
      UPDATE public.payments
      SET status = 'paid'::payment_status,
          updated_at = now()
      WHERE order_id = v_order_id 
        AND LOWER(provider::text) = 'cod';

      UPDATE public.profiles
      SET current_cod_balance = current_cod_balance + v_cod_amount,
          updated_at = now()
      WHERE id = v_driver_id;
    END IF;
  END IF;
END;
$$;

-- 4. Atomic settlement deduction RPC
CREATE OR REPLACE FUNCTION public.record_cod_settlement(
  p_delivery_partner_id uuid,
  p_amount numeric,
  p_payment_mode text DEFAULT 'cash',
  p_notes text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settlement_id uuid;
  v_admin_id uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_admin_id AND role::text = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can record COD settlements';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Settlement amount must be greater than 0';
  END IF;

  INSERT INTO public.delivery_partner_cod_settlements (
    delivery_partner_id,
    amount,
    cleared_by,
    payment_mode,
    notes
  )
  VALUES (
    p_delivery_partner_id,
    p_amount,
    v_admin_id,
    p_payment_mode,
    p_notes
  )
  RETURNING id INTO v_settlement_id;

  UPDATE public.profiles
  SET current_cod_balance = GREATEST(0, current_cod_balance - p_amount),
      updated_at = now()
  WHERE id = p_delivery_partner_id;

  RETURN v_settlement_id;
END;
$$;

-- 5. Fast O(1) Admin summary query (retains exact 7 return columns)
CREATE OR REPLACE FUNCTION public.get_delivery_partners_cod_summary()
RETURNS TABLE (
  delivery_partner_id uuid,
  driver_name text,
  phone text,
  total_cod_collected numeric,
  total_cod_settled numeric,
  outstanding_balance numeric,
  last_settled_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id AS delivery_partner_id,
    COALESCE(NULLIF(TRIM(p.full_name), ''), NULLIF(TRIM(p.personal_name), ''), 'Delivery Partner') AS driver_name,
    COALESCE(p.phone, '') AS phone,
    (COALESCE(p.current_cod_balance, 0) + COALESCE(s.total_settled, 0))::numeric AS total_cod_collected,
    COALESCE(s.total_settled, 0)::numeric AS total_cod_settled,
    COALESCE(p.current_cod_balance, 0)::numeric AS outstanding_balance,
    s.last_settled AS last_settled_at
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  LEFT JOIN (
    SELECT 
      delivery_partner_id,
      SUM(amount) AS total_settled,
      MAX(created_at) AS last_settled
    FROM public.delivery_partner_cod_settlements
    GROUP BY delivery_partner_id
  ) s ON s.delivery_partner_id = p.id
  WHERE ur.role::text = 'delivery_partner'
  ORDER BY p.current_cod_balance DESC, p.full_name ASC;
$$;

-- 6. Backfill current_cod_balance for existing delivered orders
UPDATE public.profiles p
SET current_cod_balance = COALESCE(sub.net_due, 0)
FROM (
  SELECT 
    da.delivery_partner_id,
    GREATEST(0, COALESCE(SUM(pay.amount), 0) - COALESCE(settled.total_settled, 0)) AS net_due
  FROM public.delivery_assignments da
  JOIN public.payments pay ON pay.order_id = da.order_id 
    AND LOWER(pay.provider::text) = 'cod' 
    AND LOWER(pay.status::text) IN ('paid', 'completed')
  LEFT JOIN (
    SELECT delivery_partner_id, SUM(amount) AS total_settled
    FROM public.delivery_partner_cod_settlements
    GROUP BY delivery_partner_id
  ) settled ON settled.delivery_partner_id = da.delivery_partner_id
  WHERE da.status::text = 'delivered'
  GROUP BY da.delivery_partner_id, settled.total_settled
) sub
WHERE p.id = sub.delivery_partner_id;

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
