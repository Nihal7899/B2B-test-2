// src/components/WarehouseScreen.tsx
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Loader2, Search, ClipboardList, Printer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DbProduct, DbOrder, DbOrderItem } from '@/services/catalog';
import { buildGstBillHtml } from '@/services/gstBill';
import { printHtml } from '@/utils/printHtml';
import AdminInvoices from '@/components/AdminInvoices';

interface WarehouseScreenProps { onBack: () => void; }

type Tab = 'orders' | 'stock' | 'invoices';

export function WarehouseScreen({ onBack }: WarehouseScreenProps) {
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div className="safe-top px-4 pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Warehouse Panel</h1>
          <p className="text-xs text-ink-500 mt-0.5">Manage stock and fulfill orders</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('orders')}
          className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${
            tab === 'orders' ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600'
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setTab('stock')}
          className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${
            tab === 'stock' ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600'
          }`}
        >
          Stock
        </button>
        <button
          onClick={() => setTab('invoices')}
          className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${
            tab === 'invoices' ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600'
          }`}
        >
          Invoices
        </button>
      </div>

      {tab === 'orders' && <OrdersTab />}
      {tab === 'stock' && <StockTab />}
      {tab === 'invoices' && <AdminInvoices />}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<(DbOrder & { customer_name: string; payment?: { status: string; provider: string; amount: number } | null })[]>([]);
  const [items, setItems] = useState<Record<string, DbOrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [partners, setPartners] = useState<{ user_id: string; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'packed' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled'>('all');

  const load = useCallback(async () => {
    try {
      const { data: ordersData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (orderError) {
        console.error('Error fetching orders:', orderError);
        setLoading(false);
        return;
      }

      const orderIds = (ordersData || []).map((o) => o.id);
      let paymentsByOrder: Record<string, any> = {};
      if (orderIds.length > 0) {
        const { data: payments } = await supabase
          .from('payments')
          .select('id, order_id, provider, status, amount, provider_payment_id')
          .in('order_id', orderIds);

        if (payments) {
          payments.forEach((p) => {
            paymentsByOrder[p.order_id] = p;
          });
        }
      }

      // Filter: Exclude all Razorpay pending payments and incomplete checkouts
      const actionable = (ordersData || [])
        .map((order) => ({
          ...order,
          payment: paymentsByOrder[order.id] || null,
        }))
        .filter((order) => {
          const p = order.payment;

          // 1. Never show Razorpay orders where payment is still pending or failed
          if (p && p.provider === 'razorpay' && p.status !== 'paid') {
            return false;
          }

          // 2. If order status is pending, only show if paid or explicitly marked as COD
          if (order.status === 'pending') {
            if (!p) return false;
            return p.status === 'paid' || p.provider === 'cod';
          }

          return true;
        });

      const { data: partnerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'delivery_partner');

      if (partnerRoles && partnerRoles.length > 0) {
        const partnerIds = partnerRoles.map((r) => r.user_id);
        const { data: partnerProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', partnerIds);

        if (partnerProfiles) {
          const profileMap = Object.fromEntries(
            partnerProfiles.map((p) => [p.id, p.full_name || 'Partner'])
          );
          setPartners(
            partnerRoles.map((r) => ({
              user_id: r.user_id,
              name: profileMap[r.user_id] || 'Partner',
            }))
          );
        }
      }

      const actionableIds = actionable.map((o) => o.id);
      let itemsMap: Record<string, DbOrderItem[]> = {};
      if (actionableIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', actionableIds);

        if (itemsData) {
          itemsData.forEach((item) => {
            if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
            itemsMap[item.order_id].push(item);
          });
        }
      }
      setItems(itemsMap);

      const ordersWithNames = await Promise.all(
        actionable.map(async (o) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', o.user_id)
            .maybeSingle();
          return {
            ...o,
            customer_name: (profile as { full_name: string } | null)?.full_name ?? 'Customer',
          };
        })
      );
      setOrders(ordersWithNames);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) void load();
    }, 30000);
    return () => clearInterval(interval);
  }, [load, loading]);

  const confirmOrder = async (orderId: string) => {
    const { error } = await supabase.rpc('confirm_order', { p_order_id: orderId });
    if (error) {
      alert('Could not confirm order: ' + error.message);
    } else {
      void load();
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: orderId,
      p_status: status,
    });
    if (error) {
      alert('Could not update status: ' + error.message);
    } else {
      void load();
    }
  };

  const assignPartner = async (orderId: string, partnerId: string) => {
    if (!partnerId) return;
    const { error } = await supabase.rpc('assign_delivery_partner', {
      p_order_id: orderId,
      p_partner_id: partnerId,
    });
    if (error) {
      alert('Could not assign partner: ' + error.message);
    } else {
      void load();
    }
  };

  const handlePrintBill = async (orderId: string, orderNumber?: string) => {
    try {
      setPrintingId(orderId);
      const html = await buildGstBillHtml(orderId);
      await printHtml(html, orderNumber || `Invoice_${orderId.slice(0, 8)}`);
    } catch (err) {
      console.error('Warehouse Print Error:', err);
      alert('Failed to generate bill.');
    } finally {
      setPrintingId(null);
    }
  };

  const filtered = orders
    .filter((o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((o) => statusFilter === 'all' || o.status === statusFilter);

  const statusOptions = ['all', 'pending', 'confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 bg-white border border-ink-200 rounded-xl h-10 px-3">
        <Search size={16} className="text-ink-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as any)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
              statusFilter === status ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600'
            }`}
          >
            {status === 'all' ? 'All Orders' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList size={36} className="text-ink-300" strokeWidth={1.5} />
          <p className="text-sm text-ink-500 mt-3">No orders found</p>
        </div>
      ) : (
        filtered.map((order) => {
          const isCod = order.payment?.provider === 'cod';
          const isPaid = order.payment?.status === 'paid';

          return (
            <div
              key={order.id}
              className={`bg-white border rounded-2xl p-4 shadow-card ${
                order.status === 'pending' ? 'border-amber-300 bg-amber-50/30' : 'border-ink-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-ink-800">{order.order_number}</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">
                    {order.customer_name} · {new Date(order.created_at).toLocaleDateString('en-IN')}
                    {order.status === 'pending' && (
                      <span className="ml-2 text-amber-600 font-bold">⏳ Awaiting confirmation</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {isCod && (
                    <span className="text-[8px] font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                      COD {isPaid ? '(PAID)' : '(PENDING)'}
                    </span>
                  )}
                  {!isCod && isPaid && (
                    <span className="text-[8px] font-bold bg-green-100 text-green-700 rounded-full px-2 py-0.5">PAID</span>
                  )}
                  <span
                    className={`text-[9px] font-bold rounded-full px-2.5 py-1 ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'delivered' ? 'bg-brand-100 text-brand-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="space-y-1 mt-2">
                {(items[order.id] ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-ink-600">{item.brand} {item.product_name} × {item.quantity}</span>
                    <span className="font-semibold text-ink-800">₹{Number(item.line_total).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-ink-100 pt-2 mt-2">
                <p className="text-sm font-extrabold text-brand-700">₹{Number(order.total).toLocaleString('en-IN')}</p>
              </div>

              <div className="flex gap-2 mt-2 flex-wrap">
                {order.status === 'pending' && (
                  <button
                    onClick={() => void confirmOrder(order.id)}
                    className="flex-1 h-9 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                  >
                    Confirm
                  </button>
                )}

                {order.status === 'confirmed' && (
                  <button
                    disabled={printingId === order.id}
                    onClick={() => void handlePrintBill(order.id, order.order_number)}
                    className="flex-1 h-9 rounded-lg bg-blue-600 disabled:bg-blue-400 text-white text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors"
                  >
                    {printingId === order.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Printer size={13} />
                    )}
                    Print Bill
                  </button>
                )}

                {order.status === 'confirmed' && (
                  <button
                    onClick={() => void updateStatus(order.id, 'packed')}
                    className="flex-1 h-9 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors"
                  >
                    Mark packed
                  </button>
                )}

                {order.status === 'packed' && (
                  <select
                    onChange={(e) => void assignPartner(order.id, e.target.value)}
                    className="flex-1 h-9 rounded-lg border border-ink-200 px-2 text-xs font-bold outline-none"
                  >
                    <option value="">Assign delivery...</option>
                    {partners.map((p) => (
                      <option key={p.user_id} value={p.user_id}>{p.name}</option>
                    ))}
                  </select>
                )}

                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button
                    onClick={() => void updateStatus(order.id, 'cancelled')}
                    className="h-9 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function StockTab() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState(0);

  const load = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts((data as DbProduct[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStock = async (id: string) => {
    await supabase.from('products').update({ stock_quantity: stockValue }).eq('id', id);
    setEditId(null);
    void load();
  };

  const filtered = products.filter((p) =>
    `${p.brand} ${p.name}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 bg-white border border-ink-200 rounded-xl h-10 px-3">
        <Search size={16} className="text-ink-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {filtered.map((prod) => (
        <div key={prod.id} className="bg-white border border-ink-100 rounded-2xl p-3.5 shadow-card flex items-center gap-3">
          {prod.image_url && <img src={prod.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-800 truncate">{prod.brand} {prod.name}</p>
            <p className="text-[10px] text-ink-400 mt-0.5">{prod.pack_size} · MOQ {prod.moq}</p>
          </div>
          {editId === prod.id ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={stockValue}
                onChange={(e) => setStockValue(Number(e.target.value))}
                className="w-16 h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
              <button onClick={() => void updateStock(prod.id)} className="h-9 px-3 rounded-lg bg-brand-600 text-white text-xs font-bold">
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditId(prod.id); setStockValue(prod.stock_quantity); }}
              className={`h-9 px-3 rounded-lg text-xs font-bold ${
                prod.stock_quantity > 0 ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {prod.stock_quantity} in stock
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
