import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Package,
  Printer,
  Boxes,
  AlertTriangle,
  Minus,
  Plus,
  Save,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  Eye,
  X,
  FileText,
  Check,
  CheckCircle,
  XCircle,
  ChevronDown,
  Edit2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DbOrder, DbOrderItem, DbAddress } from '@/services/catalog';
import { buildGstBillHtml } from '@/services/gstBill';
import { printHtml } from '@/utils/printHtml';

interface WarehouseScreenProps {
  onBack: () => void;
}

interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
}

interface ProductInventory {
  id: string;
  name: string;
  brand: string;
  pack_size: string;
  stock_quantity: number;
  stock_threshold: number;
  wholesale_price: number;
  mrp: number;
  image_url: string;
  is_available: boolean;
}

interface PaymentRecord {
  order_id: string;
  provider: string;
  amount: number;
  status: string;
}

interface PaymentSummary {
  walletPaid: number;
  onlinePaid: number;
  codPaid: number;
  totalPaid: number;
  amountDue: number;
  isFullyPaid: boolean;
  providers: string[];
}

export function WarehouseScreen({ onBack }: WarehouseScreenProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices' | 'inventory' | 'low_stock'>('orders');
  const [orderStatusPill, setOrderStatusPill] = useState<string>('all');

  // Orders State
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [addressMap, setAddressMap] = useState<Record<string, DbAddress>>({});
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, { id: string; delivery_partner_id: string | null; status: string }>>({});
  const [paymentsMap, setPaymentsMap] = useState<Record<string, PaymentSummary>>({});
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [editingDriverOrderId, setEditingDriverOrderId] = useState<string | null>(null);

  // Inventory State
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [savingStockId, setSavingStockId] = useState<string | null>(null);

  // Lazy Item Inspection State
  const [inspectOrderId, setInspectOrderId] = useState<string | null>(null);
  const [inspectItems, setInspectItems] = useState<DbOrderItem[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  // General Screen State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Drivers using RPC
  const loadDrivers = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_delivery_partners');
      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error('Failed to load drivers via RPC:', err);
    }
  }, []);

  // 2. Fetch Orders: Ascending order (Oldest first, Newest at bottom)
  const loadOrders = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true }) // Old orders at top, new orders at bottom
        .limit(150);

      if (ordersErr || !ordersData) return;

      setOrders(ordersData as DbOrder[]);

      const orderIds = ordersData.map((o) => o.id);
      const addressIds = ordersData.map((o) => o.address_id).filter(Boolean);

      const [addrRes, assignRes, paymentsRes] = await Promise.all([
        addressIds.length > 0
          ? supabase.from('addresses').select('*').in('id', addressIds)
          : Promise.resolve({ data: [] }),
        orderIds.length > 0
          ? supabase.from('delivery_assignments').select('id, order_id, delivery_partner_id, status').in('order_id', orderIds)
          : Promise.resolve({ data: [] }),
        orderIds.length > 0
          ? supabase.from('payments').select('order_id, provider, amount, status').in('order_id', orderIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (addrRes.data) {
        setAddressMap(Object.fromEntries(addrRes.data.map((a) => [a.id, a])));
      }

      if (assignRes.data) {
        const asgMap: Record<string, any> = {};
        assignRes.data.forEach((asg) => {
          asgMap[asg.order_id] = asg;
        });
        setAssignmentsMap(asgMap);
      }

      const paySummaries: Record<string, PaymentSummary> = {};
      const allPayments: PaymentRecord[] = (paymentsRes.data as PaymentRecord[]) || [];

      ordersData.forEach((ord) => {
        let walletPaid = 0;
        let onlinePaid = 0;
        let codPaid = 0;
        const providers: string[] = [];

        const orderPayments = allPayments.filter((p) => p.order_id === ord.id);

        orderPayments.forEach((p) => {
          const status = (p.status || '').toLowerCase();
          const provider = (p.provider || '').toLowerCase();
          const amt = Number(p.amount) || 0;

          if (!providers.includes(provider)) providers.push(provider);

          if (status === 'paid' || status === 'completed') {
            if (provider === 'wallet') walletPaid += amt;
            else if (provider === 'razorpay') onlinePaid += amt;
            else if (provider === 'cod') codPaid += amt;
          }
        });

        const total = Number(ord.total) || 0;
        const totalSettled = walletPaid + onlinePaid + codPaid;
        const pending = Math.max(0, total - totalSettled);

        paySummaries[ord.id] = {
          walletPaid,
          onlinePaid,
          codPaid,
          totalPaid: totalSettled,
          amountDue: ord.status === 'delivered' ? 0 : pending,
          isFullyPaid: ord.status === 'delivered' || pending <= 0.01,
          providers,
        };
      });

      setPaymentsMap(paySummaries);
    } catch (err) {
      console.error('Failed to load orders in warehouse:', err);
    }
  }, []);

  // 3. Fetch Inventory
  const loadInventory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, pack_size, stock_quantity, stock_threshold, wholesale_price, mrp, image_url, is_available')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data as ProductInventory[]);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadDrivers(), loadOrders(), loadInventory()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadDrivers, loadOrders, loadInventory]);

  useEffect(() => {
    void loadAll();

    const channel = supabase
      .channel('warehouse_live_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          void loadOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_assignments' },
        () => {
          void loadOrders();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadAll, loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadAll();
  };

  const openItemInspection = async (orderId: string) => {
    setInspectOrderId(orderId);
    setInspectLoading(true);
    try {
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      setInspectItems((data as DbOrderItem[]) || []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  // Confirm order & immediately recalculate low stock
  const handleConfirmOrder = async (orderId: string) => {
    setActionOrderId(orderId);
    try {
      const { error } = await supabase.rpc('confirm_order', { p_order_id: orderId });
      if (error) alert('Could not confirm order: ' + error.message);
      else {
        // Run both so inventory and the low stock badge update instantly
        await Promise.all([loadOrders(), loadInventory()]);
      }
    } finally {
      setActionOrderId(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setActionOrderId(orderId);
    try {
      const { error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_status: status,
      });
      if (error) alert('Status update failed: ' + error.message);
      else await loadOrders();
    } finally {
      setActionOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Stock will be preserved.')) return;
    setActionOrderId(orderId);
    try {
      const { error } = await supabase.rpc('cancel_order_warehouse', {
        p_order_id: orderId,
        p_reason: 'Cancelled by warehouse manager',
      });
      if (error) alert('Cancel failed: ' + error.message);
      else await Promise.all([loadOrders(), loadInventory()]);
    } finally {
      setActionOrderId(null);
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    setActionOrderId(orderId);
    const existing = assignmentsMap[orderId];
    const previousDriverId = existing?.delivery_partner_id || null;

    try {
      if (existing) {
        await supabase
          .from('delivery_assignments')
          .update({ delivery_partner_id: driverId || null, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else if (driverId) {
        await supabase
          .from('delivery_assignments')
          .insert({ order_id: orderId, delivery_partner_id: driverId, status: 'ready_for_pickup' });
      }

      // Zero-load broadcast to update driver devices instantly
      const syncChannel = supabase.channel('delivery_dispatch_sync');
      await syncChannel.send({
        type: 'broadcast',
        event: 'assignment_changed',
        payload: { orderId, previousDriverId, newDriverId: driverId },
      });

      setEditingDriverOrderId(null);
      await loadOrders();
    } catch (err: any) {
      alert('Failed to assign driver: ' + err.message);
    } finally {
      setActionOrderId(null);
    }
  };

  const handlePrint = async (orderId: string, orderNumber: string) => {
    try {
      const html = await buildGstBillHtml(orderId);
      await printHtml(html, orderNumber);
    } catch (err) {
      alert('Failed to generate bill.');
    }
  };

  // Stock Adjustment Handlers
  const handleStockDelta = (productId: string, currentStock: number, delta: number) => {
    const activeValue = stockEdits[productId] !== undefined ? stockEdits[productId] : currentStock;
    const nextVal = Math.max(0, activeValue + delta);
    setStockEdits((prev) => ({ ...prev, [productId]: nextVal }));
  };

  const handleStockInputChange = (productId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setStockEdits((prev) => ({ ...prev, [productId]: isNaN(parsed) ? 0 : Math.max(0, parsed) }));
  };

  const handleCancelStockEdit = (productId: string) => {
    setStockEdits((prev) => {
      const clone = { ...prev };
      delete clone[productId];
      return clone;
    });
  };

  const handleSaveStock = async (productId: string) => {
    const updatedQuantity = stockEdits[productId];
    if (updatedQuantity === undefined) return;

    setSavingStockId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: updatedQuantity, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) {
        alert('Failed to update stock: ' + error.message);
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock_quantity: updatedQuantity } : p))
        );
        handleCancelStockEdit(productId);
      }
    } finally {
      setSavingStockId(null);
    }
  };

  // Filter Pills for Orders
  const orderPills = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'packed', label: 'Packed' },
    { id: 'ready_for_pickup', label: 'Ready for Pickup' },
    { id: 'out_for_delivery', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const recipient = o.address_id ? addressMap[o.address_id]?.recipient_name || '' : '';
      const orderNum = o.order_number || '';
      const matchesSearch =
        orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = orderStatusPill === 'all' || o.status === orderStatusPill;
      return matchesSearch && matchesStatus;
    });
  }, [orders, addressMap, searchQuery, orderStatusPill]);

  const invoiceOrders = useMemo(() => {
    return orders.filter((o) => {
      const recipient = o.address_id ? addressMap[o.address_id]?.recipient_name || '' : '';
      const orderNum = o.order_number || '';
      return (
        orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipient.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [orders, addressMap, searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [products, searchQuery]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const isLow = p.stock_quantity <= (p.stock_threshold || 10);
      return (
        isLow &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [products, searchQuery]);

  return (
    <div className="safe-top px-4 pb-20 space-y-4 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center shadow-xs active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Warehouse Console</h1>
            <p className="text-xs text-ink-500">Live fulfillment, stock control & dispatch</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center text-ink-600 shadow-xs active:scale-95 transition-transform"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-brand-600' : ''} />
        </button>
      </div>

      {/* Main Mode Tabs with Invoices restored */}
      <div className="grid grid-cols-4 gap-1 bg-ink-100 p-1 rounded-2xl">
        <button
          onClick={() => {
            setActiveTab('orders');
            setSearchQuery('');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          <Package size={14} />
          <span className="hidden sm:inline">Orders</span>
          <span>({orders.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('invoices');
            setSearchQuery('');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'invoices' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          <FileText size={14} />
          <span>Invoices</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('inventory');
            setSearchQuery('');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'inventory' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          <Boxes size={14} />
          <span className="hidden sm:inline">Inventory</span>
          <span>({products.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('low_stock');
            setSearchQuery('');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'low_stock' ? 'bg-white text-red-600 shadow-sm' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Low Stock</span>
          {lowStockProducts.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
              {lowStockProducts.length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-3 text-ink-400" />
        <input
          type="text"
          placeholder={
            activeTab === 'orders' || activeTab === 'invoices'
              ? 'Search by Order # or Merchant Name...'
              : 'Search product brand, name, or code...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-ink-200 text-xs font-semibold outline-none focus:border-brand-500 shadow-xs"
        />
      </div>

      {/* Horizontal Status Pill Bar for Orders */}
      {activeTab === 'orders' && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {orderPills.map((pill) => {
            const count =
              pill.id === 'all' ? orders.length : orders.filter((o) => o.status === pill.id).length;
            const isActive = orderStatusPill === pill.id;

            return (
              <button
                key={pill.id}
                onClick={() => setOrderStatusPill(pill.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-ink-100 text-ink-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {/* TAB 1: ORDERS FULFILLMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-white border border-ink-100 rounded-3xl p-10 text-center text-ink-400 space-y-2">
                  <Package size={36} className="mx-auto text-ink-300" />
                  <p className="font-bold text-sm text-ink-700">No orders matching criteria</p>
                  <p className="text-xs">Adjust your search query or status filter pill above.</p>
                </div>
              ) : (
                filteredOrders.map((ord) => {
                  const addr = ord.address_id ? addressMap[ord.address_id] : null;
                  const asg = assignmentsMap[ord.id];
                  const pay = paymentsMap[ord.id] || {
                    walletPaid: 0,
                    onlinePaid: 0,
                    codPaid: 0,
                    totalPaid: 0,
                    amountDue: Number(ord.total),
                    isFullyPaid: false,
                    providers: [],
                  };
                  const isProcessing = actionOrderId === ord.id;
                  const isDelivered = ord.status === 'delivered';
                  const isCancelled = ord.status === 'cancelled';
                  const isReadyForPickup = ord.status === 'ready_for_pickup';
                  const assignedDriver = drivers.find((d) => d.id === asg?.delivery_partner_id);
                  const isEditingDriver = editingDriverOrderId === ord.id;

                  return (
                    <div
                      key={ord.id}
                      className={`bg-white border rounded-2xl p-4 shadow-card space-y-3.5 transition-all ${
                        ord.status === 'pending'
                          ? 'border-brand-300 ring-1 ring-brand-100'
                          : isCancelled
                          ? 'border-red-200 bg-red-50/20'
                          : 'border-ink-100'
                      }`}
                    >
                      {/* Order Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-ink-900 tracking-tight">
                              {ord.order_number}
                            </span>
                            <span className="text-[10px] text-ink-400 font-semibold">
                              {new Date(ord.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-ink-700 mt-0.5">
                            {addr?.recipient_name || 'Commercial Customer'}
                            {addr?.city ? ` · ${addr.city}` : ''}
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase rounded-full px-2.5 py-1 ${
                            isDelivered
                              ? 'bg-emerald-100 text-emerald-800'
                              : isReadyForPickup || ord.status === 'out_for_delivery'
                              ? 'bg-sky-100 text-sky-800'
                              : ord.status === 'packed'
                              ? 'bg-amber-100 text-amber-800'
                              : ord.status === 'confirmed'
                              ? 'bg-indigo-100 text-indigo-800'
                              : isCancelled
                              ? 'bg-red-100 text-red-800'
                              : 'bg-brand-100 text-brand-800'
                          }`}
                        >
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Payment Status Bar */}
                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between font-bold text-xs ${
                          pay.isFullyPaid || isDelivered
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-amber-500 border-amber-600 text-white shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {pay.isFullyPaid || isDelivered ? (
                            <CheckCircle size={17} className="text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle size={18} className="text-amber-100 shrink-0" />
                          )}
                          <div>
                            <p className="text-[11px] uppercase tracking-wider font-extrabold">
                              {pay.isFullyPaid || isDelivered
                                ? 'Payment Settled (Prepaid)'
                                : 'Pending Cash Collection (COD)'}
                            </p>
                            <p className={`text-[10px] ${pay.isFullyPaid || isDelivered ? 'text-emerald-700' : 'text-amber-100'}`}>
                              {pay.walletPaid > 0 && `Wallet: ₹${pay.walletPaid.toFixed(0)} `}
                              {pay.onlinePaid > 0 && `Online: ₹${pay.onlinePaid.toFixed(0)} `}
                              {pay.codPaid > 0 && `COD: ₹${pay.codPaid.toFixed(0)} `}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black">
                            {pay.isFullyPaid || isDelivered
                              ? `₹${Number(ord.total).toFixed(2)}`
                              : `Collect ₹${pay.amountDue.toFixed(2)}`}
                          </p>
                        </div>
                      </div>

                      {/* Line Item preview trigger */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="text-ink-400">Total: </span>
                          <span className="font-extrabold text-ink-900">
                            ₹{Number(ord.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <button
                          onClick={() => void openItemInspection(ord.id)}
                          className="flex items-center gap-1 text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1 rounded-lg font-bold text-[11px] transition"
                        >
                          <Eye size={12} /> View Items
                        </button>
                      </div>

                      {/* Driver Assignment ONLY in 'ready_for_pickup' */}
                      {isReadyForPickup && (
                        <div className="rounded-xl bg-ink-50 border border-ink-200 p-2.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-ink-700 flex items-center gap-1">
                              <UserCheck size={14} className="text-brand-600" /> Delivery Partner
                            </span>
                            {assignedDriver && !isEditingDriver && (
                              <button
                                onClick={() => setEditingDriverOrderId(ord.id)}
                                className="text-[11px] font-bold text-brand-600 flex items-center gap-1 hover:underline"
                              >
                                <Edit2 size={11} /> Change Partner
                              </button>
                            )}
                          </div>

                          {!assignedDriver || isEditingDriver ? (
                            <div className="relative">
                              <select
                                value={asg?.delivery_partner_id || ''}
                                disabled={isProcessing}
                                onChange={(e) => void handleAssignDriver(ord.id, e.target.value)}
                                className="w-full h-9 pl-2.5 pr-8 rounded-lg bg-white border border-ink-200 text-xs font-semibold text-ink-800 outline-none focus:border-brand-500 appearance-none shadow-xs"
                              >
                                <option value="">-- Choose Partner to Dispatch --</option>
                                {drivers.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} {d.phone ? `(${d.phone})` : ''}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={14}
                                className="absolute right-2.5 top-2.5 text-ink-400 pointer-events-none"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-white border border-ink-200 rounded-lg p-2">
                              <div>
                                <p className="text-xs font-bold text-ink-900">{assignedDriver.name}</p>
                                <p className="text-[10px] text-ink-400">{assignedDriver.phone}</p>
                              </div>
                              <span className="bg-sky-50 text-sky-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-sky-200">
                                Assigned
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Progression & Cancel Button */}
                      <div className="flex items-center gap-2 pt-1">
                        {ord.status === 'pending' && (
                          <button
                            disabled={isProcessing}
                            onClick={() => void handleConfirmOrder(ord.id)}
                            className="flex-1 h-9 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft active:scale-98 transition disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Confirm & Deduct Stock
                          </button>
                        )}

                        {ord.status === 'confirmed' && (
                          <button
                            disabled={isProcessing}
                            onClick={() => void handleUpdateStatus(ord.id, 'packed')}
                            className="flex-1 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft active:scale-98 transition disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                            Mark as Packed
                          </button>
                        )}

                        {ord.status === 'packed' && (
                          <button
                            disabled={isProcessing}
                            onClick={() => void handleUpdateStatus(ord.id, 'ready_for_pickup')}
                            className="flex-1 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft active:scale-98 transition disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Ready for Dispatch
                          </button>
                        )}

                        {!isDelivered && !isCancelled && (
                          <button
                            disabled={isProcessing}
                            onClick={() => void handleCancelOrder(ord.id)}
                            className="h-9 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 shadow-xs active:scale-98 transition"
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}

                        <button
                          onClick={() => void handlePrint(ord.id, ord.order_number)}
                          className="h-9 px-3 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-98 transition"
                        >
                          <Printer size={14} className="text-ink-600" /> Invoice
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: INVOICES TAB */}
          {activeTab === 'invoices' && (
            <div className="space-y-3">
              {invoiceOrders.length === 0 ? (
                <div className="bg-white border border-ink-100 rounded-3xl p-10 text-center text-ink-400 space-y-2">
                  <FileText size={36} className="mx-auto text-ink-300" />
                  <p className="font-bold text-sm text-ink-700">No invoices match your search</p>
                </div>
              ) : (
                invoiceOrders.map((ord) => {
                  const addr = ord.address_id ? addressMap[ord.address_id] : null;
                  return (
                    <div
                      key={ord.id}
                      className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-ink-900">{ord.order_number}</span>
                          <span className="text-[10px] font-bold text-ink-500 uppercase px-2 py-0.5 rounded-md bg-ink-100">
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-ink-600 font-medium mt-0.5">
                          {addr?.recipient_name} · {addr?.city}
                        </p>
                        <p className="text-[11px] text-ink-400 mt-0.5">
                          Total: <span className="font-extrabold text-ink-800">₹{Number(ord.total).toLocaleString('en-IN')}</span> · GST: ₹{Number(ord.gst_amount || 0).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <button
                        onClick={() => void handlePrint(ord.id, ord.order_number)}
                        className="h-9 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-soft active:scale-95 transition shrink-0"
                      >
                        <Printer size={14} /> Print GST Invoice
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3 & 4: INVENTORY & LOW STOCK */}
          {(activeTab === 'inventory' || activeTab === 'low_stock') && (
            <div className="space-y-3">
              {(activeTab === 'inventory' ? filteredProducts : lowStockProducts).length === 0 ? (
                <div className="bg-white border border-ink-100 rounded-3xl p-10 text-center text-ink-400 space-y-2">
                  <Boxes size={36} className="mx-auto text-ink-300" />
                  <p className="font-bold text-sm text-ink-700">No items found</p>
                  <p className="text-xs">
                    {activeTab === 'low_stock'
                      ? 'All inventory items are currently well-stocked.'
                      : 'No products match your search query.'}
                  </p>
                </div>
              ) : (
                (activeTab === 'inventory' ? filteredProducts : lowStockProducts).map((prod) => {
                  const currentStock = prod.stock_quantity ?? 0;
                  const threshold = prod.stock_threshold || 10;
                  const isModified = stockEdits[prod.id] !== undefined;
                  const displayStock = isModified ? stockEdits[prod.id] : currentStock;
                  const isSaving = savingStockId === prod.id;
                  const isLow = currentStock <= threshold && currentStock > 0;
                  const isOut = currentStock <= 0;

                  return (
                    <div
                      key={prod.id}
                      className={`bg-white border rounded-2xl p-3.5 shadow-card space-y-3 transition-all ${
                        isOut
                          ? 'border-red-300 ring-1 ring-red-100'
                          : isLow
                          ? 'border-amber-300 ring-1 ring-amber-100'
                          : 'border-ink-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-ink-900 truncate">
                            {prod.brand} {prod.name}
                          </span>
                          <p className="text-[11px] text-ink-500 mt-0.5 font-medium">
                            Pack: {prod.pack_size} · Wholesale: ₹{Number(prod.wholesale_price).toFixed(2)} · MRP: ₹{Number(prod.mrp).toFixed(2)}
                          </p>
                        </div>

                        <span
                          className={`text-[9px] font-black uppercase rounded-full px-2.5 py-1 shrink-0 ${
                            isOut
                              ? 'bg-red-100 text-red-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>

                      {/* Stock Adjustment Controls with Both Update & Cancel */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-ink-400 font-semibold mr-1">Qty:</span>
                          <button
                            onClick={() => handleStockDelta(prod.id, currentStock, -1)}
                            className="h-8 w-8 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 flex items-center justify-center active:scale-95 transition"
                          >
                            <Minus size={13} />
                          </button>

                          <input
                            type="number"
                            value={displayStock}
                            onChange={(e) => handleStockInputChange(prod.id, e.target.value)}
                            className={`w-16 h-8 text-center text-xs font-black rounded-lg border outline-none ${
                              isModified
                                ? 'border-brand-500 bg-brand-50/30 text-brand-900 ring-1 ring-brand-300'
                                : 'border-ink-200 bg-white text-ink-900'
                            }`}
                          />

                          <button
                            onClick={() => handleStockDelta(prod.id, currentStock, 1)}
                            className="h-8 w-8 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 flex items-center justify-center active:scale-95 transition"
                          >
                            <Plus size={13} />
                          </button>

                          <div className="flex items-center gap-1 ml-1">
                            {[5, 10, 25].map((amt) => (
                              <button
                                key={amt}
                                onClick={() => handleStockDelta(prod.id, currentStock, amt)}
                                className="h-8 px-2 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-700 font-bold text-[10px] border border-ink-200 active:scale-95 transition"
                              >
                                +{amt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Both Cancel & Update Buttons */}
                        {isModified && (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              onClick={() => handleCancelStockEdit(prod.id)}
                              className="h-8 px-2.5 rounded-lg border border-ink-200 bg-white hover:bg-ink-50 text-ink-600 font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition"
                            >
                              <RotateCcw size={12} />
                              Cancel
                            </button>
                            <button
                              disabled={isSaving}
                              onClick={() => void handleSaveStock(prod.id)}
                              className="h-8 px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1 shadow-soft active:scale-95 transition disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                              Update
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Lazy Line-Item Inspection Modal */}
      {inspectOrderId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-ink-900">Package Contents</h3>
                <p className="text-[11px] text-ink-500">Inspect ordered line items before dispatch</p>
              </div>
              <button
                onClick={() => setInspectOrderId(null)}
                className="h-8 w-8 rounded-xl bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-ink-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {inspectLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 size={28} className="animate-spin text-brand-600" />
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 divide-y divide-ink-50">
                {inspectItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs py-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-ink-900 truncate">
                        {item.brand} {item.product_name}
                      </p>
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        {item.pack_size} · Qty: <span className="font-bold text-ink-700">{item.quantity}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-ink-900">
                        ₹{Number(item.line_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-ink-400">₹{Number(item.unit_price).toFixed(2)} / unit</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setInspectOrderId(null)}
              className="w-full h-10 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-800 text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
