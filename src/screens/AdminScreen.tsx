// screens/AdminScreen.tsx
import { useEffect, useState, useCallback } from 'react';
import { PushNotificationSender } from '@/components/Admin/PushNotificationSender';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Tag,
  LayoutGrid,
  Package,
  Users,
  Loader2,
  Save,
  Image as ImageIcon,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  Store,
  Award,
  LayoutDashboard,
  Gift,
  Truck,
  MapPin,
  Percent,
  Hash, FileText, Settings, Bell,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type {
  DbCategory,
  DbProduct,
  HomeBanner,
  Store,
  TrustedBrand,
  SmartCollection,
  FilterConfig,
  VolumePricingTier,
  PromoCode,
  DeliveryZone,
  DeliveryCharge,
  DeliveryRange, // [NEW] import type
} from '@/types';
import {
  fetchAllHomeBanners,
  createHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
  duplicateHomeBanner,
  fetchAllStores,
  createStore,
  updateStore,
  deleteStore,
  fetchAllTrustedBrands,
  createTrustedBrand,
  updateTrustedBrand,
  deleteTrustedBrand,
  fetchAllSmartCollections,
  createSmartCollection,
  updateSmartCollection,
  deleteSmartCollection,
  fetchAllBrands,
  fetchVolumePricing,
  createVolumePricingTier,
  updateVolumePricingTier,
  deleteVolumePricingTier,
  fetchAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  fetchAllDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  fetchDeliveryChargesForZone,
  createDeliveryCharge,
  updateDeliveryCharge,
  deleteDeliveryCharge,
  // [NEW] delivery range functions
  fetchDeliveryRanges,
  createDeliveryRange,
  updateDeliveryRange,
  deleteDeliveryRange,
} from '@/services/catalog';
import { PromoBannerCard } from '@/components/PromoBanner';
import type { ActionType, PromoBanner } from '@/types';
import InvoiceSettings from '@/components/InvoiceSettings';
import AdminInvoices from '@/components/AdminInvoices';

interface AdminScreenProps {
  onBack: () => void;
}

type Tab =
  | 'dashboard'
  | 'banners'
  | 'stores'
  | 'brands'
  | 'categories'
  | 'products'
  | 'volumepricing'
  | 'promocodes'
  | 'deliverysettings'
  | 'smartcollections'
  | 'roles'
  | 'invoices'
  | 'invoiceSettings'
  | 'deliveryRanges'
  | 'push';  // 👈 addednew tab

