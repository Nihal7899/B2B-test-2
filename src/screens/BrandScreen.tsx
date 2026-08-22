// screens/BrandScreen.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, ChevronRight, ShieldCheck, Truck, Star, Search, X } from 'lucide-react';
import { fetchBrandById, fetchProducts, fetchWishlist, toggleWishlist } from '@/services/catalog';
import type { TrustedBrand, Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { useCart } from '@/store';
import { getStoreIcon } from '@/data/storeIcons';

// Helper: render icon (Lucide or custom image)
function renderIcon(iconName: string, className: string = "h-6 w-6", color?: string) {
  if (iconName?.startsWith('http') || iconName?.startsWith('data:')) {
    return <img src={iconName} alt="icon" className={className + " object-contain"} />;
  }
  const Icon = getStoreIcon(iconName);
  return <Icon className={className} style={{ color }} />;
}

// Bottom icon (shield, crown, leaf)
function BottomIcon({ type }: { type: 'shield' | 'crown' | 'leaf' }) {
  if (type === 'crown') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m3 7 4 4 5-7 5 7 4-4-2 11H5L3 7Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 21h14" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'leaf') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 4C11 4 5 7 5 13c0 3 2 5 5 5 6 0 9-6 10-14Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 21c3-6 7-9 13-12" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 20 6v5c0 5.2-3.4 8.5-8 10-4.6-1.5-8-4.8-8-10V6l8-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Color helpers
const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 59, g: 130, b: 246 };
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
};

const getLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const values = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
};

// Trust item component
function TrustItem({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon size={18} className="text-emerald-600" />
      <span className="text-xs font-bold text-gray-800">{label}</span>
      <span className="text-[10px] text-gray-400">{sub}</span>
    </div>
  );
}

