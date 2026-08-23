// src/components/admin/BannersManager.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, X, Eye, Copy, ArrowUp, ArrowDown, ImageIcon, Loader2, Save
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { HomeBanner, ActionType, DbCategory, DbProduct } from '@/types';
import {
  fetchAllHomeBanners,
  createHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
  duplicateHomeBanner,
  uploadBannerImage,
  deleteBannerImage,
} from '@/services/catalog';
import { PromoBannerCard } from '@/components/PromoBanner';
import type { PromoBanner } from '@/types';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { UploadProgress } from '@/components/ui/UploadProgress';
import { compressImage } from '@/lib/imageUtils';

const ACTION_TYPES: ActionType[] = [
  'VIEW_CATEGORY',
  'VIEW_PRODUCT',
  'VIEW_BRAND',
  'VIEW_OFFER',
  'SEARCH',
  'FILTER_PRODUCTS',
  'OPEN_SMART_COLLECTION',
  'OPEN_CART',
  'OPEN_ORDERS',
  'OPEN_WISHLIST',
  'OPEN_ADDRESS',
  'OPEN_SCREEN',
  'OPEN_EXTERNAL_URL',
];

export default function BannersManager() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingBanner, setEditingBanner] = useState<HomeBanner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<HomeBanner | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    bannerId?: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const load = useCallback(async () => {
    try {
      const data = await fetchAllHomeBanners();
      setBanners(data);
    } catch (err) {
      addToast('Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      bannerId: id,
      title: 'Delete Banner',
      message: 'Are you sure you want to delete this banner? This action cannot be undone.',
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.bannerId) return;
    try {
      await deleteHomeBanner(confirmDialog.bannerId);
      addToast('Banner deleted successfully', 'success');
      await load();
    } catch (err) {
      addToast('Failed to delete banner', 'error');
    } finally {
      setConfirmDialog({ isOpen: false, bannerId: undefined, title: '', message: '' });
    }
  };

  const handleToggle = async (banner: HomeBanner) => {
    try {
      await updateHomeBanner(banner.id, { is_active: !banner.is_active });
      addToast(`Banner ${!banner.is_active ? 'activated' : 'deactivated'}`, 'success');
      await load();
    } catch (err) {
      addToast('Failed to update banner', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateHomeBanner(id);
      addToast('Banner duplicated', 'success');
      await load();
    } catch (err) {
      addToast('Failed to duplicate banner', 'error');
    }
  };

  const handleReorder = async (banner: HomeBanner, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((b) => b.id === banner.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapBanner = sorted[swapIdx];
    try {
      await Promise.all([
        updateHomeBanner(banner.id, { display_order: swapBanner.display_order }),
        updateHomeBanner(swapBanner.id, { display_order: banner.display_order }),
      ]);
      await load();
    } catch (err) {
      addToast('Failed to reorder banners', 'error');
    }
  };

  const handleEdit = (banner: HomeBanner) => {
    setEditingBanner(banner);
    setViewMode('form');
  };

  const handleAddNew = () => {
    setEditingBanner(null);
    setViewMode('form');
  };

  const handleFormClose = () => {
    setViewMode('list');
    setEditingBanner(null);
  };

  const handleFormSaved = () => {
    void load();
    setViewMode('list');
    addToast('Banner saved successfully', 'success');
  };

  const toPromoBanner = (b: HomeBanner): PromoBanner => {
    const bgMap: Record<string, string> = {
      brand: 'bg-gradient-to-br from-brand-700 to-brand-900',
      accent: 'bg-gradient-to-br from-accent-500 to-accent-700',
      ink: 'bg-gradient-to-br from-ink-800 to-ink-900',
    };
    return {
      id: b.id,
      headline: b.title,
      subtext: b.description,
      cta: b.button_text,
      image: b.image_url,
      bgClass: bgMap[b.background_color] ?? bgMap.brand,
      textClass: 'text-white',
      badge: b.badge ?? undefined,
      actionType: b.action_type,
      actionConfig: b.action_config,
      position: b.position || 'top',
      bgType: b.bg_type || 'color',
      bgColor: b.bg_color || '#16a34a',
      bgGradient: b.bg_gradient || 'from-brand-600 to-brand-800',
      overlayEnabled: b.overlay_enabled || false,
      overlayColor: b.overlay_color || '#000000',
      overlayOpacity: b.overlay_opacity || 50,
      showCta: b.show_cta !== undefined ? b.show_cta : true,
    };
  };

  if (loading) {
    return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;
  }

  if (viewMode === 'form') {
    return (
      <BannerForm
        initial={editingBanner}
        onClose={handleFormClose}
        onSaved={handleFormSaved}
        addToast={addToast}
      />
    );
  }

  return (
    <div className="space-y-3">
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))} />
        ))}
      </ToastContainer>

      <button
        onClick={handleAddNew}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add banner
      </button>

      {banners.map((banner, i) => (
        <div key={banner.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {banner.image_url && (
                  <img src={banner.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                )}
                <div>
                  <p className="text-sm font-bold text-ink-800 truncate">{banner.title}</p>
                  <p className="text-xs text-ink-500 truncate">{banner.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                    banner.is_active
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {banner.is_active ? 'ACTIVE' : 'HIDDEN'}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  Order: {banner.display_order}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  Pos: {banner.position || 'top'}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  {banner.action_type}
                </span>
                {banner.start_at && (
                  <span className="text-[10px] text-amber-600">
                    From: {new Date(banner.start_at).toLocaleDateString()}
                  </span>
                )}
                {banner.end_at && (
                  <span className="text-[10px] text-amber-600">
                    To: {new Date(banner.end_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setPreviewBanner(banner)}
                className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={() => void handleReorder(banner, 'up')}
                disabled={i === 0}
                className="h-9 w-9 rounded-xl bg-ink-50 text-ink-600 flex items-center justify-center disabled:opacity-40"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => void handleReorder(banner, 'down')}
                disabled={i === banners.length - 1}
                className="h-9 w-9 rounded-xl bg-ink-50 text-ink-600 flex items-center justify-center disabled:opacity-40"
              >
                <ArrowDown size={14} />
              </button>
              <button
                onClick={() => void handleToggle(banner)}
                className={`h-9 px-3 rounded-xl text-xs font-bold ${
                  banner.is_active
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-ink-100 text-ink-500'
                }`}
              >
                {banner.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => void handleDuplicate(banner.id)}
                className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => handleEdit(banner)}
                className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDeleteClick(banner.id)}
                className="h-9 w-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {previewBanner && (
        <div
          className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setPreviewBanner(null)}
        >
          <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl p-3 mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">Preview</h3>
              <button onClick={() => setPreviewBanner(null)} className="text-ink-400">
                <X size={18} />
              </button>
            </div>
            <PromoBannerCard banner={toPromoBanner(previewBanner)} />
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, bannerId: undefined, title: '', message: '' })}
      />
    </div>
  );
}

