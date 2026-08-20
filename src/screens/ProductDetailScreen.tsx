// screens/ProductDetailScreen.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Star, Truck, ShieldCheck, Percent, Hash } from 'lucide-react';
import type { Product, VolumePricingTier } from '@/types';
import type { useCart } from '@/store';
import { OfferBadge } from '@/components/OfferBadge';
import { QuantitySelector } from '@/components/QuantitySelector';
import { ProductCard } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { fetchProductById, fetchWishlist, toggleWishlist, fetchVolumePricing } from '@/services/catalog';
import { StoreProvider, useStore } from '@/context/StoreContext';

interface ProductDetailScreenProps {
  productId: string;
  cart: ReturnType<typeof useCart>;
  onBack: () => void;
  onProduct: (product: Product) => void;
}

// Default theme when no store context
const defaultTheme = {
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  textColor: '#1f2937',
  borderColor: '#e5e7eb',
  buttonStyle: 'brand' as 'brand' | 'outline' | 'ghost',
  gradientFrom: '#065f46',
  gradientTo: '#16a34a',
};

// Component that uses the store theme (must be inside StoreProvider)
function ProductDetailWithTheme({ productId, cart, onBack, onProduct }: ProductDetailScreenProps) {
  const { theme } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [volumeTiers, setVolumeTiers] = useState<VolumePricingTier[]>([]);

  const {
    primaryColor = '#10b981',
    secondaryColor = '#059669',
    textColor = '#1f2937',
    borderColor = '#e5e7eb',
    buttonStyle = 'brand',
    gradientFrom = '#065f46',
    gradientTo = '#16a34a',
  } = theme;

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const result = await fetchProductById(productId);
      if (result) {
        setProduct(result.product);
        setRelated(result.related);
        const wl = await fetchWishlist();
        setWishlisted(wl.includes(productId));
        const tiers = await fetchVolumePricing(productId);
        setVolumeTiers(tiers);
      }
      setLoading(false);
    })();
  }, [productId]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" /></div>;
  if (!product) return <div className="flex flex-col items-center justify-center min-h-[50vh] text-center"><p className="text-sm text-ink-500">Product not found</p><button onClick={onBack} className="mt-3 text-sm font-bold text-brand-600">Go back</button></div>;

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const quantity = cart.getQuantity(product.id);
  const effectivePrice = (() => {
    if (quantity === 0) return product.price;
    const applicable = volumeTiers
      .filter(t => quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity))
      .sort((a, b) => a.unit_price - b.unit_price);
    return applicable.length ? applicable[0].unit_price : product.price;
  })();
  const totalPrice = effectivePrice * quantity;
  const totalMrp = product.mrp * quantity;
  const volumeSavings = totalMrp - totalPrice;

  const handleWishlist = async () => {
    setWishlistBusy(true);
    await toggleWishlist(product.id, wishlisted);
    setWishlisted(!wishlisted);
    setWishlistBusy(false);
  };

  return (
    <div className="pb-6 space-y-5">
      {/* Image header with theme gradient overlay */}
      <div className="relative h-[270px] bg-ink-50 overflow-hidden">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        <div
          className="absolute inset-0 bg-gradient-to-t opacity-30 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <button onClick={onBack} className="absolute top-4 left-4 h-9 w-9 rounded-xl bg-white/90 text-ink-700 flex items-center justify-center shadow-soft">
          <ArrowLeft size={18} />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="h-9 w-9 rounded-xl bg-white/90 text-ink-600 flex items-center justify-center shadow-soft">
            <Share2 size={16} />
          </button>
          <button
            onClick={handleWishlist}
            disabled={wishlistBusy}
            className={`h-9 w-9 rounded-xl bg-white/90 flex items-center justify-center shadow-soft transition-colors ${wishlisted ? 'text-red-500' : 'text-ink-600'}`}
          >
            <Heart size={17} className={wishlisted ? 'fill-red-500' : ''} />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
              {product.brand}
            </p>
            <OfferBadge discountPercent={discount} size="md" color={primaryColor} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight mt-1">{product.name}</h1>
          <p className="text-sm text-ink-500 mt-1">{product.packSize} <span className="mx-1 text-ink-300">·</span> Minimum order: {product.moq} units</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="flex items-center gap-1 text-xs font-bold text-ink-700">
              <Star size={14} className="fill-amber-400 text-amber-400" /> {product.rating}
            </span>
            <span className="text-xs text-ink-300">|</span>
            <span className={`text-xs font-semibold ${product.inStock ? 'text-brand-600' : 'text-red-500'}`}>
              {product.inStock ? 'In stock' : 'Out of stock'}
            </span>
          </div>
          {product.hsn_code && (
            <p className="text-xs text-ink-400 mt-1 flex items-center gap-1">
              <Hash size={12} /> HSN: {product.hsn_code}
            </p>
          )}
          {product.gst_percentage !== undefined && product.gst_percentage > 0 && (
            <p className="text-xs text-ink-400 flex items-center gap-1">
              <Percent size={12} /> GST: {product.gst_percentage}%
            </p>
          )}
        </div>

        {/* Pricing */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-extrabold" style={{ color: primaryColor }}>
              ₹{product.price}
            </span>
            <span className="text-sm text-ink-400 line-through mb-1">MRP ₹{product.mrp}</span>
            <OfferBadge discountPercent={discount} color={primaryColor} />
          </div>
          <p className="text-[11px] mt-1" style={{ color: primaryColor }}>
            Your wholesale price · Inclusive of all taxes
          </p>
          {volumeTiers.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: `${primaryColor}30` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                Volume Pricing
              </p>
              <div className="mt-1 space-y-1">
                {volumeTiers.map((tier) => (
                  <div key={tier.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-600">
                      {tier.min_quantity} – {tier.max_quantity ?? '∞'} units
                    </span>
                    <span className="font-bold" style={{ color: primaryColor }}>
                      ₹{tier.unit_price}/unit
                    </span>
                  </div>
                ))}
              </div>
              {quantity > 0 && effectivePrice < product.price && (
                <p className="text-[11px] mt-2" style={{ color: primaryColor }}>
                  You are getting volume pricing: ₹{effectivePrice}/unit · ₹{volumeSavings.toLocaleString('en-IN')} saved on this order
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Truck size={17} className="text-brand-600" style={{ color: primaryColor }} />
          <div>
            <p className="text-xs font-bold text-ink-700">Delivery by tomorrow</p>
            <p className="text-[10px] text-ink-400 mt-0.5">Free delivery on orders above ₹2,000</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-ink-900">About this product</h2>
          <p className="text-xs text-ink-600 leading-relaxed mt-2">{product.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: `${primaryColor}10` }}>
            <ShieldCheck size={17} style={{ color: primaryColor }} />
            <div><p className="text-[10px] font-bold text-ink-700">Quality checked</p><p className="text-[9px] text-ink-400">Verified product</p></div>
          </div>
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: `${primaryColor}10` }}>
            <Truck size={17} style={{ color: primaryColor }} />
            <div><p className="text-[10px] font-bold text-ink-700">Fast delivery</p><p className="text-[9px] text-ink-400">Reliable supply</p></div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            {quantity > 0
              ? <div className="h-12 flex items-center justify-center rounded-xl border" style={{ borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}10` }}>
                  <QuantitySelector
                    quantity={quantity}
                    onIncrement={() => cart.addToCart(product)}
                    onDecrement={() => cart.updateQuantity(product.id, quantity - 1)}
                    size="md"
                    theme={{ primaryColor, secondaryColor }}
                  />
                </div>
              : <button
                  onClick={() => cart.addToCart(product)}
                  className="w-full h-12 rounded-xl text-white text-sm font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Add to cart
                </button>
            }
          </div>
          <button
            onClick={handleWishlist}
            disabled={wishlistBusy}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${wishlisted ? 'border-red-200 text-red-500' : 'border-ink-200 text-ink-600'}`}
          >
            <Heart size={19} className={wishlisted ? 'fill-red-500' : ''} />
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <SectionHeader title="You may also like" onViewAll={() => undefined} />
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                quantity={cart.getQuantity(item.id)}
                onAdd={() => cart.addToCart(item)}
                onIncrement={() => cart.addToCart(item)}
                onDecrement={() => cart.updateQuantity(item.id, cart.getQuantity(item.id) - 1)}
                onClick={() => onProduct(item)}
                horizontal
                theme={theme}
                isWishlisted={wishlist.includes(item.id)}
                onWishlistToggle={toggleWishlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Component that renders without StoreProvider (uses default theme) ----
function ProductDetailWithoutStore(props: ProductDetailScreenProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [volumeTiers, setVolumeTiers] = useState<VolumePricingTier[]>([]);

  const {
    primaryColor = '#10b981',
    secondaryColor = '#059669',
    textColor = '#1f2937',
    borderColor = '#e5e7eb',
    buttonStyle = 'brand',
    gradientFrom = '#065f46',
    gradientTo = '#16a34a',
  } = defaultTheme;

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const result = await fetchProductById(props.productId);
      if (result) {
        setProduct(result.product);
        setRelated(result.related);
        const wl = await fetchWishlist();
        setWishlisted(wl.includes(props.productId));
        const tiers = await fetchVolumePricing(props.productId);
        setVolumeTiers(tiers);
      }
      setLoading(false);
    })();
  }, [props.productId]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" /></div>;
  if (!product) return <div className="flex flex-col items-center justify-center min-h-[50vh] text-center"><p className="text-sm text-ink-500">Product not found</p><button onClick={props.onBack} className="mt-3 text-sm font-bold text-brand-600">Go back</button></div>;

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const quantity = props.cart.getQuantity(product.id);
  const effectivePrice = (() => {
    if (quantity === 0) return product.price;
    const applicable = volumeTiers
      .filter(t => quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity))
      .sort((a, b) => a.unit_price - b.unit_price);
    return applicable.length ? applicable[0].unit_price : product.price;
  })();
  const totalPrice = effectivePrice * quantity;
  const totalMrp = product.mrp * quantity;
  const volumeSavings = totalMrp - totalPrice;

  const handleWishlist = async () => {
    setWishlistBusy(true);
    await toggleWishlist(product.id, wishlisted);
    setWishlisted(!wishlisted);
    setWishlistBusy(false);
  };

  // Same JSX as above but with defaultTheme colors
  // (Copy the same JSX from ProductDetailWithTheme, using defaultTheme colors instead of theme)

  // For brevity, I'll render a simplified version:
  return (
    <div className="pb-6 space-y-5">
      <div className="relative h-[270px] bg-ink-50 overflow-hidden">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <button onClick={props.onBack} className="absolute top-4 left-4 h-9 w-9 rounded-xl bg-white/90 text-ink-700 flex items-center justify-center shadow-soft">
          <ArrowLeft size={18} />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="h-9 w-9 rounded-xl bg-white/90 text-ink-600 flex items-center justify-center shadow-soft">
            <Share2 size={16} />
          </button>
          <button
            onClick={handleWishlist}
            disabled={wishlistBusy}
            className={`h-9 w-9 rounded-xl bg-white/90 flex items-center justify-center shadow-soft transition-colors ${wishlisted ? 'text-red-500' : 'text-ink-600'}`}
          >
            <Heart size={17} className={wishlisted ? 'fill-red-500' : ''} />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
              {product.brand}
            </p>
            <OfferBadge discountPercent={discount} size="md" color={primaryColor} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight mt-1">{product.name}</h1>
          <p className="text-sm text-ink-500 mt-1">{product.packSize} <span className="mx-1 text-ink-300">·</span> Minimum order: {product.moq} units</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="flex items-center gap-1 text-xs font-bold text-ink-700">
              <Star size={14} className="fill-amber-400 text-amber-400" /> {product.rating}
            </span>
            <span className="text-xs text-ink-300">|</span>
            <span className={`text-xs font-semibold ${product.inStock ? 'text-brand-600' : 'text-red-500'}`}>
              {product.inStock ? 'In stock' : 'Out of stock'}
            </span>
          </div>
          {product.hsn_code && (
            <p className="text-xs text-ink-400 mt-1 flex items-center gap-1">
              <Hash size={12} /> HSN: {product.hsn_code}
            </p>
          )}
          {product.gst_percentage !== undefined && product.gst_percentage > 0 && (
            <p className="text-xs text-ink-400 flex items-center gap-1">
              <Percent size={12} /> GST: {product.gst_percentage}%
            </p>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-extrabold" style={{ color: primaryColor }}>
              ₹{product.price}
            </span>
            <span className="text-sm text-ink-400 line-through mb-1">MRP ₹{product.mrp}</span>
            <OfferBadge discountPercent={discount} color={primaryColor} />
          </div>
          <p className="text-[11px] mt-1" style={{ color: primaryColor }}>
            Your wholesale price · Inclusive of all taxes
          </p>
          {volumeTiers.length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: `${primaryColor}30` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                Volume Pricing
              </p>
              <div className="mt-1 space-y-1">
                {volumeTiers.map((tier) => (
                  <div key={tier.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-600">
                      {tier.min_quantity} – {tier.max_quantity ?? '∞'} units
                    </span>
                    <span className="font-bold" style={{ color: primaryColor }}>
                      ₹{tier.unit_price}/unit
                    </span>
                  </div>
                ))}
              </div>
              {quantity > 0 && effectivePrice < product.price && (
                <p className="text-[11px] mt-2" style={{ color: primaryColor }}>
                  You are getting volume pricing: ₹{effectivePrice}/unit · ₹{volumeSavings.toLocaleString('en-IN')} saved on this order
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Truck size={17} className="text-brand-600" style={{ color: primaryColor }} />
          <div>
            <p className="text-xs font-bold text-ink-700">Delivery by tomorrow</p>
            <p className="text-[10px] text-ink-400 mt-0.5">Free delivery on orders above ₹2,000</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-ink-900">About this product</h2>
          <p className="text-xs text-ink-600 leading-relaxed mt-2">{product.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: `${primaryColor}10` }}>
            <ShieldCheck size={17} style={{ color: primaryColor }} />
            <div><p className="text-[10px] font-bold text-ink-700">Quality checked</p><p className="text-[9px] text-ink-400">Verified product</p></div>
          </div>
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: `${primaryColor}10` }}>
            <Truck size={17} style={{ color: primaryColor }} />
            <div><p className="text-[10px] font-bold text-ink-700">Fast delivery</p><p className="text-[9px] text-ink-400">Reliable supply</p></div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            {quantity > 0
              ? <div className="h-12 flex items-center justify-center rounded-xl border" style={{ borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}10` }}>
                  <QuantitySelector
                    quantity={quantity}
                    onIncrement={() => props.cart.addToCart(product)}
                    onDecrement={() => props.cart.updateQuantity(product.id, quantity - 1)}
                    size="md"
                    theme={{ primaryColor, secondaryColor }}
                  />
                </div>
              : <button
                  onClick={() => props.cart.addToCart(product)}
                  className="w-full h-12 rounded-xl text-white text-sm font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Add to cart
                </button>
            }
          </div>
          <button
            onClick={handleWishlist}
            disabled={wishlistBusy}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${wishlisted ? 'border-red-200 text-red-500' : 'border-ink-200 text-ink-600'}`}
          >
            <Heart size={19} className={wishlisted ? 'fill-red-500' : ''} />
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <SectionHeader title="You may also like" onViewAll={() => undefined} />
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                quantity={props.cart.getQuantity(item.id)}
                onAdd={() => props.cart.addToCart(item)}
                onIncrement={() => props.cart.addToCart(item)}
                onDecrement={() => props.cart.updateQuantity(item.id, props.cart.getQuantity(item.id) - 1)}
                onClick={() => props.onProduct(item)}
                horizontal
                theme={defaultTheme}
                isWishlisted={wishlist.includes(item.id)}
                onWishlistToggle={toggleWishlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Main export ----
export function ProductDetailScreen(props: ProductDetailScreenProps) {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');

  // If storeId is present, wrap with StoreProvider
  if (storeId) {
    return (
      <StoreProvider storeId={storeId}>
        <ProductDetailWithTheme {...props} />
      </StoreProvider>
    );
  }

  // If no storeId, render without StoreProvider (using default theme)
  return <ProductDetailWithoutStore {...props} />;
}