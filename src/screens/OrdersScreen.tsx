import { useEffect, useState, useCallback, useRef } from 'react';
import { ClipboardList, Package, RefreshCw, Loader2 } from 'lucide-react';
import type { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import { OrderCard } from '@/components/OrderCard';

interface OrdersScreenProps {
  onOrderClick: (orderId: string) => void;
}

const ITEMS_PER_PAGE = 20;

export function OrdersScreen({ onOrderClick }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled'>('all');

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

  const filters: ('all' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled')[] = [
    'all',
    'Processing',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="safe-top px-4 pb-6 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Your orders</h1>
          <p className="text-xs text-ink-500 mt-0.5">Track and manage your purchases</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center text-ink-600 shadow-xs active:scale-95 transition-transform"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-brand-600' : ''} />
        </button>
      </div>

      {orders.length === 0 && !loadingMore ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="h-20 w-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Package size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-extrabold text-ink-900 mt-5">No orders found</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-[250px]">
            {filter === 'all' 
              ? 'Your order history will appear here once you place your first order.'
              : `You don't have any orders with the status "${filter}".`}
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                {f === 'all' ? 'All orders' : f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order.id)} />
            ))}
            
            {/* Sentinel Div for Intersection Observer (Triggers loadOrders when scrolled into view) */}
            <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
              {loadingMore && <Loader2 size={24} className="animate-spin text-brand-600" />}
            </div>
          </div>

          <div className="rounded-2xl bg-brand-50 p-4 text-center mt-6">
            <ClipboardList size={23} className="mx-auto text-brand-600" />
            <p className="text-sm font-bold text-brand-900 mt-2">Need help with an order?</p>
            <p className="text-xs text-brand-700 mt-1">Our support team is here for you</p>
            <button className="mt-3 text-xs font-bold text-brand-700 hover:underline">Contact support</button>
          </div>
        </>
      )}
    </div>
  );
}