// screens/StoreScreen.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { useCart } from '@/store';
import { fetchProductsByIds, fetchStores } from '@/services/catalog';
import type { Product as AppProduct, Store } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { getStoreIcon } from '@/data/storeIcons'; // create this file (see below)
import {
  ChevronLeft,
  Search,
  ShoppingCart,
  ChevronRight,
  X,
  ArrowLeft,
  BadgeCheck,
  Clock,
  Package,
  ShieldCheck,
  Star,
  TrendingUp,
  Truck,
} from 'lucide-react';

interface StoreScreenProps {
  goTo: (screen: string) => void;
}

function StoreScreenContent({ goTo }: StoreScreenProps) {
  const { config, loading } = useStore();
  const navigate = useNavigate();
  const cart = useCart();
  const searchInputRef = useRef<HTMLInputElement>(null);

  if (!config) return <StoreSkeleton />;

  const {
    header = { title: 'Store', subtitle: '', cartBadgeCount: 0 },
    blurb = '',
    trustBadge = '',
    story = '',
    highlights = [],
    banners = [],
    storeTheme = { from: '#10b981', to: '#059669', accent: '#fbbf24' },
    categories = [],
    packaging = [],
    otherStores = [],
    iconGrid = [],
    dietaryNeeds = [],
    promoBanner = { badge: '', title: '', subtitle: '', backgroundTheme: 'bg-gray-100', floatingProductImages: [] },
  } = config;

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [otherStoreDetails, setOtherStoreDetails] = useState<Store[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch product IDs from categories and highlights
  const allProductIds = useMemo(() => {
    const ids: string[] = [];
    categories.forEach(cat => {
      cat.productIds.forEach(id => {
        if (!ids.includes(id)) ids.push(id);
      });
    });
    highlights.forEach(h => {
      h.productIds.forEach(id => {
        if (!ids.includes(id)) ids.push(id);
      });
    });
    return ids;
  }, [categories, highlights]);

  // Fetch product details
  useEffect(() => {
    if (allProductIds.length === 0) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    setProductsLoading(true);
    fetchProductsByIds(allProductIds)
      .then(data => {
        setProducts(data);
      })
      .catch(console.error)
      .finally(() => setProductsLoading(false));
  }, [allProductIds]);

  // Fetch other store details
  useEffect(() => {
    if (otherStores.length === 0) return;
    const storeIds = otherStores.map(s => s.storeId);
    fetchStores().then(allStores => {
      const filtered = allStores.filter(s => storeIds.includes(s.id));
      setOtherStoreDetails(filtered);
    });
  }, [otherStores]);

  // Filter logic
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
      const cat = categories.find(c => c.id === selectedCategoryId);
      if (cat) {
        result = result.filter(p => cat.productIds.includes(p.id));
      }
    }
    return result;
  }, [products, searchQuery, selectedCategoryId, categories]);

  // Handlers
  const handleIconClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const handleDietaryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery('');
    setSearchOpen(false);
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

  const scrollToHighlight = (id: string) => {
    setActiveHighlight(id);
    const el = sectionRefs.current[id];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const themeFrom = storeTheme?.from || '#10b981';
  const themeTo = storeTheme?.to || '#059669';
  const accent = storeTheme?.accent || '#fbbf24';

  if (loading) return <StoreSkeleton />;
  if (productsLoading) return <StoreSkeleton />;

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
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold tracking-wider"
              style={{ backgroundColor: accent, color: themeFrom }}
            >
              CURATED STORE
            </span>
            <div className="w-9" />
          </div>

          <div className="mt-4 flex items-end gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white/40 shadow-lg">
              <img src={header.image || header.image_url || ''} alt={header.title} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-extrabold leading-tight">{header.title}</h1>
              <p className="text-xs text-white/80">{header.subtitle}</p>
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

          <div className="mt-4 rounded-xl bg-white/15 p-3 backdrop-blur">
            <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: accent }}>
              <BadgeCheck size={14} /> {trustBadge || 'Verified store'}
            </span>
            <p className="mt-1 text-[12px] leading-snug text-white/85">{story || blurb}</p>
          </div>
        </div>
      </div>

      {/* Highlights icon strip */}
      {highlights.length > 0 && (
        <div className="mx-auto max-w-md px-4">
          <div className="-mt-3 mb-0 overflow-hidden rounded-2xl bg-white p-3 shadow-lg">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">What's in this store</p>
            <div className="grid grid-cols-4 gap-2">
              {highlights.map((h) => {
                const Icon = getStoreIcon(h.icon);
                const active = activeHighlight === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => scrollToHighlight(h.id)}
                    className="flex flex-col items-center gap-1 rounded-xl p-1.5 transition hover:bg-gray-50"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl transition"
                      style={{
                        background: active
                          ? `linear-gradient(135deg, ${themeFrom}, ${themeTo})`
                          : `${themeFrom}15`,
                        color: active ? '#fff' : themeFrom,
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span className="text-center text-[9px] font-semibold leading-tight text-gray-600">{h.label}</span>
                  </button>
                );
              })}
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
        {/* Banners */}
        {banners.length > 0 && banners.map((banner, idx) => {
          const Icon = getStoreIcon(banner.icon);
          return (
            <div key={banner.id} className="mt-3">
              <StoreBanner
                themeFrom={themeFrom}
                themeTo={themeTo}
                accent={accent}
                tag={banner.tag}
                title={banner.title}
                sub={banner.sub}
                cta={banner.cta}
                Icon={Icon}
              />
            </div>
          );
        })}

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
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Categories */}
            {categories.map((category) => {
              const categoryProducts = products.filter(p => category.productIds.includes(p.id));
              if (categoryProducts.length === 0) return null;
              return (
                <div key={category.id}>
                  <div className="mb-2.5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800">{category.title}</h3>
                    <button
                      onClick={() => handleIconClick(category.id)}
                      className="text-xs font-semibold text-emerald-600 flex items-center"
                    >
                      See all <ChevronRight size={14} />
                    </button>
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
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Highlights sections */}
            {highlights.map((h, idx) => {
              const sectionProducts = products.filter(p => h.productIds.includes(p.id));
              if (sectionProducts.length === 0) return null;
              const Icon = getStoreIcon(h.icon);
              return (
                <div
                  key={h.id}
                  ref={(el) => {
                    sectionRefs.current[h.id] = el;
                  }}
                >
                  <div className="mb-2.5 flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: `${themeFrom}15`, color: themeFrom }}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-800">{h.label}</h3>
                      <p className="text-[10px] text-gray-400">{h.desc}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{sectionProducts.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {sectionProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        quantity={cart.getQuantity(p.id)}
                        onAdd={() => cart.addToCart(p)}
                        onIncrement={() => cart.addToCart(p)}
                        onDecrement={() => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)}
                        onClick={() => navigate(`/product?id=${p.id}`)}
                      />
                    ))}
                  </div>
                </div>
              );
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

// ---- helpers ----
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

function StoreBanner({
  themeFrom,
  themeTo,
  accent,
  tag,
  title,
  sub,
  cta,
  Icon,
}: {
  themeFrom: string;
  themeTo: string;
  accent: string;
  tag: string;
  title: string;
  sub: string;
  cta: string;
  Icon: any;
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
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-inner"
          style={{ backgroundColor: accent, color: themeFrom }}
        >
          <Icon size={24} />
        </div>
        <div className="flex-1 text-white">
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider"
            style={{ backgroundColor: accent, color: themeFrom }}
          >
            {tag}
          </span>
          <h4 className="mt-1 text-base font-extrabold leading-tight">{title}</h4>
          <p className="text-[11px] text-white/80">{sub}</p>
        </div>
      </div>
      <button
        className="mt-3 flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-bold shadow transition hover:scale-105"
        style={{ backgroundColor: accent, color: themeFrom }}
      >
        {cta} <ChevronRight size={14} />
      </button>
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
      <StoreScreenContent {...props} />
    </StoreProvider>
  );
}