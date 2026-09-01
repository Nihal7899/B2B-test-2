// src/screens/WarehouseScreen.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Package,
  Printer,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  Eye,
  X,
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

export function WarehouseScreen({ onBack }: WarehouseScreenProps) {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [addressMap, setAddressMap] = useState<Record<string, DbAddress>>({});
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, { id: string; delivery_partner_id: string | null; status: string }>>({});
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  
  // Lazy Item Inspection State
  const [inspectOrderId, setInspectOrderId] = useState<string | null>(null);
  const [inspectItems, setInspectItems] = useState<DbOrderItem[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 1. Fetch delivery partner drivers with profile names
  const loadDrivers = useCallback(async () => {
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'delivery_partner');

      if (roles && roles.length > 0) {
        const userIds = roles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, personal_name, business_name, phone')
          .in('id', userIds);

        const driverList: DeliveryDriver[] = (profiles || []).map((p) => ({
          id: p.id,
          name: p.full_name || p.personal_name || p.business_name || `Driver (${p.phone})`,
          phone: p.phone,
        }));
        setDrivers(driverList);
      }
    } catch (err) {
      console.error('Failed to load drivers:', err);
    }
  }, []);

  // 2. Fetch lightweight orders metadata (No line-item payload)
  const loadOrders = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersErr || !ordersData) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setOrders(ordersData as DbOrder[]);

      const orderIds = ordersData.map((o) => o.id);
      const addressIds = ordersData.map((o) => o.address_id).filter(Boolean);

      const [addrRes, assignRes] = await Promise.all([
        addressIds.length > 0
          ? supabase.from('addresses').select('*').in('id', addressIds)
          : Promise.resolve({ data: [] }),
        orderIds.length > 0
          ? supabase.from('delivery_assignments').select('id, order_id, delivery_partner_id, status').in('order_id', orderIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (addrRes.data) {
        setAddressMap(Object.fromEntries(addrRes.data.map((a) => [a.id, a])));
      }
      if (assignRes.data) {
        const assignMap: Record<string, any> = {};
        assignRes.data.forEach((asg) => {
          assignMap[asg.order_id] = asg;
        });
        setAssignmentsMap(assignMap);
      }
    } catch (err) {
      console.error('Failed to load warehouse data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDrivers();
    void loadOrders();

    // Lightweight Realtime subscription on orders table
    const channel = supabase
      .channel('warehouse_orders')
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
  }, [loadDrivers, loadOrders]);

  // Lazy line-item inspection modal
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

  const handleConfirm = async (orderId: string) => {
    setActionOrderId(orderId);
    try {
      const { error } = await supabase.rpc('confirm_order', { p_order_id: orderId });
      if (error) alert('Could not confirm order: ' + error.message);
      else await loadOrders();
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

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    setActionOrderId(orderId);
    try {
      const existing = assignmentsMap[orderId];
      if (existing) {
        await supabase
          .from('delivery_assignments')
          .update({ delivery_partner_id: driverId, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('delivery_assignments')
          .insert({ order_id: orderId, delivery_partner_id: driverId, status: 'ready_for_pickup' });
      }
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

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.address_id && addressMap[o.address_id]?.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="safe-top px-4 pb-12 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Warehouse Panel</h1>
            <p className="text-xs text-ink-500">Live order fulfillment & dispatch</p>
          </div>
        </div>
        <button
          onClick={() => {
            setRefreshing(true);
            void loadOrders();
          }}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-brand-600' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-3 text-ink-400" />
          <input
            type="text"
            placeholder="Search order or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-ink-200 text-xs font-semibold outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white border border-ink-200 text-xs font-semibold outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="packed">Packed</option>
          <option value="ready_for_pickup">Ready for Pickup</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 text-ink-400 text-sm">No orders matching criteria</div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => {
            const addr = ord.address_id ? addressMap[ord.address_id] : null;
            const asg = assignmentsMap[ord.id];
            const isProcessing = actionOrderId === ord.id;

            return (
              <div key={ord.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-black text-ink-900">{ord.order_number}</span>
                    <p className="text-[11px] text-ink-500 mt-0.5">
                      {addr?.recipient_name} · {addr?.city}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase rounded-full px-2.5 py-1 bg-ink-100 text-ink-800">
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-ink-100 pt-2 text-xs">
                  <div>
                    <span className="text-ink-400">Total: </span>
                    <span className="font-extrabold text-ink-900">₹{Number(ord.total).toLocaleString('en-IN')}</span>
                  </div>
                  <button
                    onClick={() => void openItemInspection(ord.id)}
                    className="flex items-center gap-1 text-brand-600 font-bold text-xs bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100"
                  >
                    <Eye size={13} /> View Items
                  </button>
                </div>

                {/* Driver Assignment Dropdown */}
                <div className="border-t border-ink-100 pt-2.5 flex items-center gap-2">
                  <UserCheck size={16} className="text-ink-500 shrink-0" />
                  <select
                    value={asg?.delivery_partner_id || ''}
                    disabled={isProcessing}
                    onChange={(e) => void handleAssignDriver(ord.id, e.target.value)}
                    className="flex-1 h-8 rounded-lg bg-ink-50 border border-ink-200 text-xs font-semibold px-2 outline-none"
                  >
                    <option value="">-- Assign Delivery Partner --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {ord.status === 'pending' && (
                    <button
                      disabled={isProcessing}
                      onClick={() => void handleConfirm(ord.id)}
                      className="flex-1 h-9 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
                    >
                      {isProcessing ? 'Confirming...' : 'Confirm Order'}
                    </button>
                  )}
                  {ord.status === 'confirmed' && (
                    <button
                      disabled={isProcessing}
                      onClick={() => void handleUpdateStatus(ord.id, 'packed')}
                      className="flex-1 h-9 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                    >
                      Mark as Packed
                    </button>
                  )}
                  {ord.status === 'packed' && (
                    <button
                      disabled={isProcessing}
                      onClick={() => void handleUpdateStatus(ord.id, 'ready_for_pickup')}
                      className="flex-1 h-9 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700"
                    >
                      Ready for Pickup
                    </button>
                  )}
                  <button
                    onClick={() => void handlePrint(ord.id, ord.order_number)}
                    className="h-9 px-3 rounded-xl border border-ink-200 bg-white text-ink-700 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Printer size={14} /> Invoice
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lazy Inspection Modal */}
      {inspectOrderId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <h3 className="font-extrabold text-sm text-ink-900">Package Items</h3>
              <button onClick={() => setInspectOrderId(null)} className="h-7 w-7 rounded-lg bg-ink-100 flex items-center justify-center text-ink-600">
                <X size={16} />
              </button>
            </div>

            {inspectLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 size={24} className="animate-spin text-brand-600" />
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {inspectItems.map((it) => (
                  <div key={it.id} className="flex justify-between items-center text-xs py-1.5 border-b border-ink-50">
                    <div>
                      <p className="font-bold text-ink-800">{it.brand} {it.product_name}</p>
                      <p className="text-[10px] text-ink-400">{it.pack_size} · Qty: {it.quantity}</p>
                    </div>
                    <p className="font-bold text-ink-900">₹{Number(it.line_total).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
