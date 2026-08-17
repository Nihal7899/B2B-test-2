// src/components/admin/PromoCodesManager.tsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PromoCode, DbCategory, DbProduct } from '@/types';
import {
  fetchAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from '@/services/catalog';

export default function PromoCodesManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);

  const load = useCallback(async () => {
    const data = await fetchAllPromoCodes();
    setPromoCodes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deletePromoCode(id);
    void load();
  };

  const handleToggle = async (promo: PromoCode) => {
    await updatePromoCode(promo.id, { is_active: !promo.is_active });
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
        <Plus size={16} /> Add Promo Code
      </button>
      {showForm && (
        <PromoCodeForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {promoCodes.map((promo) => (
        <div key={promo.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink-800">{promo.code}</p>
              <p className="text-xs text-ink-500">
                {promo.discount_type === 'percentage' ? `${promo.discount_value}% off` : `₹${promo.discount_value} off`}
                {promo.min_order_value > 0 && ` · Min order ₹${promo.min_order_value}`}
                {promo.max_discount_amount && ` · Max discount ₹${promo.max_discount_amount}`}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                    promo.is_active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {promo.is_active ? 'ACTIVE' : 'HIDDEN'}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  Used: {promo.used_count}/{promo.usage_limit ?? '∞'}
                </span>
                {promo.start_date && (
                  <span className="text-[10px] text-amber-600">From: {new Date(promo.start_date).toLocaleDateString()}</span>
                )}
                {promo.end_date && (
                  <span className="text-[10px] text-amber-600">To: {new Date(promo.end_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => void handleToggle(promo)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {promo.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setEditing(promo);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(promo.id)}
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

// ---- PromoCodeForm ----
function PromoCodeForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: PromoCode | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    discount_type: initial?.discount_type ?? 'percentage' as 'percentage' | 'fixed',
    discount_value: initial?.discount_value ?? 0,
    min_order_value: initial?.min_order_value ?? 0,
    max_discount_amount: initial?.max_discount_amount ?? '',
    applies_to: initial?.applies_to ?? 'all',
    applies_to_ids: initial?.applies_to_ids ?? [],
    start_date: initial?.start_date ?? '',
    end_date: initial?.end_date ?? '',
    usage_limit: initial?.usage_limit ?? '',
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);

  useEffect(() => {
    void (async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
      ]);
      setCategories((cats as DbCategory[]) ?? []);
      setProducts((prods as DbProduct[]) ?? []);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_value: form.min_order_value,
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      applies_to: form.applies_to,
      applies_to_ids: form.applies_to_ids,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      is_active: form.is_active,
    };
    if (initial) {
      await updatePromoCode(initial.id, payload);
    } else {
      await createPromoCode(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} Promo Code</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Code *</label>
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
          placeholder="e.g. SAVE10"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Discount Type</label>
          <select
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Value</label>
          <input
            type="number"
            step="0.01"
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Min Order Value</label>
          <input
            type="number"
            value={form.min_order_value}
            onChange={(e) => setForm({ ...form, min_order_value: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Max Discount (for percentage)</label>
          <input
            type="number"
            value={form.max_discount_amount}
            onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
            placeholder="Leave empty for no limit"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Applies To</label>
        <select
          value={form.applies_to}
          onChange={(e) => setForm({ ...form, applies_to: e.target.value as 'all' | 'category' | 'product', applies_to_ids: [] })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          <option value="all">All products</option>
          <option value="category">Specific categories</option>
          <option value="product">Specific products</option>
        </select>
      </div>
      {form.applies_to !== 'all' && (
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">
            {form.applies_to === 'category' ? 'Select Categories' : 'Select Products'}
          </label>
          <select
            multiple
            value={form.applies_to_ids}
            onChange={(e) =>
              setForm({ ...form, applies_to_ids: Array.from(e.target.selectedOptions).map((o) => o.value) })
            }
            className="w-full h-24 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            size={4}
          >
            {form.applies_to === 'category' &&
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            {form.applies_to === 'product' &&
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} {p.name}
                </option>
              ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Start Date</label>
          <input
            type="datetime-local"
            value={form.start_date ? form.start_date.slice(0, 16) : ''}
            onChange={(e) => setForm({ ...form, start_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">End Date</label>
          <input
            type="datetime-local"
            value={form.end_date ? form.end_date.slice(0, 16) : ''}
            onChange={(e) => setForm({ ...form, end_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Usage Limit</label>
          <input
            type="number"
            value={form.usage_limit}
            onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
            placeholder="Leave empty for unlimited"
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
        disabled={saving || !form.code}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Promo Code</>}
      </button>
    </div>
  );
}