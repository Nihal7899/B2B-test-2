import { useEffect, useState } from 'react';
import {
  Loader2, Save, Radar, Check, Phone, MessageCircle,
  KeyRound, Eye, EyeOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminSettingsManager() {
  const [radiusKm, setRadiusKm] = useState('2');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [roleChangePin, setRoleChangePin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', [
          'dispatch_radius_km',
          'support_phone',
          'support_whatsapp',
          'role_change_pin',
        ]);

      if (cancelled) return;
      if (err) {
        console.warn('Failed to read settings:', err);
      } else if (data) {
        data.forEach((row: any) => {
          if (row.key === 'dispatch_radius_km' && row.value && 'km' in row.value) {
            setRadiusKm(String(row.value.km));
          }
          if (row.key === 'support_phone' && row.value && 'number' in row.value) {
            setSupportPhone(String(row.value.number));
          }
          if (row.key === 'support_whatsapp' && row.value && 'number' in row.value) {
            setSupportWhatsapp(String(row.value.number));
          }
          if (row.key === 'role_change_pin' && row.value && 'pin' in row.value) {
            setRoleChangePin(String(row.value.pin));
          }
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    const km = Number(radiusKm);
    if (!Number.isFinite(km) || km <= 0 || km > 100) {
      setError('Radius must be a number between 0 and 100 km.');
      return;
    }

    const cleanPhone = supportPhone.replace(/\s/g, '');
    const cleanWhatsapp = supportWhatsapp.replace(/\s/g, '');

    if (cleanPhone && !/^\+?\d{7,15}$/.test(cleanPhone)) {
      setError('Support phone must be a valid number (e.g., +919876543210).');
      return;
    }
    if (cleanWhatsapp && !/^\+?\d{7,15}$/.test(cleanWhatsapp)) {
      setError('WhatsApp number must be a valid number (e.g., +919876543210).');
      return;
    }

    const cleanPin = roleChangePin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      setError('Role change PIN must be exactly 4 digits.');
      return;
    }

    setSaving(true);
    setError('');

    const now = new Date().toISOString();
    const rows = [
      { key: 'dispatch_radius_km', value: { km }, updated_at: now },
      { key: 'support_phone', value: { number: cleanPhone }, updated_at: now },
      { key: 'support_whatsapp', value: { number: cleanWhatsapp }, updated_at: now },
      { key: 'role_change_pin', value: { pin: cleanPin }, updated_at: now },
    ];

    try {
      const { error: err } = await supabase
        .from('app_settings')
        .upsert(rows, { onConflict: 'key' });

      if (err) {
        setError(err.message || 'Could not save settings.');
        return;
      }

      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (e: any) {
      setError(e?.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <Radar size={22} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">App Settings</h1>
          <p className="text-xs text-ink-500 mt-0.5">
            Operational defaults & support contact
          </p>
        </div>
      </div>

      {/* Dispatch radius */}
      <div className="bg-white border border-ink-100 rounded-2xl shadow-card p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
            <Radar size={13} className="text-brand-600" />
            Batch dispatch radius
          </label>
          <p className="text-[11px] text-ink-400 mt-1 leading-relaxed">
            When a warehouse manager opens the "Find nearby orders" panel, orders within this
            distance of the reference order will be shown for batch dispatch.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={0.5}
              max={100}
              step={0.5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="w-32 h-11 rounded-xl border border-ink-200 px-3 text-sm font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
            />
            <span className="text-sm font-bold text-ink-500">km</span>
          </div>
        </div>
      </div>

      {/* Support contact */}
      <div className="bg-white border border-ink-100 rounded-2xl shadow-card p-5 space-y-5">
        <div>
          <label className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
            <Phone size={13} className="text-emerald-600" />
            Support phone number
          </label>
          <p className="text-[11px] text-ink-400 mt-1 leading-relaxed">
            Customers can call this number from the Help Center for order or product support.
          </p>
          <input
            type="tel"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            placeholder="+919876543210"
            className="mt-3 w-full h-11 rounded-xl border border-ink-200 px-3 text-sm font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
          />
        </div>

        <div className="border-t border-ink-100 pt-4">
          <label className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
            <MessageCircle size={13} className="text-green-600" />
            Support WhatsApp number
          </label>
          <p className="text-[11px] text-ink-400 mt-1 leading-relaxed">
            Customers will be redirected to WhatsApp with their problem prefilled when they tap
            the WhatsApp button.
          </p>
          <input
            type="tel"
            value={supportWhatsapp}
            onChange={(e) => setSupportWhatsapp(e.target.value)}
            placeholder="+919876543210"
            className="mt-3 w-full h-11 rounded-xl border border-ink-200 px-3 text-sm font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
          />
        </div>
      </div>

      {/* Role change security PIN */}
      <div className="bg-white border border-ink-100 rounded-2xl shadow-card p-5 space-y-3">
        <div>
          <label className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
            <KeyRound size={13} className="text-amber-600" />
            Role change security PIN
          </label>
          <p className="text-[11px] text-ink-400 mt-1 leading-relaxed">
            A 4-digit PIN required to confirm any role change from the Roles Manager.
            Share it only with trusted admins. You will be prompted every time a role is changed.
          </p>

          <div className="mt-3 relative">
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={roleChangePin}
              onChange={(e) =>
                setRoleChangePin(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder="••••"
              className="w-full h-11 rounded-xl border border-ink-200 px-3 pr-11 text-sm font-bold tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
            />
            <button
              type="button"
              onClick={() => setShowPin((s) => !s)}
              aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            >
              {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <p className="text-[10px] text-ink-400 mt-2">
            Must be exactly 4 digits (0–9). If left blank, admins won't be able to change
            any user's role until a PIN is set here.
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold flex items-center gap-2 shadow-soft disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Save size={16} /> Save settings
            </>
          )}
        </button>

        {savedAt && (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <Check size={14} /> Saved
          </span>
        )}
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-800">Tip:</strong> Always include the country code for phone
        numbers (e.g., <span className="font-mono">+91</span> for India). This ensures WhatsApp
        deep links and phone dialers work correctly on all devices.
      </div>
    </div>
  );
}