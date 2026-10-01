import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Save, Loader2, Plus, Trash2, ChevronDown, ChevronUp, Upload, Image as ImageIcon,
  Eye, EyeOff, RefreshCw, FolderPlus, MoveUp, MoveDown, X,
} from 'lucide-react';
import { CachedImage } from '@/components/CachedImage';
import { IconPicker } from './IconPicker';
import { supabase } from '@/lib/supabase';
import {
  fetchSiteContent, saveSiteContent, uploadSiteAsset, invalidateSiteContent,
  DEFAULT_HERO_CONFIG, DEFAULT_FOOTER_CONFIG, DEFAULT_ABOUT_CONFIG,
  type HeroConfig, type FooterConfig, type AboutConfig,
  type SiteSection,
} from '@/services/siteContent';

/* ============================ helpers ============================ */

function useCategories() {
  const [cats, setCats] = useState<{ id: string; name: string; slug: string }[]>([]);
  useEffect(() => {
    let active = true;
    supabase.from('categories').select('id, name, slug').eq('is_active', true)
      .order('sort_order').then(({ data }) => {
        if (active && data) setCats(data as any);
      });
    return () => { active = false; };
  }, []);
  return cats;
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#89c74e]/40 focus:border-[#89c74e] transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function SectionHeader({
  title, enabled, onToggle, open, onOpenChange, icon: Icon,
}: {
  title: string;
  enabled?: boolean;
  onToggle?: (v: boolean) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        {Icon && <Icon className="w-4 h-4 text-[#02402c]" />}
        <span className="text-xs font-black text-slate-800 flex-1">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {onToggle && (
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          title={enabled ? 'Disable section' : 'Enable section'}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {enabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}
    </div>
  );
}

/* ============================ image uploader ============================ */

function ImageUploader({
  value, onChange, folder, label,
}: { value: string; onChange: (url: string) => void; folder: 'hero' | 'about'; label?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadSiteAsset(file, folder, setProgress);
      onChange(url);
    } catch (e) {
      console.error(e);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>}
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            <CachedImage src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#02402c] text-white text-xs font-bold hover:bg-[#03543a] disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? `Uploading ${Math.round(progress)}%` : 'Upload image'}
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste image URL"
            className={`${inputCls} mt-2`}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================ HERO EDITOR ============================ */

function HeroEditor({ config, setConfig }: { config: HeroConfig; setConfig: (c: HeroConfig) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    badge: true, slides: true, ctas: false, stats: false, features: false,
  });
  const upd = (patch: Partial<HeroConfig>) => setConfig({ ...config, ...patch });
  const updEnabled = (k: keyof HeroConfig['enabled'], v: boolean) =>
    upd({ enabled: { ...config.enabled, [k]: v } });

  return (
    <div className="space-y-4">
      {/* Badge */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Badge Label"
          enabled={config.enabled.badge}
          onToggle={(v) => updEnabled('badge', v)}
          open={!!open.badge}
          onOpenChange={(o) => setOpen({ ...open, badge: o })}
        />
        {open.badge && (
          <Field label="Badge text">
            <input className={inputCls} value={config.badge} onChange={(e) => upd({ badge: e.target.value })} />
          </Field>
        )}
      </div>

      {/* Slides */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title={`Carousel Slides (${config.slides.length})`}
          enabled={config.enabled.slides}
          onToggle={(v) => updEnabled('slides', v)}
          open={!!open.slides}
          onOpenChange={(o) => setOpen({ ...open, slides: o })}
        />
        {open.slides && (
          <div className="space-y-3">
            {config.slides.map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500">SLIDE {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => {
                        const arr = [...config.slides];
                        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                        upd({ slides: arr });
                      }}
                      className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center disabled:opacity-30"
                    >
                      <MoveUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={i === config.slides.length - 1}
                      onClick={() => {
                        const arr = [...config.slides];
                        [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                        upd({ slides: arr });
                      }}
                      className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center disabled:opacity-30"
                    >
                      <MoveDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => upd({ slides: config.slides.filter((_, j) => j !== i) })}
                      className="w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <ImageUploader
                  value={s.image}
                  onChange={(url) => {
                    const arr = [...config.slides];
                    arr[i] = { ...arr[i], image: url };
                    upd({ slides: arr });
                  }}
                  folder="hero"
                  label="Image"
                />
                <Field label="Title">
                  <input
                    className={inputCls}
                    value={s.title}
                    onChange={(e) => {
                      const arr = [...config.slides];
                      arr[i] = { ...arr[i], title: e.target.value };
                      upd({ slides: arr });
                    }}
                  />
                </Field>
                <Field label="Subtitle">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={s.subtitle}
                    onChange={(e) => {
                      const arr = [...config.slides];
                      arr[i] = { ...arr[i], subtitle: e.target.value };
                      upd({ slides: arr });
                    }}
                  />
                </Field>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                upd({ slides: [...config.slides, { image: '', title: 'New slide', subtitle: 'Add a subtitle' }] })
              }
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-[#89c74e] text-slate-600 hover:text-[#02402c] text-xs font-bold"
            >
              <Plus size={14} /> Add slide
            </button>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Call-to-action buttons"
          open={!!open.ctas}
          onOpenChange={(o) => setOpen({ ...open, ctas: o })}
        />
        {open.ctas && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-100 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-500">PRIMARY</span>
                <button
                  onClick={() => updEnabled('primaryCta', !config.enabled.primaryCta)}
                  className={`text-[10px] font-bold px-2 py-1 rounded ${config.enabled.primaryCta ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                >
                  {config.enabled.primaryCta ? 'VISIBLE' : 'HIDDEN'}
                </button>
              </div>
              <Field label="Text">
                <input
                  className={inputCls}
                  value={config.primaryCta.text}
                  onChange={(e) => upd({ primaryCta: { ...config.primaryCta, text: e.target.value } })}
                />
              </Field>
              <Field label="Link (route or URL)">
                <input
                  className={inputCls}
                  value={config.primaryCta.link}
                  onChange={(e) => upd({ primaryCta: { ...config.primaryCta, link: e.target.value } })}
                />
              </Field>
            </div>
            <div className="rounded-lg border border-slate-100 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-500">SECONDARY</span>
                <button
                  onClick={() => updEnabled('secondaryCta', !config.enabled.secondaryCta)}
                  className={`text-[10px] font-bold px-2 py-1 rounded ${config.enabled.secondaryCta ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                >
                  {config.enabled.secondaryCta ? 'VISIBLE' : 'HIDDEN'}
                </button>
              </div>
              <Field label="Text">
                <input
                  className={inputCls}
                  value={config.secondaryCta.text}
                  onChange={(e) => upd({ secondaryCta: { ...config.secondaryCta, text: e.target.value } })}
                />
              </Field>
              <Field label="Link (route or URL)">
                <input
                  className={inputCls}
                  value={config.secondaryCta.link}
                  onChange={(e) => upd({ secondaryCta: { ...config.secondaryCta, link: e.target.value } })}
                />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title={`Stats (${config.stats.length})`}
          enabled={config.enabled.stats}
          onToggle={(v) => updEnabled('stats', v)}
          open={!!open.stats}
          onOpenChange={(o) => setOpen({ ...open, stats: o })}
        />
        {open.stats && (
          <div className="space-y-2">
            {config.stats.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputCls}
                  value={s.value}
                  placeholder="Value"
                  onChange={(e) => {
                    const arr = [...config.stats];
                    arr[i] = { ...arr[i], value: e.target.value };
                    upd({ stats: arr });
                  }}
                />
                <input
                  className={inputCls}
                  value={s.label}
                  placeholder="Label"
                  onChange={(e) => {
                    const arr = [...config.stats];
                    arr[i] = { ...arr[i], label: e.target.value };
                    upd({ stats: arr });
                  }}
                />
                <button
                  onClick={() => upd({ stats: config.stats.filter((_, j) => j !== i) })}
                  className="w-8 h-8 shrink-0 rounded-md bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={() => upd({ stats: [...config.stats, { value: '0', label: 'New stat' }] })}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-[#89c74e] text-slate-600 hover:text-[#02402c] text-xs font-bold"
            >
              <Plus size={14} /> Add stat
            </button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title={`Feature cards (${config.features.length})`}
          enabled={config.enabled.features}
          onToggle={(v) => updEnabled('features', v)}
          open={!!open.features}
          onOpenChange={(o) => setOpen({ ...open, features: o })}
        />
        {open.features && (
          <div className="space-y-3">
            {config.features.map((f, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500">CARD {i + 1}</span>
                  <button
                    onClick={() => upd({ features: config.features.filter((_, j) => j !== i) })}
                    className="w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <IconPicker
                  value={f.icon}
                  onChange={(key) => {
                    const arr = [...config.features];
                    arr[i] = { ...arr[i], icon: key };
                    upd({ features: arr });
                  }}
                  label="Icon"
                />
                <Field label="Title">
                  <input
                    className={inputCls}
                    value={f.title}
                    onChange={(e) => {
                      const arr = [...config.features];
                      arr[i] = { ...arr[i], title: e.target.value };
                      upd({ features: arr });
                    }}
                  />
                </Field>
                <Field label="Description">
                  <input
                    className={inputCls}
                    value={f.desc}
                    onChange={(e) => {
                      const arr = [...config.features];
                      arr[i] = { ...arr[i], desc: e.target.value };
                      upd({ features: arr });
                    }}
                  />
                </Field>
              </div>
            ))}
            <button
              onClick={() =>
                upd({ features: [...config.features, { icon: 'sparkles', title: 'New feature', desc: 'Description' }] })
              }
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-[#89c74e] text-slate-600 hover:text-[#02402c] text-xs font-bold"
            >
              <Plus size={14} /> Add feature
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ FOOTER EDITOR ============================ */

function FooterEditor({ config, setConfig }: { config: FooterConfig; setConfig: (c: FooterConfig) => void }) {
  const categories = useCategories();
  const [open, setOpen] = useState<Record<string, boolean>>({
    cta: true, brand: false, groups: true, social: false, copyright: false,
  });
  const upd = (patch: Partial<FooterConfig>) => setConfig({ ...config, ...patch });
  const updEnabled = (k: keyof FooterConfig['enabled'], v: boolean) =>
    upd({ enabled: { ...config.enabled, [k]: v } });

  const updateGroup = (idx: number, patch: Partial<FooterConfig['linkGroups'][number]>) => {
    const arr = [...config.linkGroups];
    arr[idx] = { ...arr[idx], ...patch };
    upd({ linkGroups: arr });
  };

  return (
    <div className="space-y-4">
      {/* CTA Banner */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="CTA Banner"
          enabled={config.enabled.ctaBanner}
          onToggle={(v) => updEnabled('ctaBanner', v)}
          open={!!open.cta}
          onOpenChange={(o) => setOpen({ ...open, cta: o })}
        />
        {open.cta && (
          <div className="space-y-2">
            <Field label="Title">
              <input className={inputCls} value={config.ctaBanner.title} onChange={(e) => upd({ ctaBanner: { ...config.ctaBanner, title: e.target.value } })} />
            </Field>
            <Field label="Subtitle">
              <input className={inputCls} value={config.ctaBanner.subtitle} onChange={(e) => upd({ ctaBanner: { ...config.ctaBanner, subtitle: e.target.value } })} />
            </Field>
            <Field label="Button text">
              <input className={inputCls} value={config.ctaBanner.ctaText} onChange={(e) => upd({ ctaBanner: { ...config.ctaBanner, ctaText: e.target.value } })} />
            </Field>
            <Field label="Button link">
              <input className={inputCls} value={config.ctaBanner.ctaLink} onChange={(e) => upd({ ctaBanner: { ...config.ctaBanner, ctaLink: e.target.value } })} />
            </Field>
          </div>
        )}
      </div>

      {/* Brand block */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Brand / Contact"
          enabled={config.enabled.brand}
          onToggle={(v) => updEnabled('brand', v)}
          open={!!open.brand}
          onOpenChange={(o) => setOpen({ ...open, brand: o })}
        />
        {open.brand && (
          <div className="space-y-2">
            <Field label="Description">
              <textarea rows={3} className={inputCls} value={config.brand.description} onChange={(e) => upd({ brand: { ...config.brand, description: e.target.value } })} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={config.brand.email} onChange={(e) => upd({ brand: { ...config.brand, email: e.target.value } })} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={config.brand.phone} onChange={(e) => upd({ brand: { ...config.brand, phone: e.target.value } })} />
            </Field>
            <Field label="Address">
              <input className={inputCls} value={config.brand.address} onChange={(e) => upd({ brand: { ...config.brand, address: e.target.value } })} />
            </Field>
          </div>
        )}
      </div>

      {/* Link groups */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title={`Link Groups (${config.linkGroups.length})`}
          enabled={config.enabled.linkGroups}
          onToggle={(v) => updEnabled('linkGroups', v)}
          open={!!open.groups}
          onOpenChange={(o) => setOpen({ ...open, groups: o })}
        />
        {open.groups && (
          <div className="space-y-3">
            {config.linkGroups.map((g, gi) => (
              <div key={g.id} className="rounded-lg border border-slate-100 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className={inputCls}
                    value={g.title}
                    placeholder="Group title"
                    onChange={(e) => updateGroup(gi, { title: e.target.value })}
                  />
                  <button
                    onClick={() => {
                      const enabled = !g.enabled;
                      updateGroup(gi, { enabled });
                    }}
                    className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${g.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                    title={g.enabled ? 'Visible' : 'Hidden'}
                  >
                    {g.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => upd({ linkGroups: config.linkGroups.filter((_, j) => j !== gi) })}
                    className="shrink-0 w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <Field label="Link source">
                  <select
                    className={inputCls}
                    value={g.source}
                    onChange={(e) => updateGroup(gi, { source: e.target.value as any })}
                  >
                    <option value="custom">Custom links</option>
                    <option value="categories">Auto: Available categories</option>
                  </select>
                </Field>

                {g.source === 'categories' ? (
                  <Field label={`Show first N categories (max ${categories.length || '—'})`}>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      className={inputCls}
                      value={g.categoryLimit}
                      onChange={(e) => updateGroup(gi, { categoryLimit: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Categories are pulled live from your store. Clicking navigates to that category page.
                    </p>
                  </Field>
                ) : (
                  <div className="space-y-2">
                    {g.links.map((lnk, li) => (
                      <div key={li} className="rounded-md bg-slate-50 p-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            className={inputCls}
                            placeholder="Label"
                            value={lnk.label}
                            onChange={(e) => {
                              const links = [...g.links];
                              links[li] = { ...links[li], label: e.target.value };
                              updateGroup(gi, { links });
                            }}
                          />
                          <button
                            onClick={() => {
                              const links = g.links.filter((_, j) => j !== li);
                              updateGroup(gi, { links });
                            }}
                            className="shrink-0 w-8 h-8 rounded-md bg-red-50 text-red-500 flex items-center justify-center"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            className={`${inputCls} max-w-[110px]`}
                            value={lnk.type}
                            onChange={(e) => {
                              const links = [...g.links];
                              links[li] = { ...links[li], type: e.target.value as any };
                              updateGroup(gi, { links });
                            }}
                          >
                            <option value="route">Route</option>
                            <option value="external">External</option>
                            <option value="category">Category ID</option>
                          </select>
                          <input
                            className={inputCls}
                            placeholder={lnk.type === 'route' ? '/help' : lnk.type === 'external' ? 'https://...' : 'category-id'}
                            value={lnk.value}
                            onChange={(e) => {
                              const links = [...g.links];
                              links[li] = { ...links[li], value: e.target.value };
                              updateGroup(gi, { links });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => updateGroup(gi, { links: [...g.links, { label: 'New link', type: 'route', value: '/' }] })}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md border-2 border-dashed border-slate-200 hover:border-[#89c74e] text-slate-600 hover:text-[#02402c] text-[11px] font-bold"
                    >
                      <Plus size={12} /> Add link
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() =>
                upd({
                  linkGroups: [
                    ...config.linkGroups,
                    { id: `group-${Date.now()}`, title: 'New group', enabled: true, source: 'custom', categoryLimit: 5, links: [] },
                  ],
                })
              }
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-[#89c74e] text-slate-600 hover:text-[#02402c] text-xs font-bold"
            >
              <Plus size={14} /> Add link group
            </button>
          </div>
        )}
      </div>

      {/* Social */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Social Links"
          enabled={config.enabled.social}
          onToggle={(v) => updEnabled('social', v)}
          open={!!open.social}
          onOpenChange={(o) => setOpen({ ...open, social: o })}
        />
        {open.social && (
          <div className="grid grid-cols-2 gap-2">
            {(['instagram', 'linkedin', 'twitter', 'facebook'] as const).map((k) => (
              <Field key={k} label={k.toUpperCase()}>
                <input
                  className={inputCls}
                  value={config.social[k]}
                  onChange={(e) => upd({ social: { ...config.social, [k]: e.target.value } })}
                />
              </Field>
            ))}
          </div>
        )}
      </div>

      {/* Copyright */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Copyright"
          enabled={config.enabled.copyright}
          onToggle={(v) => updEnabled('copyright', v)}
          open={!!open.copyright}
          onOpenChange={(o) => setOpen({ ...open, copyright: o })}
        />
        {open.copyright && (
          <Field label="Copyright text (year prepended automatically)">
            <input className={inputCls} value={config.copyright} onChange={(e) => upd({ copyright: e.target.value })} />
          </Field>
        )}
      </div>
    </div>
  );
}

/* ============================ ABOUT EDITOR ============================ */

function AboutEditor({ config, setConfig }: { config: AboutConfig; setConfig: (c: AboutConfig) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    hero: true, statsBar: false, mission: false, vision: false,
    journey: false, values: false, impact: false, quote: false, cta: false,
  });
  const upd = (patch: Partial<AboutConfig>) => setConfig({ ...config, ...patch });
  const updEnabled = (k: keyof AboutConfig['enabled'], v: boolean) =>
    upd({ enabled: { ...config.enabled, [k]: v } });

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Hero section"
          enabled={config.enabled.hero}
          onToggle={(v) => updEnabled('hero', v)}
          open={!!open.hero}
          onOpenChange={(o) => setOpen({ ...open, hero: o })}
        />
        {open.hero && (
          <div className="space-y-2">
            <Field label="Badge">
              <input className={inputCls} value={config.hero.badge} onChange={(e) => upd({ hero: { ...config.hero, badge: e.target.value } })} />
            </Field>
            <Field label="Title (first line)">
              <input className={inputCls} value={config.hero.title} onChange={(e) => upd({ hero: { ...config.hero, title: e.target.value } })} />
            </Field>
            <Field label="Highlighted title (green)">
              <input className={inputCls} value={config.hero.titleHighlight} onChange={(e) => upd({ hero: { ...config.hero, titleHighlight: e.target.value } })} />
            </Field>
            <Field label="Subtitle">
              <textarea rows={3} className={inputCls} value={config.hero.subtitle} onChange={(e) => upd({ hero: { ...config.hero, subtitle: e.target.value } })} />
            </Field>
            <ImageUploader
              value={config.hero.image}
              onChange={(url) => upd({ hero: { ...config.hero, image: url } })}
              folder="about"
              label="Background image"
            />
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title={`Stats bar (${config.statsBar.stats.length})`}
          enabled={config.enabled.statsBar}
          onToggle={(v) => updEnabled('statsBar', v)}
          open={!!open.statsBar}
          onOpenChange={(o) => setOpen({ ...open, statsBar: o })}
        />
        {open.statsBar && (
          <div className="space-y-2">
            {config.statsBar.stats.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={inputCls}
                  value={s.value}
                  onChange={(e) => {
                    const arr = [...config.statsBar.stats];
                    arr[i] = { ...arr[i], value: e.target.value };
                    upd({ statsBar: { stats: arr } });
                  }}
                />
                <input
                  className={inputCls}
                  value={s.label}
                  onChange={(e) => {
                    const arr = [...config.statsBar.stats];
                    arr[i] = { ...arr[i], label: e.target.value };
                    upd({ statsBar: { stats: arr } });
                  }}
                />
                <button
                  onClick={() => upd({ statsBar: { stats: config.statsBar.stats.filter((_, j) => j !== i) } })}
                  className="w-8 h-8 shrink-0 rounded-md bg-red-50 text-red-500 flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={() => upd({ statsBar: { stats: [...config.statsBar.stats, { value: '0', label: 'New stat' }] } })}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-[#89c74e] text-xs font-bold text-slate-600"
            >
              <Plus size={14} /> Add stat
            </button>
          </div>
        )}
      </div>

      {/* Mission */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Mission card"
          enabled={config.enabled.missionVision}
          onToggle={(v) => updEnabled('missionVision', v)}
          open={!!open.mission}
          onOpenChange={(o) => setOpen({ ...open, mission: o })}
        />
        {open.mission && (
          <div className="space-y-2">
            <IconPicker value={config.mission.icon} onChange={(k) => upd({ mission: { ...config.mission, icon: k } })} label="Icon" />
            <Field label="Title">
              <input className={inputCls} value={config.mission.title} onChange={(e) => upd({ mission: { ...config.mission, title: e.target.value } })} />
            </Field>
            <Field label="Content">
              <textarea rows={4} className={inputCls} value={config.mission.content} onChange={(e) => upd({ mission: { ...config.mission, content: e.target.value } })} />
            </Field>
          </div>
        )}
      </div>

      {/* Vision */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Vision card"
          open={!!open.vision}
          onOpenChange={(o) => setOpen({ ...open, vision: o })}
        />
        {open.vision && (
          <div className="space-y-2">
            <IconPicker value={config.vision.icon} onChange={(k) => upd({ vision: { ...config.vision, icon: k } })} label="Icon" />
            <Field label="Title">
              <input className={inputCls} value={config.vision.title} onChange={(e) => upd({ vision: { ...config.vision, title: e.target.value } })} />
            </Field>
            <Field label="Content">
              <textarea rows={4} className={inputCls} value={config.vision.content} onChange={(e) => upd({ vision: { ...config.vision, content: e.target.value } })} />
            </Field>
          </div>
        )}
      </div>

      {/* Journey */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title={`Journey milestones (${config.journey.milestones.length})`}
          enabled={config.enabled.journey}
          onToggle={(v) => updEnabled('journey', v)}
          open={!!open.journey}
          onOpenChange={(o) => setOpen({ ...open, journey: o })}
        />
        {open.journey && (
          <div className="space-y-3">
            <Field label="Title">
              <input className={inputCls} value={config.journey.title} onChange={(e) => upd({ journey: { ...config.journey, title: e.target.value } })} />
            </Field>
            <Field label="Subtitle">
              <input className={inputCls} value={config.journey.subtitle} onChange={(e) => upd({ journey: { ...config.journey, subtitle: e.target.value } })} />
            </Field>
            {config.journey.milestones.map((m, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className={`${inputCls} max-w-[90px]`}
                    value={m.year}
                    onChange={(e) => {
                      const arr = [...config.journey.milestones];
                      arr[i] = { ...arr[i], year: e.target.value };
                      upd({ journey: { ...config.journey, milestones: arr } });
                    }}
                  />
                  <input
                    className={inputCls}
                    value={m.title}
                    onChange={(e) => {
                      const arr = [...config.journey.milestones];
                      arr[i] = { ...arr[i], title: e.target.value };
                      upd({ journey: { ...config.journey, milestones: arr } });
                    }}
                  />
                  <button
                    onClick={() => {
                      const arr = config.journey.milestones.filter((_, j) => j !== i);
                      upd({ journey: { ...config.journey, milestones: arr } });
                    }}
                    className="w-8 h-8 shrink-0 rounded-md bg-red-50 text-red-500 flex items-center justify-center"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <textarea
                  rows={2}
                  className={inputCls}
                  value={m.desc}
                  onChange={(e) => {
                    const arr = [...config.journey.milestones];
                    arr[i] = { ...arr[i], desc: e.target.value };
                    upd({ journey: { ...config.journey, milestones: arr } });
                  }}
                />
              </div>
            ))}
            <button
              onClick={() =>
                upd({
                  journey: {
                    ...config.journey,
                    milestones: [...config.journey.milestones, { year: '2026', title: 'New milestone', desc: 'Description' }],
                  },
                })
              }
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-[#89c74e] text-xs font-bold text-slate-600"
            >
              <Plus size={14} /> Add milestone
            </button>
          </div>
        )}
      </div>

      {/* Values */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title={`Core values (${config.values.items.length})`}
          enabled={config.enabled.values}
          onToggle={(v) => updEnabled('values', v)}
          open={!!open.values}
          onOpenChange={(o) => setOpen({ ...open, values: o })}
        />
        {open.values && (
          <div className="space-y-3">
            <Field label="Badge">
              <input className={inputCls} value={config.values.badge} onChange={(e) => upd({ values: { ...config.values, badge: e.target.value } })} />
            </Field>
            <Field label="Title">
              <input className={inputCls} value={config.values.title} onChange={(e) => upd({ values: { ...config.values, title: e.target.value } })} />
            </Field>
            <Field label="Subtitle">
              <textarea rows={2} className={inputCls} value={config.values.subtitle} onChange={(e) => upd({ values: { ...config.values, subtitle: e.target.value } })} />
            </Field>
            {config.values.items.map((v, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500">VALUE {i + 1}</span>
                  <button
                    onClick={() => upd({ values: { ...config.values, items: config.values.items.filter((_, j) => j !== i) } })}
                    className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <IconPicker
                  value={v.icon}
                  onChange={(k) => {
                    const arr = [...config.values.items];
                    arr[i] = { ...arr[i], icon: k };
                    upd({ values: { ...config.values, items: arr } });
                  }}
                  label="Icon"
                />
                <input
                  className={inputCls}
                  value={v.title}
                  onChange={(e) => {
                    const arr = [...config.values.items];
                    arr[i] = { ...arr[i], title: e.target.value };
                    upd({ values: { ...config.values, items: arr } });
                  }}
                />
                <textarea
                  rows={2}
                  className={inputCls}
                  value={v.desc}
                  onChange={(e) => {
                    const arr = [...config.values.items];
                    arr[i] = { ...arr[i], desc: e.target.value };
                    upd({ values: { ...config.values, items: arr } });
                  }}
                />
              </div>
            ))}
            <button
              onClick={() =>
                upd({ values: { ...config.values, items: [...config.values.items, { icon: 'star', title: 'New value', desc: 'Description' }] } })
              }
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-[#89c74e] text-xs font-bold text-slate-600"
            >
              <Plus size={14} /> Add value
            </button>
          </div>
        )}
      </div>

      {/* Impact */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title={`Impact section (${config.impact.stats.length} stats)`}
          enabled={config.enabled.impact}
          onToggle={(v) => updEnabled('impact', v)}
          open={!!open.impact}
          onOpenChange={(o) => setOpen({ ...open, impact: o })}
        />
        {open.impact && (
          <div className="space-y-2">
            <Field label="Title">
              <input className={inputCls} value={config.impact.title} onChange={(e) => upd({ impact: { ...config.impact, title: e.target.value } })} />
            </Field>
            <Field label="Subtitle">
              <textarea rows={3} className={inputCls} value={config.impact.subtitle} onChange={(e) => upd({ impact: { ...config.impact, subtitle: e.target.value } })} />
            </Field>
            <ImageUploader
              value={config.impact.image}
              onChange={(url) => upd({ impact: { ...config.impact, image: url } })}
              folder="about"
              label="Section image"
            />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Badge value">
                <input className={inputCls} value={config.impact.badgeValue} onChange={(e) => upd({ impact: { ...config.impact, badgeValue: e.target.value } })} />
              </Field>
              <Field label="Badge label">
                <input className={inputCls} value={config.impact.badgeLabel} onChange={(e) => upd({ impact: { ...config.impact, badgeLabel: e.target.value } })} />
              </Field>
            </div>
            {config.impact.stats.map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500">STAT {i + 1}</span>
                  <button
                    onClick={() => upd({ impact: { ...config.impact, stats: config.impact.stats.filter((_, j) => j !== i) } })}
                    className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <IconPicker
                  value={s.icon}
                  onChange={(k) => {
                    const arr = [...config.impact.stats];
                    arr[i] = { ...arr[i], icon: k };
                    upd({ impact: { ...config.impact, stats: arr } });
                  }}
                  label="Icon"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={inputCls}
                    value={s.value}
                    onChange={(e) => {
                      const arr = [...config.impact.stats];
                      arr[i] = { ...arr[i], value: e.target.value };
                      upd({ impact: { ...config.impact, stats: arr } });
                    }}
                  />
                  <input
                    className={inputCls}
                    value={s.label}
                    onChange={(e) => {
                      const arr = [...config.impact.stats];
                      arr[i] = { ...arr[i], label: e.target.value };
                      upd({ impact: { ...config.impact, stats: arr } });
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() =>
                upd({ impact: { ...config.impact, stats: [...config.impact.stats, { icon: 'star', value: '0', label: 'New stat' }] } })
              }
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-[#89c74e] text-xs font-bold text-slate-600"
            >
              <Plus size={14} /> Add impact stat
            </button>
          </div>
        )}
      </div>

      {/* Quote */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Quote"
          enabled={config.enabled.quote}
          onToggle={(v) => updEnabled('quote', v)}
          open={!!open.quote}
          onOpenChange={(o) => setOpen({ ...open, quote: o })}
        />
        {open.quote && (
          <div className="space-y-2">
            <Field label="Quote text">
              <textarea rows={3} className={inputCls} value={config.quote.text} onChange={(e) => upd({ quote: { ...config.quote, text: e.target.value } })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Author">
                <input className={inputCls} value={config.quote.author} onChange={(e) => upd({ quote: { ...config.quote, author: e.target.value } })} />
              </Field>
              <Field label="Role">
                <input className={inputCls} value={config.quote.role} onChange={(e) => upd({ quote: { ...config.quote, role: e.target.value } })} />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-slate-100 bg-white p-3">
        <SectionHeader
          title="Bottom CTA"
          enabled={config.enabled.cta}
          onToggle={(v) => updEnabled('cta', v)}
          open={!!open.cta}
          onOpenChange={(o) => setOpen({ ...open, cta: o })}
        />
        {open.cta && (
          <div className="space-y-2">
            <Field label="Title">
              <input className={inputCls} value={config.cta.title} onChange={(e) => upd({ cta: { ...config.cta, title: e.target.value } })} />
            </Field>
            <Field label="Subtitle">
              <textarea rows={2} className={inputCls} value={config.cta.subtitle} onChange={(e) => upd({ cta: { ...config.cta, subtitle: e.target.value } })} />
            </Field>
            <Field label="Button text">
              <input className={inputCls} value={config.cta.ctaText} onChange={(e) => upd({ cta: { ...config.cta, ctaText: e.target.value } })} />
            </Field>
            <Field label="Button link">
              <input className={inputCls} value={config.cta.ctaLink} onChange={(e) => upd({ cta: { ...config.cta, ctaLink: e.target.value } })} />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ MAIN EDITOR ============================ */

export function SiteContentEditor() {
  const [tab, setTab] = useState<SiteSection>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [hero, setHero] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);
  const [footer, setFooter] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [about, setAbout] = useState<AboutConfig>(DEFAULT_ABOUT_CONFIG);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [h, f, a] = await Promise.all([
        fetchSiteContent<HeroConfig>('hero'),
        fetchSiteContent<FooterConfig>('footer'),
        fetchSiteContent<AboutConfig>('about'),
      ]);
      setHero(h);
      setFooter(f);
      setAbout(a);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = tab === 'hero' ? hero : tab === 'footer' ? footer : about;
      await saveSiteContent(tab, payload);
      invalidateSiteContent(tab);
      window.dispatchEvent(new CustomEvent('site-content-updated', { detail: { section: tab } }));
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    } catch (e) {
      console.error(e);
      alert('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!confirm('Reset current tab to default content? This will only apply on save.')) return;
    if (tab === 'hero') setHero(DEFAULT_HERO_CONFIG);
    if (tab === 'footer') setFooter(DEFAULT_FOOTER_CONFIG);
    if (tab === 'about') setAbout(DEFAULT_ABOUT_CONFIG);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-[#02402c]" />
            <h1 className="text-sm font-black text-slate-900">Site Content Editor</h1>
          </div>

          <div className="flex-1 flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['hero', 'footer', 'about'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded-md text-xs font-black capitalize transition-colors ${
                  tab === k ? 'bg-white text-[#02402c] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {k === 'hero' ? 'Hero' : k === 'footer' ? 'Footer' : 'About'}
              </button>
            ))}
          </div>

          <button
            onClick={() => void reload()}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            Reset
          </button>

          <button
            onClick={() => void handleSave()}
            disabled={saving || loading}
            className="px-4 py-2 rounded-lg bg-[#02402c] hover:bg-[#03543a] text-white text-xs font-black flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : savedAt ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading content…
          </div>
        ) : tab === 'hero' ? (
          <HeroEditor config={hero} setConfig={setHero} />
        ) : tab === 'footer' ? (
          <FooterEditor config={footer} setConfig={setFooter} />
        ) : (
          <AboutEditor config={about} setConfig={setAbout} />
        )}
      </div>
    </div>
  );
}