-- ================================================================
-- 1. Drop foreign key constraint from orders
-- ================================================================
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_zone_id_fkey;

-- ================================================================
-- 2. Drop existing objects
-- ================================================================
DROP FUNCTION IF EXISTS public.get_delivery_charge(text, numeric);
DROP TABLE IF EXISTS public.delivery_charges;
DROP TABLE IF EXISTS public.delivery_zones;

-- ================================================================
-- 3. Create tables
-- ================================================================
CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pincodes text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  min_order_value numeric DEFAULT 0,
  max_order_value numeric,
  charge numeric NOT NULL CHECK (charge >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- 4. RLS policies
-- ================================================================
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON public.delivery_charges FOR SELECT USING (true);
CREATE POLICY "Allow all for admins" ON public.delivery_zones FOR ALL USING (public.is_admin());
CREATE POLICY "Allow all for admins" ON public.delivery_charges FOR ALL USING (public.is_admin());

-- ================================================================
-- 5. Re-add foreign key constraint to orders
-- (in case you want to keep the relationship)
-- ================================================================
ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_zone_id_fkey 
  FOREIGN KEY (delivery_zone_id) REFERENCES public.delivery_zones(id);

-- ================================================================
-- 6. Create function
-- ================================================================
CREATE OR REPLACE FUNCTION public.get_delivery_charge(
  p_pincode text,
  p_subtotal numeric
)
RETURNS TABLE(charge numeric, zone_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_zone_ids
  FROM public.delivery_zones
  WHERE p_pincode = ANY(pincodes);

  IF v_zone_ids IS NULL OR array_length(v_zone_ids, 1) = 0 THEN
    RETURN QUERY SELECT 0::numeric, NULL::uuid;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    dc.charge,
    dc.zone_id
  FROM public.delivery_charges dc
  WHERE dc.zone_id = ANY(v_zone_ids)
    AND dc.is_active = true
    AND (dc.min_order_value IS NULL OR dc.min_order_value <= p_subtotal)
    AND (dc.max_order_value IS NULL OR dc.max_order_value >= p_subtotal)
  ORDER BY dc.min_order_value DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::numeric, v_zone_ids[1];
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_delivery_charge(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_delivery_charge(text, numeric) TO anon;

-- ================================================================
-- 7. Insert sample data
-- ================================================================
INSERT INTO public.delivery_zones (id, name, pincodes)
VALUES (
  'b20ac667-bdc6-4b53-a3b9-5156c4c834a8',
  'Mangalore Zone',
  ARRAY['575001', '575002', '575003']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.delivery_charges (zone_id, min_order_value, max_order_value, charge)
VALUES (
  'b20ac667-bdc6-4b53-a3b9-5156c4c834a8',
  0,
  5000,
  10
) ON CONFLICT DO NOTHING;