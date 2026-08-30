import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ShoppingBag,
  Star,
  Truck,
  ShieldCheck,
  Percent,
  Hash,
  Plus,
  Minus,
  Sparkles,
  Check,
  Zap,
} from 'lucide-react';
import type { Product, VolumePricingTier } from '@/types';
import { useCart } from '@/store';
import { OfferBadge } from '@/components/OfferBadge';
import { ProductCard } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import {
  fetchProductById,
  fetchWishlist,
  toggleWishlist,
  fetchVolumePricing,
  fetchStoreConfig,
  fetchBrandById,
  fetchCategories,
} from '@/services/catalog';
import { getStoreTheme, setStoreTheme } from '@/context/StoreContext';
import { recordRecentlyViewed } from '@/lib/recentlyViewed';

interface ProductDetailScreenProps {
  productId: string;
  cart?: ReturnType<typeof useCart>;
  onBack: () => void;
  onProduct: (product: Product) => void;
}

const defaultTheme = {
  primaryColor: '#02402c',
  secondaryColor: '#03543a',
  textColor: '#1f2937',
  borderColor: '#e5e7eb',
  buttonStyle: 'brand' as const,
  gradientFrom: '#02402c',
  gradientTo: '#03543a',
};

export function ProductDetailScreen({ productId, onBack, onProduct }: ProductDetailScreenProps) {
  const navigate = useNavigate();
  // Direct subscription to CartContext ensures live reactivity on back navigation
  const cart = useCart();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const brandId = searchParams.get('brandId');
  const categoryId = searchParams.get('categoryId');

  const [theme, setTheme] = useState(() => {
    if (storeId) {
      return getStoreTheme(storeId) || defaultTheme;
    }
    return defaultTheme;
  });

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [volumeTiers, setVolumeTiers] = useState<VolumePricingTier[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Smooth scroll opacity state (0 to 1)
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const {
    primaryColor = '#02402c',
    secondaryColor = '#03543a',
    textColor = '#1f2937',
    borderColor = '#e5e7eb',
  } = theme;

  // Track scroll and smoothly transition to white ONLY when the bottom of the image passes the header
  useEffect(() => {
    const handleScroll = () => {
      const containerHeight = imageContainerRef.current?.offsetHeight || 320;
      const scrollY = window.scrollY;
      
      const start = Math.max(0, containerHeight - 50);
      const end = containerHeight;

      if (scrollY <= start) {
        setHeaderOpacity(0);
      } else if (scrollY >= end) {
        setHeaderOpacity(1);
      } else {
        setHeaderOpacity((scrollY - start) / (end - start));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (storeId && !getStoreTheme(storeId)) {
      fetchStoreConfig(storeId)
        .then((config) => {
          const t = {
            primaryColor: config?.hero?.gradientFrom || '#02402c',
            secondaryColor: config?.hero?.gradientTo || '#03543a',
            textColor: '#1f2937',
            borderColor: '#e5e7eb',
            buttonStyle: 'brand' as const,
            gradientFrom: config?.hero?.gradientFrom || '#02402c',
            gradientTo: config?.hero?.gradientTo || '#03543a',
          };
          setStoreTheme(storeId, t);
          setTheme(t);
        })
        .catch(() => {});
    }
  }, [storeId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const result = await fetchProductById(productId);
      if (result) {
        setProduct(result.product);
        setRelated(result.related);

        void recordRecentlyViewed(productId);

        const wl = await fetchWishlist();
        setWishlist(wl);
        setWishlisted(wl.includes(productId));
        const tiers = await fetchVolumePricing(productId);
        setVolumeTiers(tiers.sort((a, b) => a.min_quantity - b.min_quantity));

        if (brandId) {
          const brand = await fetchBrandById(brandId);
          if (brand) {
            const t = {
              primaryColor: brand.primary_color || '#02402c',
              secondaryColor: brand.secondary_color || '#03543a',
              textColor: '#1f2937',
              borderColor: '#e5e7eb',
              buttonStyle: 'brand' as const,
              gradientFrom: brand.primary_color || '#02402c',
              gradientTo: brand.secondary_color || '#03543a',
            };
            setTheme(t);
            setStoreTheme(`brand_${brandId}`, t);
          }
        } else if (categoryId) {
          const { categories } = await fetchCategories();
          const category = categories.find((c) => c.id === categoryId);
          if (category) {
            const gradient = category.gradient || '#02402c';
            const hexes = gradient.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
            const expandHex = (hex: string) =>
              hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex;
            const pColor = hexes ? expandHex(hexes[0]) : '#02402c';
            const sColor = hexes && hexes.length > 1 ? expandHex(hexes[1]) : pColor;
            const t = {
              primaryColor: pColor,
              secondaryColor: sColor,
              textColor: '#1f2937',
              borderColor: '#e5e7eb',
              buttonStyle: 'brand' as const,
              gradientFrom: pColor,
              gradientTo: sColor,
            };
            setTheme(t);
            setStoreTheme(`category_${categoryId}`, t);
          }
        }
      }
      setLoading(false);
    })();
  }, [productId, brandId, categoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div 
          className="h-8 w-8 rounded-full border-2 border-slate-200 animate-spin" 
          style={{ borderTopColor: primaryColor }}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-sm text-ink-500">Product not found</p>
        <button onClick={onBack} className="mt-3 text-sm font-bold" style={{ color: primaryColor }}>
          Go back
        </button>
      </div>
    );
  }

  const images = product.image_urls?.length ? product.image_urls : [product.image];
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const quantity = cart.getQuantity(product.id);

  // Active tier requires an active positive quantity in cart
  const activeTier = quantity > 0
    ? volumeTiers.find(
        (t) => quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity)
      )
    : undefined;

  const effectivePrice = activeTier ? activeTier.unit_price : product.price;
  const totalPrice = effectivePrice * quantity;
  const totalMrp = product.mrp * quantity;
  const volumeSavings = totalMrp - totalPrice;

  const handleWishlist = async () => {
    setWishlistBusy(true);
    await toggleWishlist(product.id, wishlisted);
    setWishlisted(!wishlisted);
    setWishlistBusy(false);
  };

  const handleApplyTierQuantity = (targetQty: number) => {
    if (!product) return;
    const currentQty = cart.getQuantity(product.id);
    if (currentQty === 0) {
      cart.addToCart(product, targetQty);
    } else {
      cart.updateQuantity(product.id, targetQty);
    }
  };

  const handleProductClick = (p: Product) => {
    const params = new URLSearchParams();
    params.set('id', p.id);
    if (brandId) params.set('brandId', brandId);
    if (storeId) params.set('storeId', storeId);
    if (categoryId) params.set('categoryId', categoryId);
    navigate(`/product?${params.toString()}`);
  };

  return (
    <div className="pb-10 relative">
      {/* Dynamic Header */}
      <header
        className="fixed top-0 left-0 right-0 z-30 mx-auto max-w-[720px] px-4 pt-[calc(env(safe-area-inset-top,0px)+0.6rem)] pb-3 flex items-center justify-between pointer-events-auto"
        style={{
          backgroundColor: `rgba(255, 255, 255, ${headerOpacity * 0.98})`,
          backdropFilter: headerOpacity > 0 ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: headerOpacity > 0 ? 'blur(12px)' : 'none',
          borderBottom: headerOpacity > 0.9 ? '1px solid #f1f5f9' : '1px solid transparent',
          boxShadow: headerOpacity > 0.9 ? '0 1px 3px 0 rgba(0, 0, 0, 0.05)' : 'none',
        }}
      >
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            headerOpacity > 0.5
              ? 'bg-ink-100 text-ink-800'
              : 'bg-white/90 text-ink-700 shadow-soft'
          }`}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Product Title in Header */}
        <div
          className="flex-1 mx-3 truncate transition-opacity duration-150"
          style={{ opacity: headerOpacity }}
        >
          <p className="text-xs font-bold text-ink-900 truncate">{product.name}</p>
          <p className="text-[11px] font-extrabold" style={{ color: primaryColor }}>
            ₹{effectivePrice}
          </p>
        </div>

        {/* Top Right: Wishlist & Cart */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleWishlist}
            disabled={wishlistBusy}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              headerOpacity > 0.5
                ? 'bg-ink-100'
                : 'bg-white/90 shadow-soft'
            } ${wishlisted ? 'text-red-500' : 'text-ink-600'}`}
            aria-label="Wishlist"
          >
            <Heart size={17} className={wishlisted ? 'fill-red-500' : ''} />
          </button>

          <button
            onClick={() => navigate('/cart')}
            className={`relative h-9 w-9 rounded-xl flex items-center justify-center text-ink-700 transition-all active:scale-95 ${
              headerOpacity > 0.5
                ? 'bg-ink-100'
                : 'bg-white/90 shadow-soft'
            }`}
            aria-label="Go to Cart"
          >
            <ShoppingBag size={17} />
            {cart.totalItems > 0 && (
              <span 
                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {cart.totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Image Carousel */}
      <div ref={imageContainerRef} className="relative w-full h-[320px] bg-ink-100 overflow-hidden m-0 p-0">
        <img
          src={images[activeImageIndex] || ''}
          alt={product.name}
          className="h-full w-full object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/10 pointer-events-none" />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1.5 hover:bg-black/50"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1.5 hover:bg-black/50"
            >
              <ArrowRight size={18} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    idx === activeImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="px-4 mt-4 space-y-4">
        {/* Brand, Name, Specs */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
              {product.brand}
            </p>
            <OfferBadge discountPercent={discount} size="md" color={primaryColor} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight mt-1">{product.name}</h1>
          <p className="text-sm text-ink-500 mt-1">
            {product.packSize} <span className="mx-1 text-ink-300">·</span> Minimum order: {product.moq} units
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="flex items-center gap-1 text-xs font-bold text-ink-700">
              <Star size={14} className="fill-amber-400 text-amber-400" /> {product.rating}
            </span>
            <span className="text-xs text-ink-300">|</span>
            <span 
              className="text-xs font-semibold" 
              style={{ color: product.inStock ? primaryColor : '#ef4444' }}
            >
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

        {/* Pricing Card */}
        <div
          className="rounded-2xl p-4 transition-all"
          style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}
        >
          <div className="flex items-end gap-2">
            <span className="text-2xl font-extrabold" style={{ color: primaryColor }}>
              ₹{effectivePrice}
            </span>
            <span className="text-sm text-ink-400 line-through mb-1">MRP ₹{product.mrp}</span>
            {activeTier && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full mb-1 text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                Volume Deal Applied
              </span>
            )}
          </div>
          <p className="text-[11px] mt-1" style={{ color: primaryColor }}>
            Your wholesale price · Inclusive of all taxes
          </p>

          {quantity > 0 && effectivePrice < product.price && (
            <div
              className="mt-3 p-2.5 rounded-xl flex items-center gap-2 border"
              style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}40` }}
            >
              <Zap size={15} style={{ color: primaryColor }} />
              <span className="text-xs font-bold text-ink-800">
                You saved <span style={{ color: primaryColor }}>₹{volumeSavings.toLocaleString('en-IN')}</span> on this
                tier!
              </span>
            </div>
          )}
        </div>

        {/* Volume Pricing Tiers */}
        {volumeTiers.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} style={{ color: primaryColor }} />
              <h2 className="text-sm font-bold text-ink-900">Buy More, Save More</h2>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {volumeTiers.map((tier) => {
                const tierDiscount =
                  tier.discount_percent ||
                  Math.round(((product.price - tier.unit_price) / product.price) * 100);

                const isApplied =
                  quantity > 0 &&
                  quantity >= tier.min_quantity &&
                  (tier.max_quantity === null || quantity <= tier.max_quantity);

                return (
                  <div
                    key={tier.id}
                    className={`relative rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                      isApplied
                        ? 'shadow-md bg-white'
                        : 'bg-white/60 hover:bg-white border-ink-200'
                    }`}
                    style={{
                      borderColor: isApplied ? primaryColor : undefined,
                      borderWidth: isApplied ? '1.5px' : '1px',
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink-900">
                          Buy {tier.min_quantity}
                          {tier.max_quantity ? `–${tier.max_quantity}` : '+'} units
                        </span>
                        {tierDiscount > 0 && (
                          <span
                            className="text-[10px] font-black tracking-wide px-1.5 py-0.5 rounded-md text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {tierDiscount}% OFF
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-extrabold text-ink-900">
                          ₹{tier.unit_price}
                        </span>
                        <span className="text-[11px] text-ink-400">/unit</span>
                        <span className="text-[11px] text-ink-400 line-through">
                          ₹{product.price}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplyTierQuantity(tier.min_quantity)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 shrink-0 cursor-pointer"
                      style={
                        isApplied
                          ? { backgroundColor: `${primaryColor}15`, color: primaryColor }
                          : { backgroundColor: primaryColor, color: '#ffffff' }
                      }
                    >
                      {isApplied ? (
                        <>
                          <Check size={14} /> Active
                        </>
                      ) : (
                        `Buy ${tier.min_quantity}`
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery Info */}
        <div className="flex items-center gap-2 pt-1">
          <Truck size={17} style={{ color: primaryColor }} />
          <div>
            <p className="text-xs font-bold text-ink-700">Delivery by tomorrow</p>
            <p className="text-[10px] text-ink-400 mt-0.5">Free delivery on orders above ₹2,000</p>
          </div>
        </div>

        {/* Product Description */}
        <div>
          <h2 className="text-sm font-bold text-ink-900">About this product</h2>
          <p className="text-xs text-ink-600 leading-relaxed mt-2">{product.description}</p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: `${primaryColor}10` }}>
            <ShieldCheck size={17} style={{ color: primaryColor }} />
            <div>
              <p className="text-[10px] font-bold text-ink-700">Quality checked</p>
              <p className="text-[9px] text-ink-400">Verified product</p>
            </div>
          </div>
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: `${primaryColor}10` }}>
            <Truck size={17} style={{ color: primaryColor }} />
            <div>
              <p className="text-[10px] font-bold text-ink-700">Fast delivery</p>
              <p className="text-[9px] text-ink-400">Reliable supply</p>
            </div>
          </div>
        </div>

        {/* Cart Controls */}
        <div className="flex gap-2 pt-2">
          <div className="flex-1">
            {quantity > 0 ? (
              <div
                className="h-12 flex items-center justify-between px-3 rounded-xl border shadow-sm"
                style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
              >
                <button
                  onClick={() => cart.updateQuantity(product.id, quantity - 1)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform active:scale-95 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Minus size={16} />
                </button>
                <span className="text-sm font-extrabold" style={{ color: primaryColor }}>
                  {quantity} in cart
                </span>
                <button
                  onClick={() => cart.addToCart(product)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform active:scale-95 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => cart.addToCart(product)}
                className="w-full h-12 rounded-xl text-white text-sm font-bold shadow-md transition-transform active:scale-[0.98] cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Add to cart
              </button>
            )}
          </div>
          <button
            onClick={handleWishlist}
            disabled={wishlistBusy}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
              wishlisted ? 'border-red-200 text-red-500' : 'border-ink-200 text-ink-600'
            }`}
          >
            <Heart size={19} className={wishlisted ? 'fill-red-500' : ''} />
          </button>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-6">
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
                onClick={() => handleProductClick(item)}
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
