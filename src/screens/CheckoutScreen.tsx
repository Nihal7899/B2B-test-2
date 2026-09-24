import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft, MapPin, Tag, Truck, Loader2, CheckCircle2, CreditCard, Banknote,
  AlertCircle, X, Gift, Wallet, ShieldCheck, Building2, Plus, Sparkles,
  ChevronRight, ChevronDown, Check, Clock, Package, Lock, BadgeCheck, Percent,
  Home, Briefcase, Warehouse, MapPinned, PlusCircle, Tag as TagIcon, Zap
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Checkout } from 'capacitor-razorpay';
import logoImg from './logo.png';
import type { useCart } from '@/store';
import type { DbAddress } from '@/services/catalog';
import type { Business, PromoCode } from '@/types';
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

// ---------- Icons ----------
const StandardModeIcon = ({ active }: { active: boolean }) => {
  const color = active ? "#02402c" : "#94a3b8";
  return (
    <svg width="22" height="20" viewBox="0 0 28 24" fill="none">
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
    <svg width="28" height="20" viewBox="0 0 36 24" fill="none">
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

// ---------- Helpers ----------
function formatTimeRemaining(endDate: string | null | undefined): string | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const mins = Math.floor((diff / 60000) % 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getScopeLabel(p: PromoCode): string {
  if (p.applies_to === 'all') return 'All products';
  if (p.applies_to === 'category') return `${p.applies_to_ids?.length ?? 0} categor${(p.applies_to_ids?.length ?? 0) > 1 ? 'ies' : 'y'}`;
  return `${p.applies_to_ids?.length ?? 0} product${(p.applies_to_ids?.length ?? 0) > 1 ? 's' : ''}`;
}

function getAddressIcon(label: string) {
  const l = (label || '').toLowerCase();
  if (l.includes('business') || l.includes('warehouse') || l.includes('shop')) return Warehouse;
  if (l.includes('home')) return Home;
  if (l.includes('office') || l.includes('work')) return Briefcase;
  return MapPinned;
}

// ---------- Bottom Sheet ----------
function BottomSheet({
  open, onClose, title, subtitle, children,
}: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className="relative w-full max-w-lg mx-auto bg-white rounded-t-[28px] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 pt-3">
          <div className="h-1.5 w-12 bg-slate-200 rounded-full mx-auto" />
        </div>
        <div className="flex-shrink-0 px-5 pt-3 pb-4 flex items-start justify-between gap-3 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="text-[17px] font-black text-slate-900 tracking-[-0.02em]">{title}</h3>
            {subtitle && <p className="text-[12px] text-slate-500 font-semibold mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center active:scale-95 transition-all shrink-0"
          >
            <X size={16} className="text-slate-600" strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain safe-bottom pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------- Section Header ----------
function SectionHeader({
  icon: Icon, title, subtitle, action,
}: {
  icon: any; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 pt-5 pb-3">
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#02402c] to-[#046b4a] flex items-center justify-center shrink-0 shadow-md shadow-[#02402c]/20">
        <Icon size={16} className="text-white" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-[14.5px] font-black text-slate-900 tracking-[-0.01em]">{title}</h2>
        {subtitle && <p className="text-[11.5px] text-slate-400 font-semibold mt-0.5 truncate">{subtitle}</p>}
      </div>
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

  // Sheets
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showPromoSheet, setShowPromoSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

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
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([]);

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

  const currentAddress = addresses.find((a) => a.id === selectedAddr) || null;

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('delivery_type').eq('id', user.id).single();
      if (profile?.delivery_type) setDeliveryType(profile.delivery_type as 'standard' | 'express');
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

  // Address Background Sync
  const refreshAddresses = useCallback(async () => {
    try {
      const list = await fetchAddresses();
      setAddresses(list);
      if (list.length > 0) {
        setSelectedAddr((prev) => {
          // Keep current selection if it still exists, otherwise use default
          if (prev && list.some((a) => a.id === prev)) return prev;
          const def = list.find((a) => a.is_default) || list[0];
          return def.id;
        });
      } else {
        setSelectedAddr(null);
      }
    } catch (error) {
      console.warn('Failed to refresh addresses:', error);
    }
  }, []);

  // Sync on navigation return or tab focus
  useEffect(() => {
    const handleKeepAlive = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (customEvent.detail?.key === '/checkout' || !customEvent.detail?.key) {
        void refreshAddresses();
      }
    };
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && window.location.pathname.includes('/checkout')) {
        void refreshAddresses();
      }
    };

    window.addEventListener('keepalive:activated', handleKeepAlive);
    window.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      window.removeEventListener('keepalive:activated', handleKeepAlive);
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshAddresses]);

  // Load available promo codes
  useEffect(() => {
    void (async () => {
      try {
        const { data } = await supabase
          .from('promo_codes')
          .select('*')
          .eq('is_active', true)
          .order('discount_value', { ascending: false });
        const now = Date.now();
        const filtered = ((data as PromoCode[]) || []).filter((p) => {
          if (p.start_date && new Date(p.start_date).getTime() > now) return false;
          if (p.end_date && new Date(p.end_date).getTime() < now) return false;
          if (p.usage_limit != null && p.used_count >= p.usage_limit) return false;
          return true;
        });
        setAvailablePromos(filtered);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const sync = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('profiles').select('delivery_type').eq('id', user.id).single();
        if (data?.delivery_type && data.delivery_type !== deliveryType) {
          setDeliveryType(data.delivery_type as 'standard' | 'express');
        }
      } catch {}
    };
    const handler = () => { if (document.visibilityState === 'visible') void sync(); };
    window.addEventListener('visibilitychange', handler);
    return () => window.removeEventListener('visibilitychange', handler);
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
      return () => { try { document.body.removeChild(script); } catch {} };
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
      setExpressCharge(charge);
      setExpressTime(chargeResponse?.estimatedTime || '2 hours');
      setDeliveryZoneId(chargeResponse?.zoneId || null);
      setDeliveryCharge(deliveryType === 'express' ? charge : 0);
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
      try { await supabase.functions.invoke('razorpay', { body: { action: 'keep_alive', order_id: orderId } }); } catch {}
    }, 5 * 60 * 1000);
  };

  const stopKeepAlive = () => {
    if (keepAliveIntervalRef.current) { clearInterval(keepAliveIntervalRef.current); keepAliveIntervalRef.current = null; }
  };

  const handleApplyPromo = async (codeOverride?: string) => {
    const code = (codeOverride ?? promoInput).trim().toUpperCase();
    if (!code) return;
    setApplyingPromo(true);
    setPromoError(null);
    const result = await cart.applyPromo(code);
    if (result.success) {
      setPromoInput('');
      setShowPromoSheet(false);
    } else {
      setPromoError(result.error || 'Invalid promo code');
    }
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
    } catch {
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
              try { resObj = JSON.parse((data as any).response); } catch { resObj = (data as any).response; }
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
      <div className="min-h-screen bg-[#f6f7f9] flex flex-col">
        <div className="px-3 safe-top">
          <div className="h-14 rounded-2xl bg-[#02402c] animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="h-11 w-11 rounded-full border-[3px] border-[#02402c]/15" />
            <div className="absolute inset-0 h-11 w-11 rounded-full border-[3px] border-transparent border-t-[#02402c] animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const AddressIcon = currentAddress ? getAddressIcon(currentAddress.label) : MapPin;

  return (
    <div className="min-h-screen bg-[#f6f7f9] pb-40 scroll-smooth">
      {/* ==================== STICKY HEADER ==================== */}
      <header className="sticky top-0 z-40 px-3 safe-top bg-gradient-to-b from-[#f6f7f9] via-[#f6f7f9] to-[#f6f7f9]/0">
        <div className="rounded-2xl bg-[#02402c] p-1.5 flex items-center gap-1.5 shadow-[0_10px_28px_-12px_rgba(2,64,44,0.55)]">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center shrink-0 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft size={17} className="text-white" strokeWidth={2.4} />
          </button>

          <button
            onClick={() => setShowAddressSheet(true)}
            className="flex-1 min-w-0 flex items-center gap-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 active:scale-[0.99] px-2.5 py-2 text-left transition-all"
          >
            <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <AddressIcon size={14} className="text-emerald-200" strokeWidth={2.4} />
            </div>
            <div className="min-w-0 flex-1">
              {currentAddress ? (
                <>
                  <p className="text-[12.5px] font-black text-white tracking-[-0.01em] truncate flex items-center gap-1.5">
                    <span className="truncate">{currentAddress.label}</span>
                    {currentAddress.is_default && (
                      <span className="shrink-0 text-[8.5px] font-black bg-emerald-400/25 text-emerald-100 rounded px-1.5 py-[1px] tracking-wider">
                        DEFAULT
                      </span>
                    )}
                  </p>
                  <p className="text-[10.5px] text-emerald-100/70 font-semibold truncate mt-0.5">
                    {currentAddress.line1}, {currentAddress.city} – {currentAddress.postal_code}
                  </p>
                </>
              ) : (
                <p className="text-[12.5px] font-black text-white">Add delivery address</p>
              )}
            </div>
            <ChevronDown size={14} className="text-emerald-200/70 shrink-0" strokeWidth={2.6} />
          </button>
        </div>
      </header>

      {/* ==================== CONTENT ==================== */}
      <div className="px-4 pt-3 space-y-3.5">
        {/* DELIVERY TOGGLE */}
        <section className="bg-white rounded-2xl p-1.5 shadow-[0_8px_24px_-16px_rgba(2,64,44,0.3)] border border-slate-100 flex gap-1.5">
          <button
            onClick={() => handleDeliveryTypeChange('standard')}
            className={`flex-1 h-[62px] rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative ${
              deliveryType === 'standard'
                ? 'bg-gradient-to-b from-[#02402c]/[0.08] to-transparent ring-1 ring-[#02402c]/15'
                : 'hover:bg-slate-50/80'
            }`}
          >
            {deliveryType === 'standard' && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#02402c] flex items-center justify-center">
                <Check size={9} className="text-white" strokeWidth={4} />
              </span>
            )}
            <StandardModeIcon active={deliveryType === 'standard'} />
            <span className={`font-black text-[12.5px] mt-0.5 tracking-[-0.01em] ${deliveryType === 'standard' ? 'text-[#02402c]' : 'text-slate-600'}`}>
              Standard
            </span>
            <span className={`text-[10px] font-bold ${deliveryType === 'standard' ? 'text-[#02402c]/70' : 'text-slate-400'}`}>
              Next day
            </span>
          </button>

          <button
            onClick={() => handleDeliveryTypeChange('express')}
            className={`flex-1 h-[62px] rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative ${
              deliveryType === 'express'
                ? 'bg-gradient-to-b from-[#02402c]/[0.08] to-transparent ring-1 ring-[#02402c]/15'
                : 'hover:bg-slate-50/80'
            }`}
          >
            {deliveryType === 'express' && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#02402c] flex items-center justify-center">
                <Check size={9} className="text-white" strokeWidth={4} />
              </span>
            )}
            <ExpressModeIcon active={deliveryType === 'express'} />
            <span className={`font-black text-[12.5px] mt-0.5 tracking-[-0.01em] ${deliveryType === 'express' ? 'text-[#02402c]' : 'text-slate-600'}`}>
              Express
            </span>
            <span className={`text-[10px] font-bold truncate px-1 max-w-full ${deliveryType === 'express' ? 'text-[#02402c]/70' : 'text-slate-400'}`}>
              {expressCharge > 0 ? `+₹${expressCharge}` : 'Check Area'} • {expressTime}
            </span>
          </button>
        </section>

        {/* OFFERS STRIP */}
        <section
          onClick={() => setShowPromoSheet(true)}
          className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="h-10 w-10 rounded-xl bg-[#02402c] flex items-center justify-center shrink-0 shadow-md shadow-[#02402c]/25">
            <TagIcon size={17} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            {cart.appliedPromo ? (
              <>
                <p className="text-[13px] font-black text-emerald-700 tracking-wide flex items-center gap-1.5">
                  {cart.appliedPromo.code}
                  <Sparkles size={12} className="text-emerald-500" />
                </p>
                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                  You saved ₹{cart.appliedPromo.discount.toLocaleString('en-IN')} 🎉
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-black text-slate-900 tracking-[-0.01em]">
                  {availablePromos.length > 0 ? `${availablePromos.length} offer${availablePromos.length > 1 ? 's' : ''} available` : 'Have a promo code?'}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  {availablePromos.length > 0 ? 'Tap to view & apply best offers' : 'Tap to enter a code'}
                </p>
              </>
            )}
          </div>
          {cart.appliedPromo ? (
            <button
              onClick={(e) => { e.stopPropagation(); cart.clearPromo(); }}
              className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center active:scale-95 shrink-0"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          ) : (
            <ChevronRight size={17} className="text-slate-300 shrink-0" strokeWidth={2.4} />
          )}
        </section>

        {/* BILLING DETAILS */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] overflow-hidden">
          <SectionHeader icon={Building2} title="Billing Details" subtitle="For GST invoice" />
          <div className="px-4 pb-4">
            {businesses.length === 0 ? (
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-50/40 border border-amber-200/70 p-3.5 flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle size={15} className="text-amber-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[12.5px] font-black text-amber-900">No business profile yet</p>
                  <p className="text-[11px] text-amber-700/90 mt-0.5 leading-relaxed font-medium">
                    You can still proceed without a GSTIN.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {businesses.map((b) => {
                  const isSel = selectedBusinessId === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBusinessId(b.id)}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                        isSel
                          ? 'border-[#02402c] bg-gradient-to-br from-[#02402c]/[0.04] to-transparent'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isSel ? 'border-[#02402c] bg-[#02402c]' : 'border-slate-300 bg-white'
                        }`}>
                          {isSel && <Check size={9} className="text-white" strokeWidth={4} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13.5px] font-black text-slate-900 tracking-[-0.01em]">{b.business_name}</p>
                            {b.is_default && (
                              <span className="text-[9px] font-black bg-[#02402c]/10 text-[#02402c] rounded px-1.5 py-0.5 tracking-wide">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          {b.gst_registered && b.gstin ? (
                            <p className="text-[11px] text-slate-500 mt-1 font-mono">
                              GSTIN: <span className="font-bold text-slate-700">{b.gstin}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">Not GST registered</p>
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

        {/* ORDER SUMMARY */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] overflow-hidden">
          <SectionHeader
            icon={Package}
            title="Order Summary"
            subtitle={`${cart.items.length} item${cart.items.length > 1 ? 's' : ''}`}
          />

          <div className="px-4 pb-4 space-y-3">
            <div className="space-y-2.5">
              {cart.items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#02402c]/10 to-[#02402c]/[0.03] border border-[#02402c]/10 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-black text-[#02402c]">{item.quantity}×</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-slate-800 truncate">
                        {item.product.brand} {item.product.name}
                      </p>
                      <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                        ₹{(Number(item.effectiveUnitPrice) || Number(item.product.price)).toLocaleString('en-IN')} each
                      </p>
                    </div>
                  </div>
                  <span className="text-[12.5px] font-black text-slate-900 shrink-0 tabular-nums">
                    ₹{((Number(item.effectiveUnitPrice) || Number(item.product.price)) * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-200" />

            <div className="space-y-2">
              <div className="flex justify-between text-[12px] font-semibold text-slate-600">
                <span>Subtotal</span>
                <span className="text-slate-800 tabular-nums">₹{effectiveSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {cart.appliedPromo && (
                <div className="flex justify-between text-[12px] font-bold text-emerald-600">
                  <span className="flex items-center gap-1.5"><Sparkles size={11} /> Promo discount</span>
                  <span className="tabular-nums">− ₹{cart.appliedPromo.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {Object.entries(gstBreakdown).map(([rate, amount]) => {
                const half = amount / 2;
                return (
                  <div key={rate} className="space-y-1.5">
                    <div className="flex justify-between text-[12px] font-medium text-slate-500">
                      <span>CGST @{(Number(rate) / 2).toFixed(1)}%</span>
                      <span className="tabular-nums">₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[12px] font-medium text-slate-500">
                      <span>SGST @{(Number(rate) / 2).toFixed(1)}%</span>
                      <span className="tabular-nums">₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between items-center text-[12px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  {deliveryType === 'express' ? (
                    <><Zap size={11} className="text-[#02402c]" /> Express Delivery</>
                  ) : (
                    <><Truck size={11} className="text-slate-500" /> Standard Delivery</>
                  )}
                </span>
                <span className={`font-black tabular-nums ${deliveryCharge === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200" />

            <div className="flex justify-between items-end">
              <span className="text-[13.5px] font-black text-slate-900">Grand Total</span>
              <span className="text-[19px] font-black text-[#02402c] tracking-[-0.02em] tabular-nums">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-[#02402c]" strokeWidth={2.6} />
            <span className="text-[10px] font-bold text-slate-500">Secure</span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Truck size={12} className="text-[#02402c]" strokeWidth={2.6} />
            <span className="text-[10px] font-bold text-slate-500">Fast Delivery</span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <BadgeCheck size={12} className="text-[#02402c]" strokeWidth={2.6} />
            <span className="text-[10px] font-bold text-slate-500">Verified</span>
          </div>
        </div>
      </div>

      {/* ==================== FIXED BOTTOM AREA ==================== */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="max-w-lg mx-auto">
          {/* Compact Wallet strip */}
          <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#02402c] flex items-center justify-center shrink-0">
              <Wallet size={14} className="text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11.5px] font-black text-slate-900 tracking-[-0.01em] leading-none">CafKart Wallet</p>
                {walletDeduction > 0 && (
                  <span className="text-[9.5px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-[1px] rounded leading-none tabular-nums">
                    −₹{walletDeduction.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 tabular-nums">
                Balance ₹{walletBalance.toLocaleString('en-IN')}
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
              <div className="w-10 h-[22px] bg-slate-200 rounded-full peer peer-checked:bg-[#02402c] peer-disabled:opacity-40 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-sm peer-checked:after:translate-x-[18px]"></div>
            </label>
          </div>

          {/* Bottom bar — pt-3 keeps the pills off the top border; safe-bottom adds the home-indicator inset below */}
          <div className="bg-white border-t border-slate-100 px-3 pt-3 safe-bottom shadow-[0_-12px_36px_-12px_rgba(15,23,42,0.15)]">
            <div className="flex items-center gap-2.5">
              {/* Payment selector — larger */}
              {!isFullWalletPayment ? (
                <button
                  onClick={() => setShowPaymentSheet(true)}
                  className="flex-1 h-[52px] rounded-2xl bg-slate-50 border border-slate-200 px-3.5 flex items-center gap-3 active:scale-[0.98] transition-all hover:bg-slate-100"
                >
                  <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {paymentMethod === 'cod' ? (
                      <Banknote size={15} className="text-[#02402c]" strokeWidth={2.4} />
                    ) : (
                      <CreditCard size={15} className="text-[#02402c]" strokeWidth={2.4} />
                    )}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-[9px] font-black text-slate-400 tracking-[0.12em] uppercase leading-none">Pay via</p>
                    <p className="text-[13px] font-black text-slate-900 tracking-[-0.01em] leading-tight mt-0.5 truncate">
                      {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </p>
                  </div>
                  <ChevronDown size={15} className="text-slate-400 shrink-0" strokeWidth={2.6} />
                </button>
              ) : (
                <div className="flex-1 h-[52px] rounded-2xl bg-emerald-50 border border-emerald-200 px-3.5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0">
                    <Wallet size={15} className="text-emerald-600" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-emerald-600 tracking-[0.12em] uppercase leading-none">Full payment</p>
                    <p className="text-[13px] font-black text-emerald-700 tracking-[-0.01em] leading-tight mt-0.5">CafKart Wallet</p>
                  </div>
                </div>
              )}

              {/* Pay button — slightly smaller */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddr || cart.items.length === 0 || !selectedBusinessId}
                className="group relative shrink-0 h-[48px] rounded-2xl bg-[#02402c] text-white text-[13px] font-black flex items-center justify-center gap-1.5 px-4 shadow-lg shadow-[#02402c]/30 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-[0.97] overflow-hidden"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                {placing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isFullWalletPayment ? (
                  <>
                    <Lock size={13} className="opacity-90" />
                    <span>Place Order</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} className="opacity-90" />
                    <span className="tabular-nums">
                      Pay ₹{remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <AlertCircle size={12} className="text-red-500" />
                <p className="text-[11px] text-red-500 font-bold">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== ADDRESS SHEET ==================== */}
      <BottomSheet
        open={showAddressSheet}
        onClose={() => setShowAddressSheet(false)}
        title="Delivery Address"
        subtitle={`${addresses.length} saved address${addresses.length !== 1 ? 'es' : ''}`}
      >
        <div className="p-4 space-y-2.5">
          {addresses.map((addr) => {
            const isSel = selectedAddr === addr.id;
            const Icon = getAddressIcon(addr.label);
            return (
              <button
                key={addr.id}
                onClick={() => { setSelectedAddr(addr.id); setShowAddressSheet(false); }}
                className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all ${
                  isSel
                    ? 'border-[#02402c] bg-gradient-to-br from-[#02402c]/[0.04] to-transparent shadow-[0_6px_20px_-12px_rgba(2,64,44,0.4)]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSel ? 'bg-[#02402c] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon size={16} strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-black text-slate-900 tracking-[-0.01em]">{addr.label}</p>
                      {addr.is_default && (
                        <span className="text-[9px] font-black bg-[#02402c]/10 text-[#02402c] rounded px-1.5 py-0.5 tracking-wide">DEFAULT</span>
                      )}
                    </div>
                    <p className="text-[12px] text-slate-600 mt-1 leading-relaxed font-medium">
                      {addr.line1}, {addr.city}, {addr.state} – {addr.postal_code}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10.5px] font-bold text-slate-700 bg-slate-100 rounded-md px-2 py-0.5">
                        {addr.recipient_name}
                      </span>
                      <span className="text-[10.5px] font-semibold text-slate-500">{addr.phone}</span>
                    </div>
                  </div>
                  {isSel && (
                    <div className="h-5 w-5 rounded-full bg-[#02402c] flex items-center justify-center shrink-0 mt-1">
                      <Check size={11} className="text-white" strokeWidth={4} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          <button
            onClick={() => { setShowAddressSheet(false); onAddAddress(); }}
            className="w-full h-14 rounded-2xl border-2 border-dashed border-[#02402c]/30 bg-gradient-to-br from-[#02402c]/[0.04] to-transparent text-[#02402c] text-[13px] font-black flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            <PlusCircle size={18} strokeWidth={2.4} /> Add new address
          </button>
        </div>
      </BottomSheet>

      {/* ==================== PROMO CODES SHEET ==================== */}
      <BottomSheet
        open={showPromoSheet}
        onClose={() => setShowPromoSheet(false)}
        title="Offers & Promo Codes"
        subtitle={availablePromos.length > 0 ? `${availablePromos.length} active offer${availablePromos.length > 1 ? 's' : ''}` : 'Apply a promo code'}
      >
        <div className="p-4 space-y-3">
          {/* Manual entry */}
          {!cart.appliedPromo && (
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Gift size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleApplyPromo(); }}
                    placeholder="ENTER CODE"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full h-11 rounded-xl border border-slate-200 pl-9 pr-3 text-[12.5px] font-black uppercase tracking-wider outline-none focus:border-[#02402c] focus:ring-2 focus:ring-[#02402c]/10 transition-all bg-slate-50/60 focus:bg-white placeholder:text-slate-300 placeholder:font-bold placeholder:tracking-wider"
                  />
                </div>
                <button
                  onClick={() => void handleApplyPromo()}
                  disabled={applyingPromo || !promoInput.trim()}
                  className="h-11 px-4 rounded-xl bg-[#02402c] text-white text-[12.5px] font-black flex items-center gap-1.5 disabled:bg-slate-300 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  {applyingPromo ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
              {promoError && (
                <div className="flex items-center gap-1.5 mt-2 ml-1">
                  <AlertCircle size={12} className="text-red-500" />
                  <p className="text-[11px] text-red-500 font-bold">{promoError}</p>
                </div>
              )}
            </div>
          )}

          {/* Available promo list */}
          {availablePromos.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[10.5px] font-black text-slate-400 tracking-[0.12em] uppercase px-1 pt-1">
                {cart.appliedPromo ? 'Other available offers' : 'Best offers for you'}
              </p>
              {availablePromos.map((p) => {
                const isApplied = cart.appliedPromo?.code === p.code;
                const timer = formatTimeRemaining(p.end_date);
                const isPercent = p.discount_type === 'percentage';
                return (
                  <div
                    key={p.id}
                    className={`relative overflow-hidden rounded-2xl border transition-all ${
                      isApplied
                        ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-[0_8px_24px_-14px_rgba(16,185,129,0.4)]'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-[0_4px_16px_-12px_rgba(15,23,42,0.15)]'
                    }`}
                  >
                    <div className="flex items-stretch">
                      {/* Left colored strip */}
                      <div className={`w-1.5 ${isApplied ? 'bg-emerald-400' : 'bg-[#02402c]'}`} />

                      <div className="flex-1 p-3.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Code + timer */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-[12px] font-black text-slate-900 tracking-[0.08em] bg-slate-100 rounded-md px-2 py-1">
                              {p.code}
                            </span>
                            {timer && (
                              <span className="text-[9.5px] font-black bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full px-2 py-0.5 flex items-center gap-1 border border-amber-200/60">
                                <Clock size={9} strokeWidth={3} />
                                {timer}
                              </span>
                            )}
                          </div>

                          {/* Big discount */}
                          <div className="flex items-baseline gap-1">
                            <span className="text-[22px] font-black text-[#02402c] tracking-[-0.03em] leading-none">
                              {isPercent ? `${p.discount_value}%` : `₹${p.discount_value}`}
                            </span>
                            <span className="text-[11px] font-black text-[#02402c]/70 tracking-wide">OFF</span>
                          </div>

                          {/* Conditions line */}
                          <div className="flex items-center gap-2 flex-wrap mt-1.5">
                            {p.min_order_value > 0 && (
                              <span className="text-[10.5px] font-bold text-slate-500">
                                Above ₹{p.min_order_value}
                              </span>
                            )}
                            {isPercent && p.max_discount_amount && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10.5px] font-bold text-slate-500">
                                  Up to ₹{p.max_discount_amount}
                                </span>
                              </>
                            )}
                            <span className="text-slate-300">•</span>
                            <span className="text-[10.5px] font-bold text-slate-500">{getScopeLabel(p)}</span>
                          </div>
                        </div>

                        {/* Apply button — inline */}
                        {isApplied ? (
                          <div className="shrink-0 flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={15} strokeWidth={2.6} />
                            <span className="text-[10.5px] font-black tracking-wide">APPLIED</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => void handleApplyPromo(p.code)}
                            disabled={applyingPromo}
                            className="shrink-0 h-9 px-4 rounded-lg bg-[#02402c] text-white text-[11px] font-black tracking-wide active:scale-95 disabled:bg-slate-300 transition-all shadow-sm shadow-[#02402c]/25"
                          >
                            {applyingPromo ? <Loader2 size={12} className="animate-spin" /> : 'APPLY'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {availablePromos.length === 0 && !cart.appliedPromo && (
            <div className="py-8 text-center">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center">
                <TagIcon size={22} className="text-slate-400" strokeWidth={2.2} />
              </div>
              <p className="text-[13px] font-black text-slate-700 mt-3">No active offers right now</p>
              <p className="text-[11.5px] text-slate-500 font-semibold mt-1">
                Enter a code above if you have one
              </p>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ==================== PAYMENT METHOD SHEET ==================== */}
      <BottomSheet
        open={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        title="Payment Method"
        subtitle={`Pay ₹${remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
      >
        <div className="p-4 space-y-2.5">
          <button
            onClick={() => { setPaymentMethod('cod'); setShowPaymentSheet(false); }}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
              paymentMethod === 'cod'
                ? 'border-[#02402c] bg-gradient-to-br from-[#02402c]/[0.05] to-transparent shadow-[0_6px_20px_-12px_rgba(2,64,44,0.4)]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                paymentMethod === 'cod' ? 'bg-[#02402c]/10 text-[#02402c]' : 'bg-slate-100 text-slate-400'
              }`}>
                <Banknote size={20} strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-slate-900 tracking-[-0.01em]">Cash on delivery</p>
                <p className="text-[11.5px] text-slate-500 font-semibold mt-0.5">Pay when your order arrives</p>
              </div>
              {paymentMethod === 'cod' && (
                <div className="h-6 w-6 rounded-full bg-[#02402c] flex items-center justify-center shrink-0">
                  <Check size={13} className="text-white" strokeWidth={4} />
                </div>
              )}
            </div>
          </button>

          <button
            onClick={() => { setPaymentMethod('razorpay'); setShowPaymentSheet(false); }}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
              paymentMethod === 'razorpay'
                ? 'border-[#02402c] bg-gradient-to-br from-[#02402c]/[0.05] to-transparent shadow-[0_6px_20px_-12px_rgba(2,64,44,0.4)]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                paymentMethod === 'razorpay' ? 'bg-[#02402c]/10 text-[#02402c]' : 'bg-slate-100 text-slate-400'
              }`}>
                <CreditCard size={20} strokeWidth={2.4} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-slate-900 tracking-[-0.01em]">Online payment</p>
                <p className="text-[11.5px] text-slate-500 font-semibold mt-0.5">UPI, Cards, NetBanking & more</p>
              </div>
              {paymentMethod === 'razorpay' && (
                <div className="h-6 w-6 rounded-full bg-[#02402c] flex items-center justify-center shrink-0">
                  <Check size={13} className="text-white" strokeWidth={4} />
                </div>
              )}
            </div>
          </button>

          <div className="flex items-center justify-center gap-2 pt-2 pb-1">
            <ShieldCheck size={12} className="text-emerald-600" strokeWidth={2.6} />
            <p className="text-[10.5px] font-bold text-slate-500 tracking-wide">
              Secured by Razorpay • 100% safe payments
            </p>
          </div>
        </div>
      </BottomSheet>

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
            <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-red-100/70 blur-3xl" />
            <div className="relative flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-red-500 shrink-0 border-4 border-white shadow-lg shadow-red-100">
                <AlertCircle size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[17px] font-black text-slate-900 tracking-[-0.01em]">Payment Issue</h3>
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