import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  ArrowLeft, Loader2, Search, ClipboardList, Printer, CheckCircle, 
  Wallet, Banknote, CreditCard, ChevronLeft, ChevronRight, PackageCheck, UserCheck, Ban
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DbProduct, DbOrder, DbOrderItem } from '@/services/catalog';
import { buildGstBillHtml } from '@/services/gstBill';
import { printHtml } from '@/utils/printHtml';
import AdminInvoices from '@/components/AdminInvoices';
import LowStockTab from '@/components/LowStockTab';

interface WarehouseScreenProps { onBack: () => void; }

type Tab = 'orders' | 'stock' | 'invoices' | 'lowstock';

export interface PaymentSummary {
  walletPaid: number;
  onlinePaid: number;
  codPending: number;
  codPaid: number;
  totalPaid: number;
  amountToCollect: number;
  isSplit: boolean;
  providers: string[];
}

export function WarehouseScreen({ onBack }: WarehouseScreenProps) {
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div className="safe-top px-4 pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Warehouse Panel</h1>
          <p className="text-xs text-ink-500 mt-0.5">High-capacity fulfillment engine</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab('orders')}
          className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${
            tab === 'orders' ? 'bg-brand-600 text-white shadow-soft' : 'bg-white border border-ink-200 text-ink-600'
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setTab('stock')}
          className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${
            tab === 'stock' ? 'bg-brand-600 text-white shadow-soft' : 'bg-white border border-ink-200 text-ink-600'
          }`}
        >
          Stock
        </button>
        <button
          onClick={() => setTab('invoices')}
          className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${
            tab === 'invoices' ? 'bg-brand-600 text-white shadow-soft' : 'bg-white border border-ink-200 text-ink-600'
          }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setTab('lowstock')}
          className={`flex-1 h-10 rounded-xl text-sm font-bold transition-colors ${
            tab === 'lowstock' ? 'bg-brand-600 text-white shadow-soft' : 'bg-white border border-ink-200 text-ink-600'
          }`}
        >
          Low Stock
        </button>
      </div>

      {tab === 'orders' && <OrdersTab />}
      {tab === 'stock' && <StockTab />}
      {tab === 'invoices' && <AdminInvoices />}
      {tab === 'lowstock' && <LowStockTab />}
    </div>
  );
}

const PAGE_SIZE = 25;

function OrdersTab() {
  const [orders, setOrders] = useState<(DbOrder & { customer_name: string; paymentSummary: PaymentSummary })[]>([]);
  const [items, setItems] = useState<Record<string, DbOrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<{ user_id: string; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'packed' | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Granular Action Loading: Keeps track of exact order and active operation
  const [activeAction, setActiveAction] = useState<{ orderId: string; type: 'confirm' | 'packed' | 'assign' | 'cancel' | 'print' } | null>(null);

  // Debounce search to reduce excessive database reads
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Delivery Partners Once
  useEffect(() => {
    async function loadPartners() {
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

        const profileMap = Object.fromEntries(
          (partnerProfiles || []).map((p) => [p.id, p.full_name || 'Delivery Partner'])
        );

        setPartners(
          partnerRoles.map((r) => ({
            user_id: r.user_id,
            name: profileMap[r.user_id] || 'Delivery Partner',
          }))
        );
      }
    }
    void loadPartners();
  }, []);

  // Optimized High-Volume Query (Batched, Indexed, Non-blocking)
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (debouncedSearch.trim()) {
        query = query.ilike('order_number', `%${debouncedSearch.trim()}%`);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: ordersData, count, error: orderError } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (orderError) throw orderError;
      setTotalCount(count || 0);

      const currentOrders = ordersData || [];
      const orderIds = currentOrders.map((o) => o.id);
      const userIds = Array.from(new Set(currentOrders.map((o) => o.user_id)));

      if (orderIds.length === 0) {
        setOrders([]);
        setItems({});
        setLoading(false);
        return;
      }

      // Parallel batch fetch: 1 request for all payments, 1 for all items, 1 for all customer profiles
      const [paymentsRes, itemsRes, profilesRes] = await Promise.all([
        supabase.from('payments').select('id, order_id, provider, status, amount').in('order_id', orderIds),
        supabase.from('order_items').select('*').in('order_id', orderIds),
        supabase.from('profiles').select('id, full_name').in('id', userIds),
      ]);

      // Map profiles
      const profileMap = Object.fromEntries(
        (profilesRes.data || []).map((p) => [p.id, p.full_name || 'Customer'])
      );

      // Map payments & compute wallet/COD splits
      const paymentsByOrder: Record<string, PaymentSummary> = {};
      (paymentsRes.data || []).forEach((p) => {
        if (!paymentsByOrder[p.order_id]) {
          paymentsByOrder[p.order_id] = {
            walletPaid: 0,
            onlinePaid: 0,
            codPending: 0,
            codPaid: 0,
            totalPaid: 0,
            amountToCollect: 0,
            isSplit: false,
            providers: [],
          };
        }

        const summary = paymentsByOrder[p.order_id];
        const amt = Number(p.amount) || 0;
        if (!summary.providers.includes(p.provider)) summary.providers.push(p.provider);

        if (p.provider === 'wallet' && (p.status === 'paid' || p.status === 'completed')) {
          summary.walletPaid += amt;
          summary.totalPaid += amt;
        } else if (p.provider === 'razorpay' && (p.status === 'paid' || p.status === 'completed')) {
          summary.onlinePaid += amt;
          summary.totalPaid += amt;
        } else if (p.provider === 'cod') {
          if (p.status === 'paid' || p.status === 'completed') {
            summary.codPaid += amt;
            summary.totalPaid += amt;
          } else {
            summary.codPending += amt;
            summary.amountToCollect += amt;
          }
        }
      });

      // Map items
      const itemsMap: Record<string, DbOrderItem[]> = {};
      (itemsRes.data || []).forEach((item) => {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push(item);
      });
      setItems(itemsMap);

      // Assemble structured order records
      const assembledOrders = currentOrders.map((o) => {
        const pay = paymentsByOrder[o.id] || {
          walletPaid: 0,
          onlinePaid: 0,
          codPending: 0,
          codPaid: 0,
          totalPaid: 0,
          amountToCollect: Number(o.total),
          isSplit: false,
          providers: [],
        };
        pay.isSplit = pay.providers.length > 1;

        return {
          ...o,
          customer_name: profileMap[o.user_id] || 'Business Customer',
          paymentSummary: pay,
        };
      });

      setOrders(assembledOrders);
    } catch (err: any) {
      console.error('Failed to load warehouse orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Handlers with Granular Loading & Deadlock Protection
  const handleConfirmOrder = async (orderId: string) => {
    setActiveAction({ orderId, type: 'confirm' });
    try {
      const { error } = await supabase.rpc('confirm_order', { p_order_id: orderId });
      if (error) throw error;
      await loadOrders();
    } catch (err: any) {
      alert(`Could not confirm order: ${err.message}`);
    } finally {
      setActiveAction(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string, actionType: 'packed' | 'cancel') => {
    setActiveAction({ orderId, type: actionType });
    try {
      const { error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_status: status,
      });
      if (error) throw error;
      await loadOrders();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActiveAction(null);
    }
  };

  const handleAssignPartner = async (orderId: string, partnerId: string) => {
    if (!partnerId) return;
    setActiveAction({ orderId, type: 'assign' });
    try {
      const { error } = await supabase.rpc('assign_delivery_partner', {
        p_order_id: orderId,
        p_partner_id: partnerId,
      });
      if (error) throw error;
      await loadOrders();
    } catch (err: any) {
      alert(`Partner assignment failed: ${err.message}`);
    } finally {
      setActiveAction(null);
    }
  };

  const handlePrintBill = async (orderId: string, orderNumber?: string) => {
    setActiveAction({ orderId, type: 'print' });
    try {
      const html = await buildGstBillHtml(orderId);
      await printHtml(html, orderNumber || `Invoice_${orderId.slice(0, 8)}`);
    } catch (err) {
      alert('Failed to print GST bill.');
    } finally {
      setActiveAction(null);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const statusOptions = ['all', 'pending', 'confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="flex items-center gap-2 bg-white border border-ink-200 rounded-xl h-10 px-3 shadow-xs">
        <Search size={16} className="text-ink-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number (e.g. SK-2026)..."
          className="flex-1 bg-transparent text-sm outline-none font-medium"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs font-bold text-ink-400 hover:text-ink-600">
            Clear
          </button>
        )}
      </div>

      {/* Filter Horizontal Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status as any); setPage(1); }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === status ? 'bg-brand-600 text-white shadow-xs' : 'bg-white border border-ink-200 text-ink-600'
            }`}
          >
            {status === 'all' ? 'All Orders' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Order List / States */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-brand-600" size={28} />
          <p className="text-xs text-ink-400 mt-2 font-medium">Fetching orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-ink-100 p-6">
          <ClipboardList size={38} className="text-ink-300" strokeWidth={1.5} />
          <p className="text-sm font-bold text-ink-700 mt-3">No orders found</p>
          <p className="text-xs text-ink-400 mt-0.5">Try choosing a different status filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const pay = order.paymentSummary;
            const isFullyPaid = pay.amountToCollect === 0;
            const isRowBusy = activeAction?.orderId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-2xl p-4 shadow-card transition-all ${
                  order.status === 'pending' ? 'border-amber-300 bg-amber-50/20' : 'border-ink-100'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-ink-900">{order.order_number}</p>
                    <p className="text-[11px] text-ink-500 mt-0.5 font-medium">
                      {order.customer_name} · {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase rounded-full px-2.5 py-1 ${
                      order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      order.status === 'delivered' ? 'bg-brand-100 text-brand-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="space-y-1 mt-3 bg-ink-50/60 p-2.5 rounded-xl">
                  {(items[order.id] ?? []).map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-ink-700 truncate flex-1 font-medium">{item.brand} {item.product_name} × {item.quantity}</span>
                      <span className="font-bold text-ink-900 ml-2">₹{Number(item.line_total).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Breakdown & Split Details */}
                <div className="border-t border-dashed border-ink-200 pt-2.5 mt-2.5 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-ink-900">
                    <span>Order Total</span>
                    <span>₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {pay.walletPaid > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold items-center">
                      <span className="flex items-center gap-1"><Wallet size={12} /> Wallet Paid</span>
                      <span>- ₹{pay.walletPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {pay.onlinePaid > 0 && (
                    <div className="flex justify-between text-blue-600 font-semibold items-center">
                      <span className="flex items-center gap-1"><CreditCard size={12} /> Razorpay Paid</span>
                      <span>- ₹{pay.onlinePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {pay.codPaid > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold items-center">
                      <span className="flex items-center gap-1"><Banknote size={12} /> COD Settled</span>
                      <span>- ₹{pay.codPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className={`p-2 rounded-xl flex items-center justify-between font-extrabold mt-1.5 ${
                    isFullyPaid ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    <span className="flex items-center gap-1">
                      {isFullyPaid ? <CheckCircle size={13} className="text-emerald-600" /> : <Banknote size={13} className="text-amber-700" />}
                      {isFullyPaid ? 'Prepaid in Full' : 'Collect on Delivery (COD):'}
                    </span>
                    <span className="text-sm">
                      {isFullyPaid ? '₹0.00' : `₹${pay.amountToCollect.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </div>

                {/* Action Buttons with Row-Level Spinners */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {order.status === 'pending' && (
                    <button
                      disabled={isRowBusy}
                      onClick={() => void handleConfirmOrder(order.id)}
                      className="flex-1 h-9 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft transition-all"
                    >
                      {isRowBusy && activeAction?.type === 'confirm' ? (
                        <><Loader2 size={13} className="animate-spin" /> Confirming...</>
                      ) : (
                        <><PackageCheck size={14} /> Confirm Order</>
                      )}
                    </button>
                  )}

                  {order.status === 'confirmed' && (
                    <>
                      <button
                        disabled={isRowBusy}
                        onClick={() => void handlePrintBill(order.id, order.order_number)}
                        className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft transition-all"
                      >
                        {isRowBusy && activeAction?.type === 'print' ? (
                          <><Loader2 size={13} className="animate-spin" /> Printing...</>
                        ) : (
                          <><Printer size={14} /> Print Bill</>
                        )}
                      </button>
                      <button
                        disabled={isRowBusy}
                        onClick={() => void handleUpdateStatus(order.id, 'packed', 'packed')}
                        className="flex-1 h-9 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft transition-all"
                      >
                        {isRowBusy && activeAction?.type === 'packed' ? (
                          <><Loader2 size={13} className="animate-spin" /> Updating...</>
                        ) : (
                          'Mark Packed'
                        )}
                      </button>
                    </>
                  )}

                  {order.status === 'packed' && (
                    <div className="flex-1 relative">
                      <select
                        disabled={isRowBusy}
                        defaultValue=""
                        onChange={(e) => void handleAssignPartner(order.id, e.target.value)}
                        className="w-full h-9 rounded-xl border border-ink-200 bg-white px-3 text-xs font-bold text-ink-800 outline-none focus:border-brand-500 disabled:opacity-50"
                      >
                        <option value="" disabled>
                          {isRowBusy && activeAction?.type === 'assign' ? 'Assigning driver...' : 'Assign Delivery Partner...'}
                        </option>
                        {partners.map((p) => (
                          <option key={p.user_id} value={p.user_id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                      disabled={isRowBusy}
                      onClick={() => void handleUpdateStatus(order.id, 'cancelled', 'cancel')}
                      className="h-9 px-3 rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {isRowBusy && activeAction?.type === 'cancel' ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <><Ban size={13} /> Cancel</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination Toolbar */}
          <div className="flex items-center justify-between pt-2 px-1">
            <p className="text-xs text-ink-500 font-medium">
              Showing <span className="font-bold text-ink-800">{orders.length}</span> of <span className="font-bold text-ink-800">{totalCount}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 rounded-lg border border-ink-200 bg-white text-ink-700 text-xs font-bold disabled:opacity-40 flex items-center gap-1 active:scale-95"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs font-bold text-ink-800">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2.5 rounded-lg border border-ink-200 bg-white text-ink-700 text-xs font-bold disabled:opacity-40 flex items-center gap-1 active:scale-95"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
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
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadStock = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts((data as DbProduct[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStock();
  }, [loadStock]);

  const updateStock = async (id: string) => {
    setSavingId(id);
    try {
      await supabase.from('products').update({ stock_quantity: stockValue, updated_at: new Date().toISOString() }).eq('id', id);
      setEditId(null);
      void loadStock();
    } catch (e: any) {
      alert('Could not update stock.');
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter((p) =>
    `${p.brand} ${p.name}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600 mt-12" size={24} />;

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
          {prod.image_url && <img src={prod.image_url} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-800 truncate">{prod.brand} {prod.name}</p>
            <p className="text-[10px] text-ink-400 mt-0.5">{prod.pack_size} · MOQ {prod.moq}</p>
          </div>
          {editId === prod.id ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={stockValue}
                onChange={(e) => setStockValue(Number(e.target.value))}
                className="w-16 h-9 rounded-lg border border-ink-200 px-2 text-sm font-bold outline-none focus:border-brand-500"
              />
              <button
                disabled={savingId === prod.id}
                onClick={() => void updateStock(prod.id)}
                className="h-9 px-3 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center justify-center"
              >
                {savingId === prod.id ? <Loader2 size={13} className="animate-spin" /> : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditId(prod.id); setStockValue(prod.stock_quantity); }}
              className={`h-9 px-3 rounded-xl text-xs font-bold ${
                prod.stock_quantity > 0 ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-red-50 text-red-600 border border-red-200'
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
