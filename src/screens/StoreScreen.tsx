// screens/StoreScreen.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { useCart } from '@/store';
import { fetchProductsByIds, fetchStores, toggleWishlist, fetchWishlist } from '@/services/catalog';
import type { Product as AppProduct, Store } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { getStoreIcon } from '@/data/storeIcons';
import {
  ChevronLeft,
  Search,
  ShoppingCart,
  ChevronRight,
  X,
  ArrowLeft,
  Star,
  TrendingUp,
  Package,
  ShieldCheck,
  Truck,
  Clock,
} from 'lucide-react';

interface StoreScreenProps {
  goTo: (screen: string) => void;
}

// Helper to render either a Lucide icon or a custom image
function renderIcon(iconName: string, className: string = "h-6 w-6", color?: string) {
  if (iconName?.startsWith('http') || iconName?.startsWith('data:')) {
    return <img src={iconName} alt="icon" className={className + " object-contain"} />;
  }
  const Icon = getStoreIcon(iconName);
  return <Icon className={className} style={{ color: color }} />;
}

function StoreScreenContent({ goTo }: StoreScreenProps) {
  const { config, loading, theme, storeId } = useStore();
  const navigate = useNavigate();
  const cart = useCart();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [wishlist, setWishlist] = useState<string[]>([]);

  // 🔥 Ref to prevent re‑fetch when restored from cache
  const dataFetchedRef = useRef<Record<string, boolean>>({});

  if (!config) return <StoreSkeleton />;

  const {
    hero = { enabled: true, image: '', gradientFrom: '#065f46', gradientTo: '#16a34a', title: '', subtitle: '', ctaText: 'Shop Now', ctaLink: '/categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
    highlights = [],
    categories = [],
    bulkDeal = { enabled: false, tag: '', title: '', subtitle: '', cta: '', icon: 'Package', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
    trending = { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
  } = config;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  // Get all product IDs from all categories
  const allProductIds = useMemo(() => {
    const ids: string[] = [];
    categories.forEach((cat: any) => {
      cat.productIds.forEach((id: string) => {
        if (!ids.includes(id)) ids.push(id);
      });
    });
    return ids;
  }, [categories]);

  // 🔥 Fetch product details – skip if already fetched for this store
  useEffect(() => {
    if (dataFetchedRef.current[storeId]) {
      // Already fetched, just set loading to false if needed
      if (productsLoading) setProductsLoading(false);
      return;
    }
    if (allProductIds.length === 0) {
      setProducts([]);
      setProductsLoading(false);
      dataFetchedRef.current[storeId] = true;
      return;
    }
    setProductsLoading(true);
    fetchProductsByIds(allProductIds)
      .then(data => {
        setProducts(data);
        dataFetchedRef.current[storeId] = true;
      })
      .catch(console.error)
      .finally(() => setProductsLoading(false));
  }, [allProductIds, storeId]);

  // Fetch wishlist
  useEffect(() => {
    fetchWishlist().then(setWishlist).catch(() => {});
  }, []);

  // Filter logic (only for search)
  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategoryId) {
      const cat = categories.find((c: any) => c.id === selectedCategoryId);
      if (cat) {
        result = result.filter(p => cat.productIds.includes(p.id));
      }
    }
    return result;
  }, [products, searchQuery, selectedCategoryId, categories]);

  // Handlers – scroll to category
  const scrollToCategory = (categoryId: string) => {
    const el = categoryRefs.current[categoryId];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleIconClick = (categoryId: string) => {
    if (categoryId) {
      scrollToCategory(categoryId);
    }
  };

  const clearFilter = () => {
    setSelectedCategoryId(null);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  };

  const hasActiveFilter = !!(selectedCategoryId || searchQuery.trim());

  const themeFrom = hero.gradientFrom || '#065f46';
  const themeTo = hero.gradientTo || '#16a34a';
  const heroCtaBg = hero.ctaBgColor || '#ffffff';
  const heroCtaText = hero.ctaTextColor || '#065f46';

  // Theme for product cards
  const productCardTheme = {
    primaryColor: themeFrom,
    secondaryColor: themeTo,
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
    buttonStyle: 'brand' as const,
    cardRadius: 'xl' as const,
    shadowIntensity: 'md' as const,
    gradientFrom: themeFrom,
    gradientTo: themeTo,
  };

  // Wishlist toggle handler
  const handleWishlistToggle = async (productId: string) => {
    const isWishlisted = wishlist.includes(productId);
    await toggleWishlist(productId, isWishlisted);
    if (isWishlisted) {
      setWishlist(wishlist.filter(id => id !== productId));
    } else {
      setWishlist([...wishlist, productId]);
    }
  };

  if (loading) return <StoreSkeleton />;
  if (productsLoading) return <StoreSkeleton />;

  // Filter categories that have at least one product
  const activeCategories = categories.filter((cat: any) =>
    products.some(p => cat.productIds.includes(p.id))
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero header */}
      <div
        className="relative overflow-hidden px-4 pb-6 pt-4 text-white shadow-xl"
        style={{ background: `linear-gradient(135deg, ${themeFrom}, ${themeTo})` }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-black/10 blur-2xl" />
        <div className="pointer-events-none absolute right-4 top-20 h-20 w-20 rounded-full border-4 border-white/10" />

        <div className="relative mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30">
              <ArrowLeft size={18} />
            </button>
            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold tracking-wider backdrop-blur">
              CURATED STORE
            </span>
            <div className="w-9" />
          </div>

          <div className="mt-4 flex items-end gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white/40 shadow-lg">
              <img src={hero.image || ''} alt={hero.title} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-extrabold leading-tight">{hero.title}</h1>
              <p className="text-xs text-white/80">{hero.subtitle}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <Star size={11} className="fill-yellow-300 text-yellow-300" /> 4.7
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> 30 min
                </span>
                <span className="flex items-center gap-1">
                  <Truck size={11} /> Free
                </span>
              </div>
            </div>
          </div>

          {hero.ctaText && (
            <div className="mt-4 rounded-xl bg-white/15 p-3 backdrop-blur">
              <button
                onClick={() => navigate(hero.ctaLink || '/categories')}
                className="flex items-center gap-1.5 text-xs font-bold rounded-lg px-4 py-2"
                style={{ backgroundColor: heroCtaBg, color: heroCtaText }}
              >
                {hero.ctaText}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Highlights icon strip */}
      {highlights.length > 0 && (
        <div className="mx-auto max-w-md px-4 mt-4">
          <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-lg">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">What's in this store</p>
            <div className="grid grid-cols-4 gap-2">
              {highlights.map((h: any) => (
                <button
                  key={h.id}
                  onClick={() => handleIconClick(h.categoryId)}
                  className="flex flex-col items-center gap-1 rounded-xl p-1.5 transition hover:bg-gray-50"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition"
                    style={{ background: `${themeFrom}15`, color: themeFrom }}
                  >
                    {renderIcon(h.icon, "h-6 w-6", themeFrom)}
                  </div>
                  <span className="text-center text-[9px] font-semibold leading-tight text-gray-600">{h.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sticky search bar */}
      <div className="sticky top-0 z-30 bg-gray-50/95 px-4 pt-3 pb-2 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-white p-2 shadow-md ring-1 ring-black/5">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search this store…"
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

      <div className="mx-auto max-w-md px-4">
        {/* Bulk Deal Banner */}
        {bulkDeal.enabled && (
          <div className="mt-3">
            <BulkDealBanner
              themeFrom={themeFrom}
              themeTo={themeTo}
              tag={bulkDeal.tag}
              title={bulkDeal.title}
              subtitle={bulkDeal.subtitle}
              cta={bulkDeal.cta}
              icon={bulkDeal.icon}
              ctaBgColor={bulkDeal.ctaBgColor || '#ffffff'}
              ctaTextColor={bulkDeal.ctaTextColor || '#065f46'}
              renderIcon={renderIcon}
            />
          </div>
        )}

        {/* Search results or categories */}
        {hasActiveFilter ? (
          <div className="mt-4">
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
                    onClick={() => navigate(`/product?id=${p.id}`)}
                    theme={productCardTheme}
                    isWishlisted={wishlist.includes(p.id)}
                    onWishlistToggle={handleWishlistToggle}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Categories - with trending banner after 3rd category */}
            {activeCategories.map((category: any, index: number) => {
              const categoryProducts = products.filter(p => category.productIds.includes(p.id));
              if (categoryProducts.length === 0) return null;

              const categoryElement = (
                <div
                  key={category.id}
                  ref={(el) => { categoryRefs.current[category.id] = el; }}
                >
                  <div className="mb-2.5 flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: `${themeFrom}15`, color: themeFrom }}
                    >
                      {renderIcon(category.icon, "h-4 w-4", themeFrom)}
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
                        onClick={() => navigate(`/product?id=${p.id}`)}
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
                    <TrendingBanner
                      themeFrom={themeFrom}
                      themeTo={themeTo}
                      title={trending.title}
                      subtitle={trending.subtitle}
                      iconButtons={trending.iconButtons}
                      ctaText={trending.ctaText}
                      ctaBgColor={trending.ctaBgColor || '#ffffff'}
                      ctaTextColor={trending.ctaTextColor || '#065f46'}
                      onIconClick={handleIconClick}
                      renderIcon={renderIcon}
                    />
                  </React.Fragment>
                );
              }

              return categoryElement;
            })}
          </div>
        )}

        {/* Trust footer */}
        <div className="mt-6 flex items-center justify-around rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <TrustItem icon={ShieldCheck} label="Verified" sub="Sellers" />
          <div className="h-8 w-px bg-gray-100" />
          <TrustItem icon={Truck} label="Free" sub="Over ₹5000" />
          <div className="h-8 w-px bg-gray-100" />
          <TrustItem icon={Package} label="Bulk" sub="Pricing" />
        </div>
      </div>
    </div>
  );
}

// ---- Helpers ----
function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="h-64 bg-gray-200 animate-pulse" />
      <div className="px-4 py-4">
        <div className="h-20 bg-white rounded-2xl animate-pulse" />
      </div>
      <div className="px-4 py-2">
        <div className="h-12 bg-white rounded-2xl animate-pulse" />
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="h-40 bg-white rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
          <div className="h-48 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function BulkDealBanner({
  themeFrom,
  themeTo,
  tag,
  title,
  subtitle,
  cta,
  icon,
  ctaBgColor,
  ctaTextColor,
  renderIcon,
}: {
  themeFrom: string;
  themeTo: string;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  icon: string;
  ctaBgColor: string;
  ctaTextColor: string;
  renderIcon: (name: string, className?: string, color?: string) => React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 shadow-lg"
      style={{ background: `linear-gradient(120deg, ${themeFrom}, ${themeTo})` }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 right-8 h-16 w-16 rounded-full bg-white/5" />

      <div className="relative flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner bg-white/20 text-white"
        >
          {renderIcon(icon, "h-6 w-6", "#ffffff")}
        </div>
        <div className="flex-1 text-white">
          <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold tracking-wider">
            {tag}
          </span>
          <h4 className="mt-1 text-base font-extrabold leading-tight">{title}</h4>
          <p className="text-[11px] text-white/80">{subtitle}</p>
        </div>
      </div>
      <button
        className="mt-3 flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold shadow transition hover:scale-105"
        style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
      >
        {cta} <ChevronRight size={14} />
      </button>
    </div>
  );
}

function TrendingBanner({
  themeFrom,
  themeTo,
  title,
  subtitle,
  iconButtons,
  ctaText,
  ctaBgColor,
  ctaTextColor,
  onIconClick,
  renderIcon,
}: {
  themeFrom: string;
  themeTo: string;
  title: string;
  subtitle: string;
  iconButtons: any[];
  ctaText: string;
  ctaBgColor: string;
  ctaTextColor: string;
  onIconClick: (id: string) => void;
  renderIcon: (name: string, className?: string, color?: string) => React.ReactNode;
}) {
  return (
    <div className="my-6">
      <div
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl"
        style={{ background: `linear-gradient(135deg, ${themeFrom}, ${themeTo})` }}
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
                TRENDING IN STORE
              </span>
              <h4 className="mt-0.5 text-lg font-extrabold leading-tight">{title}</h4>
            </div>
          </div>

          <p className="mt-2 text-[12px] text-white/80">{subtitle}</p>

          <div className="mt-4 grid grid-cols-4 gap-2.5">
            {iconButtons.map((btn: any) => (
              <button
                key={btn.id}
                onClick={() => onIconClick(btn.categoryId)}
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
            style={{ backgroundColor: ctaBgColor, color: ctaTextColor }}
          >
            {ctaText} <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrustItem({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon size={18} className="text-emerald-600" />
      <span className="text-xs font-bold text-gray-800">{label}</span>
      <span className="text-[10px] text-gray-400">{sub}</span>
    </div>
  );
}

// 🔥 Memoize the whole component to prevent re‑mount on navigation
const MemoizedStoreScreen = React.memo(StoreScreenContent);

export default function StoreScreen(props: StoreScreenProps) {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const navigate = useNavigate();

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <p className="text-ink-600">Store ID missing</p>
        <button onClick={() => navigate(-1)} className="text-brand-600 font-bold">Go back</button>
      </div>
    );
  }

  return (
    <StoreProvider storeId={storeId}>
      <MemoizedStoreScreen {...props} />
    </StoreProvider>
  );
}