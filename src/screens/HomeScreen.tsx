// screens/HomeScreen.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Tag, RotateCcw, ChevronRight } from 'lucide-react';
import type { Category, Product, PromoBanner, Store, TrustedBrand } from '@/types';
import type { useCart } from '@/store';
import { SearchBar } from '@/components/SearchBar';
import { PromoCarousel } from '@/components/PromoBanner';
import { PromoAdBanner } from '@/components/PromoAdBanner';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCarousel } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { StoreCarousel } from '@/components/StoreCard';
import { BrandCarousel } from '@/components/BrandCard';
import {
  fetchCategories,
  fetchProducts,
  fetchHomeBanners,
  fetchStores,
  fetchTrustedBrands,
  fetchStoreConfig,
} from '@/services/catalog';

interface HomeScreenProps {
  search: string;
  onSearchChange: (value: string) => void;
  onProduct: (product: Product) => void;
  onViewAll: () => void;
  onStoreClick: (store: Store) => void;
  cart: ReturnType<typeof useCart>;
  onBannerAction?: (banner: PromoBanner) => void;
}

export function HomeScreen({
  search,
  onSearchChange,
  onProduct,
  onViewAll,
  onStoreClick,
  cart,
  onBannerAction,
}: HomeScreenProps) {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [brands, setBrands] = useState<TrustedBrand[]>([]);
  const [loading, setLoading] = useState(true);

  const [topBanner, setTopBanner] = useState<PromoBanner | null>(null);
  const [carouselBanners, setCarouselBanners] = useState<PromoBanner[]>([]);
  const [middleBanners, setMiddleBanners] = useState<PromoBanner[]>([]);
  const [bottomBanners, setBottomBanners] = useState<PromoBanner[]>([]);

  // Prefetch store config on hover (for instant loading)
  const prefetchStore = useCallback(async (storeId: string) => {
    try {
      await fetchStoreConfig(storeId);
    } catch (e) {
      // silently ignore – prefetch is optional
    }
  }, []);

  // Navigate to category detail (with gradient header)
  const openCategoryDetail = useCallback((category: Category) => {
    navigate(`/category?id=${category.id}`);
  }, [navigate]);

  useEffect(() => {
    void (async () => {
      try {
        const [catRes, prodRes, banners, storesRes, brandsRes] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
          fetchHomeBanners(),
          fetchStores(),
          fetchTrustedBrands(),
        ]);
        setCategories(catRes.categories);
        setProducts(prodRes.products);
        setStores(storesRes);
        setBrands(brandsRes);

        const top = banners.find((b) => b.position === 'top') || null;
        const carousel = banners.filter((b) => b.position === 'carousel');
        const middle = banners.filter((b) => b.position === 'middle');
        const bottom = banners.filter((b) => b.position === 'bottom');

        setTopBanner(top);
        setCarouselBanners(carousel);
        setMiddleBanners(middle);
        setBottomBanners(bottom);
      } catch (err) {
        console.error('Failed to load catalog', err);
      }
      setLoading(false);
    })();
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? products.filter((p) =>
        `${p.brand} ${p.name} ${p.category}`.toLowerCase().includes(query)
      )
    : products;
  const popular = filtered.slice(0, 8);
  const deals = filtered.slice(8, 16);
  const essentials = filtered.slice(16, 24);

  const actions = {
    getQuantity: cart.getQuantity,
    onAdd: cart.addToCart,
    onIncrement: (p: Product) => cart.addToCart(p),
    onDecrement: (p: Product) =>
      cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1),
    onProductClick: onProduct,
    onViewAll,
  };

  const renderActionBanner = (banner: PromoBanner) => {
    let bgStyle: React.CSSProperties = {};
    let bgClass = '';

    if (banner.bgType === 'image') {
      bgStyle = {
        backgroundImage: `url(${banner.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    } else if (banner.bgType === 'color') {
      bgStyle = { backgroundColor: banner.bgColor || '#16a34a' };
    } else if (banner.bgType === 'gradient') {
      bgClass = `bg-gradient-to-r ${banner.bgGradient || 'from-brand-600 to-brand-800'}`;
    }

    const overlayStyle: React.CSSProperties = {
      backgroundColor: banner.overlayColor || '#000000',
      opacity: (banner.overlayOpacity || 50) / 100,
    };

    const showImage = banner.bgType !== 'image' && banner.image;

    return (
      <div
        key={banner.id}
        className="relative overflow-hidden rounded-2xl h-[150px] flex items-center text-white shadow-card"
      >
        {banner.bgType === 'gradient' ? (
          <div className={`absolute inset-0 ${bgClass}`} />
        ) : (
          <div className="absolute inset-0" style={bgStyle} />
        )}
        {showImage && (
          <div className="absolute right-0 top-0 h-full w-2/5">
            <img
              src={banner.image}
              alt={banner.headline}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Banner';
              }}
            />
          </div>
        )}
        {banner.overlayEnabled && (
          <div className="absolute inset-0 z-10" style={overlayStyle} />
        )}
        <div className="relative z-20 px-4 py-3 w-3/5 h-full flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {banner.badge && (
              <span className="text-[9px] font-bold tracking-wider uppercase opacity-80">
                {banner.badge}
              </span>
            )}
            <h3 className="text-[17px] font-extrabold leading-tight mt-0.5 line-clamp-2">
              {banner.headline}
            </h3>
            <p className="text-[11px] opacity-80 mt-0.5 line-clamp-2">
              {banner.subtext}
            </p>
          </div>
          {banner.showCta !== false && (
            <button
              onClick={() => onBannerAction?.(banner)}
              className="flex-shrink-0 mt-2 bg-white text-ink-900 text-xs font-bold rounded-lg px-3.5 py-1.5 shadow-sm self-start"
            >
              {banner.cta}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6 pb-6">
      <SearchBar value={search} onChange={onSearchChange} onFilter={() => undefined} />

      {!query && topBanner && <PromoAdBanner banner={topBanner} />}

      {!query && carouselBanners.length > 0 && (
        <PromoCarousel banners={carouselBanners} onAction={onBannerAction} />
      )}

      {query ? (
        <div className="px-4">
          <p className="text-xs text-ink-500 mb-3">
            {filtered.length} products found for{' '}
            <span className="font-bold text-ink-700">“{search}”</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden"
              >
                <div
                  className="relative bg-ink-50 h-[132px] overflow-hidden cursor-pointer"
                  onClick={() => onProduct(p)}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Product';
                    }}
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wide truncate">
                    {p.brand}
                  </p>
                  <h3 className="text-[12px] font-bold text-ink-800 leading-tight mt-0.5 line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="text-[10px] text-ink-400 mt-1">{p.packSize}</p>
                  <div className="flex items-end justify-between gap-1 mt-2">
                    <div>
                      <p className="text-[10px] text-ink-400 line-through">₹{p.mrp}</p>
                      <p className="text-[15px] font-extrabold text-brand-700">₹{p.price}</p>
                    </div>
                    {cart.getQuantity(p.id) > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)
                          }
                          className="h-7 w-7 rounded-lg border border-brand-200 text-brand-700 font-bold"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold">{cart.getQuantity(p.id)}</span>
                        <button
                          onClick={() => cart.addToCart(p)}
                          className="h-7 w-7 rounded-lg border border-brand-200 text-brand-700 font-bold"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => cart.addToCart(p)}
                        className="h-8 px-2.5 rounded-lg bg-brand-600 text-white text-[11px] font-bold"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Category Grid – now navigates to category detail with inline gradient style */}
          <section className="px-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink-900 tracking-tight">
                  Shop by Category
                </h2>
                <p className="text-[11px] text-ink-500">Everything your business needs</p>
              </div>
              <button
                onClick={onViewAll}
                className="flex items-center text-xs font-semibold text-brand-600"
              >
                See all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {categories.slice(0, 20).map((category) => (
                <button
                  key={category.id}
                  onClick={() => openCategoryDetail(category)}
                  className="flex flex-col items-center gap-1.5 tap-highlight active:scale-95 transition-transform"
                >
                  <div
                    className="relative h-16 w-16 overflow-hidden rounded-2xl p-0.5 shadow-sm ring-1 ring-ink-100"
                    style={{ background: category.gradient || '#10b981' }}
                  >
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full rounded-[14px] object-cover transition-transform duration-200 hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Category';
                      }}
                    />
                  </div>
                  <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-ink-700">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Stores */}
          {stores.length > 0 && (
            <div>
              <SectionHeader
                title="Shop by Stores"
                subtitle="Curated collections"
                accent="bg-purple-600"
              />
              <StoreCarousel
                stores={stores}
                onStoreClick={onStoreClick}
                onPrefetch={prefetchStore}
              />
            </div>
          )}

          {/* Trusted Brands */}
          {brands.length > 0 && (
            <div>
              <SectionHeader
                title="Trusted Brands"
                subtitle="Quality you can rely on"
                accent="bg-blue-600"
              />
              <BrandCarousel brands={brands} />
            </div>
          )}

          {/* Popular Products */}
          {popular.length > 0 && (
            <ProductCarousel title="Popular Products" products={popular} {...actions} />
          )}

          {/* Middle Banners */}
          {middleBanners.length > 0 && (
            <section className="px-4">
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch pb-1">
                {middleBanners.map((banner) => (
                  <div key={banner.id} className="shrink-0 w-[85%] max-w-[340px]">
                    {renderActionBanner(banner)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Wholesale Deals */}
          {deals.length > 0 && (
            <ProductCarousel title="Wholesale Deals" products={deals} {...actions} />
          )}

          {/* Perks */}
          <section className="px-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-brand-50 border border-brand-100 p-3.5 min-h-[118px]">
                <Truck className="text-brand-600" size={21} />
                <h3 className="font-bold text-sm text-brand-900 mt-3">Fast delivery</h3>
                <p className="text-[10px] text-brand-700 mt-1">Same day in Bengaluru</p>
              </div>
              <div className="rounded-2xl bg-ink-50 border border-ink-200 p-3.5 min-h-[118px]">
                <ShieldCheck className="text-ink-600" size={21} />
                <h3 className="font-bold text-sm text-ink-800 mt-3">Quality assured</h3>
                <p className="text-[10px] text-ink-600 mt-1">Verified brands only</p>
              </div>
              <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3.5 min-h-[118px]">
                <Tag className="text-orange-600" size={21} />
                <h3 className="font-bold text-sm text-orange-900 mt-3">Best prices</h3>
                <p className="text-[10px] text-orange-700 mt-1">Wholesale rates daily</p>
              </div>
              <div className="rounded-2xl bg-sky-50 border border-sky-100 p-3.5 min-h-[118px]">
                <RotateCcw className="text-sky-600" size={21} />
                <h3 className="font-bold text-sm text-sky-900 mt-3">Easy returns</h3>
                <p className="text-[10px] text-sky-700 mt-1">Simple, hassle-free</p>
              </div>
            </div>
          </section>

          {/* Everyday Essentials */}
          {essentials.length > 0 && (
            <ProductCarousel title="Everyday Essentials" products={essentials} {...actions} />
          )}

          {/* Bottom Banners */}
          {bottomBanners.length > 0 && (
            <section className="px-4">
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch pb-1">
                {bottomBanners.map((banner) => (
                  <div key={banner.id} className="shrink-0 w-[85%] max-w-[340px]">
                    {renderActionBanner(banner)}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}