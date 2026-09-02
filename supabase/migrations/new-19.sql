-- 1. Fetch delivery partners with real profile names
CREATE OR REPLACE FUNCTION public.get_delivery_partners()
RETURNS TABLE (
  id uuid,
  name text,
  phone text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    COALESCE(NULLIF(TRIM(p.full_name), ''), NULLIF(TRIM(p.personal_name), ''), NULLIF(TRIM(p.business_name), ''), 'Delivery Partner') AS name,
    COALESCE(p.phone, '') AS phone
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'delivery_partner';
$$;

-- 2. Warehouse order cancellation RPC
CREATE OR REPLACE FUNCTION public.cancel_order_warehouse(
  p_order_id uuid,
  p_reason text DEFAULT 'Cancelled by warehouse'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status order_status;
BEGIN
  SELECT status INTO v_status
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel an order that is already %', v_status;
  END IF;

  UPDATE public.orders
  SET status = 'cancelled'::order_status,
      notes = CASE WHEN notes = '' THEN p_reason ELSE notes || ' | ' || p_reason END,
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.delivery_assignments
  SET status = 'cancelled'::order_status,
      updated_at = now()
  WHERE order_id = p_order_id;
END;
$$;

-- 1. Enable Full Replica Identity for row-level Realtime filters
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;

-- 2. Ensure both tables are in the realtime publication
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
    WHERE pubname = 'supabase_realtime' AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
END $$;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS staff_registration_status text NOT NULL DEFAULT 'unregistered'::text
CHECK (staff_registration_status = ANY (ARRAY['unregistered'::text, 'registered'::text]));

-- 1. Table to log COD settlements between delivery partners and admin
CREATE TABLE IF NOT EXISTS public.delivery_partner_cod_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_partner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  cleared_by uuid NOT NULL REFERENCES auth.users(id),
  payment_mode text NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'bank_transfer', 'upi')),
  notes text DEFAULT ''::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_partner_cod_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all settlements"
  ON public.delivery_partner_cod_settlements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    ) OR auth.uid() = delivery_partner_id
  );

CREATE POLICY "Admins can insert settlements"
  ON public.delivery_partner_cod_settlements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- 1. Drop existing function to avoid return-type conflict
DROP FUNCTION IF EXISTS public.get_delivery_partners_cod_summary();

-- 2. Re-create with explicit enum-to-text casts
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH driver_list AS (
    SELECT 
      ur.user_id,
      COALESCE(NULLIF(TRIM(p.full_name), ''), NULLIF(TRIM(p.personal_name), ''), NULLIF(TRIM(p.business_name), ''), 'Delivery Partner') AS name,
      COALESCE(p.phone, '') AS phone
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role::text = 'delivery_partner'
  ),
  collected AS (
    SELECT 
      da.delivery_partner_id,
      COALESCE(SUM(pay.amount), 0) AS total_collected
    FROM public.delivery_assignments da
    JOIN public.payments pay ON pay.order_id = da.order_id
    WHERE da.status::text = 'delivered'
      AND LOWER(pay.provider::text) = 'cod'
      AND LOWER(pay.status::text) IN ('paid', 'completed')
    GROUP BY da.delivery_partner_id
  ),
  settled AS (
    SELECT 
      s.delivery_partner_id,
      COALESCE(SUM(s.amount), 0) AS total_settled,
      MAX(s.created_at) AS last_settled
    FROM public.delivery_partner_cod_settlements s
    GROUP BY s.delivery_partner_id
  )
  SELECT 
    d.user_id AS delivery_partner_id,
    d.name AS driver_name,
    d.phone,
    COALESCE(c.total_collected, 0)::numeric AS total_cod_collected,
    COALESCE(s.total_settled, 0)::numeric AS total_cod_settled,
    (COALESCE(c.total_collected, 0) - COALESCE(s.total_settled, 0))::numeric AS outstanding_balance,
    s.last_settled AS last_settled_at
  FROM driver_list d
  LEFT JOIN collected c ON c.delivery_partner_id = d.user_id
  LEFT JOIN settled s ON s.delivery_partner_id = d.user_id
  ORDER BY (COALESCE(c.total_collected, 0) - COALESCE(s.total_settled, 0)) DESC, d.name ASC;
END;
$$;

-- 3. Ensure record_cod_settlement safely casts role
DROP FUNCTION IF EXISTS public.record_cod_settlement(uuid, numeric, text, text);

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

  RETURN v_settlement_id;
END;
$$;

-- 4. Force PostgREST to reload schema cache so 404 disappears immediately
NOTIFY pgrst, 'reload schema';