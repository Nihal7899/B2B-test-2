// src/components/admin/SmartCollectionsManager.tsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SmartCollection, FilterConfig, DbCategory } from '@/types';
import {
  fetchAllSmartCollections,
  createSmartCollection,
  updateSmartCollection,
  deleteSmartCollection,
  fetchAllBrands,
} from '@/services/catalog';

export default function SmartCollectionsManager() {
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SmartCollection | null>(null);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [collectionsRes, catsRes, brandsRes] = await Promise.all([
      fetchAllSmartCollections(),
      supabase.from('categories').select('*').order('name'),
      fetchAllBrands(),
    ]);
    setCollections(collectionsRes);
    setCategories((catsRes.data as DbCategory[]) ?? []);
    setBrands(brandsRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteSmartCollection(id);
    void load();
  };

  const handleToggle = async (collection: SmartCollection) => {
    await updateSmartCollection(collection.id, { is_active: !collection.is_active });
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add smart collection
      </button>
      {showForm && (
        <SmartCollectionForm
          initial={editing}
          categories={categories}
          brands={brands}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {collections.map((collection) => (
        <div key={collection.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink-800 truncate">{collection.name}</p>
              <p className="text-xs text-ink-500 truncate">{collection.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                    collection.is_active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {collection.is_active ? 'ACTIVE' : 'HIDDEN'}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  Filters: {Object.keys(collection.filter_config).length}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => void handleToggle(collection)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {collection.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setEditing(collection);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(collection.id)}
                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- SmartCollectionForm ----
function SmartCollectionForm({
  initial,
  categories,
  brands,
  onClose,
  onSaved,
}: {
  initial: SmartCollection | null;
  categories: DbCategory[];
  brands: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    filter_config: (initial?.filter_config ?? {}) as FilterConfig,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const setFilterConfig = (key: keyof FilterConfig, value: unknown) => {
    setForm((f) => ({
      ...f,
      filter_config: { ...f.filter_config, [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    if (initial) {
      await updateSmartCollection(initial.id, {
        name: form.name,
        description: form.description,
        filter_config: form.filter_config,
        is_active: form.is_active,
      });
    } else {
      await createSmartCollection({
        name: form.name,
        description: form.description,
        filter_config: form.filter_config,
        is_active: form.is_active,
      });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} smart collection</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Best Sellers"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Description</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Filter Configuration</label>
        <div className="space-y-3 bg-ink-50/30 p-3 rounded-xl border border-ink-100">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Categories</label>
            <select
              multiple
              value={(form.filter_config.category_ids as string[]) ?? []}
              onChange={(e) =>
                setFilterConfig('category_ids', Array.from(e.target.selectedOptions).map((o) => o.value))
              }
              className="w-full h-24 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              size={4}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Brands</label>
            <select
              multiple
              value={(form.filter_config.brand_ids as string[]) ?? []}
              onChange={(e) =>
                setFilterConfig('brand_ids', Array.from(e.target.selectedOptions).map((o) => o.value))
              }
              className="w-full h-24 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              size={4}
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Min Discount %</label>
              <input
                type="number"
                value={(form.filter_config.discount_min as number) ?? ''}
                onChange={(e) => setFilterConfig('discount_min', e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Max Discount %</label>
              <input
                type="number"
                value={(form.filter_config.discount_max as number) ?? ''}
                onChange={(e) => setFilterConfig('discount_max', e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Min Price</label>
              <input
                type="number"
                value={(form.filter_config.price_min as number) ?? ''}
                onChange={(e) => setFilterConfig('price_min', e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Max Price</label>
              <input
                type="number"
                value={(form.filter_config.price_max as number) ?? ''}
                onChange={(e) => setFilterConfig('price_max', e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={(form.filter_config.stock_only as boolean) ?? false}
                onChange={(e) => setFilterConfig('stock_only', e.target.checked)}
                className="accent-brand-600"
              />{' '}
              In stock only
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Sort by</label>
            <select
              value={(form.filter_config.sort as string) ?? 'newest'}
              onChange={(e) => setFilterConfig('sort', e.target.value)}
              className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="newest">Newest</option>
              <option value="discount_desc">Discount: high to low</option>
              <option value="discount_asc">Discount: low to high</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating_desc">Top rated</option>
            </select>
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="accent-brand-600"
        />{' '}
        Active
      </label>
      <button
        onClick={handleSave}
        disabled={saving || !form.name}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save collection</>}
      </button>
    </div>
  );
}