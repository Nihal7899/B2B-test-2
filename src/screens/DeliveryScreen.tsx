import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, Package, Truck, CheckCircle2, MapPin, Loader2,
  PhoneCall, Navigation, Wallet, Banknote, CreditCard, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DbOrder, DbOrderItem, DbAddress } from '@/services/catalog';
import { SlideToConfirm } from '@/components/SlideToConfirm';

interface DeliveryScreenProps {
  onBack: () => void;
}

export interface DeliveryPaymentSummary {
  walletPaid: number;
  onlinePaid: number;
  codPending: number;
  codPaid: number;
  totalPaid: number;
  amountToCollect: number;
  isFullyPaid: boolean;
  isSplit: boolean;
  providers: string[];
}

export function DeliveryScreen({ onBack }: DeliveryScreenProps) {
  const [assignments, setAssignments] = useState<
    {
      assignment: { id: string; order_id: string; status: string; picked_up_at: string | null; delivered_at: string | null };
      order: DbOrder;
      items: DbOrderItem[];
      address: DbAddress | null;
      paymentSummary: DeliveryPaymentSummary;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch assigned deliveries
      const { data: assignData, error: assignError } = await supabase
        .from('delivery_assignments')
        .select('*')
        .eq('delivery_partner_id', user.id)
        .order('created_at', { ascending: false });

      if (assignError || !assignData) {
        console.error('Error fetching assignments:', assignError);
        setLoading(false);
        return;
      }

      const orderIds = assignData.map((a) => a.order_id);
      if (orderIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // 2. Batch fetch orders, items, addresses, and payments
      const [ordersRes, itemsRes, paymentsRes] = await Promise.all([
        supabase.from('orders').select('*').in('id', orderIds),
        supabase.from('order_items').select('*').in('order_id', orderIds),
        supabase.from('payments').select('id, order_id, provider, status, amount').in('order_id', orderIds),
      ]);

      const ordersMap = Object.fromEntries((ordersRes.data || []).map((o) => [o.id, o]));
      const addressIds = (ordersRes.data || []).map((o) => o.address_id).filter(Boolean);

      let addressMap: Record<string, DbAddress> = {};
      if (addressIds.length > 0) {
        const { data: addrData } = await supabase
          .from('addresses')
          .select('*')
          .in('id', addressIds);
        addressMap = Object.fromEntries((addrData || []).map((a) => [a.id, a]));
      }

      // 3. Map items by order_id
      const itemsMap: Record<string, DbOrderItem[]> = {};
      (itemsRes.data || []).forEach((item) => {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push(item);
      });

      // 4. Compute payment summaries per order
      const paymentsMap: Record<string, DeliveryPaymentSummary> = {};
      (paymentsRes.data || []).forEach((p) => {
        if (!paymentsMap[p.order_id]) {
          paymentsMap[p.order_id] = {
            walletPaid: 0,
            onlinePaid: 0,
            codPending: 0,
            codPaid: 0,
            totalPaid: 0,
            amountToCollect: 0,
            isFullyPaid: false,
            isSplit: false,
            providers: [],
          };
        }

        const summary = paymentsMap[p.order_id];
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

      // 5. Build structured list
      const results = assignData
        .map((a) => {
          const order = ordersMap[a.order_id] as DbOrder | undefined;
          if (!order) return null;

          const summary = paymentsMap[order.id] || {
            walletPaid: 0,
            onlinePaid: 0,
            codPending: 0,
            codPaid: 0,
            totalPaid: 0,
            amountToCollect: Number(order.total),
            isFullyPaid: false,
            isSplit: false,
            providers: [],
          };

          // If delivered, pending collection is considered completed
          if (a.status === 'delivered') {
            summary.amountToCollect = 0;
            summary.isFullyPaid = true;
          } else {
            summary.isFullyPaid = summary.amountToCollect === 0;
          }
          summary.isSplit = summary.providers.length > 1;

          return {
            assignment: a,
            order,
            items: itemsMap[order.id] || [],
            address: order.address_id ? addressMap[order.address_id] || null : null,
            paymentSummary: summary,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      setAssignments(results);
    } catch (err) {
      console.error('Unexpected error in load:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) void load();
    }, 30000);
    return () => clearInterval(interval);
  }, [load, loading]);

  const completeDelivery = async (assignmentId: string, status: 'out_for_delivery' | 'delivered') => {
    setProcessingId(assignmentId);
    try {
      const { error } = await supabase.rpc('complete_delivery', {
        p_assignment_id: assignmentId,
        p_status: status,
      });
      if (error) {
        console.error('Error updating delivery:', error);
        alert('Could not update delivery: ' + error.message);
      } else {
        await load();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={28} className="animate-spin text-brand-600" />
      </div>
    );
  }

  const isProcessing = (id: string) => processingId === id;

  return (
    <div className="safe-top px-4 pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Delivery Panel</h1>
          <p className="text-xs text-ink-500 mt-0.5">Your active tasks & route assignments</p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="h-20 w-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Truck size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-extrabold text-ink-900 mt-5">No deliveries assigned</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-[250px]">
            New shipments dispatched from the warehouse will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(({ assignment, order, items, address, paymentSummary: pay }) => {
            const isCurrentProcessing = isProcessing(assignment.id);
            const isDelivered = assignment.status === 'delivered';

            return (
              <div
                key={assignment.id}
                className={`bg-white border rounded-2xl p-4 shadow-card space-y-3 transition-all ${
                  !pay.isFullyPaid && !isDelivered
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-ink-100'
                }`}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink-900">{order.order_number}</p>
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        Assigned on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase rounded-full px-2.5 py-1 ${
                      isDelivered
                        ? 'bg-emerald-100 text-emerald-800'
                        : assignment.status === 'out_for_delivery'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {assignment.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Prominent Payment Due Banner */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between font-extrabold ${
                    pay.isFullyPaid || isDelivered
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-500 text-white border-amber-600 shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {pay.isFullyPaid || isDelivered ? (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    ) : (
                      <Banknote size={20} className="text-amber-100 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs uppercase tracking-wide">
                        {pay.isFullyPaid || isDelivered ? 'Payment Status' : 'Cash to Collect on Delivery'}
                      </p>
                      <p className={`text-[10px] font-semibold ${pay.isFullyPaid || isDelivered ? 'text-emerald-700' : 'text-amber-100'}`}>
                        {pay.isFullyPaid || isDelivered
                          ? 'Prepaid in Full (Do NOT collect cash)'
                          : 'Collect cash/UPI payment before handing over goods'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black">
                      {pay.isFullyPaid || isDelivered
                        ? '₹0.00'
                        : `₹${pay.amountToCollect.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </p>
                  </div>
                </div>

                {/* Items Accordion/List */}
                <div className="space-y-1.5 border-t border-dashed border-ink-200 pt-2.5">
                  <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Package Contents</p>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-ink-700 font-medium truncate flex-1">
                        {item.brand} {item.product_name} × {item.quantity}
                      </span>
                      <span className="font-bold text-ink-900 ml-2">
                        ₹{Number(item.line_total).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Payment Breakdown */}
                <div className="border-t border-dashed border-ink-200 pt-2.5 space-y-1 text-xs">
                  <div className="flex justify-between text-ink-600 font-semibold">
                    <span>Order Grand Total</span>
                    <span>₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {pay.walletPaid > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold items-center">
                      <span className="flex items-center gap-1"><Wallet size={12} /> Paid via Wallet</span>
                      <span>- ₹{pay.walletPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {pay.onlinePaid > 0 && (
                    <div className="flex justify-between text-blue-600 font-semibold items-center">
                      <span className="flex items-center gap-1"><CreditCard size={12} /> Paid Online</span>
                      <span>- ₹{pay.onlinePaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {pay.codPaid > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold items-center">
                      <span className="flex items-center gap-1"><Banknote size={12} /> COD Settled</span>
                      <span>- ₹{pay.codPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                {/* Customer Address & Navigation Card */}
                {address && (
                  <div className="rounded-2xl bg-ink-50 p-3 space-y-2.5 border border-ink-100">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-brand-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-ink-900">
                          {address.label} · {address.recipient_name}
                        </p>
                        <p className="text-[11px] text-ink-600 mt-0.5 leading-relaxed">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} - {address.postal_code}
                        </p>
                      </div>
                    </div>

                    {/* Quick Dial & Maps Launcher */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${address.phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs hover:bg-emerald-50 active:scale-95 transition"
                      >
                        <PhoneCall size={14} className="text-emerald-600" />
                        Call ({address.phone})
                      </a>
                      {address.latitude && address.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white border border-sky-200 text-sky-700 text-xs font-bold shadow-xs hover:bg-sky-50 active:scale-95 transition"
                        >
                          <Navigation size={14} className="text-sky-600" />
                          GPS Navigate
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Slider Controls */}
                <div className="pt-2">
                  {assignment.status === 'ready_for_pickup' && (
                    <SlideToConfirm
                      label="Slide to confirm pickup"
                      onConfirm={() => completeDelivery(assignment.id, 'out_for_delivery')}
                      isLoading={isCurrentProcessing}
                      disabled={isCurrentProcessing}
                    />
                  )}
                  {assignment.status === 'out_for_delivery' && (
                    <SlideToConfirm
                      label={
                        pay.amountToCollect > 0
                          ? `Collect ₹${pay.amountToCollect.toFixed(0)} & slide to deliver`
                          : 'Slide to confirm delivery'
                      }
                      onConfirm={() => completeDelivery(assignment.id, 'delivered')}
                      isLoading={isCurrentProcessing}
                      disabled={isCurrentProcessing}
                    />
                  )}
                  {isDelivered && (
                    <div className="h-12 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200">
                      <CheckCircle2 size={18} />
                      Delivered & Settled Successfully
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
