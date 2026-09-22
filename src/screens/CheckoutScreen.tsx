import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, MapPin, Tag, Truck, Loader2, CheckCircle2, CreditCard, Banknote, AlertCircle, X, Gift, Wallet } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Checkout } from 'capacitor-razorpay';
import logoImg from './logo.png';
import type { useCart } from '@/store';
import type { DbAddress } from '@/services/catalog';
import { fetchAddresses, getDeliveryCharge, computeGST } from '@/services/catalog';
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
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWallet, setUseWallet] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [paymentAlertMsg, setPaymentAlertMsg] = useState('');
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
    const [addrData, userWallet] = await Promise.all([fetchAddresses(), fetchWallet()]);
    setAddresses(addrData);
    if (addrData.length > 0) {
      const def = addrData.find((a) => a.is_default);
      setSelectedAddr(def?.id ?? addrData[0].id);
    }
    if (userWallet) {
      setWalletBalance(userWallet.balance);
      if (userWallet.balance <= 0) setUseWallet(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isNative && typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        try {
          document.body.removeChild(script);
        } catch (_) {}
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
      const { charge, zoneId } = await getDeliveryCharge(addr.postal_code, subtotalAfterPromo);
      setDeliveryCharge(charge);
      setDeliveryZoneId(zoneId || null);
    }
    void recalc();
  }, [selectedAddr, addresses, effectiveSubtotal, cart.items, cart.appliedPromo]);

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

  const verifyAndCompleteOrder = async (
    orderId: string,
    paymentId: string,
    signature: string | null
  ) => {
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
        setPaymentAlertMsg('Payment could not be verified. Your order is on hold.');
        setShowPaymentAlert(true);
        setPlacing(false);
        sessionStorage.removeItem('active_checkout');
        sessionStorage.removeItem('checkout_order_id');
        isSubmittingRef.current = false;
        return;
      }

      sessionStorage.removeItem('active_checkout');
      sessionStorage.removeItem('checkout_order_id');
      cart.clearCart();
      cart.clearPromo();
      onOrderPlaced(orderId);
    } catch {
      setPaymentAlertMsg('Payment verification failed.');
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
      });

      if (orderError || !orderId) {
        throw new Error(orderError?.message || 'Database order creation failed');
      }

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
          await supabase.functions.invoke('razorpay', {
            body: { action: 'cancel_order', order_id: orderId },
          });
          setPaymentAlertMsg('Payment setup failed. Your order was cancelled.');
          setShowPaymentAlert(true);
          setPlacing(false);
          sessionStorage.removeItem('active_checkout');
          sessionStorage.removeItem('checkout_order_id');
          isSubmittingRef.current = false;
          return;
        }

        const currentAddr = addresses.find((a) => a.id === selectedAddr);
        startKeepAlive(orderId);

        const options = {
          key: payData.key_id,
          amount: Math.round(remainingPayable * 100),
          currency: 'INR',
          order_id: payData.razorpay_order_id,
          name: 'Stackknit',
          description: `Remaining Order Payment: ₹${remainingPayable}`,
          image: logoImg,
          prefill: {
            contact: currentAddr?.phone || '',
            name: currentAddr?.recipient_name || '',
          },
          modal: {
            animation: false,
            backdropclose: false,
          },
          send_sms_hash: false,
          retry: {
            enabled: false,
          },
          theme: { color: '#16a34a' },
        };

        if (isNative) {
          try {
            const data = await Checkout.open(options);
            let resObj: any = data;
            
            if (data && typeof (data as any).response === 'string') {
              try {
                resObj = JSON.parse((data as any).response);
              } catch (_) {
                resObj = (data as any).response;
              }
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
            await supabase.functions.invoke('razorpay', {
              body: { action: 'cancel_order', order_id: orderId },
            });

            let errorDescription = 'Payment was cancelled.';
            if (err?.code) {
              try {
                const parsed = typeof err.code === 'string' ? JSON.parse(err.code) : err.code;
                errorDescription = parsed.description || errorDescription;
              } catch (_) {
                errorDescription = err.description || err.message || errorDescription;
              }
            } else if (err?.description || err?.message) {
              errorDescription = err.description || err.message;
            }

            setPaymentAlertMsg(errorDescription);
            setShowPaymentAlert(true);
            setPlacing(false);
            sessionStorage.removeItem('active_checkout');
            sessionStorage.removeItem('checkout_order_id');
            isSubmittingRef.current = false;
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
                  void supabase.functions.invoke('razorpay', {
                    body: { action: 'cancel_order', order_id: orderId },
                  });
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
          await supabase.functions.invoke('razorpay', {
            body: { action: 'cancel_order', order_id: orderId },
          });
          throw new Error('Could not record payment method');
        }
        sessionStorage.removeItem('active_checkout');
        sessionStorage.removeItem('checkout_order_id');
        cart.clearCart();
        cart.clearPromo();
        onOrderPlaced(orderId);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not place order. Please try again.');
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
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="safe-top px-4 pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Checkout</h1>
          <p className="text-xs text-ink-500 mt-0.5">Review and place your order</p>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-bold text-ink-900 mb-2">Delivery address</h2>
        {addresses.length === 0 ? (
          <button onClick={onAddAddress} className="w-full h-14 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-700 text-sm font-bold flex items-center justify-center gap-2">
            <MapPin size={16} /> Add a delivery address
          </button>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => setSelectedAddr(addr.id)}
                className={`w-full text-left p-3.5 rounded-2xl border-2 transition-colors ${
                  selectedAddr === addr.id ? 'border-brand-500 bg-brand-50' : 'border-ink-100 bg-white'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    selectedAddr === addr.id ? 'border-brand-600 bg-brand-600' : 'border-ink-300'
                  }`}>
                    {selectedAddr === addr.id && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink-800">{addr.label}</p>
                      {addr.is_default && <span className="text-[9px] font-bold bg-brand-100 text-brand-700 rounded-full px-2 py-0.5">DEFAULT</span>}
                    </div>
                    <p className="text-xs text-ink-600 mt-1 leading-relaxed">{addr.line1}, {addr.city}, {addr.state} - {addr.postal_code}</p>
                    <p className="text-[11px] text-ink-400 mt-1">{addr.recipient_name} · {addr.phone}</p>
                  </div>
                </div>
              </button>
            ))}
            <button onClick={onAddAddress} className="w-full h-10 rounded-xl border border-ink-200 text-ink-600 text-xs font-bold flex items-center justify-center gap-1">
              + Add another address
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold text-ink-900 mb-2">Promo Code</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="Enter code"
            className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            disabled={!!cart.appliedPromo}
          />
          <button
            onClick={handleApplyPromo}
            disabled={applyingPromo || !promoInput.trim() || !!cart.appliedPromo}
            className="h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center gap-1 disabled:opacity-60"
          >
            {applyingPromo ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />} Apply
          </button>
          {cart.appliedPromo && (
            <button onClick={() => { cart.clearPromo(); }} className="h-10 px-3 rounded-xl bg-ink-100 text-ink-600 text-sm font-bold">
              Remove
            </button>
          )}
        </div>
        {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
      </section>

      <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-900">CafKart B2B Wallet</p>
              <p className="text-xs text-ink-500">Balance: <span className="font-bold text-brand-700">₹{walletBalance.toLocaleString('en-IN')}</span></p>
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
            <div className="w-11 h-6 bg-ink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        {useWallet && walletBalance > 0 && (
          <div className="pt-2 border-t border-dashed border-ink-200 text-xs flex justify-between items-center text-ink-600">
            <span>Deduction from Wallet:</span>
            <span className="font-bold text-emerald-600">- ₹{walletDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
      </section>

      {!isFullWalletPayment && (
        <section>
          <h2 className="text-sm font-bold text-ink-900 mb-2">
            {walletDeduction > 0 ? `Pay Remaining (₹${remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}) via:` : 'Payment Method'}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPaymentMethod('cod')} className={`p-3.5 rounded-2xl border-2 text-left transition-colors ${
              paymentMethod === 'cod' ? 'border-brand-500 bg-brand-50' : 'border-ink-100 bg-white'
            }`}>
              <Banknote size={20} className={paymentMethod === 'cod' ? 'text-brand-600' : 'text-ink-400'} />
              <p className="text-sm font-bold text-ink-800 mt-2">Cash on delivery</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Pay remaining on arrival</p>
            </button>
            <button onClick={() => setPaymentMethod('razorpay')} className={`p-3.5 rounded-2xl border-2 text-left transition-colors ${
              paymentMethod === 'razorpay' ? 'border-brand-500 bg-brand-50' : 'border-ink-100 bg-white'
            }`}>
              <CreditCard size={20} className={paymentMethod === 'razorpay' ? 'text-brand-600' : 'text-ink-400'} />
              <p className="text-sm font-bold text-ink-800 mt-2">Online payment</p>
              <p className="text-[10px] text-ink-400 mt-0.5">Razorpay secure</p>
            </button>
          </div>
        </section>
      )}

      <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-ink-900">Order summary</h2>
        <div className="space-y-1.5">
          {cart.items.map((item) => (
            <div key={item.product.id} className="flex justify-between text-xs">
              <span className="text-ink-600 truncate flex-1">
                {item.product.brand} {item.product.name} × {item.quantity}
              </span>
              <span className="font-semibold text-ink-800 ml-2">
                ₹{((Number(item.effectiveUnitPrice) || Number(item.product.price)) * item.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-ink-200 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-ink-500">
            <span>Subtotal</span>
            <span>₹{effectiveSubtotal.toLocaleString('en-IN')}</span>
          </div>
          {cart.appliedPromo && (
            <div className="flex justify-between text-xs text-brand-600">
              <span>Promo discount</span>
              <span>- ₹{cart.appliedPromo.discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          {Object.entries(gstBreakdown).map(([rate, amount]) => {
            const half = amount / 2;
            return (
              <div key={rate} className="space-y-1">
                <div className="flex justify-between text-xs text-ink-500">
                  <span>CGST @{(Number(rate) / 2).toFixed(1)}%</span>
                  <span>₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-ink-500">
                  <span>SGST @{(Number(rate) / 2).toFixed(1)}%</span>
                  <span>₹{half.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between text-xs text-ink-500">
            <span>Delivery fee</span>
            <span className="font-semibold text-brand-600">
              {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
            </span>
          </div>

          <div className="flex justify-between text-xs text-ink-800 font-bold pt-1">
            <span>Total Bill</span>
            <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {walletDeduction > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-semibold">
              <span>Paid via Wallet</span>
              <span>- ₹{walletDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="border-t border-dashed border-ink-200 pt-2 flex justify-between">
            <span className="text-sm font-bold text-ink-800">Remaining Payable</span>
            <span className="text-xl font-extrabold text-brand-700">
              ₹{remainingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </section>

      {error && <p className="text-xs text-red-500 text-center font-medium">{error}</p>}

      <button
        onClick={handlePlaceOrder}
        disabled={placing || !selectedAddr || cart.items.length === 0}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft disabled:opacity-60"
      >
        {placing ? (
          <><Loader2 size={17} className="animate-spin" /> Processing order...</>
        ) : isFullWalletPayment ? (
          <>Pay with Wallet · ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
        ) : walletDeduction > 0 ? (
          <>Pay ₹{walletDeduction.toLocaleString('en-IN')} (Wallet) + ₹{remainingPayable.toLocaleString('en-IN')} ({paymentMethod.toUpperCase()})</>
        ) : (
          <>Place order · ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
        )}
      </button>

      {showPaymentAlert && (
        <div className="fixed inset-0 z-[300] bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setShowPaymentAlert(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                <AlertCircle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-ink-900">Payment Alert</h3>
                <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">{paymentAlertMsg}</p>
              </div>
              <button onClick={() => setShowPaymentAlert(false)} className="text-ink-400 shrink-0">
                <X size={18} />
              </button>
            </div>
            <button onClick={() => setShowPaymentAlert(false)} className="w-full h-10 rounded-xl bg-ink-900 text-white text-sm font-bold">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
