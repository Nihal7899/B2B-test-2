import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  Copy,
  ArrowUp,
  ArrowDown,
  ImageIcon,
  Loader2,
  Save,
  Sliders,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ActionType, PromoBanner, BannerPosition, BannerSize, BannerBgType, HomeBanner } from '@/types';
import {
  fetchAllHomeBanners,
  createHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
  duplicateHomeBanner,
  uploadBannerImage,
  deleteBannerImage,
  type DbCategory,
  type DbProduct,
} from '@/services/catalog';
import { PromoBannerCard } from '@/components/PromoBanner';
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
    } catch {
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
    } catch {
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
    } catch {
      addToast('Failed to update banner', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateHomeBanner(id);
      addToast('Banner duplicated', 'success');
      await load();
    } catch {
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
    } catch {
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
    return {
      id: b.id,
      headline: b.title,
      subtext: b.description,
      cta: b.button_text,
      image: b.image_url || '',
      badge: b.badge ?? undefined,
      actionType: b.action_type,
      actionConfig: b.action_config,
      position: b.position || 'middle_1',
      size: b.size || 'medium',
      bgType: b.bg_type || 'gradient',
      bgColor: b.bg_color || '#16a34a',
      bgGradient: b.bg_gradient || '',
      gradientFrom: b.gradient_from || '#065f46',
      gradientTo: b.gradient_to || '#10b981',
      gradientDirection: b.gradient_direction || 'to right',
      overlayEnabled: Boolean(b.overlay_enabled),
      overlayColor: b.overlay_color || '#000000',
      overlayOpacity: b.overlay_opacity ?? 40,
      showCta: b.show_cta !== false,
      displayOrder: b.display_order,
      isActive: b.is_active,
    };
  };

  if (loading) {
    return <Loader2 className="animate-spin mx-auto text-brand-600 my-10" size={28} />;
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
    <div className="space-y-4">
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))} />
        ))}
      </ToastContainer>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-ink-900">Banners Management</h2>
          <p className="text-xs text-ink-500">Configure banners, positions, sizes, and custom gradients</p>
        </div>
        <button
          onClick={handleAddNew}
          className="h-10 px-4 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} /> Add banner
        </button>
      </div>

      <div className="space-y-3">
        {banners.map((banner, i) => (
          <div key={banner.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {banner.image_url ? (
                    <img src={banner.image_url} alt="" className="h-12 w-12 rounded-xl object-cover border border-ink-100" />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-xl border border-ink-100 flex items-center justify-center text-[9px] font-black text-white shadow-inner"
                      style={{
                        background:
                          banner.bg_type === 'gradient'
                            ? `linear-gradient(${banner.gradient_direction || 'to right'}, ${banner.gradient_from || '#065f46'}, ${banner.gradient_to || '#10b981'})`
                            : banner.bg_color || '#16a34a',
                      }}
                    >
                      NO IMG
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-800 truncate">{banner.title}</p>
                    <p className="text-xs text-ink-500 truncate">{banner.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span
                    className={`text-[9px] font-black tracking-wider uppercase rounded-full px-2.5 py-0.5 ${
                      banner.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {banner.is_active ? 'ACTIVE' : 'HIDDEN'}
                  </span>
                  <span className="text-[9px] font-bold text-ink-600 bg-ink-50 px-2 py-0.5 rounded-full border border-ink-100">
                    Pos: {banner.position || 'top'}
                  </span>
                  <span className="text-[9px] font-bold text-ink-600 bg-ink-50 px-2 py-0.5 rounded-full border border-ink-100">
                    Size: {banner.size || 'medium'}
                  </span>
                  <span className="text-[9px] font-bold text-ink-600 bg-ink-50 px-2 py-0.5 rounded-full border border-ink-100">
                    Type: {banner.bg_type}
                  </span>
                  <span className="text-[9px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                    Order: {banner.display_order}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 self-end md:self-start">
                <button
                  onClick={() => setPreviewBanner(banner)}
                  className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center hover:bg-sky-100"
                  title="Preview"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => void handleReorder(banner, 'up')}
                  disabled={i === 0}
                  className="h-8 w-8 rounded-xl bg-ink-50 text-ink-600 flex items-center justify-center disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => void handleReorder(banner, 'down')}
                  disabled={i === banners.length - 1}
                  className="h-8 w-8 rounded-xl bg-ink-50 text-ink-600 flex items-center justify-center disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => void handleToggle(banner)}
                  className={`h-8 px-2.5 rounded-xl text-[10px] font-extrabold ${
                    banner.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {banner.is_active ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => void handleDuplicate(banner.id)}
                  className="h-8 w-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleEdit(banner)}
                  className="h-8 w-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDeleteClick(banner.id)}
                  className="h-8 w-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewBanner && (
        <div
          className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewBanner(null)}
        >
          <div className="max-w-md w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-soft">
              <h3 className="text-sm font-bold text-ink-900">Live Preview ({previewBanner.size || 'medium'})</h3>
              <button onClick={() => setPreviewBanner(null)} className="text-ink-400 hover:text-ink-700">
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
    position: (initial?.position ?? 'middle_1') as BannerPosition,
    size: (initial?.size ?? 'medium') as BannerSize,
    start_at: initial?.start_at ?? '',
    end_at: initial?.end_at ?? '',
    bg_type: (initial?.bg_type ?? 'gradient') as BannerBgType,
    bg_color: initial?.bg_color ?? '#16a34a',
    bg_gradient: initial?.bg_gradient ?? '',
    gradient_from: initial?.gradient_from ?? '#065f46',
    gradient_to: initial?.gradient_to ?? '#10b981',
    gradient_direction: initial?.gradient_direction ?? 'to right',
    overlay_enabled: initial?.overlay_enabled ?? false,
    overlay_color: initial?.overlay_color ?? '#000000',
    overlay_opacity: initial?.overlay_opacity ?? 40,
    show_cta: initial?.show_cta ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initial?.image_url ?? '');
  const [originalImageUrl] = useState<string | null>(initial?.image_url ?? null);

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

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setForm((f) => ({ ...f, image_url: '' }));
  };

  const setActionConfig = (key: string, value: unknown) => {
    setForm((f) => ({ ...f, action_config: { ...f.action_config, [key]: value } }));
  };

  const previewBannerObject = useMemo<PromoBanner>(() => {
    return {
      id: initial?.id || 'temp-id',
      headline: form.title || 'Banner Title Headline',
      subtext: form.description || 'Short subtext and promotional details',
      cta: form.button_text || 'Shop now',
      image: previewUrl,
      badge: form.badge || undefined,
      actionType: form.action_type,
      actionConfig: form.action_config,
      position: form.position,
      size: form.size,
      bgType: form.bg_type,
      bgColor: form.bg_color,
      bgGradient: form.bg_gradient,
      gradientFrom: form.gradient_from,
      gradientTo: form.gradient_to,
      gradientDirection: form.gradient_direction,
      overlayEnabled: form.overlay_enabled,
      overlayColor: form.overlay_color,
      overlayOpacity: form.overlay_opacity,
      showCta: form.show_cta,
      displayOrder: form.display_order,
      isActive: form.is_active,
    };
  }, [form, previewUrl, initial]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      addToast('Title is required', 'warning');
      return;
    }
    if (form.bg_type === 'image' && !form.image_url && !selectedFile) {
      addToast('Please upload an image for Full Image banner type.', 'warning');
      return;
    }

    setSaving(true);
    let newImageUrl = form.image_url;

    try {
      if (selectedFile) {
        setUploading(true);
        setUploadProgress(0);
        setUploadStatus('Compressing image...');

        for (let i = 0; i <= 6; i++) {
          const progress = Math.min(30, (i / 6) * 30);
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }

        const compressed = await compressImage(selectedFile);
        setUploadStatus('Uploading banner image...');
        setUploadProgress(30);

        const uploadProgressCallback = (p: number) => {
          const overall = 30 + p * 0.7;
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading... ${Math.round(overall)}%`);
        };

        newImageUrl = await uploadBannerImage(compressed, uploadProgressCallback);

        if (originalImageUrl && originalImageUrl !== newImageUrl) {
          await deleteBannerImage(originalImageUrl);
        }
      }

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
        size: form.size,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        bg_type: form.bg_type,
        bg_color: form.bg_color,
        bg_gradient: form.bg_gradient,
        gradient_from: form.gradient_from,
        gradient_to: form.gradient_to,
        gradient_direction: form.gradient_direction,
        overlay_enabled: form.overlay_enabled,
        overlay_color: form.overlay_color,
        overlay_opacity: form.overlay_opacity,
        show_cta: form.show_cta,
      };

      if (initial) {
        await updateHomeBanner(initial.id, payload as any);
      } else {
        await createHomeBanner(payload as any);
      }

      onSaved();
    } catch (err) {
      console.error(err);
      addToast('Failed to save banner', 'error');
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  if (uploading) {
    return (
      <UploadProgress
        progress={uploadProgress}
        statusText={uploadStatus}
        isComplete={uploadProgress >= 100}
      />
    );
  }

  const needsCategory = form.action_type === 'VIEW_CATEGORY' || form.action_type === 'FILTER_PRODUCTS';
  const needsProduct = form.action_type === 'VIEW_PRODUCT';
  const needsBrand = form.action_type === 'VIEW_BRAND' || form.action_type === 'FILTER_PRODUCTS';
  const needsSmartCollection = form.action_type === 'OPEN_SMART_COLLECTION';
  const needsScreen = form.action_type === 'OPEN_SCREEN';
  const needsUrl = form.action_type === 'OPEN_EXTERNAL_URL';
  const needsSearch = form.action_type === 'SEARCH' || form.action_type === 'VIEW_OFFER';
  const needsFilter = form.action_type === 'FILTER_PRODUCTS';

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 sm:p-5 space-y-5 shadow-card">
      <div className="flex items-center justify-between border-b border-ink-100 pb-3">
        <h3 className="text-sm font-black text-ink-900 flex items-center gap-1.5">
          <Sliders size={16} className="text-brand-600" />
          {initial ? 'Edit Banner' : 'Create New Banner'}
        </h3>
        <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-50">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">Headline Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Special Bulk Discounts on Oils"
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm font-bold outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">Subtext / Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Order in volume and save up to 25% on wholesale packs"
              className="w-full rounded-xl border border-ink-200 p-2.5 text-xs outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">Badge</label>
              <input
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="e.g. WHOLESALE"
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-xs outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">CTA Button Text</label>
              <input
                value={form.button_text}
                onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                placeholder="Shop now"
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-xs outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">Banner Size</label>
              <select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value as BannerSize })}
                className="w-full h-10 rounded-xl border border-ink-200 px-2.5 text-xs font-bold bg-white outline-none focus:border-brand-500"
              >
                <option value="small">Small (110px)</option>
                <option value="medium">Medium (165px)</option>
                <option value="large">Large Hero (210px)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">Placement Slot</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value as BannerPosition })}
                className="w-full h-10 rounded-xl border border-ink-200 px-2.5 text-xs font-bold bg-white outline-none focus:border-brand-500"
              >
                <option value="top">Top Rectangular</option>
                <option value="carousel">Top Carousel</option>
                <option value="middle_1">Middle 1</option>
                <option value="middle_2">Middle 2</option>
                <option value="middle_3">Middle 3</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">Background Style</label>
              <select
                value={form.bg_type}
                onChange={(e) => setForm({ ...form, bg_type: e.target.value as BannerBgType })}
                className="w-full h-10 rounded-xl border border-ink-200 px-2.5 text-xs font-bold bg-white outline-none focus:border-brand-500"
              >
                <option value="gradient">Custom Gradient</option>
                <option value="color">Solid Colour</option>
                <option value="image">Full Image</option>
              </select>
            </div>
          </div>

          {form.bg_type === 'gradient' && (
            <div className="p-3.5 bg-ink-50/60 border border-ink-100 rounded-2xl space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-ink-600">Gradient Stop Configuration</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-500 mb-1">Start Color (From)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={form.gradient_from}
                      onChange={(e) => setForm({ ...form, gradient_from: e.target.value })}
                      className="h-8 w-10 rounded-lg border border-ink-200 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.gradient_from}
                      onChange={(e) => setForm({ ...form, gradient_from: e.target.value })}
                      className="flex-1 h-8 rounded-lg border border-ink-200 px-2 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-500 mb-1">End Color (To)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={form.gradient_to}
                      onChange={(e) => setForm({ ...form, gradient_to: e.target.value })}
                      className="h-8 w-10 rounded-lg border border-ink-200 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.gradient_to}
                      onChange={(e) => setForm({ ...form, gradient_to: e.target.value })}
                      className="flex-1 h-8 rounded-lg border border-ink-200 px-2 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { from: '#065f46', to: '#10b981' },
                  { from: '#1e3a8a', to: '#3b82f6' },
                  { from: '#7c2d12', to: '#f97316' },
                  { from: '#581c87', to: '#a855f7' },
                  { from: '#831843', to: '#ec4899' },
                  { from: '#172554', to: '#1e293b' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm({ ...form, gradient_from: preset.from, gradient_to: preset.to })}
                    className="h-6 px-2 rounded-md text-[9px] font-bold text-white shadow-xs"
                    style={{ background: `linear-gradient(to right, ${preset.from}, ${preset.to})` }}
                  >
                    Preset {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.bg_type === 'color' && (
            <div className="p-3 bg-ink-50/60 border border-ink-100 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-ink-700">Solid Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.bg_color}
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                  className="h-9 w-12 rounded-lg border border-ink-200 p-0.5 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.bg_color}
                  onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                  className="flex-1 h-9 rounded-lg border border-ink-200 px-2.5 text-xs font-mono uppercase"
                />
              </div>
            </div>
          )}

          <div className="p-3.5 bg-ink-50/60 border border-ink-100 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink-700">
                Side Image {form.bg_type === 'image' && '<Required for Full Image>'}
              </label>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove Image (Enable 100% text width)
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={form.image_url}
                onChange={(e) => {
                  setForm({ ...form, image_url: e.target.value });
                  setPreviewUrl(e.target.value);
                }}
                placeholder="Image URL or upload..."
                className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-xs outline-none focus:border-brand-500"
              />
              <label className="h-10 px-3.5 rounded-xl bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-brand-100 transition-colors">
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
          </div>

          <div className="p-3.5 bg-ink-50/60 border border-ink-100 rounded-2xl space-y-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">Click Action Type</label>
              <select
                value={form.action_type}
                onChange={(e) => setForm({ ...form, action_type: e.target.value as ActionType, action_config: {} })}
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-xs font-bold bg-white outline-none focus:border-brand-500"
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
                <label className="block text-xs font-bold text-ink-600 mb-1">Select Screen</label>
                <select
                  value={(form.action_config.screen as string) ?? ''}
                  onChange={(e) => setActionConfig('screen', e.target.value)}
                  className="w-full h-9 rounded-xl border border-ink-200 px-2.5 text-xs bg-white"
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
                  className="w-full h-9 rounded-xl border border-ink-200 px-2.5 text-xs"
                />
              </div>
            )}

            {needsSearch && (
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">Search Query</label>
                <input
                  value={(form.action_config.query as string) ?? ''}
                  onChange={(e) => setActionConfig('query', e.target.value)}
                  placeholder="e.g. basmati rice"
                  className="w-full h-9 rounded-xl border border-ink-200 px-2.5 text-xs"
                />
              </div>
            )}

            {needsProduct && (
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">Select Product</label>
                <select
                  value={(form.action_config.product_id as string) ?? ''}
                  onChange={(e) => {
                    setActionConfig('product_id', e.target.value);
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) setActionConfig('product_name', `${p.brand} ${p.name}`);
                  }}
                  className="w-full h-9 rounded-xl border border-ink-200 px-2.5 text-xs bg-white"
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
                  className="w-full h-20 rounded-xl border border-ink-200 p-2 text-xs bg-white"
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
                  className="w-full h-20 rounded-xl border border-ink-200 p-2 text-xs bg-white"
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
                  className="w-full h-9 rounded-xl border border-ink-200 px-2.5 text-xs bg-white"
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
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="number"
                  value={(form.action_config.discount_min as number) ?? ''}
                  onChange={(e) => setActionConfig('discount_min', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Min %"
                  className="h-8 rounded-lg border border-ink-200 px-2 text-xs"
                />
                <input
                  type="number"
                  value={(form.action_config.price_max as number) ?? ''}
                  onChange={(e) => setActionConfig('price_max', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Max Price"
                  className="h-8 rounded-lg border border-ink-200 px-2 text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.overlay_enabled}
                onChange={(e) => setForm({ ...form, overlay_enabled: e.target.checked })}
                className="accent-brand-600 rounded"
              />
              Dark Overlay
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_cta}
                onChange={(e) => setForm({ ...form, show_cta: e.target.checked })}
                className="accent-brand-600 rounded"
              />
              Show CTA
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="accent-brand-600 rounded"
              />
              Active
            </label>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between bg-ink-50/70 p-4 rounded-2xl border border-ink-100">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-ink-500 mb-3 flex items-center gap-1.5">
              <Eye size={14} /> Live Size & Gradient Preview
            </p>
            <div className="w-full">
              <PromoBannerCard banner={previewBannerObject} />
            </div>
            <p className="text-[10px] text-ink-400 mt-3 leading-relaxed">
              * Text wraps automatically to the next line and spans 100% width when no image is uploaded.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-ink-200 text-xs font-bold text-ink-600 bg-white hover:bg-ink-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Banner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
