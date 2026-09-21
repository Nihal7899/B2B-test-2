import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Printer,
  Loader2,
  Wallet,
  CreditCard,
  Banknote,
  AlertCircle,
  AlertOctagon,
  Building2,
  Receipt,
  FileText,
} from 'lucide-react';
import { fetchOrderDetail } from '@/services/catalog';
import type { DbOrder, DbOrderItem, DbAddress } from '@/services/catalog';
import { buildGstBillHtml } from '@/services/gstBill';
import { printHtml } from '@/utils/printHtml';
import { supabase } from '@/lib/supabase';

interface OrderDetailScreenProps {
  orderId: string;
  onBack: () => void;
}

interface OrderPaymentSummary {
  walletPaid: number;
  onlinePaid: number;
  codPaid: number;
  walletRefunded: number;
  onlineRefunded: number;
  totalPaid: number;
  amountToCollect: number;
  isFullyPaid: boolean;
}

interface BillingSnapshot {
  business_name?: string | null;
  gstin?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  landmark?: string | null;
  pincode?: string | null;
}

type OrderWithSnapshots = DbOrder & {
  cancel_reason?: string | null;
  delivery_address_snapshot?: DbAddress | null;
  billing_address_snapshot?: BillingSnapshot | null;
};

const STATUS_META: Record<
  string,
  { label: string; badge: string; dot: string; icon: typeof Clock; hero: string }
> = {
  pending: {
    label: 'Placed',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
    hero: 'Order received',
  },
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
    icon: Package,
    hero: 'Getting ready',
  },
  packed: {
    label: 'Packed',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
    icon: Package,
    hero: 'Packed & staged',
  },
  ready_for_pickup: {
    label: 'Ready for Pickup',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    icon: Package,
    hero: 'Awaiting pickup',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
    icon: Truck,
    hero: 'On the way',
  },
  delivered: {
    label: 'Delivered',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
    hero: 'Delivered',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-500',
    icon: XCircle,
    hero: 'Cancelled',
  },
};

