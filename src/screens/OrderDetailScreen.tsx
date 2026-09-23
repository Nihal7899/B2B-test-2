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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
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
  const isDelivered = normalizedStatus === 'delivered';

  const handleInvoiceClick = () => {
    if (!isDelivered) {
      setShowInvoiceModal(true);
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

  // Exact UI Timeline Mapping
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
  const paymentHeadline = isCancelled ? 'Refunded' : paymentSummary.isFullyPaid ? 'Fully Paid' : 'Pay on Delivery';

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
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Sticky Header */}
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

      <main className="flex-1 px-4 py-4 space-y-4 w-full max-w-lg mx-auto pb-8">
        
        {/* Dark Green Top Payment Banner */}
        <div 
          className="rounded-3xl p-5 text-white shadow-lg relative overflow-hidden" 
          style={{ background: `linear-gradient(to bottom right, #012b1d, ${PRIMARY_COLOR}, #03543a)` }}
        >
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/70">
                Total Order Value
              </p>
              <p className="text-3xl font-black tracking-tight mt-1 leading-none">
                {formatMoney(Number(order.total) || 0)}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/70">
                Payment
              </p>
              <p className="text-sm font-black mt-1">{paymentHeadline}</p>
              {!isCancelled && paymentSummary.amountToCollect > 0 && (
                <p className="text-[10px] text-white/80 mt-1 font-semibold">
                  Pay {formatMoney(paymentSummary.amountToCollect)} on delivery
                </p>
              )}
            </div>
          </div>

          <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        </div>

        {/* Order Status & Timeline Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${PRIMARY_COLOR}12`, color: PRIMARY_COLOR }}>
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
            <div className="relative mt-8 mb-2 px-2">
              {/* Timeline Connecting Lines */}
              <div className="absolute top-4 left-[15%] right-[15%] h-[1px] bg-slate-200 z-0"></div>
              <div 
                className="absolute top-4 left-[15%] h-[1px] z-0 transition-all duration-500"
                style={{ 
                  backgroundColor: PRIMARY_COLOR,
                  width: `${(Math.max(0, currentStage) / 3) * 70}%` 
                }}
              ></div>

              <div className="relative z-10 flex justify-between">
                {timelineSteps.map((step) => {
                  const isCompleted = currentStage > step.id;
                  const isCurrent = currentStage === step.id;
                  const isPlaced = step.id === 0;
                  const Icon = step.icon;
                  
                  let circleBg = 'white';
                  let circleBorder = '#e2e8f0'; 
                  let iconColor = '#94a3b8'; 

                  if (isCompleted || (isCurrent && isPlaced)) {
                    circleBg = PRIMARY_COLOR;
                    circleBorder = PRIMARY_COLOR;
                    iconColor = 'white';
                  } else if (isCurrent) {
                    circleBg = 'white';
                    circleBorder = PRIMARY_COLOR;
                    iconColor = PRIMARY_COLOR;
                  }
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2 w-1/4">
                      <div 
                        className="h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors bg-white"
                        style={{ backgroundColor: circleBg, borderColor: circleBorder, color: iconColor }}
                      >
                        <Icon size={16} strokeWidth={isCompleted || isCurrent ? 2.5 : 2} />
                      </div>
                      <div className="text-center">
                        <p className={`text-[10px] font-bold ${isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5 whitespace-nowrap">
                          {isCompleted || (isCurrent && isPlaced) ? orderTime : 'Pending'}
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

        {/* Order Summary with Remaining Payment */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
              <Receipt size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Order Summary</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Order ID</span>
              <span className="font-medium text-slate-900">{order.order_number}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Order Date</span>
              <span className="font-medium text-slate-900">{orderDate} • {orderTime}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Items</span>
              <span className="font-medium text-slate-900">{itemCount}</span>
            </div>
            
            <div className="pt-2 mt-2 border-t border-dashed border-slate-200">
              <div className="flex justify-between text-xs text-slate-500 items-center">
                <span>Amount Paid</span>
                <span className="font-black text-lg" style={{ color: PRIMARY_COLOR }}>
                  {formatMoney(paymentSummary.totalPaid)}
                </span>
              </div>
              
              {!paymentSummary.isFullyPaid && !isCancelled && (
                <div className="flex justify-between text-xs text-amber-600 items-center mt-1">
                  <span className="font-bold">Remaining Payment (COD)</span>
                  <span className="font-bold">{formatMoney(paymentSummary.amountToCollect)}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Billed To Details */}
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

        {/* Delivery Address Details */}
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

        {/* Items Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
                <ShoppingCart size={16} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Items ({itemCount})</h3>
            </div>
            <button className="text-xs font-bold flex items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: `${PRIMARY_COLOR}12`, color: PRIMARY_COLOR }}>
              View All Items <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => {
              // This requires updating your fetchOrderDetail function as mentioned above
              const imageUrl = (item as any).products?.image_url;
              
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="h-16 w-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    {imageUrl ? (
                      <CachedImage 
                        src={imageUrl} 
                        alt={item.product_name}
                        className="h-full w-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <Package size={24} className="text-slate-300" />
                    )}
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

        {/* Detailed Payment Breakdown */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
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
            
            {Number(order.promo_discount) > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Promo Code Discount</span>
                <span className="font-bold">- ₹{Number(order.promo_discount).toLocaleString('en-IN')}</span>
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

            {Number(order.delivery_fee) > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>Delivery fee</span>
                <span className="font-semibold text-slate-700">₹{Number(order.delivery_fee).toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="border-t border-dashed border-slate-200 mt-2 pt-2.5 flex justify-between items-baseline">
              <span className="text-sm font-black text-slate-900">Total Order Value</span>
              <span className="text-lg font-black text-slate-900 tracking-tight">
                {formatMoney(Number(order.total) || 0)}
              </span>
            </div>
          </div>

          {/* Paid Methods UI styled beautifully */}
          {(paymentSummary.walletPaid > 0 || paymentSummary.onlinePaid > 0 || paymentSummary.codPaid > 0 || (!isCancelled && !paymentSummary.isFullyPaid)) && (
            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Payment Methods</p>

              {paymentSummary.walletPaid > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-bold items-center bg-emerald-50/60 border border-emerald-100 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-1.5"><Wallet size={13} /> Paid via Wallet</span>
                  <span>- {formatMoney(paymentSummary.walletPaid)}</span>
                </div>
              )}

              {paymentSummary.onlinePaid > 0 && (
                <div className="flex justify-between text-xs text-blue-700 font-bold items-center bg-blue-50/60 border border-blue-100 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-1.5"><CreditCard size={13} /> Paid Online</span>
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

          {/* View Invoice Button underneath Payment Breakdown */}
          <button 
            onClick={handleInvoiceClick}
            disabled={isPrinting || isCancelled}
            className="w-full flex items-center justify-between mt-4 pt-4 border-t border-slate-100 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-2">
              {isPrinting ? <Loader2 size={16} className="text-slate-600 animate-spin" /> : <FileText size={16} className="text-slate-900" />}
              <span className="text-xs font-bold text-slate-900">
                {isPrinting ? 'Preparing Invoice...' : 'View Invoice'}
              </span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </section>

        {/* Need Help CTA */}
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

      {/* Invoice Modal Overlay */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowInvoiceModal(false)}
          />
          <div className="relative bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${PRIMARY_COLOR}12`, color: PRIMARY_COLOR }}>
              <Receipt size={24} />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900">Invoice Unavailable</h3>
            <p className="text-sm text-slate-500 text-center mt-2 leading-relaxed">
              You can view and download your invoice once the product is successfully delivered.
            </p>
            <button 
              onClick={() => setShowInvoiceModal(false)} 
              className="mt-6 w-full py-3.5 rounded-xl font-bold text-white shadow-md active:scale-95 transition-transform" 
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Okay, got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
