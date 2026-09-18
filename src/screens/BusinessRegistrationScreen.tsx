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
} from 'lucide-react';
import { useAuth } from '@/auth';
import { updateProfile } from '@/services/catalog';
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
}

const EMPTY_FORM: FormState = {
  id: null,
  businessName: '',
  businessType: 'Restaurant',
  gstRegistered: false,
  gstin: '',
  isDefault: false,
};

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
    if (form.gstRegistered && form.gstin.length !== 15) {
      setError('Enter a valid 15-digit GSTIN or uncheck GST registered.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (profile?.registration_status !== 'registered') {
        await updateProfile({
          personal_name: personalName || profile?.personal_name || '',
          full_name: personalName || profile?.full_name || '',
          registration_status: 'registered',
        });
        await refreshProfile();
      }

      if (form.id) {
        await updateBusiness(form.id, {
          business_name: form.businessName.trim(),
          business_type: form.businessType,
          gst_registered: form.gstRegistered,
          gstin: form.gstRegistered ? form.gstin : null,
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

  if (mode === 'form') {
    const isEdit = !!form.id;
    return (
      <div className="safe-top px-4 pb-6 space-y-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('list')}
            className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center"
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
                className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
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
                className="w-full h-11 rounded-xl border border-ink-200 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
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
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-50 text-ink-600 border border-ink-200'
                  }`}
                >
                  {type}
                </button>
              ))}
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
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-ink-200 text-ink-500'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, gstRegistered: false, gstin: '' })}
                className={`flex-1 h-11 rounded-xl text-sm font-bold border-2 transition-colors ${
                  !form.gstRegistered
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-ink-200 text-ink-500'
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
                  className="flex-1 h-11 rounded-xl border border-ink-200 px-3 text-sm uppercase tracking-wider outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
                />
                <div className="h-11 px-3 rounded-xl bg-ink-50 border border-ink-200 text-[11px] font-bold text-ink-500 flex items-center gap-1">
                  <ShieldCheck size={13} /> {form.gstin.length}/15
                </div>
              </div>
            </div>
          )}

          <label className="flex items-start gap-2 text-xs text-ink-700 pt-2 border-t border-ink-100">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="mt-0.5 accent-brand-600"
            />
            <span>
              <span className="font-bold">Set as default billing profile</span>
              <span className="block text-[11px] text-ink-400 mt-0.5">
                This business will be preselected at checkout.
              </span>
            </span>
          </label>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft disabled:opacity-60"
        >
          {saving ? <Loader2 size={17} className="animate-spin" /> : <><Check size={17} /> {isEdit ? 'Save changes' : 'Add business'}</>}
        </button>
      </div>
    );
  }

  return (
    <div className="safe-top px-4 pb-6 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">My Businesses</h1>
          <p className="text-xs text-ink-500 mt-0.5">Manage billing profiles & GST details</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : businesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-20 w-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Building2 size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-extrabold text-ink-900 mt-5">No businesses yet</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-[260px]">
            Add your first business to get GST invoices and streamline checkout.
          </p>
          <button
            onClick={startCreate}
            className="mt-5 h-11 px-5 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center gap-2"
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
                className={`bg-white border rounded-2xl p-3.5 shadow-card ${
                  b.is_default ? 'border-brand-400 ring-2 ring-brand-100/60' : 'border-ink-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-ink-800 truncate">
                          {b.business_name}
                        </p>
                        {b.is_default && (
                          <span className="text-[9px] font-black uppercase bg-brand-600 text-white rounded-full px-2 py-0.5 flex items-center gap-1">
                            <Star size={9} fill="white" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-500 mt-0.5">{b.business_type || '—'}</p>
                      {b.gst_registered && b.gstin ? (
                        <p className="text-[11px] text-ink-600 mt-1 font-mono tracking-wide">
                          GSTIN: <span className="font-bold">{b.gstin}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-ink-400 mt-1">Not GST registered</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-ink-100">
                  {!b.is_default && (
                    <button
                      onClick={() => void handleSetDefault(b)}
                      className="flex-1 h-8 px-3 rounded-lg bg-brand-50 text-brand-700 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-brand-100"
                    >
                      <Star size={12} /> Set Default
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(b)}
                    className="h-8 px-3 rounded-lg border border-ink-200 text-ink-700 text-[11px] font-bold flex items-center gap-1 hover:bg-ink-50"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(b.id)}
                    className="h-8 w-8 rounded-lg border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={startCreate}
            className="w-full h-12 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-700 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Plus size={17} /> Add another business
          </button>
        </>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-ink-900">Delete business?</h3>
                <p className="text-xs text-ink-500 mt-1">
                  This cannot be undone. Past invoices that already reference this business will
                  keep the snapshot they were created with.
                </p>
              </div>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="text-ink-400 shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 h-10 rounded-xl bg-ink-100 text-ink-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmDelete()}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 h-10 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
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