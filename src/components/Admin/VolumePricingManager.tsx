// src/components/admin/VolumePricingManager.tsx
import { useEffect, useState } from 'react';
import { Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { VolumePricingTier } from '@/types';
import {
  fetchVolumePricing,
  createVolumePricingTier,
  updateVolumePricingTier,
  deleteVolumePricingTier,
} from '@/services/catalog';

export default function VolumePricingManager() {
  const [products, setProducts] = useState<{ id: string; brand: string; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [tiers, setTiers] = useState<VolumePricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VolumePricingTier | null>(null);
  const [form, setForm] = useState({
    min_quantity: 1,
    max_quantity: '',
    unit_price: 0,
    discount_percent: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('id, brand, name').order('name');
      if (data && data.length > 0) {
        setProducts(data);
        setSelectedProductId(data[0].id);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Fetch tiers when product changes
  useEffect(() => {
    if (!selectedProductId) return;
    async function loadTiers() {
      setLoading(true);
      const tiersData = await fetchVolumePricing(selectedProductId);
      setTiers(tiersData);
      setLoading(false);
    }
    loadTiers();
  }, [selectedProductId]);

  const handleSaveTier = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    const payload = {
      product_id: selectedProductId,
      min_quantity: form.min_quantity,
      max_quantity: form.max_quantity ? parseInt(form.max_quantity) : null,
      unit_price: form.unit_price,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
    };
    if (editing) {
      await updateVolumePricingTier(editing.id, payload);
    } else {
      await createVolumePricingTier(payload);
    }
    const tiersData = await fetchVolumePricing(selectedProductId);
    setTiers(tiersData);
    setEditing(null);
    setForm({ min_quantity: 1, max_quantity: '', unit_price: 0, discount_percent: '' });
    setSaving(false);
  };

  const handleDeleteTier = async (id: string) => {
    await deleteVolumePricingTier(id);
    const tiersData = await fetchVolumePricing(selectedProductId);
    setTiers(tiersData);
  };

  if (loading && products.length === 0) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Select Product</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-ink-900">{editing ? 'Edit' : 'Add'} Volume Tier</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Min Quantity</label>
            <input
              type="number"
              value={form.min_quantity}
              onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Max Quantity (empty = unlimited)</label>
            <input
              type="number"
              value={form.max_quantity}
              onChange={(e) => setForm({ ...form, max_quantity: e.target.value })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Unit Price</label>
            <input
              type="number"
              step="0.01"
              value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Discount % (optional)</label>
            <input
              type="number"
              step="0.1"
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
              placeholder="e.g. 10"
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <button
          onClick={handleSaveTier}
          disabled={saving || !form.unit_price}
          className="w-full h-10 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {editing ? 'Update Tier' : 'Add Tier'}
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-ink-600">Existing Tiers</p>
        {tiers.length === 0 ? (
          <p className="text-xs text-ink-400">No volume tiers defined for this product.</p>
        ) : (
          tiers.map((tier) => (
            <div key={tier.id} className="bg-white border border-ink-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-ink-800">
                  {tier.min_quantity} – {tier.max_quantity ?? '∞'} qty
                </span>
                <span className="ml-3 text-sm text-brand-600">₹{tier.unit_price}</span>
                {tier.discount_percent && <span className="ml-2 text-xs text-ink-500">({tier.discount_percent}% off)</span>}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(tier);
                    setForm({
                      min_quantity: tier.min_quantity,
                      max_quantity: tier.max_quantity?.toString() ?? '',
                      unit_price: tier.unit_price,
                      discount_percent: tier.discount_percent?.toString() ?? '',
                    });
                  }}
                  className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => void handleDeleteTier(tier.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}