export function AdminScreen({ onBack }: AdminScreenProps) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'banners', label: 'Banners', icon: Tag },
    { id: 'stores', label: 'Stores', icon: Store },
    { id: 'brands', label: 'Brands', icon: Award },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'volumepricing', label: 'Volume Pricing', icon: Percent },
    { id: 'promocodes', label: 'Promo Codes', icon: Gift },
    { id: 'deliverysettings', label: 'Delivery Settings', icon: Truck },
    { id: 'smartcollections', label: 'Smart Collections', icon: LayoutGrid },
    { id: 'roles', label: 'Roles', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'invoiceSettings', label: 'Invoice Settings', icon: Settings },
    { id: 'deliveryRanges', label: 'Delivery Ranges', icon: MapPin },
    { id: 'push', label: 'Push Notifications', icon: Bell },  // 👈 added
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 px-4 pb-6">
      {/* Sidebar */}
      <div className="md:w-52 shrink-0">
        <div className="flex items-center gap-3 mb-4 md:hidden">
          <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-extrabold text-ink-900">Admin</h1>
        </div>
        <div className="hidden md:flex items-center gap-3 mb-6">
          <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-extrabold text-ink-900">Admin</h1>
        </div>
        <div className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                tab === id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
              }`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-4">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'banners' && <BannersManager />}
        {tab === 'stores' && <StoresManager />}
        {tab === 'brands' && <BrandsManager />}
        {tab === 'categories' && <CategoriesManager />}
        {tab === 'products' && <ProductsManager />}
        {tab === 'volumepricing' && <VolumePricingManager />}
        {tab === 'promocodes' && <PromoCodesManager />}
        {tab === 'deliverysettings' && <DeliverySettingsManager />}
        {tab === 'smartcollections' && <SmartCollectionsManager />}
        {tab === 'roles' && <RolesManager />}
        {tab === 'invoices' && <AdminInvoices />}
        {tab === 'invoiceSettings' && <InvoiceSettings />}
        {tab === 'deliveryRanges' && <DeliveryRangesManager />} {/* [NEW] render new manager */}
        {tab === 'push' && <PushNotificationSender />}
      </div>
    </div>
  );
}

// ----- DASHBOARD (unchanged) -----
function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-card">
        <p className="text-xs text-ink-400 font-bold uppercase">Total Banners</p>
        <p className="text-2xl font-extrabold text-ink-900 mt-1">—</p>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-card">
        <p className="text-xs text-ink-400 font-bold uppercase">Stores</p>
        <p className="text-2xl font-extrabold text-ink-900 mt-1">—</p>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-card">
        <p className="text-xs text-ink-400 font-bold uppercase">Brands</p>
        <p className="text-2xl font-extrabold text-ink-900 mt-1">—</p>
      </div>
    </div>
  );
}
// ----- BANNERS MANAGER (unchanged) -----
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

function BannersManager() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HomeBanner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<HomeBanner | null>(null);

  const load = useCallback(async () => {
    const data = await fetchAllHomeBanners();
    setBanners(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteHomeBanner(id);
    void load();
  };

  const handleToggle = async (banner: HomeBanner) => {
    await updateHomeBanner(banner.id, { is_active: !banner.is_active });
    void load();
  };

  const handleDuplicate = async (id: string) => {
    await duplicateHomeBanner(id);
    void load();
  };

  const handleReorder = async (banner: HomeBanner, direction: 'up' | 'down') => {
    const sorted = [...banners].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((b) => b.id === banner.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapBanner = sorted[swapIdx];
    await Promise.all([
      updateHomeBanner(banner.id, { display_order: swapBanner.display_order }),
      updateHomeBanner(swapBanner.id, { display_order: banner.display_order }),
    ]);
    void load();
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

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add banner
      </button>
      {showForm && (
        <BannerForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
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
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setPreviewBanner(banner)}
                className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={() => void handleReorder(banner, 'up')}
                disabled={i === 0}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center disabled:opacity-40"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => void handleReorder(banner, 'down')}
                disabled={i === banners.length - 1}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center disabled:opacity-40"
              >
                <ArrowDown size={14} />
              </button>
              <button
                onClick={() => void handleToggle(banner)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {banner.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => void handleDuplicate(banner.id)}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => {
                  setEditing(banner);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(banner.id)}
                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
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
    </div>
  );
}

// ----- BANNER FORM (same as before) -----
function BannerForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: HomeBanner | null;
  onClose: () => void;
  onSaved: () => void;
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

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `banner-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('home-banners')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadErr) {
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('home-banners').getPublicUrl(fileName);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const setActionConfig = (key: string, value: unknown) => {
    setForm((f) => ({ ...f, action_config: { ...f.action_config, [key]: value } }));
  };

  const handleSave = async () => {
    if (!form.title) return;
    if (form.bg_type === 'image' && !form.image_url) {
      alert('Please upload an image for full‑screen banner.');
      return;
    }
    setSaving(true);
    const payload = {
      badge: form.badge || null,
      title: form.title,
      description: form.description,
      image_url: form.image_url || null,
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
    try {
      if (initial) {
        await updateHomeBanner(initial.id, payload);
      } else {
        await createHomeBanner(payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Failed to save banner. Check console for details.');
    }
    setSaving(false);
  };

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
        <button onClick={onClose}>
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
        <div className="flex gap-2">
          <input
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="Image URL or upload"
            className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
          <label className="h-10 px-3 rounded-xl bg-brand-50 text-brand-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <><ImageIcon size={14} /> Upload</>}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImageUpload(f);
              }}
            />
          </label>
        </div>
        {form.image_url && (
          <img src={form.image_url} alt="" className="h-20 w-full rounded-xl object-cover mt-2" />
        )}
      </div>

      {/* Background Type */}
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
          <div className="flex items-center gap-2">
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
              className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
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

      <div className="grid grid-cols-2 gap-3">
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
            <div className="flex items-center gap-2">
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
                className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
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

      <div className="grid grid-cols-2 gap-3">
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
      <div className="grid grid-cols-2 gap-3">
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
        disabled={saving || !form.title || (form.bg_type === 'image' && !form.image_url)}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save banner</>}
      </button>
    </div>
  );
}

