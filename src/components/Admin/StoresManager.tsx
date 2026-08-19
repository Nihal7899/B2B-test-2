// src/components/admin/StoresManager.tsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Store } from '@/types';
import { fetchAllStores, createStore, updateStore, deleteStore } from '@/services/catalog';

export default function StoresManager() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);

  const load = useCallback(async () => {
    const storesRes = await fetchAllStores();
    setStores(storesRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteStore(id);
    void load();
  };

  const handleToggle = async (store: Store) => {
    await updateStore(store.id, { is_active: !store.is_active });
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
        <Plus size={16} /> Add store
      </button>
      {showForm && (
        <StoreForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {stores.map((store) => (
        <div key={store.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {store.image_url && (
                  <img src={store.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                )}
                <div>
                  <p className="text-sm font-bold text-ink-800 truncate">{store.name}</p>
                  <p className="text-xs text-ink-500 truncate">{store.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                    store.is_active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {store.is_active ? 'ACTIVE' : 'HIDDEN'}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  Order: {store.sort_order}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => void handleToggle(store)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {store.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setEditing(store);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(store.id)}
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

// ---- StoreForm (metadata only) ----
function StoreForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Store | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    image_url: initial?.image_url ?? '',
    banner_image_url: initial?.banner_image_url ?? '',
    description: initial?.description ?? '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (initial) {
      await updateStore(initial.id, form);
    } else {
      await createStore(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} store</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Store name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Fresh Harvest"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Image URL *</label>
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          placeholder="https://..."
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
        {form.image_url && (
          <img src={form.image_url} alt="" className="h-16 w-full rounded-xl object-cover mt-2" />
        )}
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Banner Image URL</label>
        <input
          value={form.banner_image_url}
          onChange={(e) => setForm({ ...form, banner_image_url: e.target.value })}
          placeholder="https://..."
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
        {form.banner_image_url && (
          <img src={form.banner_image_url} alt="" className="h-20 w-full rounded-xl object-cover mt-2" />
        )}
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Description</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Farm-fresh staples"
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
            />{' '}
            Active
          </label>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save store</>}
      </button>
    </div>
  );
}