// src/components/Admin/CompressionSettings.tsx
import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CompressionConfig, CompressionThreshold } from '@/lib/imageUtils';
import { getCompressionConfig } from '@/lib/imageUtils';

export default function CompressionSettings() {
  const [config, setConfig] = useState<CompressionConfig>({ thresholds: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const cfg = await getCompressionConfig();
    setConfig(cfg);
    setLoading(false);
  };

  const updateThreshold = (index: number, field: keyof CompressionThreshold, value: string | number) => {
    const newThresholds = [...config.thresholds];
    newThresholds[index] = {
      ...newThresholds[index],
      [field]: value === '' ? null : Number(value),
    };
    setConfig({ ...config, thresholds: newThresholds });
  };

  const addThreshold = () => {
    const last = config.thresholds[config.thresholds.length - 1];
    const newMin = last?.maxSizeMB !== null ? (last?.maxSizeMB ?? 10) : 10;
    setConfig({
      ...config,
      thresholds: [...config.thresholds, { minSizeMB: newMin, maxSizeMB: null, quality: 70 }],
    });
  };

  const removeThreshold = (index: number) => {
    if (config.thresholds.length <= 1) return;
    const newThresholds = config.thresholds.filter((_, i) => i !== index);
    // Ensure first min is 0 and last max is null
    if (newThresholds.length > 0) {
      newThresholds[0].minSizeMB = 0;
      newThresholds[newThresholds.length - 1].maxSizeMB = null;
    }
    setConfig({ ...config, thresholds: newThresholds });
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'compression_config', value: config }, { onConflict: 'key' });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save compression settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink-900">Image Compression Settings</h2>
        <p className="text-sm text-ink-500 mt-1">
          Define quality rates based on file size. Images will be compressed to WebP format.
        </p>
      </div>

      {config.thresholds.map((t, i) => (
        <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-ink-50 rounded-xl">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-bold text-ink-600 mb-0.5">Min (MB)</label>
            <input
              type="number"
              step="0.5"
              value={t.minSizeMB}
              disabled={i === 0}
              onChange={(e) => updateThreshold(i, 'minSizeMB', e.target.value)}
              className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500 disabled:opacity-50"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-bold text-ink-600 mb-0.5">Max (MB)</label>
            <input
              type="number"
              step="0.5"
              value={t.maxSizeMB === null ? '' : t.maxSizeMB}
              disabled={i === config.thresholds.length - 1}
              onChange={(e) => updateThreshold(i, 'maxSizeMB', e.target.value)}
              className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500 disabled:opacity-50"
              placeholder="∞"
            />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-bold text-ink-600 mb-0.5">Quality (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={t.quality}
              onChange={(e) => updateThreshold(i, 'quality', e.target.value)}
              className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={() => removeThreshold(i)}
            disabled={config.thresholds.length <= 1}
            className="mt-4 text-red-500 text-xs font-bold disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        onClick={addThreshold}
        className="text-brand-600 text-sm font-bold hover:underline"
      >
        + Add threshold
      </button>

      <button
        onClick={saveConfig}
        disabled={saving}
        className="flex items-center gap-2 px-6 h-10 rounded-xl bg-brand-600 text-white text-sm font-bold disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}