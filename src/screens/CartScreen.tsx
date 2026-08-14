// screens/CartScreen.tsx
import { useEffect, useState, useCallback } from 'react';
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
}

export function CartScreen({ cart, onProduct, onShop, onCheckout }: CartScreenProps) {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<DbAddress | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [gstTotal, setGstTotal] = useState(0);
  const [gstBreakdown, setGstBreakdown] = useState<Record<number, number>>({});

  // Load default address
  useEffect(() => {
    async function loadDefaultAddress() {
      const addresses = await fetchAddresses();
      const def = addresses.find((a) => a.is_default) || addresses[0] || null;
      setDefaultAddress(def);
    }
    loadDefaultAddress();
  }, []);

  // Recompute delivery and GST when items, subtotal, promo, or address changes
  useEffect(() => {
    async function compute() {
      // GST
      const { gstTotal, gstBreakdown } = computeGST(cart.items);
      setGstTotal(gstTotal);
      setGstBreakdown(gstBreakdown);

      // Delivery – only if we have a postal code
      const subtotalAfterPromo = cart.subtotal - (cart.appliedPromo?.discount || 0);
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

  const handleRemovePromo = () => {
    cart.clearPromo();
  };

  // Derived values
  const subtotalAfterDiscount = cart.subtotal - (cart.appliedPromo?.discount || 0);
  const displayDelivery = deliveryCharge !== null ? deliveryCharge : null;
  const total = subtotalAfterDiscount + gstTotal + (displayDelivery ?? 0);

  if (cart.items.length === 0) {
    return (
      <div className="px-4 pb-6 min-h-[65vh] flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600">
          <ShoppingBag size={36} strokeWidth={1.5} />
        </div>
        <h1 className="text-lg font-extrabold text-ink-900 mt-5">Your cart is empty</h1>
        <p className="text-sm text-ink-500 mt-1 max-w-[250px]">
          Add products you need for your next business restock.
        </p>
        <button
          onClick={onShop}
          className="mt-5 h-11 px-5 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center gap-2 shadow-soft"
        >
          Start shopping <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">
          Your cart{' '}
          <span className="text-sm font-semibold text-ink-400">
            ({cart.totalItems} items)
          </span>
        </h1>
        <p className="text-xs text-ink-500 mt-1">Review your wholesale order</p>
      </div>

      {/* Delivery info bar */}
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

      {/* Cart items */}
      <div className="space-y-2.5">
        {cart.items.map((item) => (
          <CartItem
            key={item.product.id}
            item={item}
            onIncrement={() => cart.addToCart(item.product)}
            onDecrement={() => cart.updateQuantity(item.product.id, item.quantity - 1)}
            onRemove={() => cart.removeFromCart(item.product.id)}
            onClick={() => onProduct(item.product)}
          />
        ))}
      </div>

      {/* Promo Code */}
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
      </section>

      {/* Order Summary */}
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
            <span>MRP total</span>
            <span>₹{cart.totalMrp.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs text-brand-600">
            <span className="flex items-center gap-1">
              <Tag size={13} /> Discounts (wholesale + volume)
            </span>
            <span>- ₹{cart.discount.toLocaleString('en-IN')}</span>
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
              <div key={rate}>
                <div className="flex justify-between text-xs text-ink-500">
                  <span>CGST @{(Number(rate) / 2).toFixed(1)}%</span>
                  <span>₹{half.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-ink-500">
                  <span>SGST @{(Number(rate) / 2).toFixed(1)}%</span>
                  <span>₹{half.toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between text-xs text-ink-500">
            <span>Delivery</span>
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
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Checkout button – always enabled */}
        <button
          onClick={onCheckout}
          className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft tap-highlight active:scale-[.98] transition-transform"
        >
          Proceed to Checkout <ArrowRight size={17} />
        </button>

        {/* Non-blocking hint if no address */}
        {!defaultAddress && (
          <p className="text-center text-[10px] text-amber-600">
            You can add a delivery address in the next step.
          </p>
        )}

        <p className="text-center text-[10px] text-ink-400 flex items-center justify-center gap-1">
          <CheckCircle2 size={12} className="text-brand-500" /> Secure checkout · No hidden charges
        </p>
      </section>

      {/* Continue shopping */}
      <button
        onClick={onShop}
        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-brand-600"
      >
        <ArrowLeft size={14} /> Continue shopping
      </button>
    </div>
  );
}