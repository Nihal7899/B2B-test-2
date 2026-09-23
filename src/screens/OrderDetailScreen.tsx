import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Package,
  Truck,
  Check,
  XCircle,
  Loader2,
  Receipt,
  FileText,
  ShoppingCart,
  ChevronRight,
  RefreshCw,
  Wallet,
  CreditCard,
  Banknote,
  Building2,
  Headphones,
} from 'lucide-react';
import { fetchOrderDetail } from '@/services/catalog';
import type { DbOrder, DbOrderItem, DbAddress } from '@/services/catalog';
import { buildGstBillHtml } from '@/services/gstBill';
import { printHtml } from '@/utils/printHtml';
import { supabase } from '@/lib/supabase';
import { CachedImage } from '@/components/CachedImage';

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

const PRIMARY_COLOR = '#02402c';

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
  
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
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

  const handlePrint = async () => {
    if (!order) return;
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

  const normalizedStatus = (order?.status || '').trim().toLowerCase();
  const isCancelled = normalizedStatus === 'cancelled';

  // Strict check: Only print if delivered
  const handleInvoiceClick = () => {
    if (normalizedStatus !== 'delivered') {
      alert("You can view the invoice once the product is delivered.");
      return;
    }
    handlePrint();
  };

  if (loading && !order) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-t-brand-600 animate-spin" style={{ borderColor: `${PRIMARY_COLOR}33`, borderTopColor: PRIMARY_COLOR }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-sm text-slate-500">Order not found</p>
        <button onClick={onBack} className="mt-3 text-sm font-bold" style={{ color: PRIMARY_COLOR }}>
          Go back
        </button>
      </div>
    );
  }

  // Map backend status to UI timeline
  const statusStageMap: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    packed: 1,
    ready_for_pickup: 1,
    out_for_delivery: 2,
    delivered: 3,
  };
  
  const currentStage = isCancelled ? -1 : statusStageMap[normalizedStatus] ?? 0;

  const timelineSteps = [
    { id: 0, label: 'Order Placed', icon: Check },
    { id: 1, label: 'Processing', icon: Package },
    { id: 2, label: 'Out for Delivery', icon: Truck },
    { id: 3, label: 'Delivered', icon: Check }
  ];

  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const orderTime = new Date(order.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Header - No extra padding, just safe-top */}
      <header 
        className="safe-top sticky top-0 z-50 flex items-center justify-between px-4 py-3 shadow-md"
        style={{ backgroundColor: PRIMARY_COLOR }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1 text-white active:scale-95 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <div className="text-white">
            <h1 className="text-lg font-bold leading-tight">Order Details</h1>
            <p className="text-[11px] text-white/80 mt-0.5">Track and manage your order</p>
          </div>
        </div>
        <button 
          onClick={loadData}
          className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4 w-full max-w-lg mx-auto">
        
        {/* Order Status & Timeline */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${PRIMARY_COLOR}12`, color: PRIMARY_COLOR }}
              >
                <Package size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{order.order_number}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{orderDate} • {itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={isCancelled ? { backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' } : { backgroundColor: `${PRIMARY_COLOR}08`, borderColor: `${PRIMARY_COLOR}20`, color: PRIMARY_COLOR }}
            >
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: isCancelled ? '#ef4444' : '#eab308' }}></div>
              <span className="text-[10px] font-bold capitalize">
                {isCancelled ? 'Cancelled' : normalizedStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {!isCancelled && (
            <div className="relative mt-8 mb-2">
              <div className="absolute top-4 left-6 right-6 h-[2px] bg-slate-100 -z-10"></div>
              <div 
                className="absolute top-4 left-6 h-[2px] -z-10 transition-all duration-500"
                style={{ 
                  backgroundColor: PRIMARY_COLOR,
                  width: `${(Math.max(0, currentStage) / 3) * 100}%` 
                }}
              ></div>

              <div className="flex justify-between">
                {timelineSteps.map((step) => {
                  const isCompleted = currentStage > step.id;
                  const isCurrent = currentStage === step.id;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2 w-1/4">
                      <div 
                        className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors`}
                        style={{
                          borderColor: isCompleted || isCurrent ? PRIMARY_COLOR : '#f1f5f9',
                          color: isCompleted ? 'white' : isCurrent ? PRIMARY_COLOR : '#cbd5e1',
                          backgroundColor: isCompleted ? PRIMARY_COLOR : 'white'
                        }}
                      >
                        <Icon size={14} strokeWidth={2.5} />
                      </div>
                      <div className="text-center">
                        <p className={`text-[10px] font-bold ${isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-[8.5px] text-slate-400 mt-0.5 whitespace-nowrap">
                          {isCompleted || isCurrent ? orderTime : 'Pending'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {isCancelled && order.cancel_reason && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2 text-red-700">
              <XCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                <span className="font-bold">Reason:</span> {order.cancel_reason}
              </p>
            </div>
          )}
        </section>

        {/* Order Summary */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
              <Receipt size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Order Summary</h3>
          </div>

          <div className="space-y-3 text-xs mb-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Order ID</span>
              <span className="font-medium text-slate-900">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Order Date</span>
              <span className="font-medium text-slate-900">{orderDate} • {orderTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Items</span>
              <span className="font-medium text-slate-900">{itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid</span>
              <span className="font-bold text-slate-900">{formatMoney(paymentSummary.totalPaid)}</span>
            </div>
          </div>

          {/* View Invoice CTA with Popup Logic */}
          <button 
            onClick={handleInvoiceClick}
            disabled={isPrinting || isCancelled}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-100"
          >
            <div className="flex items-center gap-2">
              {isPrinting ? <Loader2 size={16} className="text-slate-600 animate-spin" /> : <FileText size={16} className="text-slate-600" />}
              <span className="text-xs font-bold text-slate-800">
                {isPrinting ? 'Preparing Invoice...' : 'View Invoice'}
              </span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </section>

        {/* Billed To (Restored original logic) */}
        {billingAddress && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 size={16} />
              </div>
              <h2 className="font-bold text-slate-900 text-sm">Billed To</h2>
            </div>
            <div className="space-y-1 ml-9">
              <p className="text-sm font-black text-slate-900">
                {billingAddress.business_name || 'Customer'}
              </p>
              {billingAddress.gstin ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2 py-0.5 mt-1">
                  GSTIN · {billingAddress.gstin}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 mt-1">
                  Unregistered
                </span>
              )}
              {billingLines.length > 0 && (
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  {billingLines.join(', ')}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Items List */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
                <ShoppingCart size={16} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Items ({itemCount})</h3>
            </div>
            <button className="text-xs font-bold flex items-center gap-0.5" style={{ color: PRIMARY_COLOR }}>
              View All Items <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => {
              // Reliably resolve image from standard join aliases
              const imageUrl = (item as any).products?.image_url || (item as any).product?.image_url || (item as any).image_url || '';
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="h-16 w-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <CachedImage 
                      src={imageUrl} 
                      alt={item.product_name}
                      className="h-full w-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {item.brand ? `${item.brand} ` : ''}{item.product_name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">
                        {item.quantity} unit • ₹{Number(item.unit_price).toLocaleString('en-IN')}
                      </span>
                      <span 
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize border"
                        style={isCancelled ? { backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' } : { backgroundColor: `${PRIMARY_COLOR}08`, borderColor: `${PRIMARY_COLOR}20`, color: PRIMARY_COLOR }}
                      >
                        {isCancelled ? 'Cancelled' : normalizedStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Payment Breakdown (Restored your exact beautiful UI) */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Receipt size={16} />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Payment Breakdown</h2>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
            </div>

            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Discount</span>
                <span className="font-bold">- ₹{Number(order.discount).toLocaleString('en-IN')}</span>
              </div>
            )}

            {Number(order.cgst_amount) > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>CGST</span>
                <span className="font-semibold text-slate-700">₹{Number(order.cgst_amount).toLocaleString('en-IN')}</span>
              </div>
            )}

            {Number(order.sgst_amount) > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>SGST</span>
                <span className="font-semibold text-slate-700">₹{Number(order.sgst_amount).toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-slate-500">
              <span>Delivery fee</span>
              <span className="font-semibold text-slate-700">₹{Number(order.delivery_fee).toLocaleString('en-IN')}</span>
            </div>

            <div className="border-t border-dashed border-slate-200 mt-2 pt-2.5 flex justify-between items-baseline">
              <span className="text-sm font-black text-slate-900">Total Order Value</span>
              <span className="text-lg font-black text-slate-900 tracking-tight">
                {formatMoney(Number(order.total) || 0)}
              </span>
            </div>
          </div>

          {(paymentSummary.walletPaid > 0 || paymentSummary.onlinePaid > 0 || paymentSummary.codPaid > 0 || (!isCancelled && !paymentSummary.isFullyPaid)) && (
            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Payment Methods</p>

              {paymentSummary.walletPaid > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-bold items-center bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-1.5"><Wallet size={13} /> Paid via Wallet</span>
                  <span>- {formatMoney(paymentSummary.walletPaid)}</span>
                </div>
              )}

              {paymentSummary.onlinePaid > 0 && (
                <div className="flex justify-between text-xs text-blue-700 font-bold items-center bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-1.5"><CreditCard size={13} /> Paid Online (Razorpay)</span>
                  <span>- {formatMoney(paymentSummary.onlinePaid)}</span>
                </div>
              )}

              {paymentSummary.codPaid > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-bold items-center bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-1.5"><Banknote size={13} /> Paid on Delivery</span>
                  <span>- {formatMoney(paymentSummary.codPaid)}</span>
                </div>
              )}

              {!isCancelled && !paymentSummary.isFullyPaid && (
                <div className="flex justify-between text-xs text-amber-800 font-black items-center bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 shadow-sm">
                  <span className="flex items-center gap-1.5"><Banknote size={13} /> Pay on Delivery</span>
                  <span>{formatMoney(paymentSummary.amountToCollect)}</span>
                </div>
              )}
            </div>
          )}

          {/* Refund Breakdown (Restored) */}
          {isCancelled && (paymentSummary.walletRefunded > 0 || paymentSummary.onlineRefunded > 0) && (
            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Refund Details</p>

              {paymentSummary.walletRefunded > 0 && (
                <div className="flex justify-between items-start bg-emerald-50/60 border border-emerald-200 rounded-xl px-3 py-2.5">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-black text-emerald-800"><Wallet size={13} /> Wallet Recharged</span>
                    <span className="text-[10px] text-emerald-600 ml-5">Credited instantly to B2B Wallet</span>
                  </div>
                  <span className="text-xs font-black text-emerald-700 shrink-0">+ {formatMoney(paymentSummary.walletRefunded)}</span>
                </div>
              )}

              {paymentSummary.onlineRefunded > 0 && (
                <div className="flex justify-between items-start bg-blue-50/60 border border-blue-200 rounded-xl px-3 py-2.5">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-black text-blue-800"><CreditCard size={13} /> Bank Refund Initiated</span>
                    <span className="text-[10px] text-blue-600 ml-5">Expect Razorpay credit in 2-3 business days</span>
                  </div>
                  <span className="text-xs font-black text-blue-700 shrink-0">+ {formatMoney(paymentSummary.onlineRefunded)}</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Delivery Address (Change button removed) */}
        {deliveryAddress && (
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
                <MapPin size={16} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Delivery Address</h3>
            </div>
            <div className="ml-9">
              <p className="text-sm font-bold text-slate-900">{deliveryAddress.recipient_name || 'Customer'}</p>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                {deliveryAddress.line1}
                {deliveryAddress.line2 ? `, ${deliveryAddress.line2}` : ''},<br/>
                {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.postal_code}
              </p>
            </div>
          </section>
        )}

        {/* Need Help CTA (Restored original Headphone UI) */}
        <button 
          onClick={() => navigate(`/help?orderId=${order.id}&orderNumber=${encodeURIComponent(order.order_number || '')}`)}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 text-left hover:bg-slate-50 active:scale-[0.99] transition-transform"
        >
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <Headphones size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900">Need help with this order?</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Cancel, update address, or ask delivery questions</p>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0" />
        </button>
        
      </main>
    </div>
  );
}
