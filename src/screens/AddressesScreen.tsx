import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, MapPin, Navigation, Check, Trash2, Plus, Loader2, Pencil } from 'lucide-react';
import type { DbAddress } from '@/services/catalog';
import { fetchAddresses, deleteAddress } from '@/services/catalog';
import { saveDeliveryAddress as saveAddress } from '@/services/business';
import { LocationPicker } from '@/components/LocationPicker';
import { supabase } from '@/lib/supabase';
import { checkPointInDeliveryRange } from '@/services/catalog';

interface AddressesScreenProps { onBack: () => void; onSaved?: () => void; }

const EMPTY_FORM = {
  id: null as string | null,
  label: 'Business',
  recipient_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  latitude: null as number | null,
  longitude: null as number | null,
  place_id: null as string | null,
  is_default: false,
};

const INPUT_CLS =
  'w-full h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none transition-shadow focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50';

export function AddressesScreen({ onBack, onSaved }: AddressesScreenProps) {
  const [addresses, setAddresses] = useState<DbAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await fetchAddresses();
    setAddresses(data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleLocationConfirmed = (loc: {
    latitude: number; longitude: number;
    line1: string; city: string; state: string; postal_code: string; place_id: string | null;
  }) => {
    setForm((f) => ({
      ...f,
      latitude: loc.latitude,
      longitude: loc.longitude,
      line2: loc.line1 || f.line2,
      city: loc.city || f.city,
      state: loc.state || f.state,
      postal_code: loc.postal_code || f.postal_code,
      place_id: loc.place_id,
    }));
    setShowPicker(false);
    setShowForm(true);
  };

  const handleEdit = (addr: DbAddress) => {
    setForm({
      id: addr.id,
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      latitude: addr.latitude || null,
      longitude: addr.longitude || null,
      place_id: addr.place_id || null,
      is_default: addr.is_default,
    });
    setShowForm(true);
  };

  const handleSetDefault = async (addr: DbAddress) => {
    try {
      const currentDefault = addresses.find((a) => a.is_default);
      if (currentDefault && currentDefault.id !== addr.id) {
        await supabase.from('addresses').update({ is_default: false }).eq('id', currentDefault.id);
      }
      await supabase.from('addresses').update({ is_default: true }).eq('id', addr.id);
      await load();
    } catch (err) {
      console.error('Failed to set default address', err);
    }
  };

  const handleSave = async () => {
    if (!form.recipient_name || !form.phone || !form.line1 || !form.city || !form.state || !form.postal_code) {
      setError('Please fill all required fields.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let lat = form.latitude;
      let lng = form.longitude;

      if (lat === null || lng === null) {
        const fullAddress = `${form.line1}, ${form.city}, ${form.state} ${form.postal_code}`;
        const { data, error } = await supabase.functions.invoke('maps', {
          body: { action: 'search', query: fullAddress },
        });
        if (error || !data?.address?.latitude) {
          setError('Could not determine location from address. Please use the map picker to set location.');
          setSaving(false);
          return;
        }
        lat = data.address.latitude;
        lng = data.address.longitude;
        setForm(f => ({
          ...f,
          latitude: lat,
          longitude: lng,
          line1: data.address.line1 || f.line1,
          city: data.address.city || f.city,
          state: data.address.state || f.state,
          postal_code: data.address.postal_code || f.postal_code,
        }));
      }

      const inRange = await checkPointInDeliveryRange(lat!, lng!);
      if (!inRange) {
        setError('This address is outside our delivery area. Please choose another location.');
        setSaving(false);
        return;
      }

      const addressData = {
        label: form.label,
        recipient_name: form.recipient_name,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        latitude: lat,
        longitude: lng,
        place_id: form.place_id,
        is_default: form.is_default,
      };

      if (form.is_default) {
        const currentDefault = addresses.find((a) => a.is_default);
        if (currentDefault && currentDefault.id !== form.id) {
          await supabase.from('addresses').update({ is_default: false }).eq('id', currentDefault.id);
        }
      }

      if (form.id) {
        const { error: updateError } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', form.id);
        if (updateError) throw updateError;
      } else {
        await saveAddress(addressData);
      }

      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      await load();
      onSaved?.();
    } catch (err: any) {
      console.error('❌ Save address error:', err);
      const message = err?.message || err?.error_description || 'Could not save address. Please try again.';
      setError(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAddress(id);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-200 border-t-emerald-900 animate-spin" />
      </div>
    );
  }

  if (showPicker) {
    return (
      <LocationPicker
        onConfirm={handleLocationConfirmed}
        onCancel={() => setShowPicker(false)}
      />
    );
  }

  return (
    <div className="safe-top px-4 pb-6 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center text-ink-600 shadow-xs active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Delivery addresses</h1>
          <p className="text-xs text-ink-500 mt-0.5">Manage your delivery locations</p>
        </div>
      </div>

      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
          <div className="h-20 w-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-900">
            <MapPin size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-extrabold text-ink-900 mt-5">No addresses saved</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-[260px]">
            Add a delivery address to start placing orders.
          </p>
          <div className="mt-6 flex flex-col gap-2 w-full max-w-[280px]">
            <button
              onClick={() => setShowPicker(true)}
              className="h-12 rounded-xl bg-emerald-900 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft active:scale-[0.98] transition-transform"
            >
              <Navigation size={17} /> Pick on map
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="h-12 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Plus size={17} /> Enter manually
            </button>
          </div>
        </div>
      ) : showForm ? (
        <div className="space-y-3">
          <div className="bg-white border border-ink-100 rounded-2xl p-4 space-y-3.5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink-900">
                {form.id ? 'Edit address' : 'New address'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
                className="text-xs font-bold text-ink-400 hover:text-ink-600 transition-colors"
              >
                Cancel
              </button>
            </div>

            <button
              onClick={() => setShowPicker(true)}
              className="w-full h-12 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              <MapPin size={16} />
              {form.latitude ? 'Change location on map' : 'Pick location on map'}
            </button>

            {form.latitude && form.longitude && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5 flex items-center gap-2">
                <MapPin size={15} className="text-emerald-800 shrink-0" />
                <p className="text-xs text-emerald-900 font-medium">
                  Location set · {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Label (Home, Shop)"
                className={INPUT_CLS}
              />
              <input
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                placeholder="Recipient name *"
                className={INPUT_CLS}
              />
            </div>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number *"
              inputMode="tel"
              className={INPUT_CLS}
            />
            <input
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              placeholder="Address line 1 *"
              className={INPUT_CLS}
            />
            <input
              value={form.line2}
              onChange={(e) => setForm({ ...form, line2: e.target.value })}
              placeholder="Address line 2 (optional)"
              className={INPUT_CLS}
            />
            <div className="grid grid-cols-3 gap-2.5">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="City *"
                className={INPUT_CLS}
              />
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="State *"
                className={INPUT_CLS}
              />
              <input
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                placeholder="PIN *"
                inputMode="numeric"
                className={`${INPUT_CLS} tracking-wider`}
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-ink-700 pt-3 border-t border-ink-100 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                className="mt-0.5 accent-emerald-900"
              />
              <span>
                <span className="font-bold text-ink-800">Set as default address</span>
                <span className="block text-[11px] text-ink-400 mt-0.5">
                  This address will be preselected at checkout.
                </span>
              </span>
            </label>

            {error && (
              <p className="text-xs text-red-500 text-center bg-red-50 border border-red-100 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 rounded-xl bg-emerald-900 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft disabled:opacity-60 active:scale-[0.99] transition-transform"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <>
                  <Check size={17} /> Save address
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white border rounded-2xl p-3.5 shadow-card transition-all ${
                  addr.is_default
                    ? 'border-emerald-400 ring-2 ring-emerald-100/60'
                    : 'border-ink-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-ink-800 truncate">{addr.label}</p>
                      {addr.is_default && (
                        <span className="text-[9px] font-black uppercase bg-emerald-900 text-white rounded-full px-2 py-0.5">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-600 mt-1 leading-snug">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.postal_code}
                    </p>
                    <p className="text-[11px] text-ink-400 mt-1">
                      {addr.recipient_name} · {addr.phone}
                    </p>
                    {addr.latitude && addr.longitude && (
                      <p className="text-[10px] font-bold text-emerald-800 mt-1.5 flex items-center gap-1">
                        <Navigation size={10} /> GPS location set
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-ink-100">
                  {!addr.is_default && (
                    <button
                      onClick={() => void handleSetDefault(addr)}
                      className="flex-1 h-8 px-3 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
                    >
                      <Check size={12} /> Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(addr)}
                    className="h-8 px-3 rounded-lg border border-ink-200 text-ink-700 text-[11px] font-bold flex items-center gap-1 hover:bg-ink-50 transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => void handleDelete(addr.id)}
                    className="h-8 w-8 rounded-lg border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowPicker(true)}
              className="flex-1 h-12 rounded-xl bg-emerald-900 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft active:scale-[0.98] transition-transform"
            >
              <MapPin size={17} /> Pick on map
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 h-12 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Plus size={17} /> Enter manually
            </button>
          </div>
        </>
      )}
    </div>
  );
}