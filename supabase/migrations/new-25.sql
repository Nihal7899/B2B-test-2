-- 1. Remove the JWT policy we tried earlier
DROP POLICY IF EXISTS "Staff can view orders natively" ON public.orders;

-- 2. Restore your original Warehouse Manager SELECT policy
CREATE POLICY "Warehouse managers can view orders"
ON public.orders FOR SELECT
TO authenticated
USING (realtime_bypass_warehouse_check());

-- 3. Restore your original Admin SELECT policy
CREATE POLICY "Admins can view orders"
ON public.orders FOR SELECT
TO authenticated
USING (has_role_recursive_safe(auth.uid(), 'admin'::text));

-- 1. Create the 1-row signal table
CREATE TABLE IF NOT EXISTS warehouse_sync_signals (
  id INT PRIMARY KEY DEFAULT 1,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the row exists
INSERT INTO warehouse_sync_signals (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 2. Allow completely open read access to this specific table
ALTER TABLE warehouse_sync_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on sync signals" ON warehouse_sync_signals;
CREATE POLICY "Allow public read on sync signals" ON warehouse_sync_signals FOR SELECT USING (true);

-- 3. Enable Realtime ONLY for this signal table
ALTER PUBLICATION supabase_realtime ADD TABLE warehouse_sync_signals;
ALTER TABLE warehouse_sync_signals REPLICA IDENTITY FULL;

-- 4. Create the trigger function
CREATE OR REPLACE FUNCTION notify_warehouse_sync()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE warehouse_sync_signals SET last_updated = NOW() WHERE id = 1;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach the trigger to your tables (Fires once per bulk update for max efficiency)
DROP TRIGGER IF EXISTS trg_orders_sync ON orders;
CREATE TRIGGER trg_orders_sync AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH STATEMENT EXECUTE FUNCTION notify_warehouse_sync();

DROP TRIGGER IF EXISTS trg_delivery_sync ON delivery_assignments;
CREATE TRIGGER trg_delivery_sync AFTER INSERT OR UPDATE OR DELETE ON delivery_assignments
FOR EACH STATEMENT EXECUTE FUNCTION notify_warehouse_sync();

DROP TRIGGER IF EXISTS trg_payments_sync ON payments;
CREATE TRIGGER trg_payments_sync AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH STATEMENT EXECUTE FUNCTION notify_warehouse_sync();


-- Replace 'payment_status' with the actual name of your ENUM type
ALTER TYPE payment_status ADD VALUE 'processing_refund';
ALTER TYPE payment_status ADD VALUE 'refund_failed';

