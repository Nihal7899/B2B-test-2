// screens/CategoryScreen.tsx
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { fetchCategories, fetchProductsBySubcategory } from '@/services/catalog';
import type { Category, Subcategory, Product } from '@/types';

interface CategoryScreenProps {
  onBack: () => void;
  onProduct: (product: Product) => void;
  cart: any; // your cart store/hook
}

export function CategoryScreen({ onBack, onProduct, cart }: CategoryScreenProps) {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('id');
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [activeSubId, setActiveSubId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!categoryId) return;
    (async () => {
      try {
        const { categories } = await fetchCategories();
        const found = categories.find(c => c.id === categoryId);
        if (found) {
          setCategory(found);
          const subs = found.subcategories || [];
          setSubcategories(subs);
          if (subs.length) setActiveSubId(subs[0].id);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [categoryId]);

  useEffect(() => {
    if (!activeSubId) return;
    (async () => {
      const prods = await fetchProductsBySubcategory(activeSubId);
      setProducts(prods);
    })();
  }, [activeSubId]);

  const filteredProducts = useMemo(() => {
    if (!query) return products;
    return products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [products, query]);

  const categoryTheme = useMemo(() => {
    if (!category) return undefined;
    return {
      primaryColor: category.gradient || '#10b981',
      gradientFrom: category.gradient || '#10b981',
      gradientTo: category.gradient || '#10b981',
    };
  }, [category]);

  if (loading || !category) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Category-specific header (hides main app header) */}
      <div
        className="sticky top-0 z-40 px-4 pb-3 pt-4 text-white shadow-lg"
        style={{ background: category.gradient || '#10b981' }}
      >
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1">
              <p className="text-xs text-white/70">Category</p>
              <h2 className="text-lg font-bold">{category.name}</h2>
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <SlidersHorizontal size={16} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white px-3 py-2.5 shadow">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search in ${category.name}…`}
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-md">
        {/* Vertical subcategory strip */}
        <aside className="sticky top-[140px] h-[calc(100vh-140px)] w-24 shrink-0 overflow-y-auto border-r border-gray-100 bg-white py-2 scrollbar-hide">
          {subcategories.map((sc) => {
            const active = sc.id === activeSubId;
            return (
              <button
                key={sc.id}
                onClick={() => setActiveSubId(sc.id)}
                className={`flex w-full flex-col items-center gap-1.5 px-2 py-3 transition ${
                  active ? 'bg-emerald-50' : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className={`relative h-12 w-12 overflow-hidden rounded-xl border-2 transition ${
                    active ? 'border-emerald-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={sc.image_url}
                    alt={sc.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/200x200/EEE/999?text=Sub')}
                  />
                </div>
                <span className={`text-center text-[10px] font-medium leading-tight ${active ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {sc.name}
                </span>
                {active && <span className="absolute left-0 h-10 w-1 rounded-r-full bg-emerald-500" />}
              </button>
            );
          })}
        </aside>

        {/* Products grid */}
        <div className="flex-1 px-3 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">
              {subcategories.find(s => s.id === activeSubId)?.name || 'Products'}
            </h3>
            <span className="text-xs text-gray-400">{filteredProducts.length} items</span>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-300">
                <Search size={28} />
              </div>
              <p className="text-sm font-medium text-gray-500">No products found</p>
              <p className="text-xs text-gray-400">Try a different subcategory or search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((p) => (
                <div key={p.id} className="cursor-pointer">
                  <ProductCard
                    product={p}
                    quantity={cart.getQuantity?.(p.id) || 0}
                    onAdd={() => cart.addToCart?.(p)}
                    onIncrement={() => cart.addToCart?.(p)}
                    onDecrement={() => cart.updateQuantity?.(p.id, (cart.getQuantity?.(p.id) || 0) - 1)}
                    onClick={() => navigate(`/product?id=${p.id}&categoryId=${category.id}`)}
                    horizontal={false}
                    theme={categoryTheme}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
