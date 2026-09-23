import { useEffect, useState, useCallback, useRef } from 'react';
import { ClipboardList, Package, RefreshCw, Loader2, Headphones } from 'lucide-react';
import type { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import { OrderCard } from '@/components/OrderCard';

interface OrdersScreenProps {
  onOrderClick: (orderId: string) => void;
}

const ITEMS_PER_PAGE = 20;

type FilterKey = 'all' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

const FILTERS: FilterKey[] = [
  'all',
  'Processing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export function OrdersScreen({ onOrderClick }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  // Pagination State
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchPaginatedOrders = useCallback(async (currentPage: number, currentFilter: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { orders: [], count: 0 };

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = currentPage * ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    // Apply strict filtering at the database query level
    if (currentFilter !== 'all') {
      if (currentFilter === 'Processing') {
        query = query.in('status', ['pending', 'confirmed', 'packed', 'ready_for_pickup']);
      } else if (currentFilter === 'Out for Delivery') {
        query = query.eq('status', 'out_for_delivery');
      } else if (currentFilter === 'Delivered') {
        query = query.eq('status', 'delivered');
      } else if (currentFilter === 'Cancelled') {
        query = query.eq('status', 'cancelled');
      }
    }

    const { data: orderData, count, error } = await query.range(from, to);

    if (error || !orderData || orderData.length === 0) return { orders: [], count: 0 };

    const orderIds = orderData.map((o) => o.id);

    const [itemsRes, paymentsRes] = await Promise.all([
      supabase.from('order_items').select('*').in('order_id', orderIds),
      supabase.from('payments').select('order_id, provider, status').in('order_id', orderIds),
    ]);

    const itemsByOrder: Record<string, any[]> = {};
    (itemsRes.data || []).forEach((item) => {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    });

    const paymentsByOrder = Object.fromEntries(
      (paymentsRes.data || []).map((p) => [p.order_id, p])
    );

    const statusMap: Record<string, Order['status']> = {
      pending: 'Processing',
      confirmed: 'Processing',
      packed: 'Processing',
      ready_for_pickup: 'Processing',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    const validOrders: Order[] = [];

    orderData.forEach((db) => {
      const p = paymentsByOrder[db.id];
      // Hide failed payments to keep view clean
      if (p && p.provider === 'razorpay' && p.status === 'failed') return;

      const items = itemsByOrder[db.id] || [];
      validOrders.push({
        id: db.id,
        orderNo: db.order_number,
        date: new Date(db.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        itemCount: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
        total: Number(db.total),
        status: statusMap[db.status] ?? 'Processing',
        items: items.map((i: any) => `${i.brand} ${i.product_name}`),
      });
    });

    return { orders: validOrders, count: count || 0 };
  }, []);

  const loadOrders = useCallback(async (targetPage = 1, silent = false) => {
    if (!silent) {
      if (targetPage === 1) setLoading(true);
      else setLoadingMore(true);
    }

    try {
      const { orders: newOrders, count } = await fetchPaginatedOrders(targetPage, filter);

      if (targetPage === 1) {
        setOrders(newOrders);
      } else {
        setOrders((prev) => [...prev, ...newOrders]);
      }

      setPage(targetPage);
      setHasMore(targetPage * ITEMS_PER_PAGE < count);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      if (!silent) {
        setLoading(false);
        setLoadingMore(false);
      }
      setRefreshing(false);
    }
  }, [filter, fetchPaginatedOrders]);

  // Fetch when filter tab changes
  useEffect(() => {
    void loadOrders(1, false);
  }, [filter, loadOrders]);

  // Sentinel Ref for Intersection Observer
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          void loadOrders(page + 1, false);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, page, loadOrders]
  );

  // Background Data Refresh Listeners (Restores page 1 quietly to update order statuses)
  useEffect(() => {
    let active = true;

    const handleKeepAliveFocus = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (active && (customEvent.detail?.key === '/orders' || customEvent.detail?.key === 'orders')) {
        void loadOrders(1, true);
      }
    };

    const handleVisibilityChange = () => {
      const isCurrentlyActive = window.location.pathname.includes('/orders');
      if (document.visibilityState === 'visible' && active && isCurrentlyActive) {
        void loadOrders(1, true);
      }
    };

    window.addEventListener('keepalive:activated', handleKeepAliveFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('keepalive:activated', handleKeepAliveFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadOrders]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    void loadOrders(1, true);
  };

  /* ──────────────────────────  LOADING SKELETON  ────────────────────────── */
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#070E0B]">
        <header className="safe-top sticky top-0 z-30 border-b border-white/[0.06] bg-gradient-to-b from-[#0D2C1E] to-[#0A1F16]">
          <div className="mx-auto max-w-lg px-4 pb-4 pt-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="h-[18px] w-32 animate-pulse rounded-md bg-white/[0.08]" />
                <div className="h-3 w-44 animate-pulse rounded-md bg-white/[0.05]" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.08]" />
            </div>
            <div className="mt-4 flex gap-2">
              {[64, 88, 104, 76, 84].map((w, i) => (
                <div
                  key={i}
                  className="h-7 shrink-0 animate-pulse rounded-full bg-white/[0.05]"
                  style={{ width: w }}
                />
              ))}
            </div>
          </div>
        </header>

        <div className="flex min-h-[55vh] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-400" />
        </div>
      </div>
    );
  }

  /* ──────────────────────────────  MAIN UI  ────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#070E0B] text-[#E8F3EC] antialiased">
      {/* ── Sticky dark-green header ─────────────────────────────────────── */}
      <header
        className="safe-top sticky top-0 z-30 border-b border-white/[0.06] bg-gradient-to-b from-[#0D2C1E] via-[#0B241A] to-[#0A1F16] shadow-[0_10px_30px_-16px_rgba(0,0,0,0.95)] backdrop-blur-xl"
      >
        <div className="mx-auto max-w-lg px-4 pb-3 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-[19px] font-extrabold leading-tight tracking-tight text-white">
                Your orders
              </h1>
              <p className="mt-0.5 text-[11px] font-medium text-emerald-200/50">
                Track and manage your purchases
              </p>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              aria-label="Refresh orders"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-emerald-100 transition-all duration-200 hover:bg-white/[0.1] active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin text-emerald-400' : ''}
              />
            </button>
          </div>

          {/* Filter chips */}
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-emerald-950 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.75)]'
                      : 'border border-white/[0.08] bg-white/[0.04] text-emerald-100/60 hover:bg-white/[0.08] hover:text-emerald-50'
                  }`}
                >
                  {f === 'all' ? 'All orders' : f}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-lg px-4 pb-10 pt-4">
        {orders.length === 0 && !loadingMore ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => onOrderClick(order.id)}
                />
              ))}

              {/* Sentinel for Intersection Observer */}
              <div ref={sentinelRef} className="flex h-12 items-center justify-center">
                {loadingMore && <Loader2 size={22} className="animate-spin text-emerald-400" />}
              </div>
            </div>

            {/* Support card */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-[#0E2A1E] to-[#0A1F16] p-5 text-center">
              <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="relative">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                  <ClipboardList size={20} />
                </div>
                <p className="mt-3 text-sm font-bold text-white">Need help with an order?</p>
                <p className="mt-1 text-[11px] text-emerald-200/50">
                  Our support team is here for you
                </p>
                <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-bold text-emerald-950 transition-all duration-200 hover:bg-emerald-400 active:scale-95">
                  <Headphones size={13} />
                  Contact support
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ──────────────────────────────  EMPTY STATE  ────────────────────────────── */
function EmptyState({ filter }: { filter: FilterKey }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.07] text-emerald-400 shadow-[0_0_50px_-14px_rgba(16,185,129,0.7)]">
        <Package size={34} strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 text-lg font-extrabold tracking-tight text-white">No orders found</h2>
      <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-emerald-100/40">
        {filter === 'all'
          ? 'Your order history will appear here once you place your first order.'
          : `You don't have any orders with the status "${filter}".`}
      </p>
    </div>
  );
}