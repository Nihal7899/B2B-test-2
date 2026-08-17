// src/components/admin/DeliverySettingsManager.tsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Save } from 'lucide-react';
import type { DeliveryZone, DeliveryCharge } from '@/types';
import {
  fetchAllDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  fetchDeliveryChargesForZone,
  createDeliveryCharge,
  updateDeliveryCharge,
  deleteDeliveryCharge,
} from '@/services/catalog';

export default function DeliverySettingsManager() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [charges, setCharges] = useState<DeliveryCharge[]>([]);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [editingCharge, setEditingCharge] = useState<DeliveryCharge | null>(null);

  const loadZones = useCallback(async () => {
    const data = await fetchAllDeliveryZones();
    setZones(data);
    if (data.length > 0 && !selectedZoneId) setSelectedZoneId(data[0].id);
    setLoading(false);
  }, [selectedZoneId]);

  useEffect(() => {
    void loadZones();
  }, [loadZones]);

  // Load charges when zone changes
  useEffect(() => {
    if (!selectedZoneId) return;
    async function loadCharges() {
      const data = await fetchDeliveryChargesForZone(selectedZoneId);
      setCharges(data);
    }
    loadCharges();
  }, [selectedZoneId]);

  const handleDeleteZone = async (id: string) => {
    await deleteDeliveryZone(id);
    void loadZones();
  };

  const handleDeleteCharge = async (id: string) => {
    await deleteDeliveryCharge(id);
    const data = await fetchDeliveryChargesForZone(selectedZoneId);
    setCharges(data);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink-900">Delivery Zones</h3>
          <button
            onClick={() => {
              setEditingZone(null);
              setShowZoneForm(true);
            }}
            className="h-8 px-3 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center gap-1"
          >
            <Plus size={14} /> Add Zone
          </button>
        </div>
        {showZoneForm && (
          <ZoneForm
            initial={editingZone}
            onClose={() => setShowZoneForm(false)}
            onSaved={() => {
              setShowZoneForm(false);
              void loadZones();
            }}
          />
        )}
        <div className="space-y-2">
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between p-2 bg-ink-50 rounded-xl">
              <div>
                <p className="text-sm font-bold text-ink-800">{zone.name}</p>
                <p className="text-xs text-ink-500">{zone.pincodes.length} pincodes</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setSelectedZoneId(zone.id);
                  }}
                  className={`h-8 px-3 rounded-lg text-xs font-bold ${
                    selectedZoneId === zone.id ? 'bg-brand-100 text-brand-700' : 'bg-ink-200 text-ink-600'
                  }`}
                >
                  {selectedZoneId === zone.id ? 'Selected' : 'Select'}
                </button>
                <button
                  onClick={() => {
                    setEditingZone(zone);
                    setShowZoneForm(true);
                  }}
                  className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => void handleDeleteZone(zone.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {zones.length === 0 && <p className="text-xs text-ink-400">No delivery zones defined.</p>}
        </div>
      </div>

      {selectedZoneId && (
        <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-ink-900">
              Charges for {zones.find(z => z.id === selectedZoneId)?.name}
            </h3>
            <button
              onClick={() => {
                setEditingCharge(null);
                setShowChargeForm(true);
              }}
              className="h-8 px-3 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus size={14} /> Add Charge
            </button>
          </div>
          {showChargeForm && (
            <ChargeForm
              zoneId={selectedZoneId}
              initial={editingCharge}
              onClose={() => setShowChargeForm(false)}
              onSaved={() => {
                setShowChargeForm(false);
                async function reload() {
                  const data = await fetchDeliveryChargesForZone(selectedZoneId);
                  setCharges(data);
                }
                reload();
              }}
            />
          )}
          <div className="space-y-2">
            {charges.map((charge) => (
              <div key={charge.id} className="flex items-center justify-between p-2 bg-ink-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-ink-800">
                    ₹{charge.charge}
                    {charge.min_order_value !== null && charge.min_order_value > 0 && ` (min ₹${charge.min_order_value})`}
                    {charge.max_order_value !== null && ` - max ₹${charge.max_order_value}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingCharge(charge);
                      setShowChargeForm(true);
                    }}
                    className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
                  >
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => void handleDeleteCharge(charge.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {charges.length === 0 && <p className="text-xs text-ink-400">No charges defined for this zone.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- ZoneForm ----
function ZoneForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: DeliveryZone | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    pincodes: initial?.pincodes.join(', ') ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const pincodesArray = form.pincodes.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      pincodes: pincodesArray,
    };
    if (initial) {
      await updateDeliveryZone(initial.id, payload);
    } else {
      await createDeliveryZone(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-3 shadow-card mb-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} Zone</h4>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Zone Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Delhi NCR"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Pincodes (comma separated) *</label>
        <input
          value={form.pincodes}
          onChange={(e) => setForm({ ...form, pincodes: e.target.value })}
          placeholder="110001, 110002, 110003"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving || !form.name || !form.pincodes}
        className="w-full h-10 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Zone
      </button>
    </div>
  );
}

// ---- ChargeForm ----
function ChargeForm({
  zoneId,
  initial,
  onClose,
  onSaved,
}: {
  zoneId: string;
  initial: DeliveryCharge | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    min_order_value: initial?.min_order_value ?? '',
    max_order_value: initial?.max_order_value ?? '',
    charge: initial?.charge ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      zone_id: zoneId,
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : null,
      max_order_value: form.max_order_value ? parseFloat(form.max_order_value) : null,
      charge: form.charge,
      is_active: form.is_active,
    };
    if (initial) {
      await updateDeliveryCharge(initial.id, payload);
    } else {
      await createDeliveryCharge(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-3 shadow-card mb-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} Charge</h4>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Min Order Value</label>
          <input
            type="number"
            value={form.min_order_value}
            onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
            placeholder="0"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Max Order Value</label>
          <input
            type="number"
            value={form.max_order_value}
            onChange={(e) => setForm({ ...form, max_order_value: e.target.value })}
            placeholder="Unlimited"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Charge (₹) *</label>
        <input
          type="number"
          step="0.01"
          value={form.charge}
          onChange={(e) => setForm({ ...form, charge: Number(e.target.value) })}
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
        disabled={saving || !form.charge}
        className="w-full h-10 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Charge
      </button>
    </div>
  );
}