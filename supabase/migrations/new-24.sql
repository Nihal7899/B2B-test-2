-- 1. Ensure the authenticated role can read the user_roles table
GRANT SELECT ON public.user_roles TO authenticated;

-- 2. Drop the old policies that were causing Realtime to fail
DROP POLICY IF EXISTS "Warehouse managers can view orders" ON public.orders;
DROP POLICY IF EXISTS "Warehouse managers can view delivery assignments" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Warehouse managers can view payments" ON public.payments;

-- 3. Apply the new Realtime-safe policies
CREATE POLICY "Warehouse managers can view orders"
ON public.orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'warehouse_manager')
);

CREATE POLICY "Warehouse managers can view delivery assignments"
ON public.delivery_assignments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'warehouse_manager')
);

CREATE POLICY "Warehouse managers can view payments"
ON public.payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'warehouse_manager')
);

-- 4. Re-enable RLS to secure your data
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
