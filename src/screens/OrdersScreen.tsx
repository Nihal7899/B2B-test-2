import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Package } from 'lucide-react';
import type { Order } from '@/types';
import { fetchOrders } from '@/services/catalog';
import { supabase } from '@/lib/supabase';
import { OrderCard } from '@/components/OrderCard';

interface OrdersScreenProps {
  onOrderClick: (orderId: string) => void;
}

export function OrdersScreen({ onOrderClick }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled'>('all');

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders();
      const orderIds = (data || []).map((o) => o.id);

      if (orderIds.length > 0) {
        const { data: payments } = await supabase
          .from('payments')
          .select('order_id, provider, status')
          .in('order_id', orderIds);

        const paymentsByOrder = Object.fromEntries(
          (payments || []).map((p) => [p.order_id, p])
        );

        const validOrders = (data || []).filter((order) => {
          const p = paymentsByOrder[order.id];
          if (p && p.provider === 'razorpay' && p.status !== 'paid') return false;
          if (order.status === 'Processing') {
            if (!p) return false;
            return p.status === 'paid' || p.provider === 'cod';
          }
          return true;
        });

        setOrders(validOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();

    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Realtime subscription filtered to the current user's orders
      channel = supabase
        .channel(`user_orders_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void loadOrders();
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadOrders]);

  const filters: ('all' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled')[] = [
    'all',
    'Processing',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
  ];

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="safe-top px-4 pb-6 space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Your orders</h1>
        <p className="text-xs text-ink-500 mt-1">Track and manage your purchases</p>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="h-20 w-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Package size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-extrabold text-ink-900 mt-5">No orders yet</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-[250px]">
            Your order history will appear here once you place your first order.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
                  filter === f
                    ? 'bg-brand-600 text-white'
                    : 'bg-white border border-ink-200 text-ink-600'
                }`}
              >
                {f === 'all' ? 'All orders' : f}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order.id)} />
            ))}
          </div>
          <div className="rounded-2xl bg-brand-50 p-4 text-center">
            <ClipboardList size={23} className="mx-auto text-brand-600" />
            <p className="text-sm font-bold text-brand-900 mt-2">Need help with an order?</p>
            <p className="text-xs text-brand-700 mt-1">Our support team is here for you</p>
            <button className="mt-3 text-xs font-bold text-brand-700">Contact support</button>
          </div>
        </>
      )}
    </div>
  );
}
