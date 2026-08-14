// screens/CategoriesScreen.tsx
import { useEffect, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import type { Category } from '@/types';
import { fetchCategories, fetchProducts } from '@/services/catalog';

interface CategoriesScreenProps {
  onCategory: (category: Category) => void;
  onBack: () => void; // ← new prop for navigation
}

export function CategoriesScreen({ onCategory, onBack }: CategoriesScreenProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const { categories: cats } = await fetchCategories();
        const { products } = await fetchProducts();
        
        const productCounts: Record<string, number> = {};
        products.forEach((p) => {
          const slug = p.category;
          productCounts[slug] = (productCounts[slug] ?? 0) + 1;
        });
        
        setCategories(cats);
        setCounts(productCounts);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  // Use the first category image as a banner fallback, or provide a default
  const bannerImage =
    categories.length > 0
      ? categories[0].image
      : 'https://images.pexels.com/photos/220911/pexels-photo-220911.jpeg?auto=compress&cs=tinysrgb&w=800';

  return (
    <div className="pb-6">
      {/* === HEADER BANNER (like CategoryPage) === */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={bannerImage}
          alt="All Categories"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4 text-gray-900" />
          </button>
        </div>
        <div className="absolute bottom-3 left-4">
          <h1 className="text-lg font-bold text-white">All Categories</h1>
          <p className="text-xs text-white/80">{filtered.length} categories</p>
        </div>
      </div>

      {/* === SEARCH BAR === */}
      <div className="sticky top-0 z-20 bg-white/95 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* === CATEGORY GRID === */}
      <div className="px-4 pt-3">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategory(category)}
                className="flex flex-col items-center gap-1.5 tap-highlight active:scale-95 transition-transform"
              >
                <div
                  className={`relative h-16 w-16 overflow-hidden rounded-2xl ${category.color} p-0.5 shadow-sm ring-1 ring-gray-100`}
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
                <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-gray-700">
                  {category.name}
                </span>
                <span className="text-[9px] text-gray-400">
                  {counts[category.id] ?? 0} products
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-gray-400">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
}