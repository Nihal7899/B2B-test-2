import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, MapPin, Tag, Truck, Loader2, CheckCircle2, CreditCard, Banknote, AlertCircle, X, Gift, Wallet } from 'lucide-react';
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
      
      const chargeResponse = await getDeliveryCharge(addr.postal_code, subtotalAfterPromo) as any;
      const charge = chargeResponse?.charge || 0;
      const zoneId = chargeResponse?.zoneId || null;
      const estimatedTime = chargeResponse?.estimated_time || '45 mins';
      
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-[#02402c]/20 border-t-[#02402c] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Premium Dark Header Background */}
      <div className="bg-[#02402c] safe-top px-4 pt-4 pb-12 text-white shadow-md rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm active:bg-white/20 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Checkout</h1>
            <p className="text-[13px] text-emerald-100/80 mt-0.5 font-medium">Review and place your order</p>
          </div>
        </div>
      </div>

      {/* Floating Delivery Toggle Pill */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex items-center">
          <button
            onClick={() => handleDeliveryTypeChange('standard')}
            className={`flex-1 h-[68px] rounded-xl flex flex-col items-center justify-center gap-[2px] transition-all duration-300 ${
              deliveryType === 'standard' 
                ? 'bg-slate-50 shadow-sm text-[#02402c] border border-slate-200/60' 
                : 'text-slate-500 hover:bg-slate-50/50'
            }`}
          >
            <StandardModeIcon active={deliveryType === 'standard'} />
            <span className="font-bold text-[14px] mt-0.5 tracking-tight">Standard</span>
            <span className={`text-[11px] font-semibold ${deliveryType === 'standard' ? 'text-[#02402c]/70' : 'text-slate-400'}`}>
              Next day delivery
            </span>
          </button>

          <button
            onClick={() => handleDeliveryTypeChange('express')}
            className={`flex-1 h-[68px] rounded-xl flex flex-col items-center justify-center gap-[2px] transition-all duration-300 ${
              deliveryType === 'express' 
                ? 'bg-slate-50 shadow-sm text-[#02402c] border border-slate-200/60' 
                : 'text-slate-500 hover:bg-slate-50/50'
            }`}
          >
            <ExpressModeIcon active={deliveryType === 'express'} />
            <span className="font-bold text-[14px] mt-0.5 tracking-tight">Express</span>
            <span className={`text-[11px] font-semibold truncate px-1 max-w-full ${deliveryType === 'express' ? 'text-[#02402c]/70' : 'text-slate-400'}`}>
              {expressCharge > 0 ? `+₹${expressCharge}` : 'Check Area'} • {expressTime}
            </span>
          </button>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        {/* Billing Business */}
        <section>
          <h2 className="text-[15px] font-black text-slate-900 mb-3 tracking-tight">Billing Details</h2>
          {businesses.length === 0 ? (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-bold text-amber-900">No business profile yet</p>
              <p className="text-xs text-amber-700 mt-1">
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
                    onClick={() => setSelectedBusinessId(b.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSel ? 'border-[#02402c] bg-[#02402c]/[0.03]' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSel ? 'border-[#02402c] bg-[#02402c]' : 'border-slate-300'
                      }`}>
                        {isSel && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[15px] font-bold text-slate-800">{b.business_name}</p>
                          {b.is_default && (
                            <span className="text-[10px] font-black bg-[#02402c]/10 text-[#02402c] rounded-md px-2 py-0.5">DEFAULT</span>
                          )}
                        </div>
                        {b.gst_registered && b.gstin ? (
                          <p className="text-xs text-slate-500 mt-1 font-mono font-medium">GSTIN: <span className="font-bold text-slate-700">{b.gstin}</span></p>
                        ) : (
                          <p className="text-xs text-slate-400 mt-1">Not GST registered</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Delivery Address */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-black text-slate-900 tracking-tight">Delivery Address</h2>
            {addresses.length > 0 && (
              <button onClick={onAddAddress} className="text-xs font-bold text-[#02402c]">
                + Add New
              </button>
            )}
          </div>
          
          {addresses.length === 0 ? (
            <button onClick={onAddAddress} className="w-full h-14 rounded-2xl border-2 border-dashed border-[#02402c]/30 bg-[#02402c]/5 text-[#02402c] text-sm font-bold flex items-center justify-center gap-2">
              <MapPin size={18} /> Add a delivery address
            </button>
          ) : (
            <div className="space-y-2.5">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddr(addr.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                    selectedAddr === addr.id ? 'border-[#02402c] bg-[#02402c]/[0.03]' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      selectedAddr === addr.id ? 'border-[#02402c] bg-[#02402c]' : 'border-slate-300'
                    }`}>
                      {selectedAddr === addr.id && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-bold text-slate-800">{addr.label}</p>
                        {addr.is_default && <span className="text-[10px] font-black bg-[#02402c]/10 text-[#02402c] rounded-md px-2 py-0.5">DEFAULT</span>}
                      </div>
                      <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{addr.line1}, {addr.city}, {addr.state} - {addr.postal_code}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1.5">{addr.recipient_name} • {addr.phone}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Promo Code */}
        <section>
          <h2 className="text-[15px] font-black text-slate-900 mb-3 tracking-tight">Offers & Benefits</h2>
          <div className="flex gap-2.5">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Enter promo code"
              className="flex-1 h-12 rounded-xl border border-slate-200 px-4 text-sm font-medium outline-none focus:border-[#02402c] focus:ring-1 focus:ring-[#02402c] transition-all bg-white"
              disabled={!!cart.appliedPromo}
            />
            <button
              onClick={handleApplyPromo}
              disabled={applyingPromo || !promoInput.trim() || !!cart.appliedPromo}
              className="h-12 px-5 rounded-xl bg-[#02402c] text-white text-sm font-bold flex items-center gap-2 disabled:bg-slate-300 transition-colors shadow-sm"
            >
              {applyingPromo ? <Loader2 size={18} className="animate-spin" /> : <Gift size={18} />} Apply
            </button>
            {cart.appliedPromo && (
              <button onClick={() => { cart.clearPromo(); }} className="h-12 px-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-bold shadow-sm">
                Remove
              </button>
            )}
          </div>
          {promoError && <p className="text-xs text-red-500 mt-2 font-medium ml-1">{promoError}</p>}
        </section>

        {/* Wallet */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#02402c]/10 text-[#02402c] flex items-center justify-center shrink-0">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-[15px] font-black text-slate-900 tracking-tight">CafKart Wallet</p>
                <p className="text-[13px] text-slate-500 mt-0.5">Balance: <span className="font-bold text-[#02402c]">₹{walletBalance.toLocaleString('en-IN')}</span></p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={useWallet && walletBalance > 0} 
                disabled={walletBalance <= 0}
                onChange={(e) => setUseWallet(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#02402c]"></div>
            </label>
          </div>
        </section>

        {/* Payment Method */}
        {!isFullWalletPayment && (
          <section>
            <h2 className="text-[15px] font-black text-slate-900 mb-3 tracking-tight">
              {walletDeduction > 0 ? `Pay Remaining (₹${remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })})` : 'Payment Method'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPaymentMethod('cod')} className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                paymentMethod === 'cod' ? 'border-[#02402c] bg-[#02402c]/[0.03] shadow-sm' : 'border-slate-200 bg-white'
              }`}>
                <Banknote size={22} className={paymentMethod === 'cod' ? 'text-[#02402c]' : 'text-slate-400'} />
                <p className="text-[14px] font-bold text-slate-800 mt-2.5">Cash on delivery</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Pay on arrival</p>
              </button>
              <button onClick={() => setPaymentMethod('razorpay')} className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                paymentMethod === 'razorpay' ? 'border-[#02402c] bg-[#02402c]/[0.03] shadow-sm' : 'border-slate-200 bg-white'
              }`}>
                <CreditCard size={22} className={paymentMethod === 'razorpay' ? 'text-[#02402c]' : 'text-slate-400'} />
                <p className="text-[14px] font-bold text-slate-800 mt-2.5">Online payment</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Secure & fast</p>
              </button>
            </div>
          </section>
        )}

        {/* Order Summary */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-[15px] font-black text-slate-900 tracking-tight">Order Summary</h2>
          
          <div className="space-y-2.5">
            {cart.items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-[13px]">
                <span className="text-slate-600 truncate flex-1 font-medium pr-4">
                  {item.product.brand} {item.product.name} × {item.quantity}
                </span>
                <span className="font-bold text-slate-900">
                  ₹{((Number(item.effectiveUnitPrice) || Number(item.product.price)) * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-4 space-y-2.5">
            <div className="flex justify-between text-[13px] font-medium text-slate-600">
              <span>Item Subtotal</span>
              <span>₹{effectiveSubtotal.toLocaleString('en-IN')}</span>
            </div>
            
            {cart.appliedPromo && (
              <div className="flex justify-between text-[13px] font-bold text-emerald-600">
                <span>Promo discount</span>
                <span>- ₹{cart.appliedPromo.discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {Object.entries(gstBreakdown).map(([rate, amount]) => {
              const half = amount / 2;
              return (
                <div key={rate} className="space-y-2.5">
                  <div className="flex justify-between text-[13px] font-medium text-slate-600">
                    <span>CGST @{(Number(rate) / 2).toFixed(1)}%</span>
                    <span>₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[13px] font-medium text-slate-600">
                    <span>SGST @{(Number(rate) / 2).toFixed(1)}%</span>
                    <span>₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between text-[13px] font-bold text-slate-700">
              <span>{deliveryType === 'express' ? `Express Delivery (${expressTime})` : 'Standard Delivery (Next day)'}</span>
              <span className={deliveryCharge === 0 ? "text-emerald-600" : "text-slate-900"}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2.5">
            <div className="flex justify-between text-[15px] font-black text-slate-900">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {walletDeduction > 0 && (
              <div className="flex justify-between text-[14px] font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl">
                <span>Wallet Deduction</span>
                <span>- ₹{walletDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        </section>

        {/* Place Order Button */}
        <div className="pt-2">
          <button
            onClick={handlePlaceOrder}
            disabled={placing || !selectedAddr || cart.items.length === 0 || !selectedBusinessId}
            className="w-full h-14 rounded-2xl bg-[#02402c] text-white text-[15px] font-black flex items-center justify-between px-6 shadow-lg shadow-[#02402c]/20 disabled:bg-slate-400 disabled:shadow-none transition-all active:scale-[0.98]"
          >
            {placing ? (
              <div className="w-full flex justify-center items-center gap-2">
                <Loader2 size={20} className="animate-spin" /> 
                <span>Processing Securely...</span>
              </div>
            ) : (
              <>
                <span>Place Order</span>
                <span className="bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                  ₹{remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payment Alert Modal */}
      {showPaymentAlert && (
        <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowPaymentAlert(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0 border-8 border-red-50/50">
                <AlertCircle size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[17px] font-black text-slate-900">Payment Issue</h3>
                <p className="text-[14px] text-slate-500 mt-2 leading-relaxed font-medium">{paymentAlertMsg}</p>
              </div>
              <button onClick={() => setShowPaymentAlert(false)} className="w-full h-12 mt-2 rounded-xl bg-slate-900 text-white text-[15px] font-bold hover:bg-slate-800 transition-colors">
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
