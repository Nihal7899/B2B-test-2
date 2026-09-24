import { useEffect, useState, useCallback, useRef } from 'react';
import { ClipboardList, Package, RefreshCw, Loader2 } from 'lucide-react';
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
      if (p && p.provider === 'razorpay' && p.status === 'failed') return;

      const items = itemsByOrder[db.id] || [];
      validOrders.push({
        id: db.id,
        orderNo: db.order_number,
        date: new Date(db.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
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
      if (targetPage === 1) setOrders(newOrders);
      else setOrders((prev) => [...prev, ...newOrders]);

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

  useEffect(() => { void loadOrders(1, false); }, [filter, loadOrders]);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) void loadOrders(page + 1, false);
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, page, loadOrders]);

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

  /* ─────────────── LOADING SKELETON ─────────────── */
  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="safe-top mx-auto max-w-lg px-4 pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-32 animate-pulse rounded-md bg-emerald-900/10" />
              <div className="h-3 w-44 animate-pulse rounded-md bg-emerald-900/[0.06]" />
            </div>
            <div className="h-9 w-9 animate-pulse rounded-xl bg-emerald-900/[0.08]" />
          </div>
        </div>
        <div className="flex min-h-[55vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-900/15 border-t-emerald-900" />
        </div>
      </div>
    );
  }

  /* ─────────────── MAIN UI ─────────────── */
  return (
    <div className="min-h-screen bg-white">
      <div className="safe-top mx-auto max-w-lg px-4 pb-11">

        {/* ── Original non-sticky header ───────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-emerald-950">
              Your orders
            </h1>
            <p className="mt-0.5 text-xs font-medium text-emerald-900/50">
              Track and manage your purchases
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            aria-label="Refresh orders"
            className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-900/10 bg-white text-emerald-900 shadow-sm transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin text-emerald-800' : ''}
            />
          </button>
        </div>

        {orders.length === 0 && !loadingMore ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            {/* ── Filter pills · active = dark green ─────────────────── */}
            <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
              {FILTERS.map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200 ${
                      active
                        ? 'bg-emerald-900 text-white shadow-md shadow-emerald-900/25'
                        : 'border border-emerald-900/10 bg-white text-emerald-900/70 hover:border-emerald-900/20 hover:bg-emerald-900/[0.04] hover:text-emerald-900'
                    }`}
                  >
                    {f === 'all' ? 'All orders' : f}
                  </button>
                );
              })}
            </div>

            {/* ── Orders list ────────────────────────────────────────── */}
            <div className="mt-4 space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => onOrderClick(order.id)}
                />
              ))}

              <div ref={sentinelRef} className="flex h-12 items-center justify-center">
                {loadingMore && <Loader2 size={22} className="animate-spin text-emerald-900" />}
              </div>
            </div>

            {/* ── Support card ───────────────────────────────────────── */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-emerald-900/10 bg-white p-5 text-center shadow-[0_4px_20px_-10px_rgba(6,78,59,0.2)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-900/40 to-transparent" />
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-sm shadow-emerald-900/25">
                <ClipboardList size={20} />
              </div>
              <p className="mt-3 text-sm font-bold text-emerald-950">
                Need help with an order?
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-900/50">
                Our support team is here for you
              </p>
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-900 px-4 py-2 text-xs font-bold text-white transition-all duration-200 hover:bg-emerald-800 active:scale-95">
                Contact support
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────── EMPTY STATE ─────────────── */
function EmptyState({ filter }: { filter: FilterKey }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 -m-3 rounded-[28px] bg-emerald-900/[0.06] blur-md" />
        <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-lg shadow-emerald-900/25">
          <Package size={34} strokeWidth={1.6} />
        </div>
      </div>
      <h2 className="mt-5 text-lg font-extrabold tracking-tight text-emerald-950">
        No orders found
      </h2>
      <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-emerald-900/50">
        {filter === 'all'
          ? 'Your order history will appear here once you place your first order.'
          : `You don't have any orders with the status "${filter}".`}
      </p>
    </div>
  );
}