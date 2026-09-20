import { useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-[#F6F9F8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-[3px] border-[#0B4F3A]/15 border-t-[#0B4F3A] animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Preparing your checkout...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#F6F9F8] text-[#142437] pb-36">
      {/* Header */}
      <header className="relative overflow-hidden bg-[#075239] text-white safe-top rounded-b-[34px] shadow-[0_12px_30px_rgba(7,82,57,0.16)]">
        <div className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-white/[0.035]" />
        <div className="absolute right-8 top-8 opacity-90">
          <HeaderLeafIcon />
        </div>

        <div className="relative px-5 pt-5 pb-24">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="h-12 w-12 rounded-[18px] border border-white/20 bg-white/[0.08] flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeftIcon />
            </button>

            <div>
              <h1 className="text-[31px] leading-none font-black tracking-[-0.04em]">Checkout</h1>
              <p className="mt-2 text-[15px] leading-none font-medium text-emerald-50/75">
                Review and place your order
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Delivery selector */}
      <section className="relative z-10 -mt-10 px-4">
        <div className="rounded-[28px] bg-white p-1.5 shadow-[0_14px_35px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handleDeliveryTypeChange('standard')}
              className={`relative min-h-[118px] rounded-[23px] px-3 py-4 flex flex-col items-center justify-center transition-all ${
                deliveryType === 'standard'
                  ? 'bg-[#F3F8F6] ring-1 ring-[#D8E6E0] shadow-sm'
                  : 'bg-white'
              }`}
            >
              {deliveryType === 'standard' && (
                <div className="absolute right-3 top-3 h-6 w-6 rounded-full bg-[#23B36B] flex items-center justify-center">
                  <CheckIcon size={14} strokeWidth={3} />
                </div>
              )}
              <StandardModeIcon active={deliveryType === 'standard'} />
              <span className={`mt-2 text-[18px] font-black tracking-[-0.02em] ${
                deliveryType === 'standard' ? 'text-[#0B4F3A]' : 'text-slate-600'
              }`}>
                Standard
              </span>
              <span className={`mt-1 text-[13px] font-semibold ${
                deliveryType === 'standard' ? 'text-[#6E8A7F]' : 'text-slate-400'
              }`}>
                Next day delivery
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDeliveryTypeChange('express')}
              className={`relative min-h-[118px] rounded-[23px] px-3 py-4 flex flex-col items-center justify-center transition-all ${
                deliveryType === 'express'
                  ? 'bg-[#F3F8F6] ring-1 ring-[#D8E6E0] shadow-sm'
                  : 'bg-white'
              }`}
            >
              {deliveryType === 'express' && (
                <div className="absolute right-3 top-3 h-6 w-6 rounded-full bg-[#23B36B] flex items-center justify-center">
                  <CheckIcon size={14} strokeWidth={3} />
                </div>
              )}
              <ExpressModeIcon active={deliveryType === 'express'} />
              <span className={`mt-2 text-[18px] font-black tracking-[-0.02em] ${
                deliveryType === 'express' ? 'text-[#0B4F3A]' : 'text-slate-500'
              }`}>
                Express
              </span>
              <span className={`mt-1 text-[13px] font-semibold truncate max-w-full px-2 ${
                deliveryType === 'express' ? 'text-[#6E8A7F]' : 'text-slate-400'
              }`}>
                +₹{expressCharge || 50} • {expressTime || '2 hours'}
              </span>
            </button>
          </div>
        </div>
      </section>

      <main className="px-4 pt-7 space-y-7">
        {/* Billing */}
        <section>
          <SectionHeading
            icon={<BillingIcon />}
            title="Billing Details"
            subtitle="Select the business for your invoice"
          />

          {businesses.length === 0 ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
              <p className="text-[15px] font-black text-amber-900">No business profile yet</p>
              <p className="mt-1 text-[13px] leading-5 font-medium text-amber-800/80">
                Add a business to receive GST invoices. You can still proceed without a GSTIN.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {businesses.map((b) => {
                const isSel = selectedBusinessId === b.id;
                return (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => setSelectedBusinessId(b.id)}
                    className={`w-full rounded-[24px] border-2 p-4 text-left transition-all active:scale-[0.995] ${
                      isSel
                        ? 'border-[#0B4F3A] bg-[#F0F8F4] shadow-[0_8px_24px_rgba(11,79,58,0.07)]'
                        : 'border-[#E4EBE9] bg-white shadow-[0_5px_18px_rgba(15,23,42,0.04)]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 shrink-0">
                        <RadioDot active={isSel} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[17px] font-black tracking-[-0.02em] text-[#17263A]">
                            {b.business_name}
                          </p>
                          {b.is_default && (
                            <span className="rounded-full bg-[#DDEBE5] px-2.5 py-1 text-[10px] font-black tracking-[0.02em] text-[#0B4F3A]">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-[13px]">
                          <span className="font-medium text-[#71808F]">GSTIN:</span>
                          <span className="font-bold text-[#3B4B5E]">
                            {b.gst_registered && b.gstin ? b.gstin : 'Not GST registered'}
                          </span>
                        </div>
                      </div>

                      <ChevronRightIcon />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Delivery address */}
        <section>
          <div className="mb-3.5 flex items-start justify-between gap-3">
            <SectionHeading
              icon={<DeliveryIcon />}
              title="Delivery Address"
              subtitle="Where should we deliver your order?"
              noBottomMargin
            />
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={onAddAddress}
                className="mt-1 shrink-0 rounded-full bg-[#E9F5F0] px-4 py-2 text-[13px] font-black text-[#0B5A40] active:scale-95 transition-transform"
              >
                + Add New
              </button>
            )}
          </div>

          {addresses.length === 0 ? (
            <button
              type="button"
              onClick={onAddAddress}
              className="w-full rounded-[24px] border-2 border-dashed border-[#9ACAB6] bg-[#EDF8F3] px-5 py-6 text-[#0B4F3A] flex items-center justify-center gap-2.5 font-black"
            >
              <MapPinIcon />
              Add a delivery address
            </button>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => {
                const isSel = selectedAddr === addr.id;
                return (
                  <button
                    type="button"
                    key={addr.id}
                    onClick={() => setSelectedAddr(addr.id)}
                    className={`w-full rounded-[25px] border-2 p-5 text-left transition-all active:scale-[0.995] ${
                      isSel
                        ? 'border-[#0B4F3A] bg-[#F0F8F4] shadow-[0_8px_24px_rgba(11,79,58,0.07)]'
                        : 'border-[#E4EBE9] bg-white shadow-[0_5px_18px_rgba(15,23,42,0.04)]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 shrink-0">
                        <RadioDot active={isSel} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="h-10 w-10 rounded-full bg-white shadow-sm ring-1 ring-[#E1ECE7] flex items-center justify-center text-[#0B5A40] shrink-0">
                            <MapPinIcon size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[17px] font-black tracking-[-0.02em] text-[#17263A]">
                                {addr.label}
                              </p>
                              {addr.is_default && (
                                <span className="rounded-full bg-[#DDEBE5] px-2.5 py-1 text-[10px] font-black text-[#0B4F3A]">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="ml-[53px] mt-2">
                          <p className="text-[13px] leading-5 font-medium text-[#65778A]">
                            {addr.line1}, {addr.city}, {addr.state} - {addr.postal_code}
                          </p>
                          <p className="mt-1.5 text-[13px] font-medium text-[#7A8793]">
                            {addr.recipient_name} <span className="mx-1">•</span> {addr.phone}
                          </p>
                        </div>
                      </div>

                      <ChevronRightIcon />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Offers */}
        <section className="overflow-hidden rounded-[26px] border border-[#DAEEE5] bg-[#EDF9F4] p-5">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 shrink-0 rounded-full bg-[#D7F0E4] flex items-center justify-center text-[#0B6A49]">
              <GiftIcon />
            </div>
            <div className="min-w-0">
              <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#142D28]">Offers & Benefits</h2>
              <p className="mt-1 text-[13px] font-medium text-[#6C887E]">
                Apply promo code or view available offers
              </p>
            </div>
            <div className="ml-auto mt-1 hidden sm:block text-[#21A96A]">
              <SparkIcon />
            </div>
          </div>

          <div className="mt-4 flex gap-2.5">
            <div className="relative flex-1">
              <TagIcon />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  if (promoError) setPromoError(null);
                }}
                placeholder="Enter promo code"
                className="h-[54px] w-full rounded-[18px] border border-[#DCE6E2] bg-white pl-12 pr-4 text-[14px] font-semibold text-[#17263A] outline-none placeholder:text-[#9BA6AF] focus:border-[#53AA84] focus:ring-4 focus:ring-[#0B4F3A]/5"
                disabled={!!cart.appliedPromo}
              />
            </div>

            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={applyingPromo || !promoInput.trim() || !!cart.appliedPromo}
              className="h-[54px] shrink-0 rounded-[18px] bg-[#0AA05F] px-5 text-[14px] font-black text-white shadow-[0_8px_18px_rgba(10,160,95,0.18)] disabled:bg-[#C9D7E4] disabled:shadow-none active:scale-95 transition-all flex items-center gap-2"
            >
              {applyingPromo ? <Loader2 size={18} className="animate-spin" /> : <GiftIcon size={18} />}
              Apply
            </button>
          </div>

          {cart.appliedPromo && (
            <div className="mt-3 flex items-center justify-between rounded-[16px] bg-white/80 px-4 py-3">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#0B6849]">Applied</p>
                <p className="mt-0.5 text-[13px] font-bold text-[#27483E]">{cart.appliedPromo.code}</p>
              </div>
              <button
                type="button"
                onClick={() => cart.clearPromo()}
                className="text-[12px] font-black text-red-500"
              >
                Remove
              </button>
            </div>
          )}

          {promoError && (
            <p className="mt-2.5 ml-1 text-[12px] font-semibold text-red-500">{promoError}</p>
          )}
        </section>

        {/* Wallet */}
        <section className="rounded-[25px] border border-[#E2E9E6] bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.045)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-full bg-[#E5F4EE] flex items-center justify-center text-[#0B5B42]">
                <WalletIcon />
              </div>
              <div>
                <p className="text-[16px] font-black tracking-[-0.02em] text-[#17263A]">CafKart Wallet</p>
                <p className="mt-0.5 text-[13px] font-medium text-[#768494]">
                  Balance:
                  <span className="ml-1 font-black text-[#0B5F44]">
                    ₹{walletBalance.toLocaleString('en-IN')}
                  </span>
                </p>
              </div>
            </div>

            <label className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={useWallet && walletBalance > 0}
                disabled={walletBalance <= 0}
                onChange={(e) => setUseWallet(e.target.checked)}
                className="peer sr-only"
              />
              <div className="absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-[#0AA05F]" />
              <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </section>

        {/* Payment */}
        {!isFullWalletPayment && (
          <section>
            <div className="mb-3.5">
              <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#17263A]">
                {walletDeduction > 0
                  ? `Pay Remaining ₹${remainingPayable.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}`
                  : 'Payment Method'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`rounded-[24px] border-2 p-4 text-left transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-[#0B4F3A] bg-[#F0F8F4] shadow-[0_7px_22px_rgba(11,79,58,0.06)]'
                    : 'border-[#E5ECE9] bg-white'
                }`}
              >
                <div className={`h-11 w-11 rounded-full flex items-center justify-center ${
                  paymentMethod === 'cod' ? 'bg-[#DDF2E8] text-[#0B5D42]' : 'bg-slate-100 text-slate-500'
                }`}>
                  <CashIcon />
                </div>
                <p className="mt-3 text-[15px] font-black text-[#17263A]">Cash on delivery</p>
                <p className="mt-1 text-[12px] font-medium text-[#7A8793]">Pay on arrival</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay')}
                className={`rounded-[24px] border-2 p-4 text-left transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#0B4F3A] bg-[#F0F8F4] shadow-[0_7px_22px_rgba(11,79,58,0.06)]'
                    : 'border-[#E5ECE9] bg-white'
                }`}
              >
                <div className={`h-11 w-11 rounded-full flex items-center justify-center ${
                  paymentMethod === 'razorpay' ? 'bg-[#DDF2E8] text-[#0B5D42]' : 'bg-slate-100 text-slate-500'
                }`}>
                  <CardIcon />
                </div>
                <p className="mt-3 text-[15px] font-black text-[#17263A]">Online payment</p>
                <p className="mt-1 text-[12px] font-medium text-[#7A8793]">Secure & fast</p>
              </button>
            </div>
          </section>
        )}

        {/* Order summary */}
        <section className="rounded-[26px] border border-[#E2E9E6] bg-white p-5 shadow-[0_7px_24px_rgba(15,23,42,0.045)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#17263A]">Order Summary</h2>
            <span className="rounded-full bg-[#EFF5F2] px-3 py-1 text-[11px] font-black text-[#587468]">
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="mt-5 space-y-3.5">
            {cart.items.map((item) => (
              <div key={item.product.id} className="flex justify-between gap-4">
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#68788A]">
                  {item.product.brand} {item.product.name} × {item.quantity}
                </span>
                <span className="text-[13px] font-black text-[#233447]">
                  ₹{((Number(item.effectiveUnitPrice) || Number(item.product.price)) * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="my-5 border-t border-dashed border-[#D8E2DE]" />

          <div className="space-y-3">
            <div className="flex justify-between text-[13px]">
              <span className="font-medium text-[#758394]">Item Subtotal</span>
              <span className="font-black text-[#344355]">₹{effectiveSubtotal.toLocaleString('en-IN')}</span>
            </div>

            {cart.appliedPromo && (
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold text-[#1D9565]">Promo discount</span>
                <span className="font-black text-[#1D9565]">
                  - ₹{cart.appliedPromo.discount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {Object.entries(gstBreakdown).map(([rate, amount]) => {
              const half = amount / 2;
              return (
                <div key={rate} className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-medium text-[#758394]">CGST @{(Number(rate) / 2).toFixed(1)}%</span>
                    <span className="font-semibold text-[#344355]">
                      ₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="font-medium text-[#758394]">SGST @{(Number(rate) / 2).toFixed(1)}%</span>
                    <span className="font-semibold text-[#344355]">
                      ₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between gap-3 text-[13px]">
              <span className="font-medium text-[#758394]">
                {deliveryType === 'express' ? `Express Delivery (${expressTime || '2 hours'})` : 'Standard Delivery (Next day)'}
              </span>
              <span className={`font-black ${deliveryCharge === 0 ? 'text-[#1D9565]' : 'text-[#344355]'}`}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>
          </div>

          <div className="my-5 border-t border-[#E4EAE8]" />

          <div className="rounded-[20px] bg-[#F4F9F7] p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#789084]">Grand Total</p>
                <p className="mt-1 text-[28px] font-black tracking-[-0.04em] text-[#12382D]">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {walletDeduction > 0 && (
                <span className="mb-1 rounded-full bg-[#DDF3E8] px-3 py-1.5 text-[11px] font-black text-[#0F7653]">
                  Wallet applied
                </span>
              )}
            </div>

            {walletDeduction > 0 && (
              <div className="mt-3 flex justify-between text-[13px] font-bold text-[#1D9565]">
                <span>Wallet Deduction</span>
                <span>- ₹{walletDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        </section>

        {/* Secure checkout reassurance */}
        <section className="relative overflow-hidden rounded-[25px] bg-[#EAF8F2] p-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-[#D0F0DF] flex items-center justify-center text-[#0B7651] shrink-0">
              <ShieldIcon />
            </div>
            <div>
              <p className="text-[15px] font-black text-[#16503D]">Secure & Safe Checkout</p>
              <p className="mt-0.5 text-[12px] font-medium text-[#709488]">Your information is always protected</p>
            </div>
          </div>
          <div className="absolute right-4 bottom-2 opacity-80 text-[#29B678]">
            <MiniLeafIcon />
          </div>
        </section>

        {error && (
          <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-600">
            {error}
          </div>
        )}

        {/* Place order */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={placing || !selectedAddr || cart.items.length === 0 || !selectedBusinessId}
            className="w-full min-h-[60px] rounded-[22px] bg-[#0B5A40] px-5 text-white shadow-[0_14px_28px_rgba(11,90,64,0.22)] disabled:bg-slate-300 disabled:shadow-none active:scale-[0.99] transition-all"
          >
            {placing ? (
              <div className="flex items-center justify-center gap-2 text-[15px] font-black">
                <Loader2 size={20} className="animate-spin" />
                Processing Securely...
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[16px] font-black">Place Order</span>
                <span className="rounded-[14px] bg-white/15 px-3.5 py-2 text-[15px] font-black">
                  ₹{remainingPayable.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </button>
        </div>
      </main>

      {/* Bottom navigation — visual match to the reference */}
      <nav className="fixed inset-x-0 bottom-0 z-[120] bg-white/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)] backdrop-blur-xl shadow-[0_-8px_28px_rgba(15,23,42,0.08)]">
        <div className="mx-auto grid max-w-md grid-cols-5">
          <BottomNavItem icon={<ShopNavIcon />} label="Shop" />
          <BottomNavItem icon={<CategoriesNavIcon />} label="Categories" />
          <BottomNavItem icon={<ListNavIcon />} label="My list" />
          <BottomNavItem icon={<OrdersNavIcon />} label="Orders" />
          <BottomNavItem icon={<AccountNavIcon />} label="Account" />
        </div>
      </nav>

      {/* Payment Alert Modal */}
      {showPaymentAlert && (
        <div
          className="fixed inset-0 z-[300] bg-[#07150F]/55 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowPaymentAlert(false)}
        >
          <div
            className="w-full max-w-sm rounded-[30px] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle size={30} strokeWidth={2.5} />
              </div>
              <h3 className="mt-4 text-[19px] font-black text-[#17263A]">Payment Issue</h3>
              <p className="mt-2 text-[14px] leading-6 font-medium text-[#788697]">{paymentAlertMsg}</p>
              <button
                type="button"
                onClick={() => setShowPaymentAlert(false)}
                className="mt-5 h-12 w-full rounded-[16px] bg-[#0B4F3A] text-[14px] font-black text-white active:scale-[0.99]"
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

/* -------------------------------------------------------------------------- */
/* Inline SVG icon system                                                      */
/* -------------------------------------------------------------------------- */

type IconProps = {
  size?: number;
  strokeWidth?: number;
};

function ArrowLeftIcon({ size = 27, strokeWidth = 2.2 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ size = 16, strokeWidth = 2.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.2 4.1L19 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-2 shrink-0 text-[#0B6549]" aria-hidden="true">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
      active ? 'border-[#0B5A40] bg-[#0B5A40]' : 'border-[#C7D1DB] bg-white'
    }`}>
      {active && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
    </span>
  );
}

function HeaderLeafIcon() {
  return (
    <svg width="88" height="62" viewBox="0 0 88 62" fill="none" aria-hidden="true">
      <path d="M38 57c3-17 11-29 26-39 8-5 15-7 18-7-1 11-5 24-14 32-8 7-18 11-30 10Z" fill="#83E97C" opacity=".95" />
      <path d="M31 51c2-10 0-20-7-28-5-5-10-8-15-9 0 10 2 19 8 26 4 5 9 8 14 11Z" fill="#30B875" opacity=".88" />
      <path d="M35 58c5-11 13-22 27-31" stroke="#C8F7BE" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function MiniLeafIcon() {
  return (
    <svg width="80" height="46" viewBox="0 0 80 46" fill="none" aria-hidden="true">
      <path d="M21 38c1-11 8-20 20-26 6-3 12-5 15-5-1 10-5 18-12 24-7 5-15 7-23 7Z" fill="currentColor" opacity=".28" />
      <path d="M16 34c0-8-3-14-9-19-3-2-5-3-7-3 0 7 2 13 6 17 3 3 7 4 10 5Z" fill="currentColor" opacity=".17" />
      <path d="M17 38c5-10 12-17 23-23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".65" />
    </svg>
  );
}

function StandardModeIcon({ active }: { active: boolean }) {
  const color = active ? '#0B5A40' : '#9AA9B8';
  return (
    <svg width="42" height="34" viewBox="0 0 42 34" fill="none" aria-hidden="true">
      <path d="M14 10V7.5C14 5.6 15.6 4 17.5 4h7C26.4 4 28 5.6 28 7.5V10" stroke={color} strokeWidth="2.7" strokeLinecap="round" />
      <rect x="8" y="10" width="26" height="19" rx="5" stroke={color} strokeWidth="2.7" />
      <path d="M8 16h26M21 16v4m0 0 2.5-2.7M21 20l-2.5-2.7" stroke={color} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExpressModeIcon({ active }: { active: boolean }) {
  const color = active ? '#0B5A40' : '#9AA9B8';
  return (
    <svg width="48" height="34" viewBox="0 0 48 34" fill="none" aria-hidden="true">
      <path d="M2 14h7M1 20h5M4 26h5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="10" y="6" width="20" height="20" rx="3.5" fill={active ? '#E2F5EA' : '#F7F9FA'} stroke={color} strokeWidth="2.7" />
      <path d="m21 9-4 8h4l-2 7 6-9h-4l3-6-3 0Z" fill={active ? '#FFC92E' : 'none'} stroke={active ? '#F6AD00' : color} strokeWidth={active ? 1.3 : 1.7} strokeLinejoin="round" />
      <path d="M30 13h6l6 5.5v7.5H30V13Z" stroke={color} strokeWidth="2.7" strokeLinejoin="round" />
      <path d="M31 14h4l3.2 3v2H31v-5Z" stroke={color} strokeWidth="2.1" strokeLinejoin="round" />
      <circle cx="16" cy="27.5" r="3.2" fill="white" stroke={color} strokeWidth="2.5" />
      <circle cx="37" cy="27.5" r="3.2" fill="white" stroke={color} strokeWidth="2.5" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3.5h8.5L19 8v12.5H6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3.5V8h5M9 12h7M9 15.5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17.5" cy="17.5" r="3" fill="#D8F4E5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m16.2 17.5 1 1 1.6-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 10V7h-3M6.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MapPinIcon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 10.2c0 5.4-8 11-8 11s-8-5.6-8-11a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function GiftIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="9" width="17" height="11.5" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M12 9v11.5M3.5 12h17M12 9H8.6A2.6 2.6 0 1 1 11.2 6.4L12 9Zm0 0h3.4A2.6 2.6 0 1 0 12.8 6.4L12 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#78A092]" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5.5V11l8 8 7-7-8-8H4.5A.5.5 0 0 0 4 4.5v1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 6.5V5a2 2 0 0 1 2-2h11.5a1.5 1.5 0 0 1 0 3.0H4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 13h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7.5" width="18" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 10v4M18 10v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="5" width="19" height="14" rx="2.8" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18M6 14.5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 20 6v5.5c0 4.8-3.1 8.3-8 9.9-4.9-1.6-8-5.1-8-9.9V6l8-3Z" fill="currentColor" opacity=".2" />
      <path d="M12 3 20 6v5.5c0 4.8-3.1 8.3-8 9.9-4.9-1.6-8-5.1-8-9.9V6l8-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path d="M17 4v8M17 22v8M4 17h8M22 17h8M7.8 7.8l5.6 5.6M20.6 20.6l5.6 5.6M26.2 7.8l-5.6 5.6M13.4 20.6l-5.6 5.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function SectionHeading({
  icon,
  title,
  subtitle,
  noBottomMargin = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  noBottomMargin?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${noBottomMargin ? '' : 'mb-4'}`}>
      <div className="h-12 w-12 shrink-0 rounded-full bg-[#DDF3E8] text-[#0B6A49] flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0 pt-0.5">
        <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#17263A]">{title}</h2>
        <p className="mt-1 text-[13px] font-medium text-[#728194]">{subtitle}</p>
      </div>
    </div>
  );
}

function BottomNavItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center gap-1.5 py-1 text-[#6B7C8C]"
    >
      <span className="flex h-7 items-center justify-center">{icon}</span>
      <span className="text-[11px] font-semibold tracking-[-0.01em]">{label}</span>
    </button>
  );
}

function ShopNavIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M6 10.5h16l-1 12H7l-1-12Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M9 10.5V8a5 5 0 0 1 10 0v2.5M10 15v2M18 15v2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function CategoriesNavIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2.2" />
      <rect x="16" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2.2" />
      <rect x="4" y="16" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2.2" />
      <rect x="16" y="16" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

function ListNavIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="m14 23-1.4-1.3C7 16.6 4 13.8 4 9.8 4 7 6.1 5 8.8 5c1.7 0 3.4.8 4.4 2.1C14.2 5.8 15.9 5 17.2 5 19.9 5 22 7 22 9.8c0 4-3 6.8-8.6 11.9L14 23Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

function OrdersNavIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M5 10h18l-1 13H6L5 10Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M9 10V7.5a5 5 0 0 1 10 0V10M10.5 15h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function AccountNavIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="10.5" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="14" cy="11" r="3.2" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 22c1.3-3.2 3.2-4.8 5.5-4.8s4.2 1.6 5.5 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