const formatMoney = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function OrderDetailScreen({ orderId, onBack }: OrderDetailScreenProps) {
  const [order, setOrder] = useState<OrderWithSnapshots | null>(null);
  const [items, setItems] = useState<DbOrderItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState<DbAddress | null>(null);
  const [billingAddress, setBillingAddress] = useState<BillingSnapshot | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<OrderPaymentSummary>({
    walletPaid: 0,
    onlinePaid: 0,
    codPaid: 0,
    walletRefunded: 0,
    onlineRefunded: 0,
    totalPaid: 0,
    amountToCollect: 0,
    isFullyPaid: false,
  });
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [orderData, paymentsRes] = await Promise.all([
        fetchOrderDetail(orderId),
        supabase.from('payments').select('*').eq('order_id', orderId),
      ]);

      if (orderData) {
        const dbOrder = orderData.order as OrderWithSnapshots;
        setOrder(dbOrder);
        setItems(orderData.items);

        const dSnap = dbOrder.delivery_address_snapshot as DbAddress | null | undefined;
        const resolvedDelivery =
          dSnap && dSnap.recipient_name ? dSnap : orderData.address ?? null;
        setDeliveryAddress(resolvedDelivery);

        const bSnap = dbOrder.billing_address_snapshot as BillingSnapshot | null | undefined;
        const hasBillingData =
          bSnap &&
          (bSnap.address_line_1 || bSnap.city || bSnap.pincode || bSnap.business_name);
        setBillingAddress(hasBillingData ? bSnap : null);

        let walletPaid = 0;
        let onlinePaid = 0;
        let codPaid = 0;
        let walletRefunded = 0;
        let onlineRefunded = 0;

        (paymentsRes.data || []).forEach((p) => {
          const pStatus = (p.status || '').toLowerCase();
          const pProvider = (p.provider || '').toLowerCase();
          const amt = Number(p.amount) || 0;

          if (pStatus === 'paid' || pStatus === 'completed') {
            if (pProvider === 'wallet') walletPaid += amt;
            else if (pProvider === 'razorpay') onlinePaid += amt;
            else if (pProvider === 'cod') codPaid += amt;
          } else if (
            pStatus === 'refunded' ||
            (pProvider === 'wallet' && pStatus === 'cancelled')
          ) {
            if (pProvider === 'wallet') walletRefunded += amt;
            else if (pProvider === 'razorpay') onlineRefunded += amt;
          }
        });

        const total = Number(orderData.order.total) || 0;
        const totalPaid = walletPaid + onlinePaid + codPaid;
        const pending = Math.max(0, total - totalPaid);
        const isDelivered = orderData.order.status === 'delivered';
        const isCancelled = orderData.order.status === 'cancelled';

        setPaymentSummary({
          walletPaid,
          onlinePaid,
          codPaid,
          walletRefunded,
          onlineRefunded,
          totalPaid,
          amountToCollect: isDelivered || isCancelled ? 0 : pending,
          isFullyPaid: isDelivered || pending <= 0.01,
        });
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-sm text-ink-500">Order not found</p>
        <button onClick={onBack} className="mt-3 text-sm font-bold text-brand-600">
          Go back
        </button>
      </div>
    );
  }

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const html = await buildGstBillHtml(order.id);
      await printHtml(html, order.order_number || `Invoice_${order.id.slice(0, 8)}`);
    } catch (err) {
      console.error('Print Error:', err);
      alert('Failed to generate bill.');
    } finally {
      setIsPrinting(false);
    }
  };

  const normalizedStatus = (order.status || '').trim().toLowerCase();
  const statusMeta = STATUS_META[normalizedStatus] ?? STATUS_META.pending;
  const StatusIcon = statusMeta.icon;
  const isCancelled = normalizedStatus === 'cancelled';

  const statusSteps = [
    { key: 'pending', label: 'Order placed', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: Package },
    { key: 'packed', label: 'Packed', icon: Package },
    { key: 'ready_for_pickup', label: 'Ready for pickup', icon: Package },
    { key: 'out_for_delivery', label: 'Out for delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const currentStepIndex = isCancelled
    ? -1
    : statusSteps.findIndex((s) => s.key === normalizedStatus);

  const canPrintBill =
    normalizedStatus === 'delivered' || normalizedStatus === 'confirmed';

  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const billingLines = billingAddress
    ? [
        billingAddress.address_line_1,
        billingAddress.address_line_2,
        billingAddress.landmark,
        billingAddress.city && billingAddress.state
          ? `${billingAddress.city}, ${billingAddress.state}`
          : billingAddress.city || billingAddress.state,
        billingAddress.pincode,
      ].filter((p): p is string => !!p && p.trim().length > 0)
    : [];

  const paymentHeadline = isCancelled
    ? 'Refunded'
    : paymentSummary.isFullyPaid
    ? 'Fully Paid'
    : 'Pay on Delivery';

  return (
    <div className="safe-top pt-1 px-4 pb-8 space-y-3 max-w-lg mx-auto">
      {/* ─── Header row ───────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center shadow-xs active:scale-95 transition-transform shrink-0 mt-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold text-ink-900 tracking-tight truncate">
            {order.order_number}
          </h1>
          <p className="text-xs text-ink-500 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}{' '}
            · {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider border rounded-full px-2.5 py-1 ${statusMeta.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
          {statusMeta.label}
        </span>
      </div>

      {/* ─── Hero summary card ────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-5 text-white shadow-lg shadow-brand-900/10 relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-brand-200">
              Total Order Value
            </p>
            <p className="text-3xl font-black tracking-tight mt-1 leading-none">
              {formatMoney(Number(order.total) || 0)}
            </p>
            <p className="text-[11px] text-brand-200 mt-2 flex items-center gap-1.5 font-semibold">
              <StatusIcon size={12} className="shrink-0" />
              {isCancelled ? 'Void order — no delivery' : statusMeta.hero}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] font-black uppercase tracking-wider text-brand-200">
              Payment
            </p>
            <p className="text-sm font-black mt-1">{paymentHeadline}</p>
            {!isCancelled && paymentSummary.amountToCollect > 0 && (
              <p className="text-[10px] text-brand-300 mt-1 font-semibold">
                Pay {formatMoney(paymentSummary.amountToCollect)} on delivery
              </p>
            )}
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-brand-500/25 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-brand-700/30 blur-2xl pointer-events-none" />
      </div>

      {/* ─── Status timeline OR cancelled alert ───────────────────── */}
      {isCancelled ? (
        <div className="rounded-2xl bg-red-50 border border-red-200/80 p-4 space-y-2.5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 border border-red-200">
              <XCircle size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-red-800">Order Cancelled</p>
              <p className="text-xs text-red-600 mt-0.5">
                This order was cancelled and will not be delivered.
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-3 border border-red-200/70 flex items-start gap-2">
            <AlertOctagon size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-black tracking-wider text-red-500">
                Cancellation Reason
              </p>
              <p className="text-xs font-bold text-red-950 mt-0.5 break-words">
                {order.cancel_reason?.trim() || 'Cancelled by warehouse manager'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <h2 className="text-xs font-black uppercase tracking-wider text-ink-400 mb-3">
            Order Status
          </h2>
          <div className="relative">
            {statusSteps.map((step, index) => {
              const isDone = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isLast = index === statusSteps.length - 1;
              const Icon = step.icon;
              const lineDone = index < currentStepIndex;

              return (
                <div key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
                  {!isLast && (
                    <div
                      className={`absolute left-4 top-9 bottom-0 w-0.5 ${
                        lineDone ? 'bg-brand-500' : 'bg-ink-100'
                      }`}
                    />
                  )}
                  <div
                    className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-white border-2 border-ink-200 text-ink-300'
                    } ${isCurrent ? 'ring-4 ring-brand-100' : ''}`}
                  >
                    <Icon size={14} strokeWidth={2.4} />
                  </div>
                  <div className="pt-1 min-w-0">
                    <p
                      className={`text-sm font-bold ${
                        isDone ? 'text-ink-900' : 'text-ink-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[10px] font-black uppercase tracking-wider text-brand-600 mt-0.5">
                        Current status
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Payment status banner ───────────────────────────────── */}
      {!isCancelled && (
        <section
          className={`rounded-2xl p-4 border shadow-xs ${
            paymentSummary.isFullyPaid
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {paymentSummary.isFullyPaid ? (
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-amber-600 shrink-0" />
              )}
              <div className="min-w-0">
                <p
                  className={`text-xs font-black uppercase tracking-wider ${
                    paymentSummary.isFullyPaid ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  {paymentSummary.isFullyPaid
                    ? 'Payment Complete'
                    : 'Payment Due on Delivery'}
                </p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    paymentSummary.isFullyPaid ? 'text-emerald-600' : 'text-amber-700'
                  }`}
                >
                  {paymentSummary.isFullyPaid
                    ? 'All dues settled for this order'
                    : 'Keep the exact amount ready for the delivery partner'}
                </p>
              </div>
            </div>
            <p
              className={`text-base font-black shrink-0 ${
                paymentSummary.isFullyPaid ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              {paymentSummary.isFullyPaid
                ? '₹0.00'
                : formatMoney(paymentSummary.amountToCollect)}
            </p>
          </div>
        </section>
      )}

      {/* ─── Billed To ────────────────────────────────────────────── */}
      {billingAddress && (
        <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Building2 size={14} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-ink-400">
              Billed To
            </h2>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-black text-ink-900">
              {billingAddress.business_name || 'Customer'}
            </p>

            {billingAddress.gstin ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2 py-0.5 mt-1">
                GSTIN · {billingAddress.gstin}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-ink-50 text-ink-500 border border-ink-200 rounded-full px-2 py-0.5 mt-1">
                Unregistered
              </span>
            )}

            {billingLines.length > 0 && (
              <p className="text-xs text-ink-600 leading-relaxed mt-2">
                {billingLines.join(', ')}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ─── Delivering To ────────────────────────────────────────── */}
      {deliveryAddress && (
        <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
              <MapPin size={14} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-ink-400">
              Delivering To
            </h2>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-black text-ink-900">
              {deliveryAddress.recipient_name || 'Customer'}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-2 py-0.5">
              {deliveryAddress.label || 'Business'}
            </span>
            <p className="text-xs text-ink-600 leading-relaxed mt-2">
              {deliveryAddress.line1}
              {deliveryAddress.line2 ? `, ${deliveryAddress.line2}` : ''},{' '}
              {deliveryAddress.city}, {deliveryAddress.state} -{' '}
              {deliveryAddress.postal_code}
            </p>
          </div>
        </section>
      )}

      {/* ─── Items ────────────────────────────────────────────────── */}
      <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Package size={14} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-ink-400">
              Items
            </h2>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-ink-500 bg-ink-50 border border-ink-200 rounded-full px-2 py-0.5">
            {itemCount} {itemCount === 1 ? 'unit' : 'units'}
          </span>
        </div>

        <div className="divide-y divide-ink-100">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="h-7 w-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 text-[11px] font-black border border-brand-100 mt-0.5">
                  ×{item.quantity}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink-900 leading-snug">
                    {item.brand ? `${item.brand} ` : ''}
                    {item.product_name}
                  </p>
                  <p className="text-[11px] text-ink-400 mt-0.5">
                    {item.pack_size} · ₹
                    {Number(item.unit_price).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    each
                  </p>
                </div>
              </div>
              <p className="text-sm font-black text-ink-900 shrink-0">
                ₹{Number(item.line_total).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Payment Breakdown ────────────────────────────────────── */}
      <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Receipt size={14} />
          </div>
          <h2 className="text-xs font-black uppercase tracking-wider text-ink-400">
            Payment Breakdown
          </h2>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-ink-500">
            <span>Subtotal</span>
            <span className="font-semibold text-ink-700">
              ₹{Number(order.subtotal).toLocaleString('en-IN')}
            </span>
          </div>

          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Discount</span>
              <span className="font-bold">
                - ₹{Number(order.discount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {Number(order.cgst_amount) > 0 && (
            <div className="flex justify-between text-xs text-ink-500">
              <span>CGST</span>
              <span className="font-semibold text-ink-700">
                ₹{Number(order.cgst_amount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {Number(order.sgst_amount) > 0 && (
            <div className="flex justify-between text-xs text-ink-500">
              <span>SGST</span>
              <span className="font-semibold text-ink-700">
                ₹{Number(order.sgst_amount).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          <div className="flex justify-between text-xs text-ink-500">
            <span>Delivery fee</span>
            <span className="font-semibold text-ink-700">
              ₹{Number(order.delivery_fee).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="border-t border-dashed border-ink-200 mt-2 pt-2.5 flex justify-between items-baseline">
            <span className="text-sm font-black text-ink-900">Total Order Value</span>
            <span className="text-lg font-black text-ink-900 tracking-tight">
              {formatMoney(Number(order.total) || 0)}
            </span>
          </div>
        </div>

        {(paymentSummary.walletPaid > 0 ||
          paymentSummary.onlinePaid > 0 ||
          paymentSummary.codPaid > 0 ||
          (!isCancelled && !paymentSummary.isFullyPaid)) && (
          <div className="mt-3 pt-3 border-t border-dashed border-ink-200 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-ink-400 mb-1">
              Payment Methods
            </p>

            {paymentSummary.walletPaid > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 font-bold items-center bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2">
                <span className="flex items-center gap-1.5">
                  <Wallet size={13} /> Paid via Wallet
                </span>
                <span>- {formatMoney(paymentSummary.walletPaid)}</span>
              </div>
            )}

            {paymentSummary.onlinePaid > 0 && (
              <div className="flex justify-between text-xs text-blue-700 font-bold items-center bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2">
                <span className="flex items-center gap-1.5">
                  <CreditCard size={13} /> Paid Online (Razorpay)
                </span>
                <span>- {formatMoney(paymentSummary.onlinePaid)}</span>
              </div>
            )}

            {paymentSummary.codPaid > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 font-bold items-center bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2">
                <span className="flex items-center gap-1.5">
                  <Banknote size={13} /> Paid on Delivery
                </span>
                <span>- {formatMoney(paymentSummary.codPaid)}</span>
              </div>
            )}

            {!isCancelled && !paymentSummary.isFullyPaid && (
              <div className="flex justify-between text-xs text-amber-800 font-black items-center bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <span className="flex items-center gap-1.5">
                  <Banknote size={13} /> Pay on Delivery
                </span>
                <span>{formatMoney(paymentSummary.amountToCollect)}</span>
              </div>
            )}
          </div>
        )}

        {isCancelled &&
          (paymentSummary.walletRefunded > 0 ||
            paymentSummary.onlineRefunded > 0) && (
            <div className="mt-3 pt-3 border-t border-dashed border-ink-200 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-400 mb-1">
                Refund Details
              </p>

              {paymentSummary.walletRefunded > 0 && (
                <div className="flex justify-between items-start bg-emerald-50/60 border border-emerald-200 rounded-xl px-3 py-2.5">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                      <Wallet size={13} /> Wallet Recharged
                    </span>
                    <span className="text-[10px] text-emerald-600 ml-5">
                      Credited instantly to B2B Wallet
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 shrink-0">
                    + {formatMoney(paymentSummary.walletRefunded)}
                  </span>
                </div>
              )}

              {paymentSummary.onlineRefunded > 0 && (
                <div className="flex justify-between items-start bg-blue-50/60 border border-blue-200 rounded-xl px-3 py-2.5">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-black text-blue-800">
                      <CreditCard size={13} /> Bank Refund Initiated
                    </span>
                    <span className="text-[10px] text-blue-600 ml-5">
                      Expect Razorpay credit in 2-3 business days
                    </span>
                  </div>
                  <span className="text-xs font-black text-blue-700 shrink-0">
                    + {formatMoney(paymentSummary.onlineRefunded)}
                  </span>
                </div>
              )}
            </div>
          )}
      </section>

      {/* ─── Print button ─────────────────────────────────────────── */}
      {canPrintBill && (
        <button
          disabled={isPrinting}
          onClick={() => void handlePrint()}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 disabled:from-blue-400 disabled:to-blue-400 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.99] transition-all"
        >
          {isPrinting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Preparing Bill...
            </>
          ) : (
            <>
              <FileText size={18} /> Print / Save Bill (PDF)
            </>
          )}
        </button>
      )}
    </div>
  );
}