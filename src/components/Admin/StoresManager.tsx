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

// ---- StoreForm ----
function StoreForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Store | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  // 🔥 FIX: Properly read tint opacity from config
  const initialConfig = initial?.config || {};
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    image_url: initial?.image_url ?? '',
    banner_image_url: initial?.banner_image_url ?? '',
    description: initial?.description ?? '',
    tint_color: initial?.primary_color ?? '#10b981',
    tint_opacity: initialConfig?.tintOpacity ?? 50,
    text_color: initial?.text_color ?? '#ffffff',
    badge_text: initialConfig?.badgeText ?? 'STORE',
    badge_color: initialConfig?.badgeColor ?? '#fbbf24',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  // 🔥 FIX: Reset form when initial changes
  useEffect(() => {
    const config = initial?.config || {};
    setForm({
      name: initial?.name ?? '',
      image_url: initial?.image_url ?? '',
      banner_image_url: initial?.banner_image_url ?? '',
      description: initial?.description ?? '',
      tint_color: initial?.primary_color ?? '#10b981',
      tint_opacity: config?.tintOpacity ?? 50,
      text_color: initial?.text_color ?? '#ffffff',
      badge_text: config?.badgeText ?? 'STORE',
      badge_color: config?.badgeColor ?? '#fbbf24',
      sort_order: initial?.sort_order ?? 0,
      is_active: initial?.is_active ?? true,
    });
  }, [initial]);

  const handleSave = async () => {
    setSaving(true);

    // 🔥 FIX: Preserve existing config and update only changed fields
    const existingConfig = initial?.config || {};
    const configData = {
      ...existingConfig,
      tintOpacity: form.tint_opacity,
      badgeText: form.badge_text,
      badgeColor: form.badge_color,
    };

    const data = {
      name: form.name,
      image_url: form.image_url,
      banner_image_url: form.banner_image_url,
      description: form.description,
      primary_color: form.tint_color,
      text_color: form.text_color,
      sort_order: form.sort_order,
      is_active: form.is_active,
      config: configData,
    };

    if (initial) {
      await updateStore(initial.id, data);
    } else {
      await createStore(data);
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
        <label className="block text-xs font-bold text-ink-600 mb-1">Cover/Banner Image URL</label>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Tint Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.tint_color}
              onChange={(e) => setForm({ ...form, tint_color: e.target.value })}
              className="h-10 w-16 rounded-xl border border-ink-200 p-1"
            />
            <input
              type="text"
              value={form.tint_color}
              onChange={(e) => setForm({ ...form, tint_color: e.target.value })}
              className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm font-mono outline-none focus:border-brand-500"
              placeholder="#000000"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Tint Opacity: {form.tint_opacity}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={form.tint_opacity}
            onChange={(e) => setForm({ ...form, tint_opacity: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Text Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={form.text_color}
            onChange={(e) => setForm({ ...form, text_color: e.target.value })}
            className="h-10 w-16 rounded-xl border border-ink-200 p-1"
          />
          <input
            type="text"
            value={form.text_color}
            onChange={(e) => setForm({ ...form, text_color: e.target.value })}
            className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm font-mono outline-none focus:border-brand-500"
            placeholder="#ffffff"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Badge Text</label>
          <input
            value={form.badge_text}
            onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
            placeholder="STORE"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Badge Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.badge_color}
              onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
              className="h-10 w-16 rounded-xl border border-ink-200 p-1"
            />
            <input
              type="text"
              value={form.badge_color}
              onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
              className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm font-mono outline-none focus:border-brand-500"
              placeholder="#fbbf24"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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