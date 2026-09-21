import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, ShoppingBag, Tag, Truck, Gift,
  Loader2, MapPin, X, ChevronRight, ChevronDown, Home, Briefcase, Warehouse,
  MapPinned, Sparkles, Clock, ShieldCheck, Package, AlertCircle, PlusCircle,
  Check,
} from 'lucide-react';
import type { Product, PromoCode } from '@/types';
import type { useCart } from '@/store';
import { CartItem } from '@/components/CartItem';
import { fetchAddresses, getDeliveryCharge, computeGST } from '@/services/catalog';
import type { DbAddress } from '@/services/catalog';
import { supabase } from '@/lib/supabase';

interface CartScreenProps {
  cart: ReturnType<typeof useCart>;
  onProduct: (product: Product) => void;
  onShop: () => void;
  onCheckout: () => void;
  onBack?: () => void;
}

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

export function CartScreen({ cart, onProduct, onShop, onCheckout, onBack }: CartScreenProps) {
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<DbAddress[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const [showAddressSheet, setShowAddressSheet] = useState(false);

  const [deliveryCharge, setDeliveryCharge] = useState<number | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [gstTotal, setGstTotal] = useState(0);
  const [gstBreakdown, setGstBreakdown] = useState<Record<number, number>>({});
  const [promoRevalidateError, setPromoRevalidateError] = useState<string | null>(null);
  const [showPromoSheet, setShowPromoSheet] = useState(false);
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([]);

  const prevPromoRef = useRef(cart.appliedPromo);

  // Background Sync
  useEffect(() => {
    let active = true;
    void cart.refreshCart();

    const handleVisibilityChange = () => {
      const isCurrentlyActive = window.location.pathname.includes('/cart');
      if (document.visibilityState === 'visible' && active && isCurrentlyActive) {
        void cart.refreshCart();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor promo invalidation
  useEffect(() => {
    if (prevPromoRef.current && !cart.appliedPromo && cart.items.length > 0) {
      setPromoRevalidateError(`Promo code "${prevPromoRef.current.code}" no longer applies to your cart.`);
    } else if (cart.appliedPromo) {
      setPromoRevalidateError(null);
    }
    prevPromoRef.current = cart.appliedPromo;
  }, [cart.appliedPromo, cart.items.length]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleIncrement = useCallback(async (product: Product) => {
    await cart.addToCart(product);
  }, [cart]);

  const handleDecrement = useCallback(async (productId: string, currentQuantity: number) => {
    if (currentQuantity <= 1) await cart.removeFromCart(productId);
    else await cart.updateQuantity(productId, currentQuantity - 1);
  }, [cart]);

  const handleRemove = useCallback(async (productId: string) => {
    await cart.removeFromCart(productId);
  }, [cart]);

  const handleApplyPromo = async (codeOverride?: string) => {
    const code = (codeOverride ?? promoInput).trim().toUpperCase();
    if (!code) return;
    setApplyingPromo(true);
    setPromoError(null);
    setPromoRevalidateError(null);
    const result = await cart.applyPromo(code);
    if (result.success) {
      setPromoInput('');
      setShowPromoSheet(false);
    } else {
      setPromoError(result.error || 'Invalid promo code');
    }
    setApplyingPromo(false);
  };

  const handleRemovePromo = () => {
    cart.clearPromo();
    setPromoRevalidateError(null);
    setPromoError(null);
  };

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

  // Initial load
  useEffect(() => {
    void refreshAddresses();
  }, [refreshAddresses]);

  // Sync on navigation return or tab focus
  useEffect(() => {
    const handleKeepAlive = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (customEvent.detail?.key === '/cart' || !customEvent.detail?.key) {
        void refreshAddresses();
      }
    };
    
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && window.location.pathname.includes('/cart')) {
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

  const selectedAddress = addresses.find((a) => a.id === selectedAddr) || null;

  // Load available promos
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
    async function compute() {
      const promoDiscount = cart.appliedPromo?.discount || 0;
      const { gstTotal: computedGst, gstBreakdown: computedBreakdown } = computeGST(cart.items, promoDiscount);
      setGstTotal(computedGst);
      setGstBreakdown(computedBreakdown);

      const subtotalAfterPromo = Math.max(0, cart.subtotal - promoDiscount);
      if (selectedAddress?.postal_code) {
        setDeliveryLoading(true);
        const { charge } = await getDeliveryCharge(selectedAddress.postal_code, subtotalAfterPromo);
        setDeliveryCharge(charge);
        setDeliveryLoading(false);
      } else {
        setDeliveryCharge(null);
      }
    }
    compute();
  }, [cart.items, cart.subtotal, cart.appliedPromo, selectedAddress]);

  const subtotalAfterDiscount = Math.max(0, cart.subtotal - (cart.appliedPromo?.discount || 0));
  const displayDelivery = deliveryCharge !== null ? deliveryCharge : 0;
  const total = subtotalAfterDiscount + gstTotal + displayDelivery;

  // ---------- EMPTY STATE ----------
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] flex flex-col">
        <header className="px-3 pt-3">
          <div className="rounded-2xl bg-[#02402c] p-1.5 flex items-center gap-1.5 shadow-[0_10px_28px_-12px_rgba(2,64,44,0.55)]">
            <button
              type="button"
              onClick={handleBack}
              className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center shrink-0 transition-all"
              aria-label="Back"
            >
              <ArrowLeft size={17} className="text-white" strokeWidth={2.4} />
            </button>
            <div className="flex-1 min-w-0 px-2">
              <p className="text-[12.5px] font-black text-white tracking-[-0.01em]">Your Cart</p>
              <p className="text-[10.5px] text-emerald-100/70 font-semibold mt-0.5">0 items</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#02402c]/10 to-[#02402c]/[0.02] border border-[#02402c]/10 flex items-center justify-center">
            <ShoppingBag size={32} className="text-[#02402c]" strokeWidth={1.8} />
          </div>
          <h1 className="text-[17px] font-black text-slate-900 mt-5 tracking-[-0.01em]">Your cart is empty</h1>
          <p className="text-[12.5px] text-slate-500 mt-1.5 max-w-[260px] font-medium leading-relaxed">
            Add products you need for your next business restock.
          </p>
          <button
            onClick={onShop}
            className="mt-6 h-12 px-6 rounded-2xl bg-[#02402c] text-white text-[13.5px] font-black flex items-center gap-2 shadow-lg shadow-[#02402c]/25 active:scale-95 transition-transform"
          >
            Start shopping <ArrowRight size={16} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    );
  }

  const moqErrors = cart.items.filter((item) => item.quantity < item.product.moq);
  const hasMoqErrors = moqErrors.length > 0;
  const outOfStockErrors = cart.items.filter((item) => !item.product.inStock);
  const hasOutOfStockErrors = outOfStockErrors.length > 0;
  const hasCheckoutErrors = hasMoqErrors || hasOutOfStockErrors;

  const AddressIcon = selectedAddress ? getAddressIcon(selectedAddress.label) : MapPin;

  return (
    <div className="min-h-screen bg-[#f6f7f9] pb-32 scroll-smooth">
      {/* ==================== STICKY HEADER ==================== */}
      <header className="sticky top-0 z-40 px-3 pt-3 pb-2 bg-gradient-to-b from-[#f6f7f9] via-[#f6f7f9] to-[#f6f7f9]/0">
        <div className="rounded-2xl bg-[#02402c] p-1.5 flex items-center gap-1.5 shadow-[0_10px_28px_-12px_rgba(2,64,44,0.55)]">
          <button
            type="button"
            onClick={handleBack}
            className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center shrink-0 transition-all"
            aria-label="Back"
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
              {selectedAddress ? (
                <>
                  <p className="text-[12.5px] font-black text-white tracking-[-0.01em] truncate flex items-center gap-1.5">
                    <span className="truncate">{selectedAddress.label}</span>
                    {selectedAddress.is_default && (
                      <span className="shrink-0 text-[8.5px] font-black bg-emerald-400/25 text-emerald-100 rounded px-1.5 py-[1px] tracking-wider">
                        DEFAULT
                      </span>
                    )}
                  </p>
                  <p className="text-[10.5px] text-emerald-100/70 font-semibold truncate mt-0.5">
                    {selectedAddress.line1}, {selectedAddress.city} – {selectedAddress.postal_code}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[12.5px] font-black text-white tracking-[-0.01em]">Add delivery address</p>
                  <p className="text-[10.5px] text-emerald-100/70 font-semibold mt-0.5">Tap to select or add</p>
                </>
              )}
            </div>
            <ChevronDown size={14} className="text-emerald-200/70 shrink-0" strokeWidth={2.6} />
          </button>
        </div>
      </header>

      {/* ==================== CONTENT ==================== */}
      <div className="px-4 pt-3 space-y-3.5">
        {/* CART ITEMS */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] overflow-hidden">
          <SectionHeader
            icon={Package}
            title="Your Items"
            subtitle={`${cart.totalItems} item${cart.totalItems > 1 ? 's' : ''} in cart`}
          />
          <div className="px-4 pb-2">
            <div className="divide-y divide-slate-100">
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
          </div>
        </section>

        {/* OFFERS STRIP */}
        <section
          onClick={() => setShowPromoSheet(true)}
          className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] p-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-all"
        >
          <div className="h-10 w-10 rounded-xl bg-[#02402c] flex items-center justify-center shrink-0 shadow-md shadow-[#02402c]/25">
            <Tag size={17} className="text-white" strokeWidth={2.5} />
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
                  {availablePromos.length > 0
                    ? `${availablePromos.length} offer${availablePromos.length > 1 ? 's' : ''} available`
                    : 'Have a promo code?'}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  {availablePromos.length > 0 ? 'Tap to view & apply best offers' : 'Tap to enter a code'}
                </p>
              </>
            )}
          </div>
          {cart.appliedPromo ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleRemovePromo(); }}
              className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center active:scale-95 shrink-0"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          ) : (
            <ChevronRight size={17} className="text-slate-300 shrink-0" strokeWidth={2.4} />
          )}
        </section>

        {/* Promo revalidation warning */}
        {promoRevalidateError && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 flex gap-2 items-start">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-[11.5px] font-semibold text-red-600">{promoRevalidateError}</p>
          </div>
        )}

        {/* ORDER SUMMARY */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.15)] overflow-hidden">
          <SectionHeader
            icon={CheckCircle2}
            title="Order Summary"
            subtitle="Bill breakdown"
          />

          <div className="px-4 pb-4 space-y-3">
            <div className="space-y-2">
              {cart.items.map((item) => {
                const effectivePrice = item.effectiveUnitPrice || item.product.price;
                return (
                  <div key={item.product.id} className="flex justify-between gap-3 text-[12px]">
                    <span className="text-slate-600 truncate flex-1 font-medium">
                      {item.product.brand} {item.product.name} × {item.quantity}
                      {effectivePrice < item.product.price && (
                        <span className="ml-1 text-[#02402c] text-[9.5px] font-black">(volume)</span>
                      )}
                    </span>
                    <span className="font-bold text-slate-800 tabular-nums shrink-0">
                      ₹{(effectivePrice * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-dashed border-slate-200" />

            <div className="space-y-2">
              <div className="flex justify-between text-[12px] font-semibold text-slate-600">
                <span>Subtotal</span>
                <span className="text-slate-800 tabular-nums">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {cart.appliedPromo && (
                <div className="flex justify-between text-[12px] font-bold text-emerald-600">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={11} /> Promo discount ({cart.appliedPromo.code})
                  </span>
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
                  <Truck size={11} className="text-slate-500" /> Delivery fee
                </span>
                <span className="font-black tabular-nums">
                  {deliveryLoading ? (
                    <Loader2 size={13} className="animate-spin inline text-slate-500" />
                  ) : deliveryCharge !== null ? (
                    deliveryCharge === 0 ? (
                      <span className="text-emerald-600">FREE</span>
                    ) : (
                      <span className="text-slate-900">₹{deliveryCharge}</span>
                    )
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200" />

            <div className="flex justify-between items-end">
              <span className="text-[13.5px] font-black text-slate-900">Total Payable</span>
              <span className="text-[19px] font-black text-[#02402c] tracking-[-0.02em] tabular-nums">
                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </section>

        {/* MOQ / OUT OF STOCK ERRORS */}
        {hasMoqErrors && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500 shrink-0" strokeWidth={2.5} />
              <p className="text-[11.5px] font-black text-red-700 tracking-wide uppercase">Minimum order not met</p>
            </div>
            {moqErrors.map((item) => (
              <p key={item.product.id} className="text-[11.5px] font-semibold text-red-600 flex items-center gap-1.5 pl-6">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                {item.product.name} requires min {item.product.moq} qty
              </p>
            ))}
          </div>
        )}

        {hasOutOfStockErrors && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500 shrink-0" strokeWidth={2.5} />
              <p className="text-[11.5px] font-black text-red-700 tracking-wide uppercase">Out of stock</p>
            </div>
            {outOfStockErrors.map((item) => (
              <p key={item.product.id} className="text-[11.5px] font-semibold text-red-600 flex items-center gap-1.5 pl-6">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                {item.product.name} — please remove from cart
              </p>
            ))}
          </div>
        )}

        {/* TRUST */}
        <div className="flex items-center justify-center gap-3 py-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-[#02402c]" strokeWidth={2.6} />
            <span className="text-[10px] font-bold text-slate-500">Secure</span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-[#02402c]" strokeWidth={2.6} />
            <span className="text-[10px] font-bold text-slate-500">No hidden charges</span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Truck size={12} className="text-[#02402c]" strokeWidth={2.6} />
            <span className="text-[10px] font-bold text-slate-500">Fast Delivery</span>
          </div>
        </div>

        <button
          onClick={handleBack}
          className="w-full flex items-center justify-center gap-2 text-[12px] font-black text-[#02402c] py-2 active:opacity-70"
        >
          <ArrowLeft size={14} strokeWidth={2.6} /> Continue shopping
        </button>
      </div>

      {/* ==================== FIXED BOTTOM BAR ==================== */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="max-w-lg mx-auto">
          <div className="bg-white border-t border-slate-100 px-3 py-3 shadow-[0_-12px_36px_-12px_rgba(15,23,42,0.15)]">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-[52px] rounded-2xl bg-slate-50 border border-slate-200 px-3.5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Package size={15} className="text-[#02402c]" strokeWidth={2.4} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-slate-400 tracking-[0.12em] uppercase leading-none">Total</p>
                  <p className="text-[15px] font-black text-slate-900 tracking-[-0.01em] leading-tight mt-0.5 tabular-nums">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <button
                onClick={hasCheckoutErrors ? undefined : onCheckout}
                disabled={hasCheckoutErrors}
                className="group relative shrink-0 h-[52px] rounded-2xl bg-[#02402c] text-white text-[13px] font-black flex items-center justify-center gap-1.5 px-5 shadow-lg shadow-[#02402c]/30 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-[0.97] overflow-hidden"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <span>Proceed</span>
                <ArrowRight size={15} strokeWidth={2.8} />
              </button>
            </div>
            {!selectedAddress && (
              <p className="text-center text-[10.5px] text-amber-600 font-bold mt-2">
                Select a delivery address to get accurate delivery fee
              </p>
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
          {addresses.length === 0 && (
            <div className="py-6 text-center">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center">
                <MapPin size={22} className="text-slate-400" strokeWidth={2.2} />
              </div>
              <p className="text-[13px] font-black text-slate-700 mt-3">No addresses yet</p>
              <p className="text-[11.5px] text-slate-500 font-semibold mt-1">
                Add one to get accurate delivery fee
              </p>
            </div>
          )}

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
            onClick={() => { setShowAddressSheet(false); onCheckout(); }}
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
                      <div className={`w-1.5 ${isApplied ? 'bg-emerald-400' : 'bg-[#02402c]'}`} />
                      <div className="flex-1 p-3.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
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

                          <div className="flex items-baseline gap-1">
                            <span className="text-[22px] font-black text-[#02402c] tracking-[-0.03em] leading-none">
                              {isPercent ? `${p.discount_value}%` : `₹${p.discount_value}`}
                            </span>
                            <span className="text-[11px] font-black text-[#02402c]/70 tracking-wide">OFF</span>
                          </div>

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
                <Tag size={22} className="text-slate-400" strokeWidth={2.2} />
              </div>
              <p className="text-[13px] font-black text-slate-700 mt-3">No active offers right now</p>
              <p className="text-[11.5px] text-slate-500 font-semibold mt-1">
                Enter a code above if you have one
              </p>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