// ========== BannerForm (refactored) ==========
function BannerForm({
  initial,
  onClose,
  onSaved,
  addToast,
}: {
  initial: HomeBanner | null;
  onClose: () => void;
  onSaved: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const [form, setForm] = useState({
    badge: initial?.badge ?? '',
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    image_url: initial?.image_url ?? '',
    background_color: initial?.background_color ?? 'brand',
    button_text: initial?.button_text ?? 'Shop now',
    action_type: (initial?.action_type ?? 'OPEN_SCREEN') as ActionType,
    action_config: (initial?.action_config ?? {}) as Record<string, unknown>,
    display_order: initial?.display_order ?? 0,
    is_active: initial?.is_active ?? true,
    position: initial?.position ?? 'top',
    start_at: initial?.start_at ?? '',
    end_at: initial?.end_at ?? '',
    bg_type: initial?.bg_type ?? 'color',
    bg_color: initial?.bg_color ?? '#16a34a',
    bg_gradient: initial?.bg_gradient ?? 'from-brand-600 to-brand-800',
    overlay_enabled: initial?.overlay_enabled ?? false,
    overlay_color: initial?.overlay_color ?? '#000000',
    overlay_opacity: initial?.overlay_opacity ?? 50,
    show_cta: initial?.show_cta ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initial?.image_url ?? '');
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [smartCollections, setSmartCollections] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    void (async () => {
      const [{ data: cats }, { data: prods }, { data: sc }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
        supabase.from('smart_collections').select('id, name').eq('is_active', true).order('created_at', { ascending: false }),
      ]);
      setCategories((cats as DbCategory[]) ?? []);
      setProducts((prods as DbProduct[]) ?? []);
      setBrands(Array.from(new Set((prods as DbProduct[] | null)?.map((p) => p.brand) ?? [])).sort());
      setSmartCollections((sc as { id: string; name: string }[]) ?? []);
    })();
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const setActionConfig = (key: string, value: unknown) => {
    setForm((f) => ({ ...f, action_config: { ...f.action_config, [key]: value } }));
  };

  const handleSave = async () => {
    if (!form.title) {
      addToast('Title is required', 'warning');
      return;
    }
    if (form.bg_type === 'image' && !form.image_url && !selectedFile) {
      addToast('Please upload an image for full‑screen banner.', 'warning');
      return;
    }

    setSaving(true);
    let newImageUrl = form.image_url;

    try {
      if (selectedFile) {
        setUploading(true);
        setUploadProgress(0);
        setUploadStatus('Compressing image...');

        // Simulate compression progress (0-30%)
        const compressionSteps = 8;
        for (let i = 0; i <= compressionSteps; i++) {
          const progress = Math.min(30, (i / compressionSteps) * 30);
          setUploadProgress(progress);
          setUploadStatus(`Compressing... ${Math.round(progress)}%`);
          await new Promise((resolve) => setTimeout(resolve, 120));
        }

        // Actual compression
        const compressed = await compressImage(selectedFile);
        setUploadStatus('Compression complete. Uploading...');
        setUploadProgress(30);

        // Upload with progress callback (30-100%)
        const uploadProgressCallback = (uploadPercent: number) => {
          const overall = 30 + (uploadPercent * 0.7);
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading... ${Math.round(overall)}%`);
        };

        newImageUrl = await uploadBannerImage(compressed, uploadProgressCallback);

        setUploadProgress(100);
        setUploadStatus('Upload complete!');

        // Delete old image if different
        if (originalImageUrl && originalImageUrl !== newImageUrl) {
          await deleteBannerImage(originalImageUrl);
        }
      }

      // Build payload
      const payload = {
        badge: form.badge || null,
        title: form.title,
        description: form.description,
        image_url: newImageUrl || null,
        background_color: form.background_color,
        button_text: form.button_text,
        action_type: form.action_type,
        action_config: form.action_config,
        display_order: form.display_order,
        is_active: form.is_active,
        position: form.position,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        bg_type: form.bg_type,
        bg_color: form.bg_color,
        bg_gradient: form.bg_gradient,
        overlay_enabled: form.overlay_enabled,
        overlay_color: form.overlay_color,
        overlay_opacity: form.overlay_opacity,
        show_cta: form.show_cta,
      };

      if (initial) {
        await updateHomeBanner(initial.id, payload);
      } else {
        await createHomeBanner(payload);
      }

      onSaved();
    } catch (err) {
      console.error(err);
      addToast('Failed to save banner. Check console for details.', 'error');
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  // Show circular upload overlay
  if (uploading) {
    return (
      <UploadProgress
        progress={uploadProgress}
        statusText={uploadStatus}
        isComplete={uploadProgress >= 100}
      />
    );
  }

  // Render form (same as before, mobile friendly)
  const needsCategory = form.action_type === 'VIEW_CATEGORY' || form.action_type === 'FILTER_PRODUCTS';
  const needsProduct = form.action_type === 'VIEW_PRODUCT';
  const needsBrand = form.action_type === 'VIEW_BRAND' || form.action_type === 'FILTER_PRODUCTS';
  const needsSmartCollection = form.action_type === 'OPEN_SMART_COLLECTION';
  const needsScreen = form.action_type === 'OPEN_SCREEN';
  const needsUrl = form.action_type === 'OPEN_EXTERNAL_URL';
  const needsSearch = form.action_type === 'SEARCH' || form.action_type === 'VIEW_OFFER';
  const needsFilter = form.action_type === 'FILTER_PRODUCTS';

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} banner</h3>
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center">
          <X size={16} className="text-ink-400" />
        </button>
      </div>

      {/* Basic fields */}
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Badge</label>
        <input
          value={form.badge}
          onChange={(e) => setForm({ ...form, badge: e.target.value })}
          placeholder="e.g. WHOLESALE"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Title *</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Banner title"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Description</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Image URL {form.bg_type === 'image' && '*'}</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={form.image_url}
            onChange={(e) => {
              setForm({ ...form, image_url: e.target.value });
              setPreviewUrl(e.target.value);
            }}
            placeholder="Image URL or upload"
            className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
          <label className="h-10 px-3 rounded-xl bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
            <ImageIcon size={14} /> Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
          </label>
        </div>
        {previewUrl && (
          <div className="relative mt-2">
            <img src={previewUrl} alt="Preview" className="h-20 w-full rounded-xl object-cover" />
            {selectedFile && (
              <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
        )}
      </div>

      {/* Background type */}
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Background Type</label>
        <select
          value={form.bg_type}
          onChange={(e) => setForm({ ...form, bg_type: e.target.value as 'color' | 'image' | 'gradient' })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          <option value="color">Solid Colour</option>
          <option value="image">Full Image (no colour)</option>
          <option value="gradient">Gradient</option>
        </select>
      </div>

      {form.bg_type === 'color' && (
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Background Colour</label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              value={form.bg_color}
              onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
              className="h-10 w-14 rounded-xl border border-ink-200 p-1 cursor-pointer"
            />
            <input
              type="text"
              value={form.bg_color}
              onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
              placeholder="#hex"
              className="flex-1 min-w-[120px] h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {['#16a34a', '#dc2626', '#2563eb', '#ea580c', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#4b5563'].map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, bg_color: c })}
                className="h-8 w-8 rounded-full border border-ink-200"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {form.bg_type === 'gradient' && (
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Gradient Classes</label>
          <select
            value={form.bg_gradient}
            onChange={(e) => setForm({ ...form, bg_gradient: e.target.value })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="from-brand-600 to-brand-800">Brand Green</option>
            <option value="from-red-500 to-red-700">Red</option>
            <option value="from-blue-500 to-blue-700">Blue</option>
            <option value="from-orange-500 to-orange-700">Orange</option>
            <option value="from-purple-500 to-purple-700">Purple</option>
            <option value="from-pink-500 to-pink-700">Pink</option>
            <option value="from-yellow-400 to-yellow-600">Yellow</option>
            <option value="from-teal-400 to-teal-600">Teal</option>
            <option value="from-gray-600 to-gray-800">Gray</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Legacy Color (for carousel)</label>
          <select
            value={form.background_color}
            onChange={(e) => setForm({ ...form, background_color: e.target.value })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="brand">Brand green</option>
            <option value="accent">Accent</option>
            <option value="ink">Dark</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Button text</label>
          <input
            value={form.button_text}
            onChange={(e) => setForm({ ...form, button_text: e.target.value })}
            placeholder="CTA"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Position</label>
        <select
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          <option value="top">Top (rectangular promo code)</option>
          <option value="carousel">Carousel (action button card)</option>
          <option value="middle">Middle (action button banner)</option>
          <option value="bottom">Bottom (action button banner)</option>
        </select>
      </div>

      {form.position === 'top' && (
        <>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Promo Code</label>
            <input
              value={(form.action_config.promoCode as string) || ''}
              onChange={(e) => setActionConfig('promoCode', e.target.value)}
              placeholder="e.g. HYPER10"
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Discount Text</label>
            <input
              value={(form.action_config.discount as string) || ''}
              onChange={(e) => setActionConfig('discount', e.target.value)}
              placeholder="e.g. 10% OFF"
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </>
      )}

      {form.position !== 'top' && (
        <>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Action type</label>
            <select
              value={form.action_type}
              onChange={(e) => setForm({ ...form, action_type: e.target.value as ActionType, action_config: {} })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            >
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          {needsScreen && (
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Screen</label>
              <select
                value={(form.action_config.screen as string) ?? ''}
                onChange={(e) => setActionConfig('screen', e.target.value)}
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Select screen</option>
                <option value="home">Home</option>
                <option value="categories">Categories</option>
                <option value="cart">Cart</option>
                <option value="orders">Orders</option>
                <option value="wishlist">Wishlist</option>
                <option value="addresses">Addresses</option>
                <option value="account">Account</option>
                <option value="businessRegistration">Business registration</option>
              </select>
            </div>
          )}
          {needsUrl && (
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">External URL</label>
              <input
                value={(form.action_config.url as string) ?? ''}
                onChange={(e) => setActionConfig('url', e.target.value)}
                placeholder="https://..."
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
          )}
          {needsSearch && (
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Search query</label>
              <input
                value={(form.action_config.query as string) ?? ''}
                onChange={(e) => setActionConfig('query', e.target.value)}
                placeholder="e.g. basmati"
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
          )}
          {needsProduct && (
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Product</label>
              <select
                value={(form.action_config.product_id as string) ?? ''}
                onChange={(e) => {
                  setActionConfig('product_id', e.target.value);
                  const p = products.find((x) => x.id === e.target.value);
                  if (p) setActionConfig('product_name', `${p.brand} ${p.name}`);
                }}
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {needsCategory && (
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Categories</label>
              <select
                multiple
                value={(form.action_config.category_ids as string[]) ?? []}
                onChange={(e) =>
                  setActionConfig('category_ids', Array.from(e.target.selectedOptions).map((o) => o.value))
                }
                className="w-full h-24 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
                size={4}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {needsBrand && (
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Brands</label>
              <select
                multiple
                value={(form.action_config.brand_ids as string[]) ?? []}
                onChange={(e) =>
                  setActionConfig('brand_ids', Array.from(e.target.selectedOptions).map((o) => o.value))
                }
                className="w-full h-24 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
                size={4}
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}
          {needsSmartCollection && (
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Smart Collection</label>
              <select
                value={(form.action_config.collection_id as string) ?? ''}
                onChange={(e) => {
                  const sc = smartCollections.find((x) => x.id === e.target.value);
                  setActionConfig('collection_id', e.target.value);
                  if (sc) setActionConfig('name', sc.name);
                }}
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Select collection</option>
                {smartCollections.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {needsFilter && (
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Filter options</label>
              <div className="rounded-xl border border-ink-100 p-3 bg-ink-50/30 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={(form.action_config.discount_min as number) ?? ''}
                    onChange={(e) => setActionConfig('discount_min', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Min discount %"
                    className="h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    type="number"
                    value={(form.action_config.discount_max as number) ?? ''}
                    onChange={(e) => setActionConfig('discount_max', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Max discount %"
                    className="h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    type="number"
                    value={(form.action_config.price_min as number) ?? ''}
                    onChange={(e) => setActionConfig('price_min', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Min price"
                    className="h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
                  />
                  <input
                    type="number"
                    value={(form.action_config.price_max as number) ?? ''}
                    onChange={(e) => setActionConfig('price_max', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Max price"
                    className="h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={(form.action_config.stock_only as boolean) ?? false}
                    onChange={(e) => setActionConfig('stock_only', e.target.checked)}
                    className="accent-brand-600"
                  />{' '}
                  In stock only
                </label>
                <select
                  value={(form.action_config.sort as string) ?? 'newest'}
                  onChange={(e) => setActionConfig('sort', e.target.value)}
                  className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
                >
                  <option value="newest">Newest</option>
                  <option value="discount_desc">Discount: high to low</option>
                  <option value="discount_asc">Discount: low to high</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="rating_desc">Top rated</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Overlay */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-bold text-ink-700">
          <input
            type="checkbox"
            checked={form.overlay_enabled}
            onChange={(e) => setForm({ ...form, overlay_enabled: e.target.checked })}
            className="accent-brand-600"
          />
          Enable tint overlay
        </label>
      </div>

      {form.overlay_enabled && (
        <div className="space-y-2 border border-ink-100 rounded-xl p-3 bg-ink-50">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Tint Colour</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={form.overlay_color}
                onChange={(e) => setForm({ ...form, overlay_color: e.target.value })}
                className="h-10 w-14 rounded-xl border border-ink-200 p-1 cursor-pointer"
              />
              <input
                type="text"
                value={form.overlay_color}
                onChange={(e) => setForm({ ...form, overlay_color: e.target.value })}
                className="flex-1 min-w-[120px] h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Opacity: {form.overlay_opacity}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.overlay_opacity}
              onChange={(e) => setForm({ ...form, overlay_opacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-xs font-bold text-ink-700">
          <input
            type="checkbox"
            checked={form.show_cta}
            onChange={(e) => setForm({ ...form, show_cta: e.target.checked })}
            className="accent-brand-600"
          />
          Show action button
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Start date</label>
          <input
            type="datetime-local"
            value={form.start_at ? form.start_at.slice(0, 16) : ''}
            onChange={(e) => setForm({ ...form, start_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">End date</label>
          <input
            type="datetime-local"
            value={form.end_at ? form.end_at.slice(0, 16) : ''}
            onChange={(e) => setForm({ ...form, end_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Display order</label>
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-end h-10">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="accent-brand-600"
            />{' '}
            Active
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !form.title || (form.bg_type === 'image' && !form.image_url && !selectedFile)}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save banner</>}
      </button>
    </div>
  );
}