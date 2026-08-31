import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  Tag,
  Truck,
  Gift,
  Loader2,
  MapPin,
  X,
} from 'lucide-react';
import type { Product } from '@/types';
import type { useCart } from '@/store';
import { CartItem } from '@/components/CartItem';
import {
  fetchAddresses,
  getDeliveryCharge,
  computeGST,
} from '@/services/catalog';
import type { DbAddress } from '@/services/catalog';

interface CartScreenProps {
  cart: ReturnType<typeof useCart>;
  onProduct: (product: Product) => void;
  onShop: () => void;
  onCheckout: () => void;
  onBack?: () => void;
}

export function CartScreen({ cart, onProduct, onShop, onCheckout, onBack }: CartScreenProps) {
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<DbAddress | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [gstTotal, setGstTotal] = useState(0);
  const [gstBreakdown, setGstBreakdown] = useState<Record<number, number>>({});
  // State for promo revalidation feedback
  const [promoRevalidateError, setPromoRevalidateError] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Helper to revalidate promo after a cart mutation and show error if removed
  const revalidatePromoAfterAction = useCallback(async () => {
    const prevPromo = cart.appliedPromo;
    await cart.revalidatePromo();
    if (prevPromo && !cart.appliedPromo) {
      setPromoRevalidateError('Promo code no longer applies to your cart');
    } else {
      setPromoRevalidateError(null);
    }
  }, [cart]);

  // Wrapped cart actions with revalidation
  const handleIncrement = useCallback(async (product: Product) => {
    await cart.addToCart(product);
    await revalidatePromoAfterAction();
  }, [cart, revalidatePromoAfterAction]);

  const handleDecrement = useCallback(async (productId: string, currentQuantity: number) => {
    if (currentQuantity <= 1) {
      await cart.removeFromCart(productId);
    } else {
      await cart.updateQuantity(productId, currentQuantity - 1);
    }
    await revalidatePromoAfterAction();
  }, [cart, revalidatePromoAfterAction]);

  const handleRemove = useCallback(async (productId: string) => {
    await cart.removeFromCart(productId);
    await revalidatePromoAfterAction();
  }, [cart, revalidatePromoAfterAction]);

  // Promo apply
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplyingPromo(true);
    setPromoError(null);
    setPromoRevalidateError(null);
    const result = await cart.applyPromo(promoInput.trim());
    if (result.success) {
      setPromoInput('');
    } else {
      setPromoError(result.error || 'Invalid promo code');
    }
    setApplyingPromo(false);
  };

  // Manual promo removal
  const handleRemovePromo = () => {
    cart.clearPromo();
    setPromoRevalidateError(null);
    setPromoError(null);
  };

  useEffect(() => {
    async function loadDefaultAddress() {
      const addresses = await fetchAddresses();
      const def = addresses.find((a) => a.is_default) || addresses[0] || null;
      setDefaultAddress(def);
    }
    loadDefaultAddress();
  }, []);

  // Recompute delivery and GST with pro‑rata promo discount
  useEffect(() => {
    async function compute() {
      const promoDiscount = cart.appliedPromo?.discount || 0;
      
      const { gstTotal: computedGst, gstBreakdown: computedBreakdown } = computeGST(cart.items, promoDiscount);
      setGstTotal(computedGst);
      setGstBreakdown(computedBreakdown);

      const subtotalAfterPromo = Math.max(0, cart.subtotal - promoDiscount);
      if (defaultAddress?.postal_code) {
        setDeliveryLoading(true);
        const { charge } = await getDeliveryCharge(defaultAddress.postal_code, subtotalAfterPromo);
        setDeliveryCharge(charge);
        setDeliveryLoading(false);
      } else {
        setDeliveryCharge(null);
      }
    }
    compute();
  }, [cart.items, cart.subtotal, cart.appliedPromo, defaultAddress]);

  const subtotalAfterDiscount = Math.max(0, cart.subtotal - (cart.appliedPromo?.discount || 0));
  const displayDelivery = deliveryCharge !== null ? deliveryCharge : 0;
  const total = subtotalAfterDiscount + gstTotal + displayDelivery;

  if (cart.items.length === 0) {
    return (
      <div className="safe-top px-4 pb-6 min-h-[75vh] flex flex-col justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleBack}
            className="h-9 w-9 rounded-xl bg-white border border-ink-100 flex items-center justify-center text-ink-700 shadow-soft active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center text-center my-auto">
          <div className="h-20 w-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600">
            <ShoppingBag size={36} strokeWidth={1.5} />
          </div>
          <h1 className="text-lg font-extrabold text-ink-900 mt-5">Your cart is empty</h1>
          <p className="text-sm text-ink-500 mt-1 max-w-[250px]">
            Add products you need for your next business restock.
          </p>
          <button
            onClick={onShop}
            className="mt-5 h-11 px-5 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center gap-2 shadow-soft active:scale-95 transition-transform"
          >
            Start shopping <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-top px-4 pb-8 space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="h-9 w-9 rounded-xl bg-white border border-ink-100 flex items-center justify-center text-ink-700 shadow-soft active:scale-95 shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight flex items-center gap-1.5">
            Your cart{' '}
            <span className="text-sm font-semibold text-ink-400">
              ({cart.totalItems} items)
            </span>
          </h1>
          <p className="text-xs text-ink-500">Review your wholesale order</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-100 p-3">
        <Truck size={17} className="text-brand-600 shrink-0" />
        <div className="flex-1">
          {defaultAddress ? (
            <p className="text-xs text-brand-800">
              <span className="font-bold">Deliver to:</span> {defaultAddress.line1},{' '}
              {defaultAddress.city} – {defaultAddress.postal_code}
              {deliveryLoading ? (
                <Loader2 size={12} className="inline animate-spin ml-1" />
              ) : deliveryCharge !== null ? (
                deliveryCharge === 0 ? (
                  <span className="ml-2 font-bold text-brand-600">FREE delivery</span>
                ) : (
                  <span className="ml-2">Delivery: ₹{deliveryCharge}</span>
                )
              ) : (
                <span className="ml-2 text-amber-600">Calculating…</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <MapPin size={14} /> Add a delivery address in checkout
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {cart.items.map((item) => (
          <CartItem
            key={item.product.id}
            item={item}
            onIncrement={() => handleIncrement(item.product)}
            onDecrement={() => handleDecrement(item.product.id, item.quantity)}
            onRemove={() => handleRemove(item.product.id)}
            onClick={() => onProduct(item.product)}
          />
        ))}
      </div>

      <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
        <h2 className="text-sm font-bold text-ink-900 mb-2">Promo Code</h2>
        {cart.appliedPromo ? (
          <div className="flex items-center justify-between rounded-xl bg-brand-50 border border-brand-200 p-3">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-brand-600" />
              <span className="text-sm font-bold text-brand-700">
                {cart.appliedPromo.code}
              </span>
              <span className="text-xs text-brand-600">
                – ₹{cart.appliedPromo.discount}
              </span>
            </div>
            <button
              onClick={handleRemovePromo}
              className="h-8 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold flex items-center gap-1"
            >
              <X size={14} /> Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="Enter code"
              className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
            <button
              onClick={handleApplyPromo}
              disabled={applyingPromo || !promoInput.trim()}
              className="h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center gap-1 disabled:opacity-60"
            >
              {applyingPromo ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Gift size={16} />
              )}{' '}
              Apply
            </button>
          </div>
        )}
        {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
        {promoRevalidateError && <p className="text-xs text-red-500 mt-1">{promoRevalidateError}</p>}
      </section>

      <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-ink-900">Order summary</h2>
        <div className="space-y-1.5">
          {cart.items.map((item) => {
            const effectivePrice = item.effectiveUnitPrice || item.product.price;
            return (
              <div key={item.product.id} className="flex justify-between text-xs">
                <span className="text-ink-600 truncate flex-1">
                  {item.product.brand} {item.product.name} × {item.quantity}
                  {effectivePrice < item.product.price && (
                    <span className="ml-1 text-brand-600 text-[9px]">(volume)</span>
                  )}
                </span>
                <span className="font-semibold text-ink-800 ml-2">
                  ₹{(effectivePrice * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-dashed border-ink-200 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-ink-500">
            <span>Subtotal</span>
            <span>₹{cart.subtotal.toLocaleString('en-IN')}</span>
          </div>
          {cart.appliedPromo && (
            <div className="flex justify-between text-xs text-brand-600">
              <span className="flex items-center gap-1">
                <Tag size={13} /> Promo discount ({cart.appliedPromo.code})
              </span>
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
            <span className="font-semibold">
              {deliveryLoading ? (
                <Loader2 size={14} className="animate-spin inline" />
              ) : deliveryCharge !== null ? (
                deliveryCharge === 0 ? (
                  <span className="text-brand-600">FREE</span>
                ) : (
                  <span>₹{deliveryCharge}</span>
                )
              ) : (
                <span className="text-ink-400">—</span>
              )}
            </span>
          </div>
          <div className="border-t border-dashed border-ink-200 pt-2 flex justify-between">
            <span className="text-sm font-bold text-ink-800">Total payable</span>
            <span className="text-xl font-extrabold text-brand-700">
              ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft tap-highlight active:scale-[.98] transition-transform"
        >
          Proceed to Checkout <ArrowRight size={17} />
        </button>

        {!defaultAddress && (
          <p className="text-center text-[10px] text-amber-600">
            You can add a delivery address in the next step.
          </p>
        )}

        <p className="text-center text-[10px] text-ink-400 flex items-center justify-center gap-1">
          <CheckCircle2 size={12} className="text-brand-500" /> Secure checkout · No hidden charges
        </p>
      </section>

      <button
        onClick={handleBack}
        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-brand-600 active:opacity-75"
      >
        <ArrowLeft size={14} /> Continue shopping
      </button>
    </div>
  );
}