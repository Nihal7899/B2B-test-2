import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, MapPin, Tag, Loader2, CheckCircle2, CreditCard, Banknote, AlertCircle, Gift, Wallet, ShieldCheck, LockKeyhole, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // --- Background Sync for Delivery Type (Same as Home Screen) ---
  useEffect(() => {
    const syncDeliveryPreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('delivery_type')
            .eq('id', user.id)
            .single();
          if (data?.delivery_type && data.delivery_type !== deliveryType) {
            setDeliveryType(data.delivery_type as 'standard' | 'express');
          }
        }
      } catch (e) {
        console.warn('Background sync failed:', e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncDeliveryPreference();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [deliveryType]);
  // ---------------------------------------------------------------

  const handleDeliveryTypeChange = async (type: 'standard' | 'express') => {
    setDeliveryType(type);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      supabase.from('profiles').update({ delivery_type: type }).eq('id', user.id).then();
    }
  };

  useEffect(() => {
    if (!isNative && typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        try { document.body.removeChild(script); } catch (_) {}
      };
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
      const estimatedTime = chargeResponse?.estimatedTime || '2 hours';  // ← camelCase
      
      setExpressCharge(charge);
      setExpressTime(estimatedTime);
      setDeliveryZoneId(zoneId);

      if (deliveryType === 'express') {
        setDeliveryCharge(charge);
      } else {
        setDeliveryCharge(0); // Standard is always Free
      }
    }
    void recalc();
  }, [selectedAddr, addresses, effectiveSubtotal, cart.items, cart.appliedPromo, deliveryType]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionStorage.getItem('active_checkout') === 'true') {
        const orderId = sessionStorage.getItem('checkout_order_id');
        if (orderId) {
          supabase.functions.invoke('razorpay', {
            body: { action: 'cancel_order', order_id: orderId },
          }).catch(() => {});
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
        await supabase.functions.invoke('razorpay', {
          body: { action: 'keep_alive', order_id: orderId },
        });
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
    if (result.success) {
      setPromoInput('');
    } else {
      setPromoError(result.error || 'Invalid promo code');
    }
    setApplyingPromo(false);
  };

  const verifyAndCompleteOrder = async (orderId: string, paymentId: string, signature: string | null) => {
    try {
      stopKeepAlive();
      const verification = await supabase.functions.invoke('razorpay', {
        body: {
          action: 'verify_payment',
          order_id: orderId,
          payment_id: paymentId,
          signature: signature || undefined,
        },
      });

      if (verification.error || !verification.data?.verified) {
        throw new Error('Payment could not be verified.');
      }

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
    
    if (!selectedAddr) {
      setError('Please select a delivery address.');
      isSubmittingRef.current = false;
      return;
    }
    if (!selectedBusinessId) {
      setError('Please select a billing business.');
      isSubmittingRef.current = false;
      return;
    }
    
    setPlacing(true);
    setError('');

    try {
      const items = cart.items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));

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

      if (walletDeduction > 0) {
        await payWithWalletRpc(orderId, walletDeduction);
      }

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
          prefill: {
            contact: currentAddr?.phone || '',
            name: currentAddr?.recipient_name || '',
          },
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

            if (paymentId) {
              await verifyAndCompleteOrder(orderId, paymentId, signature);
            } else {
              throw new Error('Payment was cancelled or no payment ID was received');
            }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F9F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 rounded-full border-2 border-[#02402c]/15 border-t-[#02402c] animate-spin" />
          <p className="text-[11px] font-semibold text-slate-500">Preparing your checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F9F7] text-[#172536] pb-36">
      {/* ------------------------------------------------------------------ */}
      {/* STICKY CHECKOUT HEADER                                             */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-[100] bg-[#02402c] safe-top shadow-[0_8px_22px_rgba(2,64,44,0.16)]">
        <div className="px-3.5 pt-2.5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="h-9 w-9 shrink-0 rounded-[12px] border border-white/15 bg-white/[0.09] flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={2.4} className="text-white" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] leading-none font-extrabold tracking-[-0.04em] text-white">
                  Checkout
                </h1>
              </div>
              <p className="mt-1 text-[10.5px] font-medium text-emerald-50/70 truncate">
                Review and place your order securely
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 rounded-full bg-white/[0.10] border border-white/15 px-2.5 py-1.5">
              <ShieldCheck size={15} strokeWidth={2.2} className="text-[#B7F0D0]" />
              <span className="text-[10px] font-extrabold tracking-tight text-white/90">
                Secure
              </span>
            </div>
          </div>

          <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-[#65D69B]" />
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* DELIVERY SELECTOR                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="px-3.5 pt-3">
        <div className="rounded-[20px] border border-[#DCE8E3] bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handleDeliveryTypeChange('standard')}
              className={`relative h-[72px] rounded-[16px] flex items-center gap-2.5 px-3 transition-all ${
                deliveryType === 'standard'
                  ? 'bg-[#F0F7F3] ring-1 ring-[#CFE3DA]'
                  : 'bg-white'
              }`}
            >
              {deliveryType === 'standard' && (
                <span className="absolute right-2.5 top-2.5 h-[18px] w-[18px] rounded-full bg-[#1DAD68] flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
                </span>
              )}

              <div className="h-9 w-9 shrink-0 rounded-[12px] bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                <StandardModeIcon active={deliveryType === 'standard'} />
              </div>

              <div className="min-w-0 text-left">
                <p className={`text-[13px] font-extrabold ${deliveryType === 'standard' ? 'text-[#02402c]' : 'text-slate-600'}`}>
                  Standard
                </p>
                <p className="mt-1 text-[10px] font-semibold text-slate-500 truncate">
                  Next day delivery
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDeliveryTypeChange('express')}
              className={`relative h-[72px] rounded-[16px] flex items-center gap-2.5 px-3 transition-all ${
                deliveryType === 'express'
                  ? 'bg-[#F0F7F3] ring-1 ring-[#CFE3DA]'
                  : 'bg-white'
              }`}
            >
              {deliveryType === 'express' && (
                <span className="absolute right-2.5 top-2.5 h-[18px] w-[18px] rounded-full bg-[#1DAD68] flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
                </span>
              )}

              <div className="h-9 w-9 shrink-0 rounded-[12px] bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                <ExpressModeIcon active={deliveryType === 'express'} />
              </div>

              <div className="min-w-0 text-left">
                <p className={`text-[13px] font-extrabold ${deliveryType === 'express' ? 'text-[#02402c]' : 'text-slate-600'}`}>
                  Express
                </p>
                <p className="mt-1 text-[10px] font-semibold text-slate-500 truncate">
                  {expressCharge > 0 ? `+₹${expressCharge}` : 'Check area'} · {expressTime || '2 hours'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      <main className="px-3.5 pt-5 space-y-5">
        {/* BILLING */}
        <section>
          <SectionTitle title="Billing Details" />

          {businesses.length === 0 ? (
            <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-3.5">
              <p className="text-[12px] font-bold text-amber-900">No business profile yet</p>
              <p className="text-[10.5px] text-amber-700 mt-1 leading-4">
                Add a business to receive GST invoices. You can still proceed without a GSTIN.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {businesses.map((b) => {
                const isSel = selectedBusinessId === b.id;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBusinessId(b.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-[19px] border transition-all active:scale-[0.995] ${
                      isSel
                        ? 'border-[#02402c] bg-[#F0F7F4] shadow-[0_5px_16px_rgba(2,64,44,0.05)]'
                        : 'border-[#E2E9E6] bg-white shadow-[0_3px_12px_rgba(15,23,42,0.025)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-[19px] w-[19px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSel
                            ? 'border-[#02402c] bg-[#02402c]'
                            : 'border-[#C8D3DC] bg-white'
                        }`}
                      >
                        {isSel && (
                          <CheckCircle2 size={11} className="text-white" strokeWidth={3} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13px] font-extrabold text-[#263548] truncate">
                            {b.business_name}
                          </p>

                          {b.is_default && (
                            <span className="text-[8px] font-black bg-[#DCEBE5] text-[#02402c] rounded-full px-2 py-0.5">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        {b.gst_registered && b.gstin ? (
                          <p className="text-[10px] text-slate-500 mt-1 font-medium">
                            GSTIN: <span className="font-bold text-slate-700">{b.gstin}</span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 mt-1">Not GST registered</p>
                        )}
                      </div>

                      <ChevronRight size={17} className="text-slate-300 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* DELIVERY ADDRESS */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <SectionTitle title="Delivery Address" noMargin />

            {addresses.length > 0 && (
              <button
                type="button"
                onClick={onAddAddress}
                className="rounded-full bg-[#EAF5F0] px-3 py-1.5 text-[10.5px] font-extrabold text-[#02402c] active:scale-95 transition-transform"
              >
                + Add New
              </button>
            )}
          </div>

          {addresses.length === 0 ? (
            <button
              type="button"
              onClick={onAddAddress}
              className="w-full h-12 rounded-[17px] border border-dashed border-[#78A995] bg-[#F0F8F4] text-[#02402c] text-[12px] font-bold flex items-center justify-center gap-1.5"
            >
              <MapPin size={16} /> Add a delivery address
            </button>
          ) : (
            <div className="space-y-2.5">
              {addresses.map((addr) => {
                const selected = selectedAddr === addr.id;

                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => setSelectedAddr(addr.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-[19px] border transition-all active:scale-[0.995] ${
                      selected
                        ? 'border-[#02402c] bg-[#F0F7F4] shadow-[0_5px_16px_rgba(2,64,44,0.05)]'
                        : 'border-[#E2E9E6] bg-white shadow-[0_3px_12px_rgba(15,23,42,0.025)]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 h-[19px] w-[19px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected
                            ? 'border-[#02402c] bg-[#02402c]'
                            : 'border-[#C8D3DC] bg-white'
                        }`}
                      >
                        {selected && (
                          <CheckCircle2 size={11} className="text-white" strokeWidth={3} />
                        )}
                      </div>

                      <div className="h-8 w-8 rounded-full bg-white border border-[#E1EAE6] flex items-center justify-center text-[#0A6045] shrink-0">
                        <MapPin size={15} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13px] font-extrabold text-[#263548]">{addr.label}</p>

                          {addr.is_default && (
                            <span className="text-[8px] font-black bg-[#DCEBE5] text-[#02402c] rounded-full px-2 py-0.5">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <p className="text-[10.5px] text-[#687789] mt-1 leading-[1.45] line-clamp-2">
                          {addr.line1}, {addr.city}, {addr.state} - {addr.postal_code}
                        </p>

                        <p className="text-[10px] font-medium text-slate-500 mt-1">
                          {addr.recipient_name} <span className="px-0.5">•</span> {addr.phone}
                        </p>
                      </div>

                      <ChevronRight size={17} className="text-slate-300 shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* OFFERS */}
        <section className="rounded-[20px] border border-[#DCEDE5] bg-[#EDF8F3] p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-[12px] bg-[#D9F0E4] flex items-center justify-center text-[#0B6749] shrink-0">
              <Gift size={17} />
            </div>

            <div className="min-w-0">
              <h2 className="text-[13px] font-extrabold text-[#18372D]">Offers & Benefits</h2>
              <p className="text-[10px] text-[#718A80] mt-0.5">Apply a promo code to save on this order</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829B91]" />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  if (promoError) setPromoError(null);
                }}
                placeholder="Enter promo code"
                className="w-full h-11 rounded-[14px] border border-[#DDE6E2] bg-white pl-9 pr-3 text-[12px] font-medium outline-none focus:border-[#02402c] focus:ring-2 focus:ring-[#02402c]/5 placeholder:text-slate-400"
                disabled={!!cart.appliedPromo}
              />
            </div>

            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={applyingPromo || !promoInput.trim() || !!cart.appliedPromo}
              className="h-11 px-4 rounded-[14px] bg-[#0A8F58] text-white text-[12px] font-extrabold flex items-center gap-1.5 disabled:bg-[#C8D4DE] active:scale-95 transition-all"
            >
              {applyingPromo ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Gift size={15} />
              )}
              Apply
            </button>
          </div>

          {cart.appliedPromo && (
            <div className="mt-2.5 flex items-center justify-between gap-2 bg-white/75 rounded-[12px] px-3 py-2">
              <span className="text-[10px] font-bold text-[#0A704E] truncate">
                {cart.appliedPromo.code} applied · ₹{cart.appliedPromo.discount.toLocaleString('en-IN')} saved
              </span>
              <button
                type="button"
                onClick={() => cart.clearPromo()}
                className="text-[10px] font-extrabold text-red-500 shrink-0"
              >
                Remove
              </button>
            </div>
          )}

          {promoError && (
            <p className="text-[10px] text-red-500 mt-1.5 font-medium">{promoError}</p>
          )}
        </section>

        {/* WALLET */}
        <section className="bg-white border border-[#E2E8E6] rounded-[19px] px-3.5 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-[11px] bg-[#E8F5EF] text-[#075C41] flex items-center justify-center shrink-0">
                <Wallet size={18} />
              </div>

              <div>
                <p className="text-[13px] font-extrabold text-[#263548]">CafKart Wallet</p>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  Balance: <span className="font-bold text-[#075C41]">₹{walletBalance.toLocaleString('en-IN')}</span>
                </p>
              </div>
            </div>

            <label className="relative inline-flex h-6 w-11 cursor-pointer">
              <input
                type="checkbox"
                checked={useWallet && walletBalance > 0}
                disabled={walletBalance <= 0}
                onChange={(e) => setUseWallet(e.target.checked)}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-slate-200 peer-checked:bg-[#0A8F58] transition-colors" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </section>

        {/* PAYMENT */}
        {!isFullWalletPayment && (
          <section>
            <SectionTitle
              title={
                walletDeduction > 0
                  ? `Pay Remaining ₹${remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  : 'Payment Method'
              }
            />

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-[17px] border transition-all text-left active:scale-[0.995] ${
                  paymentMethod === 'cod'
                    ? 'border-[#02402c] bg-[#F0F7F4]'
                    : 'border-[#E2E8E6] bg-white'
                }`}
              >
                <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center ${paymentMethod === 'cod' ? 'bg-[#DDF0E7] text-[#075C41]' : 'bg-slate-100 text-slate-400'}`}>
                  <Banknote size={17} />
                </div>
                <p className="text-[12px] font-extrabold text-[#263548] mt-2">Cash on delivery</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Pay on arrival</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-3 rounded-[17px] border transition-all text-left active:scale-[0.995] ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#02402c] bg-[#F0F7F4]'
                    : 'border-[#E2E8E6] bg-white'
                }`}
              >
                <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center ${paymentMethod === 'razorpay' ? 'bg-[#DDF0E7] text-[#075C41]' : 'bg-slate-100 text-slate-400'}`}>
                  <CreditCard size={17} />
                </div>
                <p className="text-[12px] font-extrabold text-[#263548] mt-2">Online payment</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Secure & fast</p>
              </button>
            </div>
          </section>
        )}

        {/* ORDER SUMMARY */}
        <section className="bg-white border border-[#E2E8E6] rounded-[20px] p-4 shadow-[0_4px_14px_rgba(15,23,42,0.035)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.10em] font-black text-[#7B9188]">Final review</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#263548]">Order Summary</h2>
            </div>

            <span className="rounded-full bg-[#F0F5F3] px-2.5 py-1 text-[9px] font-extrabold text-[#60756C]">
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="space-y-2">
            {cart.items.map((item) => (
              <div key={item.product.id} className="flex justify-between gap-3 text-[11px]">
                <span className="text-slate-600 truncate flex-1 font-medium">
                  {item.product.brand} {item.product.name} × {item.quantity}
                </span>
                <span className="font-bold text-slate-800 shrink-0">
                  ₹{((Number(item.effectiveUnitPrice) || Number(item.product.price)) * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 my-3 pt-3 space-y-2">
            <div className="flex justify-between text-[11px] font-medium text-slate-600">
              <span>Item Subtotal</span>
              <span>₹{effectiveSubtotal.toLocaleString('en-IN')}</span>
            </div>

            {cart.appliedPromo && (
              <div className="flex justify-between text-[11px] font-bold text-emerald-600">
                <span>Promo discount</span>
                <span>- ₹{cart.appliedPromo.discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {Object.entries(gstBreakdown).map(([rate, amount]) => {
              const half = amount / 2;

              return (
                <div key={rate} className="space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>CGST @{(Number(rate) / 2).toFixed(1)}%</span>
                    <span>₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>SGST @{(Number(rate) / 2).toFixed(1)}%</span>
                    <span>₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between gap-3 text-[11px] font-bold text-slate-700">
              <span>
                {deliveryType === 'express'
                  ? `Express Delivery (${expressTime || '2 hours'})`
                  : 'Standard Delivery (Next day)'}
              </span>
              <span className={deliveryCharge === 0 ? 'text-emerald-600' : 'text-slate-800'}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>
          </div>

          <div className="rounded-[16px] bg-[#F1F7F4] px-3.5 py-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#789087]">Grand Total</p>
              <p className="mt-0.5 text-[22px] leading-none font-black tracking-[-0.04em] text-[#12382D]">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {walletDeduction > 0 && (
              <span className="text-[9px] font-extrabold text-[#0A704E] bg-[#DDF1E7] rounded-full px-2 py-1">
                Wallet applied
              </span>
            )}
          </div>

          {walletDeduction > 0 && (
            <div className="flex justify-between mt-2 text-[11px] font-bold text-emerald-600">
              <span>Wallet Deduction</span>
              <span>- ₹{walletDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </section>

        {/* SECURE CHECKOUT */}
        <div className="rounded-[18px] border border-[#DCEDE5] bg-[#EDF8F3] px-3.5 py-3 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#D7EFE3] text-[#0A704E] flex items-center justify-center shrink-0">
            <ShieldCheck size={17} strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-extrabold text-[#18513E]">Secure checkout</p>
            <p className="text-[10px] text-[#718A80] mt-0.5 truncate">Encrypted payment flow · Your order details stay protected</p>
          </div>

          <LockKeyhole size={15} className="ml-auto text-[#79A797] shrink-0" />
        </div>

        {error && (
          <div className="rounded-[14px] border border-red-100 bg-red-50 px-3 py-2.5 text-[11px] font-bold text-red-600">
            {error}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STICKY BOTTOM ACTION — uses the same safe-bottom utility as       */}
        {/* BottomNavigation.tsx                                              */}
        {/* ---------------------------------------------------------------- */}
        <div className="fixed inset-x-0 bottom-0 z-[110] safe-bottom bg-white/[0.97] backdrop-blur-xl border-t border-slate-100 px-3.5 pt-2.5 shadow-[0_-7px_22px_rgba(15,23,42,0.075)]">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-[0.08em] font-black text-[#7B9188]">Payable now</p>
              <p className="mt-0.5 text-[18px] leading-none font-black tracking-[-0.035em] text-[#12382D]">
                ₹{remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddr || cart.items.length === 0 || !selectedBusinessId}
              className="h-12 flex-1 max-w-[230px] rounded-[16px] bg-[#02402c] text-white px-4 shadow-[0_9px_20px_rgba(2,64,44,0.20)] disabled:bg-slate-300 disabled:shadow-none active:scale-[0.99] transition-all"
            >
              {placing ? (
                <span className="flex items-center justify-center gap-2 text-[12px] font-extrabold">
                  <Loader2 size={16} className="animate-spin" />
                  Processing securely...
                </span>
              ) : (
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-extrabold">Place Order</span>
                  <span className="rounded-[9px] bg-white/15 px-2.5 py-1.5 text-[11px] font-extrabold">
                    {paymentMethod === 'razorpay' && !isFullWalletPayment ? 'Pay' : 'Continue'}
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* PAYMENT ALERT */}
      {showPaymentAlert && (
        <div
          className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPaymentAlert(false)}
        >
          <div
            className="bg-white rounded-[24px] p-5 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-[16px] font-black text-slate-900 mt-3">Payment Issue</h3>
              <p className="text-[12px] text-slate-500 mt-1.5 leading-5 font-medium">{paymentAlertMsg}</p>
              <button
                type="button"
                onClick={() => setShowPaymentAlert(false)}
                className="w-full h-11 mt-4 rounded-[13px] bg-slate-900 text-white text-[12px] font-bold"
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

function SectionTitle({ title, noMargin = false }: { title: string; noMargin?: boolean }) {
  return (
    <div className={`${noMargin ? '' : 'mb-2.5'} flex items-center gap-2`}>
      <span className="h-5 w-1 rounded-full bg-[#0A8F58]" />
      <h2 className="text-[14px] font-extrabold tracking-[-0.02em] text-[#172536]">{title}</h2>
    </div>
  );
}
