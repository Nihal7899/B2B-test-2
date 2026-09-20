import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft, MapPin, Tag, Truck, Loader2, CheckCircle2, CreditCard, Banknote,
  AlertCircle, X, Gift, Wallet, ShieldCheck, Building2, Plus, Sparkles,
  ChevronRight, Check, Clock, Package, Lock, BadgeCheck, Percent
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Checkout } from 'capacitor-razorpay';
import logoImg from './logo.png';
import type { useCart } from '@/store';
import type { DbAddress } from '@/services/catalog';
import type { Business } from '@/types';
import { fetchAddresses, getDeliveryCharge, computeGST } from '@/services/catalog';
import { fetchBusinesses } from '@/services/business';
import { fetchWallet, payWithWalletRpc } from '@/services/wallet';
import { supabase } from '@/lib/supabase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutScreenProps {
  cart: ReturnType<typeof useCart>;
  onBack: () => void;
  onOrderPlaced: (orderId: string) => void;
  onAddAddress: () => void;
}

// --- Premium UI Custom SVGs (Synced with Home Screen) ---
const StandardModeIcon = ({ active }: { active: boolean }) => {
  const color = active ? "#02402c" : "#94a3b8";
  return (
    <svg width="24" height="22" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="4" y="7" width="20" height="14" rx="3" stroke={color} strokeWidth="2.5" />
      <path d="M4 12h20 M12 12l2 2.5 2-2.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ExpressModeIcon = ({ active }: { active: boolean }) => {
  const color = active ? "#02402c" : "#94a3b8";
  const cargoFill = active ? "#02402c" : "transparent";
  const lightningColor = active ? "#fde047" : "transparent";
  return (
    <svg width="32" height="22" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 14h4 M3 10h3 M4 18h2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="11" y="4" width="12" height="14" rx="2.5" fill={cargoFill} stroke={color} strokeWidth="2.5" />
      <path d="M17 7l-2 5h2.5l-1 4 3-5h-2.5l1.5-4h-2z" fill={lightningColor} stroke={active ? "none" : color} strokeWidth={active ? 0 : 2} />
      <path d="M23 11h4l3.5 3.5v3.5h-7.5v-7z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M23 11h2.5l2 2.5v1.5h-4.5v-4z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="15" cy="18" r="2.5" fill={active ? "#ffffff" : "transparent"} stroke={color} strokeWidth="2.5" />
      <circle cx="26" cy="18" r="2.5" fill={active ? "#ffffff" : "transparent"} stroke={color} strokeWidth="2.5" />
    </svg>
  );
};
// --------------------------------------------------------

// Section header helper
function SectionHeader({
  icon: Icon, title, step, action,
}: {
  icon: any; title: string; step?: number; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="relative shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#02402c] to-[#046b4a] flex items-center justify-center shadow-sm shadow-[#02402c]/30">
          <Icon size={16} className="text-white" strokeWidth={2.5} />
        </div>
        {step !== undefined && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white border-2 border-[#02402c] text-[#02402c] text-[8px] font-black flex items-center justify-center">
            {step}
          </span>
        )}
      </div>
      <h2 className="text-[15px] font-black text-slate-900 tracking-tight flex-1">{title}</h2>
      {action}
    </div>
  );
}

export function CheckoutScreen({ cart, onBack, onOrderPlaced, onAddAddress }: CheckoutScreenProps) {
  const [addresses, setAddresses] = useState<DbAddress[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWallet, setUseWallet] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [paymentAlertMsg, setPaymentAlertMsg] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // Delivery State
  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');
  const [expressCharge, setExpressCharge] = useState(0);
  const [expressTime, setExpressTime] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryZoneId, setDeliveryZoneId] = useState<string | null>(null);

  const [gstTotal, setGstTotal] = useState(0);
  const [gstBreakdown, setGstBreakdown] = useState<Record<number, number>>({});
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const keepAliveIntervalRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);
  const isNative = Capacitor.isNativePlatform();

  const effectiveSubtotal = cart.subtotal;
  const promoDiscount = cart.appliedPromo?.discount || 0;
  const taxableAmount = Math.max(0, effectiveSubtotal - promoDiscount);
  const totalWithGST = taxableAmount + gstTotal;
  const grandTotal = totalWithGST + deliveryCharge;

  const walletDeduction = useWallet ? Math.min(walletBalance, grandTotal) : 0;
  const remainingPayable = Math.max(0, grandTotal - walletDeduction);
  const isFullWalletPayment = useWallet && walletDeduction >= grandTotal;

  // Scroll-aware sticky header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase.from('profiles').select('delivery_type').eq('id', user.id).single();
      if (profile?.delivery_type) {
        setDeliveryType(profile.delivery_type as 'standard' | 'express');
      }
    }

    const [addrData, userWallet, bizList] = await Promise.all([
      fetchAddresses(),
      fetchWallet(),
      fetchBusinesses().catch(() => [] as Business[]),
    ]);

    setAddresses(addrData);
    if (addrData.length > 0) {
      const def = addrData.find((a) => a.is_default);
      setSelectedAddr(def?.id ?? addrData[0].id);
    }

    if (userWallet) {
      setWalletBalance(userWallet.balance);
      if (userWallet.balance <= 0) setUseWallet(false);
    }

    setBusinesses(bizList);
    if (bizList.length > 0) {
      const defBiz = bizList.find((b) => b.is_default) ?? bizList[0];
      setSelectedBusinessId(defBiz.id);
    }

    setLoading(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    const syncDeliveryPreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('delivery_type').eq('id', user.id).single();
          if (data?.delivery_type && data.delivery_type !== deliveryType) {
            setDeliveryType(data.delivery_type as 'standard' | 'express');
          }
        }
      } catch (e) { console.warn('Background sync failed:', e); }
    };
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') void syncDeliveryPreference(); };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [deliveryType]);

  const handleDeliveryTypeChange = async (type: 'standard' | 'express') => {
    setDeliveryType(type);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) supabase.from('profiles').update({ delivery_type: type }).eq('id', user.id).then();
  };

  useEffect(() => {
    if (!isNative && typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => { try { document.body.removeChild(script); } catch (_) {} };
    }
  }, [isNative]);

  useEffect(() => {
    async function recalc() {
      const promoDisc = cart.appliedPromo?.discount || 0;
      const { gstTotal: computedGst, gstBreakdown: computedBreakdown } = computeGST(cart.items, promoDisc);
      setGstTotal(computedGst);
      setGstBreakdown(computedBreakdown);

      if (!selectedAddr) return;
      const addr = addresses.find((a) => a.id === selectedAddr);
      if (!addr) return;

      const subtotalAfterPromo = Math.max(0, effectiveSubtotal - promoDisc);
      const chargeResponse = await getDeliveryCharge(addr.postal_code, subtotalAfterPromo);
      const charge = chargeResponse?.charge || 0;
      const zoneId = chargeResponse?.zoneId || null;
      const estimatedTime = chargeResponse?.estimatedTime || '2 hours';

      setExpressCharge(charge);
      setExpressTime(estimatedTime);
      setDeliveryZoneId(zoneId);

      if (deliveryType === 'express') setDeliveryCharge(charge);
      else setDeliveryCharge(0);
    }
    void recalc();
  }, [selectedAddr, addresses, effectiveSubtotal, cart.items, cart.appliedPromo, deliveryType]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionStorage.getItem('active_checkout') === 'true') {
        const orderId = sessionStorage.getItem('checkout_order_id');
        if (orderId) {
          supabase.functions.invoke('razorpay', { body: { action: 'cancel_order', order_id: orderId } }).catch(() => {});
        }
        sessionStorage.removeItem('active_checkout');
        sessionStorage.removeItem('checkout_order_id');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const startKeepAlive = (orderId: string) => {
    if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    keepAliveIntervalRef.current = window.setInterval(async () => {
      try {
        await supabase.functions.invoke('razorpay', { body: { action: 'keep_alive', order_id: orderId } });
      } catch (e) {}
    }, 5 * 60 * 1000);
  };

  const stopKeepAlive = () => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplyingPromo(true);
    setPromoError(null);
    const result = await cart.applyPromo(promoInput.trim());
    if (result.success) setPromoInput('');
    else setPromoError(result.error || 'Invalid promo code');
    setApplyingPromo(false);
  };

  const verifyAndCompleteOrder = async (orderId: string, paymentId: string, signature: string | null) => {
    try {
      stopKeepAlive();
      const verification = await supabase.functions.invoke('razorpay', {
        body: { action: 'verify_payment', order_id: orderId, payment_id: paymentId, signature: signature || undefined },
      });
      if (verification.error || !verification.data?.verified) throw new Error('Payment could not be verified.');
      sessionStorage.removeItem('active_checkout');
      sessionStorage.removeItem('checkout_order_id');
      cart.clearCart();
      cart.clearPromo();
      onOrderPlaced(orderId);
    } catch (err) {
      setPaymentAlertMsg('Payment verification failed. Your order is on hold.');
      setShowPaymentAlert(true);
      setPlacing(false);
      sessionStorage.removeItem('active_checkout');
      sessionStorage.removeItem('checkout_order_id');
      isSubmittingRef.current = false;
    }
  };

  const handlePlaceOrder = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (!selectedAddr) { setError('Please select a delivery address.'); isSubmittingRef.current = false; return; }
    if (!selectedBusinessId) { setError('Please select a billing business.'); isSubmittingRef.current = false; return; }

    setPlacing(true);
    setError('');

    try {
      const items = cart.items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));

      const { data: orderId, error: orderError } = await supabase.rpc('create_order', {
        p_address_id: selectedAddr,
        p_items: items,
        p_promo_code: cart.appliedPromo?.code || null,
        p_delivery_zone_id: deliveryZoneId,
        p_business_id: selectedBusinessId,
      });

      if (orderError || !orderId) throw new Error(orderError?.message || 'Database order creation failed');

      sessionStorage.setItem('checkout_order_id', orderId);
      sessionStorage.setItem('active_checkout', 'true');
      sessionStorage.setItem('checkout_start_time', Date.now().toString());

      if (walletDeduction > 0) await payWithWalletRpc(orderId, walletDeduction);

      if (isFullWalletPayment) {
        sessionStorage.removeItem('active_checkout');
        sessionStorage.removeItem('checkout_order_id');
        cart.clearCart();
        cart.clearPromo();
        onOrderPlaced(orderId);
        return;
      }

      if (paymentMethod === 'razorpay') {
        const { data: payData, error: payErr } = await supabase.functions.invoke('razorpay', {
          body: { action: 'create_order', order_id: orderId, amount: remainingPayable },
        });

        if (payErr || !payData?.razorpay_order_id) {
          await supabase.functions.invoke('razorpay', { body: { action: 'cancel_order', order_id: orderId } });
          throw new Error('Payment setup failed. Your order was cancelled.');
        }

        const currentAddr = addresses.find((a) => a.id === selectedAddr);
        startKeepAlive(orderId);

        const options = {
          key: payData.key_id,
          amount: Math.round(remainingPayable * 100),
          currency: 'INR',
          order_id: payData.razorpay_order_id,
          name: 'Stackknit',
          description: `Order Payment: ₹${remainingPayable}`,
          image: logoImg,
          prefill: { contact: currentAddr?.phone || '', name: currentAddr?.recipient_name || '' },
          modal: { animation: false, backdropclose: false },
          send_sms_hash: false,
          retry: { enabled: false },
          theme: { color: '#02402c' },
        };

        if (isNative) {
          try {
            const data = await Checkout.open(options);
            let resObj: any = data;
            if (data && typeof (data as any).response === 'string') {
              try { resObj = JSON.parse((data as any).response); } catch (_) { resObj = (data as any).response; }
            } else if (data && typeof (data as any).response === 'object') {
              resObj = (data as any).response;
            }
            const paymentId = resObj?.razorpay_payment_id || resObj?.payment_id || (typeof resObj === 'string' ? resObj : null);
            const signature = resObj?.razorpay_signature || resObj?.signature || null;
            if (paymentId) await verifyAndCompleteOrder(orderId, paymentId, signature);
            else throw new Error('Payment was cancelled or no payment ID was received');
          } catch (err: any) {
            stopKeepAlive();
            await supabase.functions.invoke('razorpay', { body: { action: 'cancel_order', order_id: orderId } });
            throw new Error(err?.description || err?.message || 'Payment was cancelled.');
          }
        } else {
          let paymentSucceeded = false;
          const rzp = new window.Razorpay({
            ...options,
            handler: async (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
              paymentSucceeded = true;
              void verifyAndCompleteOrder(orderId, response.razorpay_payment_id, response.razorpay_signature);
            },
            modal: {
              animation: false,
              ondismiss: () => {
                stopKeepAlive();
                if (!paymentSucceeded) {
                  void supabase.functions.invoke('razorpay', { body: { action: 'cancel_order', order_id: orderId } });
                  setPaymentAlertMsg('Payment was cancelled.');
                  setShowPaymentAlert(true);
                  setPlacing(false);
                  sessionStorage.removeItem('active_checkout');
                  sessionStorage.removeItem('checkout_order_id');
                  isSubmittingRef.current = false;
                }
              },
            },
          });
          rzp.open();
        }
      } else {
        const { error: codPayError } = await supabase.functions.invoke('razorpay', {
          body: { action: 'create_cod_payment', order_id: orderId, amount: remainingPayable },
        });
        if (codPayError) {
          await supabase.functions.invoke('razorpay', { body: { action: 'cancel_order', order_id: orderId } });
          throw new Error('Could not record COD payment.');
        }
        sessionStorage.removeItem('active_checkout');
        sessionStorage.removeItem('checkout_order_id');
        cart.clearCart();
        cart.clearPromo();
        onOrderPlaced(orderId);
      }
    } catch (err: any) {
      setPaymentAlertMsg(err?.message || 'Could not place order. Please try again.');
      setShowPaymentAlert(true);
      sessionStorage.removeItem('active_checkout');
      sessionStorage.removeItem('checkout_order_id');
      stopKeepAlive();
    } finally {
      setPlacing(false);
      isSubmittingRef.current = false;
    }
  };

  // ---------- LOADING ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-gradient-to-br from-[#02402c] to-[#035a3e] safe-top px-4 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-white/20 animate-pulse" />
              <div className="h-3 w-32 rounded bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-[3px] border-[#02402c]/20 border-t-[#02402c] animate-spin" />
            <p className="text-xs font-bold text-slate-400 tracking-wide">Preparing checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 pb-6">
      {/* ==================== STICKY HEADER ==================== */}
      <header className={`sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? 'shadow-xl shadow-[#02402c]/10' : ''}`}>
        <div className="relative bg-gradient-to-br from-[#02402c] via-[#03573b] to-[#02402c] safe-top overflow-hidden">
          {/* decorative glows */}
          <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          {/* subtle dot grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />

          <div className="relative px-4 pt-4 pb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="h-10 w-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-md active:scale-95 active:bg-white/20 transition-all"
                aria-label="Go back"
              >
                <ArrowLeft size={19} className="text-white" />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-[20px] font-black tracking-tight text-white leading-tight">Checkout</h1>
                <p className="text-[11px] text-emerald-100/70 font-semibold mt-0.5 truncate">
                  {scrolled
                    ? `${cart.items.length} item${cart.items.length > 1 ? 's' : ''} • ₹${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                    : 'Review & place your order'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <ShieldCheck size={12} className="text-emerald-300" strokeWidth={2.5} />
                <span className="text-[10px] font-bold text-white">Secure</span>
              </div>
            </div>

            {/* compact total chip appears when scrolled */}
            <div className={`overflow-hidden transition-all duration-300 ${scrolled ? 'max-h-12 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}`}>
              <div className="flex items-center justify-between rounded-xl bg-white/10 border border-white/10 backdrop-blur-md px-3 py-2">
                <span className="text-[11px] font-bold text-emerald-100/90">Grand Total</span>
                <span className="text-[15px] font-black text-white">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== DELIVERY TOGGLE (floating) ==================== */}
      <div className="px-4 -mt-3 relative z-10">
        <div className="bg-white rounded-[22px] p-1.5 shadow-[0_18px_45px_-18px_rgba(2,64,44,0.35)] border border-slate-100 flex gap-1.5">
          <button
            onClick={() => handleDeliveryTypeChange('standard')}
            className={`flex-1 h-[74px] rounded-[16px] flex flex-col items-center justify-center gap-[1px] transition-all duration-300 relative overflow-hidden ${
              deliveryType === 'standard'
                ? 'bg-gradient-to-b from-[#02402c]/[0.08] to-[#02402c]/[0.02] ring-1 ring-[#02402c]/20'
                : 'hover:bg-slate-50'
            }`}
          >
            {deliveryType === 'standard' && (
              <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#02402c] flex items-center justify-center shadow">
                <Check size={9} className="text-white" strokeWidth={4} />
              </span>
            )}
            <StandardModeIcon active={deliveryType === 'standard'} />
            <span className={`font-bold text-[14px] mt-0.5 tracking-tight ${deliveryType === 'standard' ? 'text-[#02402c]' : 'text-slate-600'}`}>
              Standard
            </span>
            <span className={`text-[10.5px] font-semibold ${deliveryType === 'standard' ? 'text-[#02402c]/70' : 'text-slate-400'}`}>
              Next day delivery
            </span>
          </button>

          <button
            onClick={() => handleDeliveryTypeChange('express')}
            className={`flex-1 h-[74px] rounded-[16px] flex flex-col items-center justify-center gap-[1px] transition-all duration-300 relative overflow-hidden ${
              deliveryType === 'express'
                ? 'bg-gradient-to-b from-[#02402c]/[0.08] to-[#02402c]/[0.02] ring-1 ring-[#02402c]/20'
                : 'hover:bg-slate-50'
            }`}
          >
            {deliveryType === 'express' && (
              <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#02402c] flex items-center justify-center shadow">
                <Check size={9} className="text-white" strokeWidth={4} />
              </span>
            )}
            <ExpressModeIcon active={deliveryType === 'express'} />
            <span className={`font-bold text-[14px] mt-0.5 tracking-tight ${deliveryType === 'express' ? 'text-[#02402c]' : 'text-slate-600'}`}>
              Express
            </span>
            <span className={`text-[10.5px] font-semibold truncate px-1 max-w-full ${deliveryType === 'express' ? 'text-[#02402c]/70' : 'text-slate-400'}`}>
              {expressCharge > 0 ? `+₹${expressCharge}` : 'Check Area'} • {expressTime}
            </span>
          </button>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        {/* ==================== BILLING DETAILS ==================== */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_-16px_rgba(15,23,42,0.18)] overflow-hidden">
          <SectionHeader icon={Building2} title="Billing Details" step={1} />

          <div className="px-4 pb-4">
            {businesses.length === 0 ? (
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-50/50 border border-amber-200/70 p-4 flex gap-3">
                <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle size={17} className="text-amber-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] font-black text-amber-900">No business profile yet</p>
                  <p className="text-[11.5px] text-amber-700/90 mt-1 leading-relaxed font-medium">
                    Add a business to receive GST invoices. You can still proceed without a GSTIN.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {businesses.map((b) => {
                  const isSel = selectedBusinessId === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBusinessId(b.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden ${
                        isSel
                          ? 'border-[#02402c] bg-gradient-to-br from-[#02402c]/[0.04] to-transparent shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isSel ? 'border-[#02402c] bg-[#02402c] scale-100' : 'border-slate-300 bg-white'
                        }`}>
                          {isSel && <Check size={11} className="text-white" strokeWidth={4} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[15px] font-bold text-slate-800">{b.business_name}</p>
                            {b.is_default && (
                              <span className="text-[9.5px] font-black bg-[#02402c]/10 text-[#02402c] rounded-md px-2 py-0.5 tracking-wide">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          {b.gst_registered && b.gstin ? (
                            <p className="text-[11.5px] text-slate-500 mt-1.5 font-mono font-medium">
                              GSTIN: <span className="font-bold text-slate-700">{b.gstin}</span>
                            </p>
                          ) : (
                            <p className="text-[11.5px] text-slate-400 mt-1.5">Not GST registered</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ==================== DELIVERY ADDRESS ==================== */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_-16px_rgba(15,23,42,0.18)] overflow-hidden">
          <SectionHeader
            icon={MapPin}
            title="Delivery Address"
            step={2}
            action={
              addresses.length > 0 ? (
                <button
                  onClick={onAddAddress}
                  className="flex items-center gap-1 text-[11.5px] font-black text-[#02402c] bg-[#02402c]/[0.06] hover:bg-[#02402c]/10 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={12} strokeWidth={3} /> Add
                </button>
              ) : null
            }
          />

          <div className="px-4 pb-4">
            {addresses.length === 0 ? (
              <button
                onClick={onAddAddress}
                className="w-full h-20 rounded-2xl border-2 border-dashed border-[#02402c]/25 bg-gradient-to-br from-[#02402c]/[0.04] to-transparent text-[#02402c] text-sm font-bold flex items-center justify-center gap-2.5 hover:bg-[#02402c]/[0.06] transition-colors"
              >
                <div className="h-8 w-8 rounded-xl bg-[#02402c]/10 flex items-center justify-center">
                  <MapPin size={16} strokeWidth={2.5} />
                </div>
                Add a delivery address
              </button>
            ) : (
              <div className="space-y-2.5">
                {addresses.map((addr) => {
                  const isSel = selectedAddr === addr.id;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddr(addr.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden ${
                        isSel
                          ? 'border-[#02402c] bg-gradient-to-br from-[#02402c]/[0.04] to-transparent shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isSel ? 'border-[#02402c] bg-[#02402c] scale-100' : 'border-slate-300 bg-white'
                        }`}>
                          {isSel && <Check size={11} className="text-white" strokeWidth={4} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-slate-800">{addr.label}</p>
                            {addr.is_default && (
                              <span className="text-[9.5px] font-black bg-[#02402c]/10 text-[#02402c] rounded-md px-2 py-0.5 tracking-wide">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-[12.5px] text-slate-600 mt-1.5 leading-relaxed">
                            {addr.line1}, {addr.city}, {addr.state} - {addr.postal_code}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 rounded-md px-2 py-0.5">
                              {addr.recipient_name}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">{addr.phone}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ==================== OFFERS & PROMO ==================== */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_-16px_rgba(15,23,42,0.18)] overflow-hidden">
          <SectionHeader icon={Tag} title="Offers & Benefits" step={3} />
          <div className="px-4 pb-4">
            {cart.appliedPromo ? (
              <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-50/30 p-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Percent size={18} className="text-emerald-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-black text-emerald-800 tracking-wide">{cart.appliedPromo.code}</p>
                    <Sparkles size={13} className="text-emerald-500" />
                  </div>
                  <p className="text-[11.5px] font-semibold text-emerald-600 mt-0.5">
                    You saved ₹{cart.appliedPromo.discount.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => { cart.clearPromo(); }}
                  className="h-9 w-9 rounded-xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center active:scale-95 transition-transform"
                  aria-label="Remove promo"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <Gift size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Enter promo code"
                      className="w-full h-12 rounded-xl border border-slate-200 pl-10 pr-3 text-[13px] font-bold uppercase tracking-wide outline-none focus:border-[#02402c] focus:ring-2 focus:ring-[#02402c]/10 transition-all bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    disabled={applyingPromo || !promoInput.trim()}
                    className="h-12 px-5 rounded-xl bg-[#02402c] text-white text-[13px] font-black flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm shadow-[#02402c]/20"
                  >
                    {applyingPromo ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {promoError && (
                  <div className="flex items-center gap-2 mt-2.5 ml-1">
                    <AlertCircle size={13} className="text-red-500" />
                    <p className="text-[11.5px] text-red-500 font-semibold">{promoError}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ==================== WALLET ==================== */}
        <section className="bg-gradient-to-br from-[#02402c] to-[#03573b] rounded-3xl shadow-[0_12px_35px_-18px_rgba(2,64,44,0.5)] overflow-hidden relative">
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-400/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
              <Wallet size={20} className="text-emerald-200" strokeWidth={2.3} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-black text-white tracking-tight flex items-center gap-1.5">
                CafKart Wallet
                <Sparkles size={12} className="text-emerald-300" />
              </p>
              <p className="text-[12px] text-emerald-100/80 mt-0.5 font-semibold">
                Balance: <span className="text-white font-black">₹{walletBalance.toLocaleString('en-IN')}</span>
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={useWallet && walletBalance > 0}
                disabled={walletBalance <= 0}
                onChange={(e) => setUseWallet(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-white/20 border border-white/10 rounded-full peer peer-checked:bg-emerald-400 peer-checked:border-emerald-400 peer-disabled:opacity-40 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:after:translate-x-[20px] after:shadow-sm"></div>
            </label>
          </div>

          {walletDeduction > 0 && (
            <div className="relative mx-4 mb-4 flex items-center justify-between rounded-xl bg-white/10 border border-white/15 backdrop-blur-md px-3 py-2.5">
              <span className="text-[11.5px] font-bold text-emerald-100/90">Applying from wallet</span>
              <span className="text-[14px] font-black text-emerald-200">
                − ₹{walletDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </section>

        {/* ==================== PAYMENT METHOD ==================== */}
        {!isFullWalletPayment && (
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_-16px_rgba(15,23,42,0.18)] overflow-hidden">
            <SectionHeader
              icon={CreditCard}
              title={walletDeduction > 0 ? `Pay Remaining` : 'Payment Method'}
              step={4}
              action={
                walletDeduction > 0 ? (
                  <span className="text-[14px] font-black text-[#02402c]">
                    ₹{remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                ) : null
              }
            />
            <div className="px-4 pb-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cod')}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden ${
                  paymentMethod === 'cod'
                    ? 'border-[#02402c] bg-gradient-to-br from-[#02402c]/[0.04] to-transparent shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {paymentMethod === 'cod' && (
                  <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-[#02402c] flex items-center justify-center shadow">
                    <Check size={11} className="text-white" strokeWidth={4} />
                  </span>
                )}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                  paymentMethod === 'cod' ? 'bg-[#02402c]/10 text-[#02402c]' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Banknote size={20} strokeWidth={2.3} />
                </div>
                <p className="text-[13.5px] font-black text-slate-800 mt-3">Cash on delivery</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Pay on arrival</p>
              </button>

              <button
                onClick={() => setPaymentMethod('razorpay')}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#02402c] bg-gradient-to-br from-[#02402c]/[0.04] to-transparent shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {paymentMethod === 'razorpay' && (
                  <span className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-[#02402c] flex items-center justify-center shadow">
                    <Check size={11} className="text-white" strokeWidth={4} />
                  </span>
                )}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                  paymentMethod === 'razorpay' ? 'bg-[#02402c]/10 text-[#02402c]' : 'bg-slate-100 text-slate-400'
                }`}>
                  <CreditCard size={20} strokeWidth={2.3} />
                </div>
                <p className="text-[13.5px] font-black text-slate-800 mt-3">Online payment</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">UPI, Cards, NetBanking</p>
              </button>
            </div>
          </section>
        )}

        {/* ==================== ORDER SUMMARY ==================== */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_-16px_rgba(15,23,42,0.18)] overflow-hidden">
          <SectionHeader
            icon={Package}
            title="Order Summary"
            action={
              <span className="text-[11.5px] font-bold text-slate-500">
                {cart.items.length} item{cart.items.length > 1 ? 's' : ''}
              </span>
            }
          />

          <div className="px-5 pb-5 space-y-4">
            {/* items */}
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#02402c]/10 to-[#02402c]/5 border border-[#02402c]/10 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-black text-[#02402c]">{item.quantity}×</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-slate-800 truncate">
                        {item.product.brand} {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        ₹{(Number(item.effectiveUnitPrice) || Number(item.product.price)).toLocaleString('en-IN')} each
                      </p>
                    </div>
                  </div>
                  <span className="text-[13px] font-black text-slate-900 shrink-0">
                    ₹{((Number(item.effectiveUnitPrice) || Number(item.product.price)) * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* divider */}
            <div className="relative pt-2">
              <div className="border-t border-dashed border-slate-200" />
            </div>

            {/* pricing rows */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-[12.5px] font-semibold text-slate-600">
                <span>Item Subtotal</span>
                <span className="text-slate-800">₹{effectiveSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {cart.appliedPromo && (
                <div className="flex justify-between text-[12.5px] font-bold text-emerald-600">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={12} /> Promo discount
                  </span>
                  <span>− ₹{cart.appliedPromo.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {Object.entries(gstBreakdown).map(([rate, amount]) => {
                const half = amount / 2;
                return (
                  <div key={rate} className="space-y-2">
                    <div className="flex justify-between text-[12.5px] font-medium text-slate-500">
                      <span>CGST @{(Number(rate) / 2).toFixed(1)}%</span>
                      <span>₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[12.5px] font-medium text-slate-500">
                      <span>SGST @{(Number(rate) / 2).toFixed(1)}%</span>
                      <span>₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between items-center text-[12.5px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  {deliveryType === 'express' ? (
                    <>
                      <Sparkles size={12} className="text-[#02402c]" />
                      Express Delivery
                    </>
                  ) : (
                    <>
                      <Truck size={12} className="text-slate-500" />
                      Standard Delivery
                    </>
                  )}
                </span>
                <span className={deliveryCharge === 0 ? 'text-emerald-600 font-black' : 'text-slate-900 font-black'}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
            </div>

            {/* total */}
            <div className="relative pt-1">
              <div className="border-t border-slate-200" />
            </div>

            <div className="flex justify-between items-end">
              <span className="text-[14px] font-black text-slate-900">Grand Total</span>
              <span className="text-[20px] font-black text-[#02402c] tracking-tight">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </section>

        {/* ==================== TRUST BADGES ==================== */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#02402c]" strokeWidth={2.5} />
            <span className="text-[10.5px] font-bold text-slate-500">Secure Payments</span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Truck size={13} className="text-[#02402c]" strokeWidth={2.5} />
            <span className="text-[10.5px] font-bold text-slate-500">Fast Delivery</span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <BadgeCheck size={13} className="text-[#02402c]" strokeWidth={2.5} />
            <span className="text-[10.5px] font-bold text-slate-500">Verified Sellers</span>
          </div>
        </div>
      </div>

      {/* ==================== STICKY BOTTOM CTA ==================== */}
      <div className="sticky bottom-0 z-40 mt-4">
        <div className="px-4 pb-4 pt-3 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent backdrop-blur-[2px]">
          <button
            onClick={handlePlaceOrder}
            disabled={placing || !selectedAddr || cart.items.length === 0 || !selectedBusinessId}
            className="group relative w-full h-14 rounded-2xl bg-gradient-to-r from-[#02402c] via-[#03573b] to-[#02402c] text-white text-[15px] font-black flex items-center justify-between px-6 shadow-lg shadow-[#02402c]/30 disabled:from-slate-400 disabled:via-slate-400 disabled:to-slate-400 disabled:shadow-none transition-all active:scale-[0.98] overflow-hidden"
          >
            {/* shine */}
            <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {placing ? (
              <div className="w-full flex justify-center items-center gap-2.5">
                <Loader2 size={20} className="animate-spin" />
                <span>Processing Securely...</span>
              </div>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <Lock size={15} className="opacity-90" />
                  Place Order
                </span>
                <span className="flex items-center gap-2 bg-white/15 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                  <span className="text-[14px] font-black">
                    ₹{remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <ChevronRight size={14} className="opacity-80" />
                </span>
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center justify-center gap-2 mt-2.5">
              <AlertCircle size={13} className="text-red-500" />
              <p className="text-[11.5px] text-red-500 font-semibold">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ==================== PAYMENT ALERT MODAL ==================== */}
      {showPaymentAlert && (
        <div
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowPaymentAlert(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-red-100/60 blur-3xl" />

            <div className="relative flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-red-500 shrink-0 border-4 border-white shadow-lg shadow-red-100">
                <AlertCircle size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[17px] font-black text-slate-900">Payment Issue</h3>
                <p className="text-[13.5px] text-slate-500 mt-2 leading-relaxed font-medium">{paymentAlertMsg}</p>
              </div>
              <button
                onClick={() => setShowPaymentAlert(false)}
                className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white text-[14px] font-black hover:opacity-95 transition-opacity active:scale-[0.98]"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}