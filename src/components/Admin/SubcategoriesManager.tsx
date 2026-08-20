import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchCategories } from '@/services/catalog';
import type { Subcategory, Category } from '@/types';

export default function SubcategoriesManager() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);

  const load = async () => {
    const { categories } = await fetchCategories();
    setCategories(categories);
    const { data } = await supabase.from('subcategories').select('*').order('sort_order');
    setSubcategories((data as Subcategory[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('subcategories').delete().eq('id', id);
    await load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add subcategory
      </button>
      {showForm && (
        <SubcategoryForm
          initial={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
      {subcategories.map((s) => (
        <div key={s.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card flex items-center gap-3">
          {s.image_url && <img src={s.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-800 truncate">{s.name}</p>
            <p className="text-xs text-ink-500">/{s.slug} · {categories.find(c => c.id === s.category_id)?.name || 'Unknown'}</p>
          </div>
          <button
            onClick={() => { setEditing(s); setShowForm(true); }}
            className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
          >
            <Pencil size={14} />
          </button>
          <button onClick={() => handleDelete(s.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function SubcategoryForm({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: Subcategory | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    category_id: initial?.category_id || categories[0]?.id || '',
    name: initial?.name || '',
    slug: initial?.slug || '',
    image_url: initial?.image_url || '',
    description: initial?.description || '',
    sort_order: initial?.sort_order || 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (initial) {
      await supabase.from('subcategories').update(form).eq('id', initial.id);
    } else {
      await supabase.from('subcategories').insert(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} subcategory</h3>
        <button onClick={onClose}><X size={16} className="text-ink-400" /></button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Category *</label>
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Fresh Vegetables"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Slug *</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g. fresh-vegetables"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Image URL</label>
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          placeholder="https://..."
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Sort order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-end h-10">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="accent-brand-600"
            /> Active
          </label>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save</>}
      </button>
    </div>
  );
}