import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Heart, ShoppingBag, Star, Truck, ShieldCheck,
  Percent, Hash, Plus, Minus, Sparkles, Check, Zap, Package, Timer
} from 'lucide-react';
import type { Product, VolumePricingTier } from '@/types';
import { useCart } from '@/store';
import { OfferBadge } from '@/components/OfferBadge';
import { ProductCard } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { AppLoader } from '@/components/AppLoader';
import { CachedImage } from '@/components/CachedImage';
import { supabase } from '@/lib/supabase';
import {
  fetchProductById, fetchWishlist, toggleWishlist, fetchVolumePricing,
  fetchStoreConfig, fetchBrandById, fetchCategories,
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
  primaryColor: '#02402c', secondaryColor: '#03543a', textColor: '#1f2937',
  borderColor: '#e5e7eb', buttonStyle: 'brand' as const, gradientFrom: '#02402c', gradientTo: '#03543a',
};

export function ProductDetailScreen({ productId, onBack, onProduct: _onProduct }: ProductDetailScreenProps) {
  const navigate = useNavigate();
  const cart = useCart();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const brandId = searchParams.get('brandId');
  const categoryId = searchParams.get('categoryId');

  const [theme, setTheme] = useState(() => (storeId ? getStoreTheme(storeId) || defaultTheme : defaultTheme));
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [volumeTiers, setVolumeTiers] = useState<VolumePricingTier[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  // Delivery config state
  const [deliveryConfig, setDeliveryConfig] = useState<{ max_order_value: number | null; estimated_time?: string } | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { primaryColor = '#02402c' } = theme;

  // Corrected Delivery Config Fetch
  useEffect(() => {
    let active = true;
    
    const fetchDelivery = async () => {
      const { data, error } = await supabase
        .from('delivery_charges')
        .select('min_order_value, charge, estimated_time')
        .eq('is_active', true)
        .order('min_order_value', { ascending: true }); // Properly order by minimum order value

      if (error) {
        console.error("Delivery Config Error:", error);
        return;
      }

      if (data && data.length > 0 && active) {
        // Find the first tier with a valid estimated time string
        const timeTier = data.find((d) => d.estimated_time && d.estimated_time.trim() !== '');
        const estTime = timeTier ? timeTier.estimated_time.trim() : undefined;

        // Find the tier where charge is 0 to determine the free delivery threshold
        const freeTier = data.find((d) => Number(d.charge) === 0);
        const freeThreshold = freeTier ? freeTier.min_order_value : null;

        setDeliveryConfig({
          estimated_time: estTime,
          max_order_value: freeThreshold,
        });
      }
    };

    fetchDelivery();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const containerHeight = imageContainerRef.current?.offsetHeight || 320;
      const scrollY = window.scrollY;
      const start = Math.max(0, containerHeight - 50);
      const end = containerHeight;
      if (scrollY <= start) setHeaderOpacity(0);
      else if (scrollY >= end) setHeaderOpacity(1);
      else setHeaderOpacity((scrollY - start) / (end - start));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (storeId && !getStoreTheme(storeId)) {
      fetchStoreConfig(storeId).then((config) => {
        const t = {
          primaryColor: config?.hero?.gradientFrom || '#02402c',
          secondaryColor: config?.hero?.gradientTo || '#03543a',
          textColor: '#1f2937', borderColor: '#e5e7eb', buttonStyle: 'brand' as const,
          gradientFrom: config?.hero?.gradientFrom || '#02402c',
          gradientTo: config?.hero?.gradientTo || '#03543a',
        };
        setStoreTheme(storeId, t);
        setTheme(t);
      }).catch(() => {});
    }
  }, [storeId]);

  const refreshProductData = useCallback(async () => {
    try {
      const result = await fetchProductById(productId);
      if (result) {
        setProduct(result.product);
        setRelated(result.related);
      }
      const tiers = await fetchVolumePricing(productId);
      setVolumeTiers(tiers.sort((a, b) => a.min_quantity - b.min_quantity));
    } catch (err) {
      console.warn('Failed to refresh product silently', err);
    }
  }, [productId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refreshProductData();
      void recordRecentlyViewed(productId);
      
      const wl = await fetchWishlist();
      setWishlist(wl);
      setWishlisted(wl.includes(productId));

      if (brandId) {
        const brand = await fetchBrandById(brandId);
        if (brand) {
          const t = {
            primaryColor: brand.primary_color || '#02402c', secondaryColor: brand.secondary_color || '#03543a',
            textColor: '#1f2937', borderColor: '#e5e7eb', buttonStyle: 'brand' as const,
            gradientFrom: brand.primary_color || '#02402c', gradientTo: brand.secondary_color || '#03543a',
          };
          setTheme(t); setStoreTheme(`brand_${brandId}`, t);
        }
      } else if (categoryId) {
        const { categories } = await fetchCategories();
        const category = categories.find((c) => c.id === categoryId);
        if (category) {
          const gradient = category.gradient || '#02402c';
          const hexes = gradient.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
          const expandHex = (hex: string) => hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex;
          const pColor = hexes ? expandHex(hexes[0]) : '#02402c';
          const sColor = hexes && hexes.length > 1 ? expandHex(hexes[1]) : pColor;
          const t = {
            primaryColor: pColor, secondaryColor: sColor, textColor: '#1f2937', borderColor: '#e5e7eb',
            buttonStyle: 'brand' as const, gradientFrom: pColor, gradientTo: sColor,
          };
          setTheme(t); setStoreTheme(`category_${categoryId}`, t);
        }
      }
      setLoading(false);
    })();
  }, [productId, brandId, categoryId, refreshProductData]);

  useEffect(() => {
    let active = true;
    const expectedKey = `product|${productId}`;

    const handleKeepAliveFocus = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (active && customEvent.detail?.key === expectedKey) {
        void refreshProductData();
      }
    };
    
    const handleVisibilityChange = () => {
      const isCurrentlyActive = window.location.pathname === '/product' && window.location.search.includes(`id=${productId}`);
      if (document.visibilityState === 'visible' && active && isCurrentlyActive) {
        void refreshProductData();
      }
    };

    window.addEventListener('keepalive:activated', handleKeepAliveFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('keepalive:activated', handleKeepAliveFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshProductData, productId]);

  const rawImages = product?.image_urls?.length ? product.image_urls : product?.image ? [product.image] : [];
  const images = rawImages.filter(Boolean);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null) return;
    const swipeThreshold = 40;
    if (touchDeltaX.current < -swipeThreshold && activeImageIndex < images.length - 1) setActiveImageIndex((prev) => prev + 1);
    else if (touchDeltaX.current > swipeThreshold && activeImageIndex > 0) setActiveImageIndex((prev) => prev - 1);
    touchStartX.current = null;
    touchDeltaX.current = 0;
  }, [activeImageIndex, images.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 safe-top">
          <button onClick={onBack} className="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700 active:scale-95 transition-transform" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center -mt-16"><AppLoader fullScreen={false} showStatus={true} size="md" type="general"/></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-sm text-ink-500">Product not found</p>
        <button onClick={onBack} className="mt-3 text-sm font-bold" style={{ color: primaryColor }}>Go back</button>
      </div>
    );
  }

  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const quantity = cart.getQuantity(product.id);
  const activeTier = quantity > 0 ? volumeTiers.find((t) => quantity >= t.min_quantity && (t.max_quantity === null || quantity <= t.max_quantity)) : undefined;
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
    if (!product || !product.inStock) return;
    const currentQty = cart.getQuantity(product.id);
    if (currentQty === 0) cart.addToCart(product, targetQty);
    else cart.updateQuantity(product.id, targetQty);
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
        <button
          onClick={onBack}
          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${headerOpacity > 0.5 ? 'bg-ink-100 text-ink-800' : 'bg-white/90 text-ink-700 shadow-soft'}`}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 mx-3 truncate transition-opacity duration-150" style={{ opacity: headerOpacity }}>
          <p className="text-xs font-bold text-ink-900 truncate">{product.name}</p>
          <p className="text-[11px] font-extrabold" style={{ color: primaryColor }}>₹{effectivePrice}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleWishlist} disabled={wishlistBusy}
            className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${headerOpacity > 0.5 ? 'bg-ink-100' : 'bg-white/90 shadow-soft'} ${wishlisted ? 'text-red-500' : 'text-ink-600'}`}
          >
            <Heart size={17} className={wishlisted ? 'fill-red-500' : ''} />
          </button>
          <button
            onClick={() => navigate('/cart')}
            className={`relative h-9 w-9 rounded-xl flex items-center justify-center text-ink-700 transition-all active:scale-95 ${headerOpacity > 0.5 ? 'bg-ink-100' : 'bg-white/90 shadow-soft'}`}
          >
            <ShoppingBag size={17} />
            {cart.totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-xs" style={{ backgroundColor: primaryColor }}>
                {cart.totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <div ref={imageContainerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="relative w-full h-[320px] overflow-hidden m-0 p-0 select-none touch-pan-y">
        {images.length > 0 ? (
          <div className="flex h-full w-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}>
            {images.map((imgUrl, idx) => {
              const isInvalid = imageErrors[idx];
              return (
                <div key={idx} className="flex h-full w-full shrink-0 items-center justify-center overflow-hidden">
                  {!isInvalid ? (
                    <CachedImage 
                      src={imgUrl} 
                      alt={`${product.name} - ${idx + 1}`} 
                      onError={() => setImageErrors((prev) => ({ ...prev, [idx]: true }))} 
                      className={`h-full w-full object-cover pointer-events-none transition-all ${!product.inStock ? 'grayscale opacity-70' : ''}`} 
                      draggable={false} 
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300"><Package size={64} strokeWidth={1.5} /></div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300"><Package size={64} strokeWidth={1.5} /></div>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
            <div className="bg-white/95 px-5 py-2.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2">
               <Package size={18} className="text-slate-400" />
               <span className="text-sm font-black tracking-widest text-slate-600 uppercase">Sold Out</span>
            </div>
          </div>
        )}

        {images.length > 1 && (
          <>
            <button type="button" onClick={() => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1.5 hover:bg-black/50 transition-colors z-30"><ArrowLeft size={18} /></button>
            <button type="button" onClick={() => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1.5 hover:bg-black/50 transition-colors z-30"><ArrowRight size={18} /></button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
              {images.map((_, idx) => (
                <button key={idx} type="button" onClick={() => setActiveImageIndex(idx)} className={`h-2 rounded-full transition-all duration-300 ${idx === activeImageIndex ? 'w-4 bg-slate-800' : 'w-2 bg-slate-300'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs font-bold uppercase tracking-wider ${!product.inStock ? 'text-slate-400' : ''}`} style={product.inStock ? { color: primaryColor } : undefined}>{product.brand}</p>
            {product.inStock && <OfferBadge discountPercent={discount} size="md" color={primaryColor} />}
          </div>
          <h1 className={`text-2xl font-extrabold tracking-tight mt-1 ${!product.inStock ? 'text-slate-600' : 'text-ink-900'}`}>{product.name}</h1>
          <p className="text-sm text-ink-500 mt-1">{product.packSize} <span className="mx-1 text-ink-300">·</span> Minimum order: {product.moq} units</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`flex items-center gap-1 text-xs font-bold ${!product.inStock ? 'text-slate-400' : 'text-ink-700'}`}><Star size={14} className={!product.inStock ? 'fill-slate-300 text-slate-300' : 'fill-amber-400 text-amber-400'} /> {product.rating}</span>
            <span className="text-xs text-ink-300">|</span>
            <span className="text-xs font-semibold" style={{ color: product.inStock ? primaryColor : '#94a3b8' }}>{product.inStock ? 'In stock' : 'Out of stock'}</span>
          </div>
          {product.hsn_code && <p className="text-xs text-ink-400 mt-1 flex items-center gap-1"><Hash size={12} /> HSN: {product.hsn_code}</p>}
          {product.gst_percentage !== undefined && product.gst_percentage > 0 && <p className="text-xs text-ink-400 flex items-center gap-1"><Percent size={12} /> GST: {product.gst_percentage}%</p>}
        </div>

        <div className={`rounded-2xl p-4 transition-all ${!product.inStock ? 'bg-slate-50 border border-slate-100' : ''}`} style={product.inStock ? { backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` } : undefined}>
          <div className="flex items-end gap-2">
            <span className={`text-2xl font-extrabold ${!product.inStock ? 'text-slate-500' : ''}`} style={product.inStock ? { color: primaryColor } : undefined}>₹{effectivePrice}</span>
            <span className="text-sm text-ink-400 line-through mb-1">MRP ₹{product.mrp}</span>
            {activeTier && product.inStock && <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-1 text-white shadow-xs" style={{ backgroundColor: primaryColor }}>Volume Deal Applied</span>}
          </div>
          <p className={`text-[11px] mt-1 ${!product.inStock ? 'text-slate-400' : ''}`} style={product.inStock ? { color: primaryColor } : undefined}>Your wholesale price · Inclusive of all taxes</p>
          {quantity > 0 && effectivePrice < product.price && product.inStock && (
            <div className="mt-3 p-2.5 rounded-xl flex items-center gap-2 border" style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}40` }}>
              <Zap size={15} style={{ color: primaryColor }} />
              <span className="text-xs font-bold text-ink-800">You saved <span style={{ color: primaryColor }}>₹{volumeSavings.toLocaleString('en-IN')}</span> on this tier!</span>
            </div>
          )}
        </div>

        {volumeTiers.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className={!product.inStock ? 'text-slate-400' : ''} style={product.inStock ? { color: primaryColor } : undefined} />
              <h2 className={`text-sm font-bold ${!product.inStock ? 'text-slate-500' : 'text-ink-900'}`}>Buy More, Save More</h2>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {volumeTiers.map((tier) => {
                const tierDiscount = tier.discount_percent || Math.round(((product.price - tier.unit_price) / product.price) * 100);
                const isApplied = quantity > 0 && quantity >= tier.min_quantity && (tier.max_quantity === null || quantity <= tier.max_quantity);
                return (
                  <div key={tier.id} className={`relative rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${!product.inStock ? 'bg-slate-50 border-slate-100 opacity-90' : isApplied ? 'shadow-md bg-white' : 'bg-white/60 hover:bg-white border-ink-200'}`} style={product.inStock ? { borderColor: isApplied ? primaryColor : undefined, borderWidth: isApplied ? '1.5px' : '1px' } : undefined}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${!product.inStock ? 'text-slate-500' : 'text-ink-900'}`}>Buy {tier.min_quantity}{tier.max_quantity ? `–${tier.max_quantity}` : '+'} units</span>
                        {tierDiscount > 0 && product.inStock && <span className="text-[10px] font-black tracking-wide px-1.5 py-0.5 rounded-md text-white" style={{ backgroundColor: primaryColor }}>{tierDiscount}% OFF</span>}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className={`text-sm font-extrabold ${!product.inStock ? 'text-slate-600' : 'text-ink-900'}`}>₹{tier.unit_price}</span>
                        <span className="text-[11px] text-ink-400">/unit</span>
                        <span className="text-[11px] text-ink-400 line-through">₹{product.price}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleApplyTierQuantity(tier.min_quantity)} 
                      disabled={!product.inStock}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform shrink-0 ${!product.inStock ? 'cursor-not-allowed shadow-none' : 'shadow-xs active:scale-95 cursor-pointer'}`} 
                      style={
                        !product.inStock 
                          ? { backgroundColor: '#f1f5f9', color: '#94a3b8' } 
                          : isApplied 
                            ? { backgroundColor: `${primaryColor}15`, color: primaryColor } 
                            : { backgroundColor: primaryColor, color: '#ffffff' }
                      }
                    >
                      {!product.inStock ? 'Out of Stock' : isApplied ? <><Check size={14} /> Active</> : `Buy ${tier.min_quantity}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Beautiful Express Delivery Block */}
        <div className={`mt-4 rounded-2xl p-4 border transition-all ${!product.inStock ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-2xl ${!product.inStock ? 'bg-slate-200 text-slate-400' : ''}`} style={product.inStock ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : undefined}>
              <Zap size={20} className={product.inStock ? "fill-current" : ""} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-extrabold tracking-tight ${!product.inStock ? 'text-slate-500' : 'text-slate-900'}`}>
                  Express Delivery
                </h3>
                {product.inStock && (
                  <span className="px-1.5 py-0.5 rounded-[5px] text-[9px] font-black tracking-widest text-white uppercase shadow-sm" style={{ backgroundColor: primaryColor }}>
                    FAST
                  </span>
                )}
              </div>
              <p className={`text-xs mt-1 font-medium flex items-center gap-1.5 ${!product.inStock ? 'text-slate-400' : 'text-slate-600'}`}>
                <Timer size={14} className={!product.inStock ? 'text-slate-400' : 'text-slate-400'} />
                Delivery in <span className={!product.inStock ? '' : 'text-slate-900 font-black'}>{deliveryConfig?.estimated_time || '45 - 60 minutes'}</span>
              </p>
              
              {/* Free Delivery Threshold Check */}
              {deliveryConfig?.max_order_value != null && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  <Sparkles size={14} className={!product.inStock ? 'text-slate-400' : 'text-amber-500'} />
                  <p className={`text-[11px] font-semibold ${!product.inStock ? 'text-slate-400' : 'text-slate-600'}`}>
                    Free delivery on orders above <span className="font-bold text-slate-900">₹{deliveryConfig.max_order_value}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-ink-900">About this product</h2>
          <p className="text-xs text-ink-600 leading-relaxed mt-2">{product.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-xl p-3 flex items-center gap-2 ${!product.inStock ? 'bg-slate-50' : ''}`} style={product.inStock ? { backgroundColor: `${primaryColor}10` } : undefined}>
            <ShieldCheck size={17} className={!product.inStock ? 'text-slate-400' : ''} style={product.inStock ? { color: primaryColor } : undefined} />
            <div>
              <p className={`text-[10px] font-bold ${!product.inStock ? 'text-slate-500' : 'text-ink-700'}`}>Quality checked</p>
              <p className="text-[9px] text-ink-400">Verified product</p>
            </div>
          </div>
          <div className={`rounded-xl p-3 flex items-center gap-2 ${!product.inStock ? 'bg-slate-50' : ''}`} style={product.inStock ? { backgroundColor: `${primaryColor}10` } : undefined}>
            <Truck size={17} className={!product.inStock ? 'text-slate-400' : ''} style={product.inStock ? { color: primaryColor } : undefined} />
            <div>
              <p className={`text-[10px] font-bold ${!product.inStock ? 'text-slate-500' : 'text-ink-700'}`}>Fast delivery</p>
              <p className="text-[9px] text-ink-400">Reliable supply</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <div className="flex-1">
            {quantity > 0 ? (
              <div className="h-12 flex items-center justify-between px-3 rounded-xl border shadow-sm" style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}>
                <button onClick={() => cart.updateQuantity(product.id, quantity - 1)} className="h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform active:scale-95 cursor-pointer" style={{ backgroundColor: primaryColor }}><Minus size={16} /></button>
                <span className="text-sm font-extrabold" style={{ color: primaryColor }}>{quantity} in cart</span>
                <button disabled={!product.inStock} onClick={() => cart.addToCart(product)} className={`h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform cursor-pointer ${!product.inStock ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`} style={{ backgroundColor: primaryColor }}><Plus size={16} /></button>
              </div>
            ) : !product.inStock ? (
              <button disabled className="w-full h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-sm font-bold shadow-none cursor-not-allowed flex items-center justify-center gap-2">
                <Package size={18} /> Out of Stock
              </button>
            ) : (
              <button onClick={() => cart.addToCart(product)} className="w-full h-12 rounded-xl text-white text-sm font-bold shadow-md transition-transform active:scale-[0.98] cursor-pointer" style={{ backgroundColor: primaryColor }}>Add to cart</button>
            )}
          </div>
          <button onClick={handleWishlist} disabled={wishlistBusy} className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${wishlisted ? 'border-red-200 text-red-500' : 'border-ink-200 text-ink-600'}`}>
            <Heart size={19} className={wishlisted ? 'fill-red-500' : ''} />
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="You may also like" onViewAll={() => undefined} />
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
            {related.map((item) => (
              <ProductCard
                key={item.id} product={item} quantity={cart.getQuantity(item.id)}
                onAdd={() => cart.addToCart(item)} onIncrement={() => cart.addToCart(item)}
                onDecrement={() => cart.updateQuantity(item.id, cart.getQuantity(item.id) - 1)}
                onClick={() => handleProductClick(item)} horizontal theme={theme}
                isWishlisted={wishlist.includes(item.id)} onWishlistToggle={toggleWishlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