// ----- STORES MANAGER (unchanged) -----
function StoresManager() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [products, setProducts] = useState<{ id: string; brand: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const [storesRes, prodsRes] = await Promise.all([
      fetchAllStores(),
      supabase.from('products').select('id, brand, name').order('name'),
    ]);
    setStores(storesRes);
    setProducts((prodsRes.data as { id: string; brand: string; name: string }[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteStore(id);
    void load();
  };

  const handleToggle = async (store: Store) => {
    await updateStore(store.id, { is_active: !store.is_active });
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add store
      </button>
      {showForm && (
        <StoreForm
          initial={editing}
          products={products}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {stores.map((store) => (
        <div key={store.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {store.image_url && (
                  <img src={store.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                )}
                <div>
                  <p className="text-sm font-bold text-ink-800 truncate">{store.name}</p>
                  <p className="text-xs text-ink-500 truncate">{store.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                    store.is_active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {store.is_active ? 'ACTIVE' : 'HIDDEN'}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  Order: {store.sort_order}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  {store.product_ids?.length ?? 0} products
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => void handleToggle(store)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {store.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setEditing(store);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(store.id)}
                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StoreForm({
  initial,
  products,
  onClose,
  onSaved,
}: {
  initial: Store | null;
  products: { id: string; brand: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    image_url: initial?.image_url ?? '',
    description: initial?.description ?? '',
    theme_bg: initial?.theme_bg ?? 'bg-emerald-50',
    theme_border: initial?.theme_border ?? 'border-emerald-200',
    theme_text: initial?.theme_text ?? 'text-emerald-900',
    theme_accent: initial?.theme_accent ?? 'bg-emerald-600',
    product_ids: initial?.product_ids ?? [],
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (initial) {
      await updateStore(initial.id, form);
    } else {
      await createStore(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} store</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Store name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Fresh Harvest"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Image URL *</label>
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          placeholder="https://..."
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
        {form.image_url && (
          <img src={form.image_url} alt="" className="h-16 w-full rounded-xl object-cover mt-2" />
        )}
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Description</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Farm-fresh staples"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Theme colors</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.theme_bg}
            onChange={(e) => setForm({ ...form, theme_bg: e.target.value })}
            placeholder="bg-*"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
          <input
            value={form.theme_border}
            onChange={(e) => setForm({ ...form, theme_border: e.target.value })}
            placeholder="border-*"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
          <input
            value={form.theme_text}
            onChange={(e) => setForm({ ...form, theme_text: e.target.value })}
            placeholder="text-*"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
          <input
            value={form.theme_accent}
            onChange={(e) => setForm({ ...form, theme_accent: e.target.value })}
            placeholder="bg-* (accent)"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Products (select multiple)</label>
        <select
          multiple
          value={form.product_ids}
          onChange={(e) =>
            setForm({ ...form, product_ids: Array.from(e.target.selectedOptions).map((o) => o.value) })
          }
          className="w-full h-32 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          size={4}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Sort order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
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
        disabled={saving}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save store</>}
      </button>
    </div>
  );
}

// ----- BRANDS MANAGER (unchanged) -----
function BrandsManager() {
  const [brands, setBrands] = useState<TrustedBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TrustedBrand | null>(null);

  const load = useCallback(async () => {
    const data = await fetchAllTrustedBrands();
    setBrands(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteTrustedBrand(id);
    void load();
  };

  const handleToggle = async (brand: TrustedBrand) => {
    await updateTrustedBrand(brand.id, { is_active: !brand.is_active });
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add brand
      </button>
      {showForm && (
        <BrandForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {brands.map((brand) => (
        <div key={brand.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {brand.logo_url && (
                <img src={brand.logo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
              )}
              <div>
                <p className="text-sm font-bold text-ink-800 truncate">{brand.name}</p>
                <p className="text-xs text-ink-500">Order: {brand.sort_order}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => void handleToggle(brand)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {brand.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setEditing(brand);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(brand.id)}
                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BrandForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: TrustedBrand | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    logo_url: initial?.logo_url ?? '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (initial) {
      await updateTrustedBrand(initial.id, form);
    } else {
      await createTrustedBrand(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} brand</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Brand name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Amul"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Logo URL *</label>
        <input
          value={form.logo_url}
          onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
          placeholder="https://..."
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
        {form.logo_url && (
          <img src={form.logo_url} alt="" className="h-16 w-16 rounded-full object-cover mt-2" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Sort order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
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
        disabled={saving}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save brand</>}
      </button>
    </div>
  );
}

// ----- CATEGORIES MANAGER (unchanged) -----
function CategoriesManager() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DbCategory | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories((data as DbCategory[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add category
      </button>
      {showForm && (
        <CategoryForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {categories.map((cat) => (
        <div key={cat.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card flex items-center gap-3">
          {cat.image_url && <img src={cat.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-800 truncate">{cat.name}</p>
            <p className="text-xs text-ink-500">/{cat.slug} · Order {cat.sort_order}</p>
          </div>
          <button
            onClick={() => {
              setEditing(cat);
              setShowForm(true);
            }}
            className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
          >
            <Pencil size={14} />
          </button>
          <button onClick={() => void handleDelete(cat.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function CategoryForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: DbCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    image_url: initial?.image_url ?? '',
    description: initial?.description ?? '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (initial) {
      await supabase.from('categories').update(form).eq('id', initial.id);
    } else {
      await supabase.from('categories').insert(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} category</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Category name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Rice"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Slug *</label>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          placeholder="e.g. rice"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Image URL</label>
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          placeholder="https://..."
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Sort order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
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
        disabled={saving}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save</>}
      </button>
    </div>
  );
}

// ----- PRODUCTS MANAGER (updated with GST/HSN) -----
function ProductsManager() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DbProduct | null>(null);

  const load = useCallback(async () => {
    const [{ data: prodData }, { data: catData }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);
    setProducts((prodData as DbProduct[]) ?? []);
    setCategories((catData as DbCategory[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add product
      </button>
      {showForm && (
        <ProductForm
          initial={editing}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {products.map((prod) => (
        <div key={prod.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card flex items-center gap-3">
          {prod.image_url && <img src={prod.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-800 truncate">{prod.brand} {prod.name}</p>
            <p className="text-xs text-ink-500">{prod.pack_size} · ₹{prod.wholesale_price} · Stock: {prod.stock_quantity}</p>
            {prod.gst_percentage != null && prod.gst_percentage > 0 && (
              <span className="text-[10px] text-brand-600">GST: {prod.gst_percentage}%</span>
            )}
          </div>
          <button
            onClick={() => {
              setEditing(prod);
              setShowForm(true);
            }}
            className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
          >
            <Pencil size={14} />
          </button>
          <button onClick={() => void handleDelete(prod.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ProductForm({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: DbProduct | null;
  categories: DbCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    category_id: initial?.category_id ?? categories[0]?.id ?? '',
    brand: initial?.brand ?? '',
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    pack_size: initial?.pack_size ?? '',
    mrp: initial?.mrp ?? 0,
    wholesale_price: initial?.wholesale_price ?? 0,
    moq: initial?.moq ?? 1,
    stock_quantity: initial?.stock_quantity ?? 0,
    image_url: initial?.image_url ?? '',
    description: initial?.description ?? '',
    rating: initial?.rating ?? 0,
    is_active: initial?.is_active ?? true,
    hsn_code: initial?.hsn_code ?? '',
    gst_percentage: initial?.gst_percentage ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (initial) {
      await supabase.from('products').update(form).eq('id', initial.id);
    } else {
      await supabase.from('products').insert(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} product</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Category *</label>
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Brand *</label>
          <input
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="e.g. Fortune"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Sunflower Oil"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Slug *</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g. sunflower-oil"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Pack size *</label>
          <input
            value={form.pack_size}
            onChange={(e) => setForm({ ...form, pack_size: e.target.value })}
            placeholder="e.g. 1 L"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">MRP</label>
          <input
            type="number"
            value={form.mrp}
            onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Wholesale</label>
          <input
            type="number"
            value={form.wholesale_price}
            onChange={(e) => setForm({ ...form, wholesale_price: Number(e.target.value) })}
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">MOQ</label>
          <input
            type="number"
            value={form.moq}
            onChange={(e) => setForm({ ...form, moq: Number(e.target.value) })}
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Stock quantity</label>
          <input
            type="number"
            value={form.stock_quantity}
            onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Rating</label>
          <input
            type="number"
            step="0.1"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      {/* GST and HSN fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">HSN Code</label>
          <input
            value={form.hsn_code}
            onChange={(e) => setForm({ ...form, hsn_code: e.target.value })}
            placeholder="e.g. 1512"
            className="h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">GST %</label>
          <select
            value={form.gst_percentage}
            onChange={(e) => setForm({ ...form, gst_percentage: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Image URL</label>
        <input
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
          placeholder="https://..."
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Product description"
          rows={2}
          className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 resize-none"
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
        disabled={saving}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save</>}
      </button>
    </div>
  );
}

// ----- VOLUME PRICING MANAGER -----
function VolumePricingManager() {
  const [products, setProducts] = useState<{ id: string; brand: string; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [tiers, setTiers] = useState<VolumePricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VolumePricingTier | null>(null);
  const [form, setForm] = useState({
    min_quantity: 1,
    max_quantity: '',
    unit_price: 0,
    discount_percent: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('id, brand, name').order('name');
      if (data && data.length > 0) {
        setProducts(data);
        setSelectedProductId(data[0].id);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Fetch tiers when product changes
  useEffect(() => {
    if (!selectedProductId) return;
    async function loadTiers() {
      setLoading(true);
      const tiersData = await fetchVolumePricing(selectedProductId);
      setTiers(tiersData);
      setLoading(false);
    }
    loadTiers();
  }, [selectedProductId]);

  const handleSaveTier = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    const payload = {
      product_id: selectedProductId,
      min_quantity: form.min_quantity,
      max_quantity: form.max_quantity ? parseInt(form.max_quantity) : null,
      unit_price: form.unit_price,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
    };
    if (editing) {
      await updateVolumePricingTier(editing.id, payload);
    } else {
      await createVolumePricingTier(payload);
    }
    const tiersData = await fetchVolumePricing(selectedProductId);
    setTiers(tiersData);
    setEditing(null);
    setForm({ min_quantity: 1, max_quantity: '', unit_price: 0, discount_percent: '' });
    setSaving(false);
  };

  const handleDeleteTier = async (id: string) => {
    await deleteVolumePricingTier(id);
    const tiersData = await fetchVolumePricing(selectedProductId);
    setTiers(tiersData);
  };

  if (loading && products.length === 0) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Select Product</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-ink-900">{editing ? 'Edit' : 'Add'} Volume Tier</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Min Quantity</label>
            <input
              type="number"
              value={form.min_quantity}
              onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Max Quantity (empty = unlimited)</label>
            <input
              type="number"
              value={form.max_quantity}
              onChange={(e) => setForm({ ...form, max_quantity: e.target.value })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Unit Price</label>
            <input
              type="number"
              step="0.01"
              value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Discount % (optional)</label>
            <input
              type="number"
              step="0.1"
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
              placeholder="e.g. 10"
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <button
          onClick={handleSaveTier}
          disabled={saving || !form.unit_price}
          className="w-full h-10 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {editing ? 'Update Tier' : 'Add Tier'}
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-ink-600">Existing Tiers</p>
        {tiers.length === 0 ? (
          <p className="text-xs text-ink-400">No volume tiers defined for this product.</p>
        ) : (
          tiers.map((tier) => (
            <div key={tier.id} className="bg-white border border-ink-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-ink-800">
                  {tier.min_quantity} – {tier.max_quantity ?? '∞'} qty
                </span>
                <span className="ml-3 text-sm text-brand-600">₹{tier.unit_price}</span>
                {tier.discount_percent && <span className="ml-2 text-xs text-ink-500">({tier.discount_percent}% off)</span>}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(tier);
                    setForm({
                      min_quantity: tier.min_quantity,
                      max_quantity: tier.max_quantity?.toString() ?? '',
                      unit_price: tier.unit_price,
                      discount_percent: tier.discount_percent?.toString() ?? '',
                    });
                  }}
                  className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => void handleDeleteTier(tier.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ----- PROMO CODES MANAGER -----
function PromoCodesManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);

  const load = useCallback(async () => {
    const data = await fetchAllPromoCodes();
    setPromoCodes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deletePromoCode(id);
    void load();
  };

  const handleToggle = async (promo: PromoCode) => {
    await updatePromoCode(promo.id, { is_active: !promo.is_active });
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add Promo Code
      </button>
      {showForm && (
        <PromoCodeForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {promoCodes.map((promo) => (
        <div key={promo.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink-800">{promo.code}</p>
              <p className="text-xs text-ink-500">
                {promo.discount_type === 'percentage' ? `${promo.discount_value}% off` : `₹${promo.discount_value} off`}
                {promo.min_order_value > 0 && ` · Min order ₹${promo.min_order_value}`}
                {promo.max_discount_amount && ` · Max discount ₹${promo.max_discount_amount}`}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                    promo.is_active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {promo.is_active ? 'ACTIVE' : 'HIDDEN'}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  Used: {promo.used_count}/{promo.usage_limit ?? '∞'}
                </span>
                {promo.start_date && (
                  <span className="text-[10px] text-amber-600">From: {new Date(promo.start_date).toLocaleDateString()}</span>
                )}
                {promo.end_date && (
                  <span className="text-[10px] text-amber-600">To: {new Date(promo.end_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => void handleToggle(promo)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {promo.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setEditing(promo);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(promo.id)}
                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PromoCodeForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: PromoCode | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: initial?.code ?? '',
    discount_type: initial?.discount_type ?? 'percentage' as 'percentage' | 'fixed',
    discount_value: initial?.discount_value ?? 0,
    min_order_value: initial?.min_order_value ?? 0,
    max_discount_amount: initial?.max_discount_amount ?? '',
    applies_to: initial?.applies_to ?? 'all',
    applies_to_ids: initial?.applies_to_ids ?? [],
    start_date: initial?.start_date ?? '',
    end_date: initial?.end_date ?? '',
    usage_limit: initial?.usage_limit ?? '',
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);

  useEffect(() => {
    void (async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
      ]);
      setCategories((cats as DbCategory[]) ?? []);
      setProducts((prods as DbProduct[]) ?? []);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_value: form.min_order_value,
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      applies_to: form.applies_to,
      applies_to_ids: form.applies_to_ids,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      is_active: form.is_active,
    };
    if (initial) {
      await updatePromoCode(initial.id, payload);
    } else {
      await createPromoCode(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} Promo Code</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Code *</label>
        <input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
          placeholder="e.g. SAVE10"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Discount Type</label>
          <select
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Value</label>
          <input
            type="number"
            step="0.01"
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Min Order Value</label>
          <input
            type="number"
            value={form.min_order_value}
            onChange={(e) => setForm({ ...form, min_order_value: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Max Discount (for percentage)</label>
          <input
            type="number"
            value={form.max_discount_amount}
            onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
            placeholder="Leave empty for no limit"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Applies To</label>
        <select
          value={form.applies_to}
          onChange={(e) => setForm({ ...form, applies_to: e.target.value as 'all' | 'category' | 'product', applies_to_ids: [] })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          <option value="all">All products</option>
          <option value="category">Specific categories</option>
          <option value="product">Specific products</option>
        </select>
      </div>
      {form.applies_to !== 'all' && (
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">
            {form.applies_to === 'category' ? 'Select Categories' : 'Select Products'}
          </label>
          <select
            multiple
            value={form.applies_to_ids}
            onChange={(e) =>
              setForm({ ...form, applies_to_ids: Array.from(e.target.selectedOptions).map((o) => o.value) })
            }
            className="w-full h-24 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            size={4}
          >
            {form.applies_to === 'category' &&
              categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            {form.applies_to === 'product' &&
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} {p.name}
                </option>
              ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Start Date</label>
          <input
            type="datetime-local"
            value={form.start_date ? form.start_date.slice(0, 16) : ''}
            onChange={(e) => setForm({ ...form, start_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">End Date</label>
          <input
            type="datetime-local"
            value={form.end_date ? form.end_date.slice(0, 16) : ''}
            onChange={(e) => setForm({ ...form, end_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Usage Limit</label>
          <input
            type="number"
            value={form.usage_limit}
            onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
            placeholder="Leave empty for unlimited"
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
        disabled={saving || !form.code}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Promo Code</>}
      </button>
    </div>
  );
}

// ----- DELIVERY SETTINGS MANAGER -----
function DeliverySettingsManager() {
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

  const handleToggleZone = async (zone: DeliveryZone) => {
    // No active flag for zone, but we can update if needed.
    // We'll just soft delete by pincodes? For simplicity, we'll allow delete.
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

// ================================================================
// [NEW] DELIVERY RANGES MANAGER
// ================================================================
function DeliveryRangesManager() {
  const [ranges, setRanges] = useState<DeliveryRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DeliveryRange | null>(null);

  const load = useCallback(async () => {
    const data = await fetchDeliveryRanges();
    setRanges(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteDeliveryRange(id);
    void load();
  };

  const handleToggle = async (range: DeliveryRange) => {
    await updateDeliveryRange(range.id, { is_active: !range.is_active });
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add delivery range
      </button>
      {showForm && (
        <DeliveryRangeForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {ranges.map((range) => (
        <div key={range.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink-800">{range.name}</p>
              <p className="text-xs text-ink-500">
                {range.center_lat.toFixed(5)}, {range.center_lng.toFixed(5)} · Radius: {range.radius_km} km
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => void handleToggle(range)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {range.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setEditing(range);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(range.id)}
                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Form component for delivery range
function DeliveryRangeForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: DeliveryRange | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    center_lat: initial?.center_lat ?? 0,
    center_lng: initial?.center_lng ?? 0,
    radius_km: initial?.radius_km ?? 5,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      center_lat: form.center_lat,
      center_lng: form.center_lng,
      radius_km: form.radius_km,
      is_active: form.is_active,
    };
    if (initial) {
      await updateDeliveryRange(initial.id, payload);
    } else {
      await createDeliveryRange(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} delivery range</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Range name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Delhi NCR"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Center latitude *</label>
          <input
            type="number"
            step="any"
            value={form.center_lat}
            onChange={(e) => setForm({ ...form, center_lat: parseFloat(e.target.value) || 0 })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Center longitude *</label>
          <input
            type="number"
            step="any"
            value={form.center_lng}
            onChange={(e) => setForm({ ...form, center_lng: parseFloat(e.target.value) || 0 })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Radius (km) *</label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={form.radius_km}
          onChange={(e) => setForm({ ...form, radius_km: parseFloat(e.target.value) || 0 })}
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
        disabled={saving || !form.name || !form.radius_km}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save range</>}
      </button>
    </div>
  );
}

// ----- Zone Form -----
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

// ----- Charge Form -----
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

// ----- SMART COLLECTIONS MANAGER (unchanged) -----
function SmartCollectionsManager() {
  const [collections, setCollections] = useState<SmartCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SmartCollection | null>(null);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [collectionsRes, catsRes, brandsRes] = await Promise.all([
      fetchAllSmartCollections(),
      supabase.from('categories').select('*').order('name'),
      fetchAllBrands(),
    ]);
    setCollections(collectionsRes);
    setCategories((catsRes.data as DbCategory[]) ?? []);
    setBrands(brandsRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    await deleteSmartCollection(id);
    void load();
  };

  const handleToggle = async (collection: SmartCollection) => {
    await updateSmartCollection(collection.id, { is_active: !collection.is_active });
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add smart collection
      </button>
      {showForm && (
        <SmartCollectionForm
          initial={editing}
          categories={categories}
          brands={brands}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}
      {collections.map((collection) => (
        <div key={collection.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink-800 truncate">{collection.name}</p>
              <p className="text-xs text-ink-500 truncate">{collection.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                    collection.is_active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {collection.is_active ? 'ACTIVE' : 'HIDDEN'}
                </span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">
                  Filters: {Object.keys(collection.filter_config).length}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => void handleToggle(collection)}
                className="h-8 w-8 rounded-lg bg-ink-50 text-ink-600 flex items-center justify-center text-xs font-bold"
              >
                {collection.is_active ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setEditing(collection);
                  setShowForm(true);
                }}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => void handleDelete(collection.id)}
                className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SmartCollectionForm({
  initial,
  categories,
  brands,
  onClose,
  onSaved,
}: {
  initial: SmartCollection | null;
  categories: DbCategory[];
  brands: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    filter_config: (initial?.filter_config ?? {}) as FilterConfig,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const setFilterConfig = (key: keyof FilterConfig, value: unknown) => {
    setForm((f) => ({
      ...f,
      filter_config: { ...f.filter_config, [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    if (initial) {
      await updateSmartCollection(initial.id, {
        name: form.name,
        description: form.description,
        filter_config: form.filter_config,
        is_active: form.is_active,
      });
    } else {
      await createSmartCollection({
        name: form.name,
        description: form.description,
        filter_config: form.filter_config,
        is_active: form.is_active,
      });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} smart collection</h3>
        <button onClick={onClose}>
          <X size={16} className="text-ink-400" />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Best Sellers"
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
        <label className="block text-xs font-bold text-ink-600 mb-1">Filter Configuration</label>
        <div className="space-y-3 bg-ink-50/30 p-3 rounded-xl border border-ink-100">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Categories</label>
            <select
              multiple
              value={(form.filter_config.category_ids as string[]) ?? []}
              onChange={(e) =>
                setFilterConfig('category_ids', Array.from(e.target.selectedOptions).map((o) => o.value))
              }
              className="w-full h-24 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              size={4}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Brands</label>
            <select
              multiple
              value={(form.filter_config.brand_ids as string[]) ?? []}
              onChange={(e) =>
                setFilterConfig('brand_ids', Array.from(e.target.selectedOptions).map((o) => o.value))
              }
              className="w-full h-24 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              size={4}
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Min Discount %</label>
              <input
                type="number"
                value={(form.filter_config.discount_min as number) ?? ''}
                onChange={(e) => setFilterConfig('discount_min', e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Max Discount %</label>
              <input
                type="number"
                value={(form.filter_config.discount_max as number) ?? ''}
                onChange={(e) => setFilterConfig('discount_max', e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Min Price</label>
              <input
                type="number"
                value={(form.filter_config.price_min as number) ?? ''}
                onChange={(e) => setFilterConfig('price_min', e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-600 mb-1">Max Price</label>
              <input
                type="number"
                value={(form.filter_config.price_max as number) ?? ''}
                onChange={(e) => setFilterConfig('price_max', e.target.value ? Number(e.target.value) : null)}
                className="w-full h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={(form.filter_config.stock_only as boolean) ?? false}
                onChange={(e) => setFilterConfig('stock_only', e.target.checked)}
                className="accent-brand-600"
              />{' '}
              In stock only
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Sort by</label>
            <select
              value={(form.filter_config.sort as string) ?? 'newest'}
              onChange={(e) => setFilterConfig('sort', e.target.value)}
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
        disabled={saving || !form.name}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save collection</>}
      </button>
    </div>
  );
}

// ----- ROLES MANAGER (unchanged) -----
function RolesManager() {
  const [users, setUsers] = useState<{ user_id: string; role: string; full_name: string; phone: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, role, profiles!inner(full_name, phone)')
      .order('created_at', { ascending: false });
    if (data) {
      setUsers(
        data.map((r: Record<string, unknown>) => {
          const p = r.profiles as { full_name: string; phone: string };
          return { user_id: r.user_id as string, role: r.role as string, full_name: p.full_name, phone: p.phone };
        })
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRoleChange = async (userId: string, role: string) => {
    await supabase.rpc('set_user_role', { p_user_id: userId, p_role: role });
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">Change a user's role to grant admin, warehouse, or delivery access.</p>
      {users.map((u) => (
        <div key={u.user_id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-800 truncate">{u.full_name || 'Unknown'}</p>
              <p className="text-xs text-ink-500">{u.phone || u.user_id.slice(0, 8)}</p>
            </div>
            <select
              value={u.role}
              onChange={(e) => void handleRoleChange(u.user_id, e.target.value)}
              className="h-9 rounded-lg border border-ink-200 px-2 text-xs font-bold outline-none focus:border-brand-500"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="warehouse_manager">Warehouse</option>
              <option value="delivery_partner">Delivery</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}