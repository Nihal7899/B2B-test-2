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
