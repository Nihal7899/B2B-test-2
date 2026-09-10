-- Speeds up the revenue and order volume aggregations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created_at 
ON public.orders(status, created_at);

-- Speeds up the pie chart payment aggregations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created_at 
ON public.payments(status, created_at);

-- Speeds up the new customer growth calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_created_at 
ON public.profiles(created_at);
