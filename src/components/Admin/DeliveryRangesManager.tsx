// src/components/admin/DeliveryRangesManager.tsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Save } from 'lucide-react';
import type { DeliveryRange } from '@/types';
import {
  fetchDeliveryRanges,
  createDeliveryRange,
  updateDeliveryRange,
  deleteDeliveryRange,
} from '@/services/catalog';

export default function DeliveryRangesManager() {
  const [ranges, setRanges] = useState<DeliveryRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DeliveryRange | null>(null);

  const load = useCallback(async () => {
    const data = await fetchDeliveryRanges();
    setRanges(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteDeliveryRange(id);
    void load();
  };

  const handleToggle = async (range: DeliveryRange) => {
    await updateDeliveryRange(range.id, { is_active: !range.is_active });
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
        <Plus size={16} /> Add delivery range
      </button>
      {showForm && (
        <DeliveryRangeForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {ranges.map((range) => (
        <div key={range.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink-800">{range.name}</p>
              <p className="text-xs text-ink-500">
                {range.center_lat.toFixed(5)}, {range.center_lng.toFixed(5)} · Radius: {range.radius_km} km
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => void handleToggle(range)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {range.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setEditing(range);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(range.id)}
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

// ---- DeliveryRangeForm ----
function DeliveryRangeForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: DeliveryRange | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    center_lat: initial?.center_lat ?? 0,
    center_lng: initial?.center_lng ?? 0,
    radius_km: initial?.radius_km ?? 5,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      center_lat: form.center_lat,
      center_lng: form.center_lng,
      radius_km: form.radius_km,
      is_active: form.is_active,
    };
    if (initial) {
      await updateDeliveryRange(initial.id, payload);
    } else {
      await createDeliveryRange(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} delivery range</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Range name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Delhi NCR"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Center latitude *</label>
          <input
            type="number"
            step="any"
            value={form.center_lat}
            onChange={(e) => setForm({ ...form, center_lat: parseFloat(e.target.value) || 0 })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Center longitude *</label>
          <input
            type="number"
            step="any"
            value={form.center_lng}
            onChange={(e) => setForm({ ...form, center_lng: parseFloat(e.target.value) || 0 })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Radius (km) *</label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={form.radius_km}
          onChange={(e) => setForm({ ...form, radius_km: parseFloat(e.target.value) || 0 })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
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
        disabled={saving || !form.name || !form.radius_km}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save range</>}
      </button>
    </div>
  );
}