// screens/CartScreen.tsx
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ShoppingBag, Tag, Truck, Gift, Loader2 } from 'lucide-react';
import type { Product } from '@/types';
import type { useCart } from '@/store';
import { CartItem } from '@/components/CartItem';

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

  if (cart.items.length === 0)
    return (
      <div className="px-4 pb-6 min-h-[65vh] flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600">
          <ShoppingBag size={36} strokeWidth={1.5} />
        </div>
        <h1 className="text-lg font-extrabold text-ink-900 mt-5">Your cart is empty</h1>
        <p className="text-sm text-ink-500 mt-1 max-w-[250px]">Add products you need for your next business restock.</p>
        <button onClick={onShop} className="mt-5 h-11 px-5 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center gap-2 shadow-soft">
          Start shopping <ArrowRight size={16} />
        </button>
      </div>
    );

  return (
    <div className="px-4 pb-6 space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">
          Your cart <span className="text-sm font-semibold text-ink-400">({cart.totalItems} items)</span>
        </h1>
        <p className="text-xs text-ink-500 mt-1">Review your wholesale order</p>
      </div>

      {/* Delivery notice */}
      <div className="flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-100 p-3">
        <Truck size={17} className="text-brand-600 shrink-0" />
        <p className="text-xs text-brand-800">
          <span className="font-bold">Free delivery</span> on orders above ₹2,000
        </p>
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
            <button
              onClick={() => { cart.clearPromo(); }}
              className="h-10 px-3 rounded-xl bg-ink-100 text-ink-600 text-sm font-bold"
            >
              Remove
            </button>
          )}
        </div>
        {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
        {cart.appliedPromo && (
          <p className="text-xs text-brand-600 mt-1">
            Promo applied: {cart.appliedPromo.code} (₹{cart.appliedPromo.discount} off)
          </p>
        )}
      </section>

      {/* Order summary */}
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
                    <span className="ml-1 text-brand-600 text-[9px]">(volume discount)</span>
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
              <Tag size={13} /> Wholesale & volume discount
            </span>
            <span>- ₹{cart.discount.toLocaleString('en-IN')}</span>
          </div>
          {cart.appliedPromo && (
            <div className="flex justify-between text-xs text-brand-600">
              <span>Promo discount</span>
              <span>- ₹{cart.appliedPromo.discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-ink-500">
            <span>Delivery charges</span>
            <span className="font-semibold text-brand-600">
              {cart.subtotal >= 2000 ? 'FREE' : '₹80'}
            </span>
          </div>
          <div className="border-t border-dashed border-ink-200 pt-2 flex justify-between">
            <span className="text-sm font-bold text-ink-800">Total payable</span>
            <span className="text-xl font-extrabold text-brand-700">
              ₹{(
                (cart.subtotal - (cart.appliedPromo?.discount || 0)) +
                (cart.subtotal >= 2000 ? 0 : 80)
              ).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        <button
          onClick={onCheckout}
          className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft tap-highlight active:scale-[.98] transition-transform"
        >
          Proceed to Checkout <ArrowRight size={17} />
        </button>
        <p className="text-center text-[10px] text-ink-400 flex items-center justify-center gap-1">
          <CheckCircle2 size={12} className="text-brand-500" /> Secure checkout · No hidden charges
        </p>
      </section>

      <button
        onClick={onShop}
        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-brand-600"
      >
        <ArrowLeft size={14} /> Continue shopping
      </button>
    </div>
  );
}