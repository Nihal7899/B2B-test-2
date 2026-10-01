import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  Loader2,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/auth';
import { supabase } from '@/lib/supabase';
import {
  fetchBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  setDefaultBusiness,
} from '@/services/business';
import type { Business } from '@/types';

interface BusinessRegistrationScreenProps {
  onBack: () => void;
  onRegistered: (business: Business) => void;
}

const BUSINESS_TYPES = [
  'Restaurant',
  'Cafe',
  'Kirana Store',
  'Supermarket',
  'Catering',
  'Hotel',
  'Bakery',
  'Other',
];

type Mode = 'list' | 'form';

interface FormState {
  id: string | null;
  businessName: string;
  businessType: string;
  gstRegistered: boolean;
  gstin: string;
  isDefault: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  landmark: string;
  pincode: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  businessName: '',
  businessType: 'Restaurant',
  gstRegistered: false,
  gstin: '',
  isDefault: false,
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  landmark: '',
  pincode: '',
};

const INPUT_CLS =
  'w-full h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none transition-shadow focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50';

export function BusinessRegistrationScreen({
  onBack,
  onRegistered,
}: BusinessRegistrationScreenProps) {
  const { profile, refreshProfile } = useAuth();

  const [mode, setMode] = useState<Mode>('list');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [personalName, setPersonalName] = useState(profile?.personal_name ?? '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBusinesses();
      setBusinesses(data);
    } catch (err) {
      console.error('Failed to load businesses', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => {
    setForm({
      ...EMPTY_FORM,
      isDefault: businesses.length === 0,
    });
    setError('');
    setMode('form');
  };

  const startEdit = (b: Business) => {
    setForm({
      id: b.id,
      businessName: b.business_name,
      businessType: b.business_type || 'Restaurant',
      gstRegistered: !!b.gst_registered,
      gstin: b.gstin || '',
      isDefault: !!b.is_default,
      addressLine1: b.address_line_1 || '',
      addressLine2: b.address_line_2 || '',
      city: b.city || '',
      state: b.state || '',
      landmark: b.landmark || '',
      pincode: b.pincode || '',
    });
    setError('');
    setMode('form');
  };

  const handleSave = async () => {
    if (!profile?.personal_name && !personalName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!form.businessName.trim()) {
      setError('Please enter your business name.');
      return;
    }
    if (!form.addressLine1.trim()) {
      setError('Please enter the billing address (line 1).');
      return;
    }
    if (!form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      setError('Please fill in city, state, and pincode.');
      return;
    }
    if (form.gstRegistered && form.gstin.length !== 15) {
      setError('Enter a valid 15-digit GSTIN or uncheck GST registered.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (profile?.registration_status !== 'registered') {
        const { error: rpcError } = await supabase.rpc('update_profile', {
          p_personal_name: personalName || profile?.personal_name || '',
          p_full_name: personalName || profile?.full_name || '',
          p_registration_status: 'registered',
        });

        if (rpcError) throw rpcError;
        await refreshProfile();
      }

      if (form.id) {
        await updateBusiness(form.id, {
          business_name: form.businessName.trim(),
          business_type: form.businessType,
          gst_registered: form.gstRegistered,
          gstin: form.gstRegistered ? form.gstin : null,
          address_line_1: form.addressLine1.trim(),
          address_line_2: form.addressLine2.trim() || null,
          city: form.city.trim(),
          state: form.state.trim(),
          landmark: form.landmark.trim() || null,
          pincode: form.pincode.trim(),
        });
        if (form.isDefault) {
          await setDefaultBusiness(form.id);
        }
      } else {
        const created = await createBusiness({
          business_name: form.businessName.trim(),
          business_type: form.businessType,
          gst_registered: form.gstRegistered,
          gstin: form.gstRegistered ? form.gstin : undefined,
          is_default: form.isDefault,
          address_line_1: form.addressLine1.trim(),
          address_line_2: form.addressLine2.trim() || undefined,
          city: form.city.trim(),
          state: form.state.trim(),
          landmark: form.landmark.trim() || undefined,
          pincode: form.pincode.trim(),
        });
        if (created) onRegistered(created);
      }

      await load();
      setMode('list');
    } catch (err: any) {
      console.error('Failed to save business', err);
      setError(err?.message || 'Could not save business. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (b: Business) => {
    try {
      await setDefaultBusiness(b.id);
      await load();
    } catch (err) {
      console.error('Failed to set default', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try {
      await deleteBusiness(confirmDeleteId);
      await load();
    } catch (err) {
      console.error('Failed to delete business', err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatAddress = (b: Business): string => {
    const parts = [
      b.address_line_1,
      b.address_line_2,
      b.landmark,
      b.city && b.state ? `${b.city}, ${b.state}` : b.city || b.state,
      b.pincode,
    ].filter((p): p is string => !!p && p.trim().length > 0);
    return parts.join(', ');
  };

  /* ─────────────────── FORM VIEW ─────────────────── */
  if (mode === 'form') {
    const isEdit = !!form.id;
    return (
      <div className="safe-top px-4 pb-6 space-y-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('list')}
            className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center text-ink-600 shadow-xs active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">
              {isEdit ? 'Edit business' : 'New business'}
            </h1>
            <p className="text-xs text-ink-500 mt-0.5">
              {isEdit ? 'Update your business details' : 'Add a billing profile'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-2xl p-4 space-y-4 shadow-card">
          {profile?.registration_status !== 'registered' && (
            <div>
              <label className="text-xs font-bold text-ink-700">
                Your name <span className="text-red-500">*</span>
              </label>
              <input
                value={personalName}
                onChange={(e) => setPersonalName(e.target.value)}
                placeholder="Enter your full name"
                className={`mt-1.5 ${INPUT_CLS}`}
              />
            </div>
          )}

          <div className={profile?.registration_status !== 'registered' ? 'border-t border-ink-100 pt-4' : ''}>
            <label className="text-xs font-bold text-ink-700">
              Business name <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5 relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. ABC Foods"
                className={`${INPUT_CLS} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-700">Business type</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, businessType: type })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    form.businessType === type
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'bg-ink-50 text-ink-600 border border-ink-200 hover:bg-ink-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-ink-100 pt-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <MapPin size={13} className="text-emerald-800" />
              <label className="text-xs font-bold text-ink-700">
                Billing address <span className="text-red-500">*</span>
              </label>
            </div>

            <div className="space-y-2.5">
              <input
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                placeholder="Address line 1 *"
                className={INPUT_CLS}
              />
              <input
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                placeholder="Address line 2 (optional)"
                className={INPUT_CLS}
              />
              <input
                value={form.landmark}
                onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                placeholder="Landmark (optional)"
                className={INPUT_CLS}
              />
              <div className="grid grid-cols-2 gap-2.5">
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
              </div>
              <input
                value={form.pincode}
                onChange={(e) =>
                  setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                }
                placeholder="Pincode *"
                inputMode="numeric"
                className={`${INPUT_CLS} tracking-wider`}
              />
            </div>
          </div>

          <div className="border-t border-ink-100 pt-4">
            <label className="text-xs font-bold text-ink-700">GST registered?</label>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, gstRegistered: true })}
                className={`flex-1 h-11 rounded-xl text-sm font-bold border-2 transition-colors ${
                  form.gstRegistered
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-ink-200 text-ink-500 hover:bg-ink-50'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, gstRegistered: false, gstin: '' })}
                className={`flex-1 h-11 rounded-xl text-sm font-bold border-2 transition-colors ${
                  !form.gstRegistered
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                    : 'border-ink-200 text-ink-500 hover:bg-ink-50'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {form.gstRegistered && (
            <div>
              <label className="text-xs font-bold text-ink-700">
                GSTIN <span className="text-red-500">*</span>
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={form.gstin}
                  onChange={(e) =>
                    setForm({ ...form, gstin: e.target.value.toUpperCase().slice(0, 15) })
                  }
                  placeholder="15-digit GSTIN"
                  className={`flex-1 h-11 rounded-xl border border-ink-200 px-3 text-sm uppercase tracking-wider outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-50`}
                />
                <div className="h-11 px-3 rounded-xl bg-ink-50 border border-ink-200 text-[11px] font-bold text-ink-500 flex items-center gap-1">
                  <ShieldCheck size={13} /> {form.gstin.length}/15
                </div>
              </div>
            </div>
          )}

          <label className="flex items-start gap-2 text-xs text-ink-700 pt-3 border-t border-ink-100 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="mt-0.5 accent-emerald-900"
            />
            <span>
              <span className="font-bold text-ink-800">Set as default billing profile</span>
              <span className="block text-[11px] text-ink-400 mt-0.5">
                This business will be preselected at checkout.
              </span>
            </span>
          </label>

          {error && (
            <p className="text-xs text-red-500 text-center bg-red-50 border border-red-100 rounded-lg py-2 px-3">
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-emerald-900 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft disabled:opacity-60 active:scale-[0.99] transition-transform"
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <>
              <Check size={17} /> {isEdit ? 'Save changes' : 'Add business'}
            </>
          )}
        </button>
      </div>
    );
  }

  /* ─────────────────── LIST VIEW ─────────────────── */
  return (
    <div className="safe-top px-4 pb-6 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center text-ink-600 shadow-xs active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">My Businesses</h1>
          <p className="text-xs text-ink-500 mt-0.5">Manage billing profiles & GST details</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-200 border-t-emerald-900 animate-spin" />
        </div>
      ) : businesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
          <div className="h-20 w-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-900">
            <Building2 size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-extrabold text-ink-900 mt-5">No businesses yet</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-[270px]">
            Add your first business to get GST invoices and streamline checkout.
          </p>
          <button
            onClick={startCreate}
            className="mt-6 h-12 px-6 rounded-xl bg-emerald-900 text-white text-sm font-bold flex items-center gap-2 shadow-soft active:scale-[0.98] transition-transform"
          >
            <Plus size={17} /> Add business
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {businesses.map((b) => (
              <div
                key={b.id}
                className={`bg-white border rounded-2xl p-3.5 shadow-card transition-all ${
                  b.is_default
                    ? 'border-emerald-400 ring-2 ring-emerald-100/60'
                    : 'border-ink-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-ink-800 truncate">{b.business_name}</p>
                      {b.is_default && (
                        <span className="text-[9px] font-black uppercase bg-emerald-900 text-white rounded-full px-2 py-0.5 flex items-center gap-1">
                          <Star size={9} fill="white" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-500 mt-0.5">{b.business_type || '—'}</p>
                    {formatAddress(b) && (
                      <p className="text-[11px] text-ink-600 mt-1 leading-snug">{formatAddress(b)}</p>
                    )}
                    {b.gst_registered && b.gstin ? (
                      <p className="text-[11px] text-ink-600 mt-1 font-mono tracking-wide">
                        GSTIN: <span className="font-bold">{b.gstin}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-ink-400 mt-1">Not GST registered</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-ink-100">
                  {!b.is_default && (
                    <button
                      onClick={() => void handleSetDefault(b)}
                      className="flex-1 h-8 px-3 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
                    >
                      <Star size={12} /> Set Default
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(b)}
                    className="h-8 px-3 rounded-lg border border-ink-200 text-ink-700 text-[11px] font-bold flex items-center gap-1 hover:bg-ink-50 transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(b.id)}
                    className="h-8 w-8 rounded-lg border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={startCreate}
            className="w-full h-12 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Plus size={17} /> Add another business
          </button>
        </>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-ink-900">Delete business?</h3>
                <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                  This cannot be undone. Past invoices that already reference this business will
                  keep the snapshot they were created with.
                </p>
              </div>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="text-ink-400 shrink-0 hover:text-ink-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 h-11 rounded-xl bg-ink-100 text-ink-700 text-xs font-bold hover:bg-ink-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmDelete()}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 h-11 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 hover:bg-red-700 transition-colors"
              >
                {deletingId === confirmDeleteId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}