// Main component
function BrandScreenContent({ brandId }: { brandId: string }) {
  const navigate = useNavigate();
  const cart = useCart();

  const [brand, setBrand] = useState<TrustedBrand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Search state
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!brandId) {
      navigate('/');
      return;
    }
    (async () => {
      const b = await fetchBrandById(brandId);
      if (!b) {
        navigate('/');
        return;
      }
      setBrand(b);
      // Fetch products with this brand name (case-insensitive)
      const { products: allProducts } = await fetchProducts();
      const filtered = allProducts.filter(p => p.brand.toLowerCase() === b.name.toLowerCase());
      setProducts(filtered);
      const wl = await fetchWishlist();
      setWishlist(wl);
      setLoading(false);
    })();
  }, [brandId, navigate]);

  const handleWishlistToggle = async (productId: string) => {
    const isWishlisted = wishlist.includes(productId);
    await toggleWishlist(productId, isWishlisted);
    if (isWishlisted) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  // Filter logic for search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const hasActiveFilter = !!searchQuery.trim();

  const clearFilter = () => {
    setSearchQuery('');
    setSearchOpen(false);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  };

  if (loading || !brand) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  const {
    primary_color = '#3B82F6',
    secondary_color = '#1E40AF',
    logo_url,
    name,
    tagline,
    categories: brandCategories = [],
    bottom_label,
    bottom_icon = 'shield',
    description,
    config = {},
  } = brand;

  const primaryRgb = hexToRgb(primary_color);
  const isLightBackground = getLuminance(primary_color) > 0.68;
  const textColor = isLightBackground ? '#111827' : '#ffffff';

  // Brand config sections
  const highlights = config.highlights || [];
  const categories = config.categories || [];
  const bulkDeal = config.bulkDeal || { enabled: false, tag: '', title: '', subtitle: '', cta: '', icon: 'Package', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' };
  const trending = config.trending || { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' };

  // Product card theme
  const productCardTheme = {
    primaryColor: primary_color,
    secondaryColor: secondary_color,
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
    buttonStyle: 'brand' as const,
    cardRadius: 'xl' as const,
    shadowIntensity: 'md' as const,
    gradientFrom: primary_color,
    gradientTo: secondary_color,
  };

  const scrollToCategory = (categoryId: string) => {
    const el = categoryRefs.current[categoryId];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Filter active categories (those with at least one product)
  const activeCategories = categories.filter((cat: any) =>
    products.some(p => cat.productIds?.includes(p.id))
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ===== HERO (same as BrandCard design) ===== */}
      <div className="relative overflow-hidden pt-12 pb-8 px-4 isolate">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(
                circle at 50% 15%,
                rgba(255,255,255,0.18),
                transparent 30%
              ),
              linear-gradient(
                145deg,
                ${primary_color} 0%,
                ${primary_color} 45%,
                ${secondary_color} 100%
              )
            `,
          }}
        />
        <div
          className="absolute -left-12 -top-8 h-32 w-32 rounded-full blur-2xl"
          style={{ background: `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.35)` }}
        />
        <div className="absolute -right-10 top-20 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.13]" viewBox="0 0 180 270" preserveAspectRatio="none">
          <circle cx="-10" cy="50" r="50" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="-10" cy="50" r="36" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="190" cy="74" r="34" fill="none" stroke="white" strokeWidth="1" />
          <path d="M-20 158 C40 126 90 153 205 112" fill="none" stroke="white" strokeWidth="1.2" />
          <path d="M-20 165 C45 133 97 160 205 120" fill="none" stroke="white" strokeWidth="0.8" />
          <circle cx="150" cy="34" r="2" fill="white" />
          <circle cx="162" cy="43" r="1.5" fill="white" />
          <circle cx="141" cy="44" r="1" fill="white" />
        </svg>
        <div className="absolute right-3 top-3 z-10 grid grid-cols-3 gap-[3px] opacity-25">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-[2.5px] w-[2.5px] rounded-full bg-white" />
          ))}
        </div>
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-40 h-[80px] bg-gradient-to-b from-white/[0.12] to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-md"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center text-center" style={{ color: textColor }}>
          <div className="h-24 w-24 rounded-2xl border-2 border-white/40 bg-white p-2 shadow-lg mb-4 flex items-center justify-center">
            <img src={logo_url} alt={name} className="max-h-full max-w-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{name}</h1>
          {tagline && <p className="mt-1 text-sm opacity-90">{tagline}</p>}
          {brandCategories.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {brandCategories.slice(0, 3).map((cat) => (
                <span key={cat} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  {cat}
                </span>
              ))}
            </div>
          )}
          {description && <p className="mt-4 max-w-md text-sm leading-relaxed opacity-95">{description}</p>}
          {(bottom_label || bottom_icon) && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-1.5 text-white backdrop-blur-md border border-white/20">
              <BottomIcon type={bottom_icon} />
              <span className="text-xs font-semibold">{bottom_label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Highlights strip */}
      {highlights.length > 0 && (
        <div className="mx-auto max-w-md px-4 mt-4">
          <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-lg">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">What's in this brand</p>
            <div className="grid grid-cols-4 gap-2">
              {highlights.map((h: any) => (
                <button
                  key={h.id}
                  onClick={() => h.categoryId && scrollToCategory(h.categoryId)}
                  className="flex flex-col items-center gap-1 rounded-xl p-1.5 transition hover:bg-gray-50"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition"
                    style={{ background: `${primary_color}15`, color: primary_color }}
                  >
                    {renderIcon(h.icon, "h-6 w-6", primary_color)}
                  </div>
                  <span className="text-center text-[9px] font-semibold leading-tight text-gray-600">{h.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky search bar */}
      <div className="sticky top-0 z-30 bg-gray-50/95 px-4 pt-3 pb-2 backdrop-blur-lg mt-2">
        <div className="mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-white p-2 shadow-md ring-1 ring-black/5">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search this brand…"
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-1">
            {searchQuery && (
              <button onClick={clearFilter} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
            <button
              onClick={toggleSearch}
              className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
            >
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 mt-4 space-y-6">
        {/* Bulk Deal Banner */}
        {bulkDeal.enabled && !hasActiveFilter && (
          <div>
            <div
              className="relative overflow-hidden rounded-2xl p-4 shadow-lg"
              style={{ background: `linear-gradient(120deg, ${primary_color}, ${secondary_color})` }}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-8 right-8 h-16 w-16 rounded-full bg-white/5" />
              <div className="relative flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner bg-white/20 text-white">
                  {renderIcon(bulkDeal.icon, "h-6 w-6", "#ffffff")}
                </div>
                <div className="flex-1 text-white">
                  <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold tracking-wider">
                    {bulkDeal.tag}
                  </span>
                  <h4 className="mt-1 text-base font-extrabold leading-tight">{bulkDeal.title}</h4>
                  <p className="text-[11px] text-white/80">{bulkDeal.subtitle}</p>
                </div>
              </div>
              <button
                className="mt-3 flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold shadow transition hover:scale-105"
                style={{ backgroundColor: bulkDeal.ctaBgColor || '#ffffff', color: bulkDeal.ctaTextColor || '#065f46' }}
              >
                {bulkDeal.cta} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Search Results or Categories */}
        {hasActiveFilter ? (
          <div>
            <h3 className="mb-3 text-sm font-bold text-gray-800">Search results ({filteredProducts.length})</h3>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search size={32} className="mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No products match "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    quantity={cart.getQuantity(p.id)}
                    onAdd={() => cart.addToCart(p)}
                    onIncrement={() => cart.addToCart(p)}
                    onDecrement={() => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)}
                    onClick={() => navigate(`/product?id=${p.id}&brandId=${brand.id}`)}
                    theme={productCardTheme}
                    isWishlisted={wishlist.includes(p.id)}
                    onWishlistToggle={handleWishlistToggle}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {activeCategories.map((category: any, index: number) => {
              const categoryProducts = products.filter(p => category.productIds?.includes(p.id));
              if (categoryProducts.length === 0) return null;

              const categoryElement = (
                <div
                  key={category.id}
                  ref={(el) => { categoryRefs.current[category.id] = el; }}
                >
                  <div className="mb-2.5 flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: `${primary_color}15`, color: primary_color }}
                    >
                      {renderIcon(category.icon, "h-4 w-4", primary_color)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-800">{category.title}</h3>
                      <p className="text-[10px] text-gray-400">{category.description}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{categoryProducts.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryProducts.slice(0, 4).map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        quantity={cart.getQuantity(p.id)}
                        onAdd={() => cart.addToCart(p)}
                        onIncrement={() => cart.addToCart(p)}
                        onDecrement={() => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)}
                        onClick={() => navigate(`/product?id=${p.id}&brandId=${brand.id}`)}
                        theme={productCardTheme}
                        isWishlisted={wishlist.includes(p.id)}
                        onWishlistToggle={handleWishlistToggle}
                      />
                    ))}
                  </div>
                </div>
              );

              // Insert Trending Banner after 3rd category (index === 2)
              if (index === 2 && trending.enabled) {
                return (
                  <React.Fragment key={`group-${category.id}`}>
                    {categoryElement}
                    <div className="my-6">
                      <div
                        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl"
                        style={{ background: `linear-gradient(135deg, ${primary_color}, ${secondary_color})` }}
                      >
                        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
                        <div className="pointer-events-none absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-black/10 blur-xl" />
                        <div className="pointer-events-none absolute right-6 bottom-4 h-16 w-16 rounded-full border-4 border-white/10" />

                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                              <TrendingUp size={18} />
                            </div>
                            <div>
                              <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold tracking-wider">
                                TRENDING IN BRAND
                              </span>
                              <h4 className="mt-0.5 text-lg font-extrabold leading-tight">{trending.title}</h4>
                            </div>
                          </div>

                          <p className="mt-2 text-[12px] text-white/80">{trending.subtitle}</p>

                          <div className="mt-4 grid grid-cols-4 gap-2.5">
                            {trending.iconButtons.map((btn: any) => (
                              <button
                                key={btn.id}
                                onClick={() => btn.categoryId && scrollToCategory(btn.categoryId)}
                                className="group flex flex-col items-center gap-1.5 rounded-2xl bg-white/15 p-2.5 backdrop-blur transition hover:bg-white/25"
                              >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 transition group-hover:scale-110">
                                  {renderIcon(btn.icon, "h-5 w-5", "#ffffff")}
                                </div>
                                <span className="text-center text-[9px] font-semibold leading-tight text-white">{btn.label}</span>
                              </button>
                            ))}
                          </div>

                          <button
                            className="mt-4 flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold shadow transition hover:scale-105"
                            style={{ backgroundColor: trending.ctaBgColor || '#ffffff', color: trending.ctaTextColor || '#065f46' }}
                          >
                            {trending.ctaText} <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              }

              return categoryElement;
            })}
          </div>
        )}
      </div>

      {/* Trust footer */}
      <div className="mx-auto max-w-md px-4 mt-6">
        <div className="flex items-center justify-around rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <TrustItem icon={ShieldCheck} label="Quality" sub="Assured" />
          <div className="h-8 w-px bg-gray-100" />
          <TrustItem icon={Truck} label="Bulk" sub="Pricing" />
          <div className="h-8 w-px bg-gray-100" />
          <TrustItem icon={Star} label="Trusted" sub="Brand" />
        </div>
      </div>
    </div>
  );
}

// Wrap with React.memo to prevent re-mount on navigation
export const BrandScreen = React.memo(() => {
  const [searchParams] = useSearchParams();
  // 🔥 Freeze the brandId on initial mount so it doesn't become null when navigating away
  const [brandId] = useState(() => searchParams.get('id'));
  const navigate = useNavigate();

  if (!brandId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <p className="text-ink-600">Brand ID missing</p>
        <button onClick={() => navigate(-1)} className="text-brand-600 font-bold">Go back</button>
      </div>
    );
  }

  return <BrandScreenContent brandId={brandId} />;
});
