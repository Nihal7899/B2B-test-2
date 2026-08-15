import { useEffect, useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buildGstBillHtml } from '@/services/gstBill';
import { printHtml } from '@/utils/printHtml';
import type { DbOrder } from '@/services/catalog';

export default function AdminInvoices() {
  const [orders, setOrders] = useState<(DbOrder & { customer_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery', 'delivered'])
      .order('created_at', { ascending: false });
    if (!ordersData) { setLoading(false); return; }
    // Fetch customer names
    const userIds = ordersData.map(o => o.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    const nameMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name || 'Customer']));
    const enriched = ordersData.map(o => ({
      ...o,
      customer_name: nameMap[o.user_id] || 'Customer',
    }));
    setOrders(enriched);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handlePrint = async (orderId: string) => {
    setPrinting(orderId);
    try {
      const html = await buildGstBillHtml(orderId);
      printHtml(html);
    } catch (err) {
      alert('Failed to generate bill.');
    } finally {
      setPrinting(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-8"><div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">Invoices for confirmed/delivered orders. Click print to generate bill.</p>
      {orders.map(order => (
        <div key={order.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-ink-800">{order.order_number}</p>
            <p className="text-xs text-ink-500">{order.customer_name} · {new Date(order.created_at).toLocaleDateString()}</p>
            <p className="text-xs text-ink-400">Status: {order.status.replace(/_/g, ' ')} · ₹{Number(order.total).toLocaleString('en-IN')}</p>
          </div>
          <button
            onClick={() => void handlePrint(order.id)}
            disabled={printing === order.id}
            className="h-9 px-4 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60"
          >
            {printing === order.id ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
            Print Bill
          </button>
        </div>
      ))}
    </div>
  );
}