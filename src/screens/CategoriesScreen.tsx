import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { fetchCategories } from '@/services/catalog';
import type { Category } from '@/types';
import { preloadImages } from '@/services/homePreload';
import { AppLoader } from '@/components/AppLoader';

export function CategoriesScreen({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { categories: fetchedCats } = await fetchCategories();
        if (active && Array.isArray(fetchedCats)) {
          setCategories(fetchedCats);
          void preloadImages(fetchedCats.map((c) => c.image).filter(Boolean));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const openCategory = (categoryId: string) => navigate(`/category?id=${categoryId}`);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 safe-top">
          <button
            onClick={onBack}
            className="h-9 w-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700 active:scale-95 transition-transform"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Textless B2B produce loader */}
        <div className="flex-1 flex items-center justify-center -mt-16">
          <AppLoader fullScreen={false} size="md" />
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white px-4 py-4 shadow-sm safe-top">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">All Categories</h2>
        </div>
      </div>

      {/* Category List */}
      <div className="mx-auto max-w-md w-full flex-1 space-y-2.5 px-4 pt-4">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => openCategory(c.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:border-emerald-200 hover:shadow active:scale-[0.99]"
          >
            <div
              className="h-14 w-14 shrink-0 overflow-hidden rounded-xl p-0.5"
              style={{ background: c.gradient || '#10b981' }}
            >
              <img
                src={c.image}
                alt={c.name}
                loading="eager"
                decoding="sync"
                className="h-full w-full rounded-xl object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{c.name}</p>
              <p className="text-xs text-gray-400">{c.subcategories?.length || 0} subcategories</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        ))}

        {/* Physical Spacer: Guarantees full scroll clearance above the fixed bottom bar (64px + mobile browser toolbars) */}
        <div className="h-32 w-full shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}