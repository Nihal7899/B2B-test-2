import { useEffect, useState } from 'react';
import { Loader2, Save, Radar, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminSettingsManager() {
  const [radiusKm, setRadiusKm] = useState('2');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'dispatch_radius_km')
        .maybeSingle();

      if (cancelled) return;
      if (err) {
        console.warn('Failed to read dispatch radius setting:', err);
      } else if (data?.value && typeof data.value === 'object' && 'km' in (data.value as any)) {
        setRadiusKm(String((data.value as any).km));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    const km = Number(radiusKm);
    if (!Number.isFinite(km) || km <= 0 || km > 100) {
      setError('Radius must be a number between 0 and 100 km.');
      return;
    }

    setSaving(true);
    setError('');

    const { error: err } = await supabase
      .from('app_settings')
      .upsert(
        {
          key: 'dispatch_radius_km',
          value: { km },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    setSaving(false);

    if (err) {
      setError(err.message || 'Could not save setting.');
      return;
    }

    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 2500);
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
          <p className="text-xs text-ink-500 mt-0.5">Operational defaults for dispatch & warehouse</p>
        </div>
      </div>

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

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
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
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-800">Tip:</strong> Lower values (0.5 – 2 km) work best in dense
        city areas where many shops sit in the same block. Higher values (5 – 10 km) make sense for
        suburban routes where the next customer is far.
      </div>
    </div>
  );
}