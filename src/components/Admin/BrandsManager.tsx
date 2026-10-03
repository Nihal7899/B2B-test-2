import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Loader2, Upload, Copy, X, Search } from 'lucide-react';
import { BrandCard } from '@/components/BrandCard';
import {
  fetchAllTrustedBrands,
  createTrustedBrand,
  updateTrustedBrand,
  deleteTrustedBrand,
  uploadBrandImage,
  deleteBrandImage,
  fetchDistinctBrands,
} from '@/services/catalog';
import type { TrustedBrand, BrandCardConfig } from '@/types';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { UploadProgress } from '@/components/ui/UploadProgress';
import { compressImage } from '@/lib/imageUtils';
import { CachedImage } from '@/components/CachedImage';

interface BrandWithColors extends TrustedBrand {
  primary_color: string;
  secondary_color: string;
  product_images: string[];
  tagline?: string;
  categories?: string[];
  bottom_label?: string;
  bottom_icon?: 'shield' | 'crown' | 'leaf';
  description?: string;
}

/* Shared class names — keeps fields consistent and non-overlapping on mobile */
const inputClass =
  'w-full min-w-0 rounded-lg border border-ink-200 bg-white p-2 text-sm outline-none focus:border-brand-500';
const labelClass = 'mb-1 block text-sm font-medium text-ink-700';

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

/** Extracts a hex color from any `#rrggbb` / `#rgb` / `rgba(...)` string. */
function toHexColor(value: string): string {
  if (!value) return '#000000';
  if (value.startsWith('#') && (value.length === 7 || value.length === 4)) {
    return value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      : value.slice(0, 7);
  }
  const m = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const hex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${hex(Number(m[1]))}${hex(Number(m[2]))}${hex(Number(m[3]))}`;
  }
  return '#000000';
}

/** Color picker + text input, side by side. Picker writes hex; text allows anything (rgba etc.). */
function ColorWithInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={toHexColor(value)}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-ink-200 p-1"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} flex-1`}
        placeholder={placeholder}
      />
    </div>
  );
}

/** Range slider + numeric read-out. */
function SliderInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-brand-600"
      />
      <span className="min-w-[52px] shrink-0 text-right font-mono text-xs text-ink-600">
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Brand Card Style Editor                                            */
/* ------------------------------------------------------------------ */
function BrandStyleEditor({
  config,
  onChange,
}: {
  config: BrandCardConfig;
  onChange: (c: BrandCardConfig) => void;
}) {
  const set = (patch: Partial<BrandCardConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="mt-1 grid grid-cols-1 gap-3 rounded-lg border border-ink-200 bg-ink-50/40 p-3 md:grid-cols-2">
      {/* Text colors */}
      <div className="min-w-0">
        <label className={labelClass}>Name Color</label>
        <ColorWithInput
          value={config.nameColor ?? ''}
          onChange={(v) => set({ nameColor: v })}
          placeholder="Auto (contrast)"
        />
        <p className="mt-1 text-[11px] text-ink-400">
          Empty = auto contrast from background.
        </p>
      </div>
      <div className="min-w-0">
        <label className={labelClass}>Tagline Color</label>
        <ColorWithInput
          value={config.taglineColor ?? ''}
          onChange={(v) => set({ taglineColor: v })}
          placeholder="Auto (contrast)"
        />
        <p className="mt-1 text-[11px] text-ink-400">
          Empty = auto contrast from background.
        </p>
      </div>

      {/* Shadow controls — sliders */}
      <div className="min-w-0 md:col-span-2">
        <label className={labelClass}>Cylinder Shadow Opacity</label>
        <SliderInput
          value={config.cylinderShadowOpacity ?? 0.3}
          onChange={(n) => set({ cylinderShadowOpacity: n })}
          min={0}
          max={1}
          step={0.05}
        />
      </div>
      <div className="min-w-0 md:col-span-2">
        <label className={labelClass}>Cylinder Shadow Blur (px)</label>
        <SliderInput
          value={config.cylinderShadowBlur ?? 20}
          onChange={(n) => set({ cylinderShadowBlur: n })}
          min={0}
          max={60}
          step={1}
        />
      </div>

      {/* Bottom pill */}
      <div className="min-w-0">
        <label className={labelClass}>Bottom Pill Background</label>
        <ColorWithInput
          value={config.pillBgColor ?? ''}
          onChange={(v) => set({ pillBgColor: v })}
          placeholder="rgba(0,0,0,0.75)"
        />
      </div>
      <div className="min-w-0">
        <label className={labelClass}>Bottom Pill Text</label>
        <ColorWithInput
          value={config.pillTextColor ?? ''}
          onChange={(v) => set({ pillTextColor: v })}
          placeholder="#ffffff"
        />
      </div>
      <div className="min-w-0 md:col-span-2">
        <label className={labelClass}>Bottom Pill Border</label>
        <ColorWithInput
          value={config.pillBorderColor ?? ''}
          onChange={(v) => set({ pillBorderColor: v })}
          placeholder="rgba(255,255,255,0.2)"
        />
      </div>

      {/* Category pills */}
      <div className="min-w-0">
        <label className={labelClass}>Category Pill Background</label>
        <ColorWithInput
          value={config.categoryPillBg ?? ''}
          onChange={(v) => set({ categoryPillBg: v })}
          placeholder="rgba(0,0,0,0.2)"
        />
      </div>
      <div className="min-w-0">
        <label className={labelClass}>Category Pill Text</label>
        <ColorWithInput
          value={config.categoryPillText ?? ''}
          onChange={(v) => set({ categoryPillText: v })}
          placeholder="#ffffff"
        />
      </div>
      <div className="min-w-0 md:col-span-2">
        <label className={labelClass}>Category Pill Border</label>
        <ColorWithInput
          value={config.categoryPillBorder ?? ''}
          onChange={(v) => set({ categoryPillBorder: v })}
          placeholder="rgba(255,255,255,0.25)"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared editable fields (used by both Add and Edit forms)           */
/* ------------------------------------------------------------------ */
function BrandEditableFields({
  brand,
  setBrand,
}: {
  brand: Partial<BrandWithColors>;
  setBrand: (b: any) => void;
}) {
  return (
    <>
      <div className="min-w-0">
        <label className={labelClass}>Tagline (below name)</label>
        <input
          value={brand.tagline || ''}
          onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
          className={inputClass}
          placeholder="e.g. Goodness of Purity"
        />
      </div>
      <div className="min-w-0">
        <label className={labelClass}>Categories (comma separated, max 3)</label>
        <input
          value={(brand.categories || []).join(', ')}
          onChange={(e) => {
            const items = e.target.value.split(/\s*,\s*/).filter(Boolean);
            setBrand({ ...brand, categories: items.slice(0, 3) });
          }}
          className={inputClass}
          placeholder="e.g. Dairy, Butter, Ice Cream"
        />
      </div>
      <div className="min-w-0">
        <label className={labelClass}>Bottom Label</label>
        <input
          value={brand.bottom_label || ''}
          onChange={(e) => setBrand({ ...brand, bottom_label: e.target.value })}
          className={inputClass}
          placeholder="e.g. Trusted by Generations"
        />
      </div>
      <div className="min-w-0">
        <label className={labelClass}>Bottom Icon</label>
        <select
          value={brand.bottom_icon || 'shield'}
          onChange={(e) =>
            setBrand({ ...brand, bottom_icon: e.target.value as any })
          }
          className={inputClass}
        >
          <option value="shield">Shield</option>
          <option value="crown">Crown</option>
          <option value="leaf">Leaf</option>
        </select>
      </div>
      <div className="min-w-0 md:col-span-2">
        <label className={labelClass}>Description</label>
        <textarea
          value={brand.description || ''}
          onChange={(e) => setBrand({ ...brand, description: e.target.value })}
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder="Tell the story of this brand..."
        />
      </div>

      {/* Card style — stored in its own `card_config` column */}
      <div className="min-w-0 md:col-span-2">
        <label className={labelClass}>Card Style</label>
        <BrandStyleEditor
          config={brand.card_config || {}}
          onChange={(c) => setBrand({ ...brand, card_config: c })}
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit form                                                          */
/* ------------------------------------------------------------------ */
function BrandEditForm({
  brand,
  onSave,
  onCancel,
  productBrands,
}: {
  brand: BrandWithColors;
  onSave: (updatedBrand: BrandWithColors, logoFile: File | null, productFile: File | null) => Promise<void>;
  onCancel: () => void;
  productBrands: string[];
}) {
  const [editBrand, setEditBrand] = useState(brand);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingProductFile, setPendingProductFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(brand.logo_url);
  const [productPreview, setProductPreview] = useState<string | null>(
    brand.product_images?.[0] || null
  );

  const handleLogoSelect = (file: File) => {
    setPendingLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleProductSelect = (file: File) => {
    setPendingProductFile(file);
    setProductPreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    onSave(editBrand, pendingLogoFile, pendingProductFile);
  };

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* ---------------- Left: fields ---------------- */}
      <div className="min-w-0 space-y-3">
        {/* Name + copy */}
        <div className="min-w-0">
          <label className={labelClass}>Name *</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={editBrand.name}
              onChange={(e) => setEditBrand({ ...editBrand, name: e.target.value })}
              className={`${inputClass} sm:flex-1`}
            />
            <select
              value=""
              onChange={(e) => {
                const selected = e.target.value;
                if (selected) setEditBrand({ ...editBrand, name: selected });
              }}
              className="w-full shrink-0 rounded-lg border border-ink-200 p-2 text-sm outline-none focus:border-brand-500 sm:w-40"
              title="Copy name from product brand"
            >
              <option value="">📋 Copy</option>
              {productBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort order */}
        <div className="min-w-0">
          <label className={labelClass}>Sort Order</label>
          <input
            type="number"
            value={editBrand.sort_order}
            onChange={(e) =>
              setEditBrand({ ...editBrand, sort_order: Number(e.target.value) })
            }
            className={inputClass}
          />
        </div>

        {/* Primary colour */}
        <div className="min-w-0">
          <label className={labelClass}>Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={editBrand.primary_color}
              onChange={(e) =>
                setEditBrand({ ...editBrand, primary_color: e.target.value })
              }
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-ink-200 p-1"
            />
            <input
              type="text"
              value={editBrand.primary_color}
              onChange={(e) =>
                setEditBrand({ ...editBrand, primary_color: e.target.value })
              }
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>

        {/* Secondary colour */}
        <div className="min-w-0">
          <label className={labelClass}>Secondary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={editBrand.secondary_color}
              onChange={(e) =>
                setEditBrand({ ...editBrand, secondary_color: e.target.value })
              }
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-ink-200 p-1"
            />
            <input
              type="text"
              value={editBrand.secondary_color}
              onChange={(e) =>
                setEditBrand({ ...editBrand, secondary_color: e.target.value })
              }
              className={`${inputClass} flex-1`}
            />
          </div>
        </div>

        {/* Logo */}
        <div className="min-w-0">
          <label className={labelClass}>Logo</label>
          <div className="flex items-center gap-2">
            <input
              value={editBrand.logo_url}
              onChange={(e) => {
                setEditBrand({ ...editBrand, logo_url: e.target.value });
                setLogoPreview(e.target.value);
              }}
              className={`${inputClass} flex-1`}
            />
            <label className="shrink-0 cursor-pointer rounded-lg bg-ink-100 p-2">
              <Upload size={16} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoSelect(file);
                }}
              />
            </label>
          </div>
          {logoPreview && (
            <div className="mt-2 flex items-center gap-2">
              <CachedImage
                src={logoPreview}
                alt="Logo preview"
                className="h-16 w-16 shrink-0 rounded object-cover"
              />
              {pendingLogoFile && (
                <span className="text-xs text-green-600">Pending upload</span>
              )}
            </div>
          )}
        </div>

        {/* Product image */}
        <div className="min-w-0">
          <label className={labelClass}>Product Image</label>
          <div className="flex items-center gap-2">
            <input
              value={editBrand.product_images?.[0] || ''}
              onChange={(e) => {
                const imgs = [e.target.value];
                setEditBrand({ ...editBrand, product_images: imgs });
                setProductPreview(e.target.value);
              }}
              className={`${inputClass} flex-1`}
            />
            <label className="shrink-0 cursor-pointer rounded-lg bg-ink-100 p-2">
              <Upload size={16} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProductSelect(file);
                }}
              />
            </label>
          </div>
          {productPreview && (
            <div className="mt-2 flex items-center gap-2">
              <CachedImage
                src={productPreview}
                alt="Product preview"
                className="h-16 w-16 shrink-0 rounded object-cover"
              />
              {pendingProductFile && (
                <span className="text-xs text-green-600">Pending upload</span>
              )}
            </div>
          )}
        </div>

        {/* Active */}
        <div className="min-w-0">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              checked={editBrand.is_active}
              onChange={(e) =>
                setEditBrand({ ...editBrand, is_active: e.target.checked })
              }
            />
            Active
          </label>
        </div>

        <BrandEditableFields brand={editBrand} setBrand={setEditBrand} />

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="w-full rounded-lg border px-4 py-2 text-sm sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white sm:w-auto"
          >
            <Save size={16} /> Save
          </button>
        </div>
      </div>

      {/* ---------------- Right: preview ---------------- */}
      <div className="flex min-w-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 p-4">
        <div className="w-full max-w-full overflow-x-auto">
          <div className="mx-auto w-fit">
            <BrandCard
              brandName={editBrand.name}
              primaryColor={editBrand.primary_color}
              secondaryColor={editBrand.secondary_color}
              logoUrl={logoPreview || editBrand.logo_url || 'https://via.placeholder.com/100'}
              productImage={
                productPreview ||
                editBrand.product_images?.[0] ||
                'https://via.placeholder.com/120/CCCCCC/999999?text=Product'
              }
              tagline={editBrand.tagline}
              categories={editBrand.categories}
              bottomLabel={editBrand.bottom_label}
              bottomIcon={editBrand.bottom_icon}
              config={editBrand.card_config || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main manager                                                       */
/* ------------------------------------------------------------------ */
export default function BrandsManager() {
  const [brands, setBrands] = useState<BrandWithColors[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [productBrands, setProductBrands] = useState<string[]>([]);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>
  >([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    brandId?: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const loadBrands = async () => {
    const data = await fetchAllTrustedBrands();
    setBrands(data as BrandWithColors[]);
    setLoading(false);
  };

  useEffect(() => {
    loadBrands();
    fetchDistinctBrands().then(setProductBrands);
  }, []);

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      brandId: id,
      title: 'Delete Brand',
      message: 'Are you sure you want to delete this brand? This action cannot be undone.',
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.brandId) return;
    const brand = brands.find((b) => b.id === confirmDialog.brandId);
    try {
      if (brand) {
        if (brand.logo_url && !brand.logo_url.includes('placeholder')) {
          await deleteBrandImage(brand.logo_url);
        }
        if (brand.product_images && brand.product_images.length) {
          for (const img of brand.product_images) {
            if (img && !img.includes('placeholder')) {
              await deleteBrandImage(img);
            }
          }
        }
      }
      await deleteTrustedBrand(confirmDialog.brandId);
      addToast('Brand deleted successfully', 'success');
      await loadBrands();
    } catch {
      addToast('Failed to delete brand', 'error');
    } finally {
      setConfirmDialog({ isOpen: false, brandId: undefined, title: '', message: '' });
    }
  };

  const handleSaveEdit = async (
    updatedBrand: BrandWithColors,
    logoFile: File | null,
    productFile: File | null
  ) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing to save...');

    try {
      let newLogoUrl = updatedBrand.logo_url;
      let newProductImage = updatedBrand.product_images?.[0] || '';

      if (logoFile) {
        const oldLogo = updatedBrand.logo_url;
        setUploadStatus('Compressing logo...');
        for (let i = 0; i <= 6; i++) {
          const progress = Math.min(30, (i / 6) * 30);
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        const compressed = await compressImage(logoFile);
        setUploadStatus('Uploading logo...');
        setUploadProgress(30);
        const url = await uploadBrandImage(compressed, updatedBrand.id, 'logo_url', (p) => {
          const overall = 30 + p * 0.7;
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading logo... ${Math.round(overall)}%`);
        });
        newLogoUrl = url;
        setUploadProgress(100);
        if (oldLogo && !oldLogo.includes('placeholder') && oldLogo !== url) {
          await deleteBrandImage(oldLogo);
        }
      }

      if (productFile) {
        const oldProduct = updatedBrand.product_images?.[0] || '';
        setUploadStatus('Compressing product image...');
        for (let i = 0; i <= 6; i++) {
          const progress = Math.min(30, (i / 6) * 30);
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        const compressed = await compressImage(productFile);
        setUploadStatus('Uploading product image...');
        setUploadProgress(30);
        const url = await uploadBrandImage(compressed, updatedBrand.id, 'product_images', (p) => {
          const overall = 30 + p * 0.7;
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading product image... ${Math.round(overall)}%`);
        });
        newProductImage = url;
        setUploadProgress(100);
        if (oldProduct && !oldProduct.includes('placeholder') && oldProduct !== url) {
          await deleteBrandImage(oldProduct);
        }
      }

      const finalBrand = {
        ...updatedBrand,
        logo_url: newLogoUrl,
        product_images: [newProductImage],
      };
      await updateTrustedBrand(finalBrand.id, {
        name: finalBrand.name,
        logo_url: finalBrand.logo_url,
        sort_order: finalBrand.sort_order,
        is_active: finalBrand.is_active,
        primary_color: finalBrand.primary_color,
        secondary_color: finalBrand.secondary_color,
        product_images: finalBrand.product_images,
        tagline: finalBrand.tagline,
        categories: finalBrand.categories,
        bottom_label: finalBrand.bottom_label,
        bottom_icon: finalBrand.bottom_icon,
        description: finalBrand.description,
        card_config: finalBrand.card_config || {},   // ← separate column
        // NOTE: `config` is intentionally omitted — that column is owned
        // exclusively by BrandConfigManager.
      });
      setEditingId(null);
      await loadBrands();
      addToast('Brand updated successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to update brand', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const [newBrand, setNewBrand] = useState<Partial<BrandWithColors>>({
    name: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    product_images: [''],
    sort_order: 0,
    is_active: true,
    tagline: 'Quality You Can Trust',
    categories: ['Premium', 'Quality', 'Trusted'],
    bottom_label: 'Premium Quality',
    bottom_icon: 'shield',
    description: '',
    card_config: {},
  });

  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingProductFile, setPendingProductFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);

  const handleLogoSelect = (file: File) => {
    setPendingLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleProductSelect = (file: File) => {
    setPendingProductFile(file);
    setProductPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!newBrand.name || (!newBrand.logo_url && !pendingLogoFile)) {
      addToast('Name and Logo are required', 'warning');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing to save...');

    try {
      let newLogoUrl = newBrand.logo_url || '';
      let newProductImage = newBrand.product_images?.[0] || '';

      if (pendingLogoFile) {
        setUploadStatus('Compressing logo...');
        for (let i = 0; i <= 6; i++) {
          const progress = Math.min(30, (i / 6) * 30);
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        const compressed = await compressImage(pendingLogoFile);
        setUploadStatus('Uploading logo...');
        setUploadProgress(30);
        const url = await uploadBrandImage(compressed, null, 'logo_url', (p) => {
          const overall = 30 + p * 0.7;
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading logo... ${Math.round(overall)}%`);
        });
        newLogoUrl = url;
        setUploadProgress(100);
        setPendingLogoFile(null);
        setLogoPreview(null);
      }

      if (pendingProductFile) {
        setUploadStatus('Compressing product image...');
        for (let i = 0; i <= 6; i++) {
          const progress = Math.min(30, (i / 6) * 30);
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        const compressed = await compressImage(pendingProductFile);
        setUploadStatus('Uploading product image...');
        setUploadProgress(30);
        const url = await uploadBrandImage(compressed, null, 'product_images', (p) => {
          const overall = 30 + p * 0.7;
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading product image... ${Math.round(overall)}%`);
        });
        newProductImage = url;
        setUploadProgress(100);
        setPendingProductFile(null);
        setProductPreview(null);
      }

      await createTrustedBrand({
        name: newBrand.name,
        logo_url: newLogoUrl,
        sort_order: newBrand.sort_order || 0,
        is_active: newBrand.is_active ?? true,
        primary_color: newBrand.primary_color || '#3B82F6',
        secondary_color: newBrand.secondary_color || '#1E40AF',
        product_images: [newProductImage],
        tagline: newBrand.tagline,
        categories: newBrand.categories,
        bottom_label: newBrand.bottom_label,
        bottom_icon: newBrand.bottom_icon,
        description: newBrand.description,
        card_config: newBrand.card_config || {},   // ← separate column
      });
      setNewBrand({
        name: '',
        logo_url: '',
        primary_color: '#3B82F6',
        secondary_color: '#1E40AF',
        product_images: [''],
        sort_order: 0,
        is_active: true,
        tagline: 'Quality You Can Trust',
        categories: ['Premium', 'Quality', 'Trusted'],
        bottom_label: 'Premium Quality',
        bottom_icon: 'shield',
        description: '',
        card_config: {},
      });
      setShowAddForm(false);
      await loadBrands();
      addToast('Brand created successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to create brand', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  if (uploading) {
    return (
      <UploadProgress
        progress={uploadProgress}
        statusText={uploadStatus}
        isComplete={uploadProgress >= 100}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
          />
        ))}
      </ToastContainer>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
        <input
          type="text"
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-xl border border-ink-200 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <button
        onClick={() => setShowAddForm(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 font-bold text-white"
      >
        <Plus size={16} /> Add Brand
      </button>

      {/* -------------------- Add form -------------------- */}
      {showAddForm && (
        <div className="overflow-hidden rounded-2xl border bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">New Brand</h3>
            <button onClick={() => setShowAddForm(false)} className="text-ink-400">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Quick import */}
            <div className="col-span-1 min-w-0 md:col-span-2">
              <label className={labelClass}>Quick import from product brands</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value=""
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected) setNewBrand((prev) => ({ ...prev, name: selected }));
                  }}
                  className={`${inputClass} sm:flex-1`}
                >
                  <option value="">-- select a product brand --</option>
                  {productBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setNewBrand((prev) => ({ ...prev, name: '' }))}
                  className="w-full shrink-0 rounded-lg bg-ink-100 px-3 py-2 text-sm sm:w-auto"
                >
                  Clear
                </button>
              </div>
              <p className="mt-1 text-xs text-ink-400">
                Selecting a brand will fill the <strong>Name</strong> field below.
              </p>
            </div>

            {/* Name */}
            <div className="min-w-0">
              <label className={labelClass}>Name *</label>
              <input
                value={newBrand.name}
                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Sort order */}
            <div className="min-w-0">
              <label className={labelClass}>Sort Order</label>
              <input
                type="number"
                value={newBrand.sort_order}
                onChange={(e) =>
                  setNewBrand({ ...newBrand, sort_order: Number(e.target.value) })
                }
                className={inputClass}
              />
            </div>

            {/* Primary colour */}
            <div className="min-w-0">
              <label className={labelClass}>Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newBrand.primary_color}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, primary_color: e.target.value })
                  }
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-ink-200 p-1"
                />
                <input
                  type="text"
                  value={newBrand.primary_color}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, primary_color: e.target.value })
                  }
                  className={`${inputClass} flex-1`}
                />
              </div>
            </div>

            {/* Secondary colour */}
            <div className="min-w-0">
              <label className={labelClass}>Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newBrand.secondary_color}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, secondary_color: e.target.value })
                  }
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-ink-200 p-1"
                />
                <input
                  type="text"
                  value={newBrand.secondary_color}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, secondary_color: e.target.value })
                  }
                  className={`${inputClass} flex-1`}
                />
              </div>
            </div>

            {/* Logo */}
            <div className="min-w-0">
              <label className={labelClass}>Logo</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newBrand.logo_url}
                  onChange={(e) => {
                    setNewBrand({ ...newBrand, logo_url: e.target.value });
                    setLogoPreview(e.target.value);
                  }}
                  className={`${inputClass} flex-1`}
                />
                <label className="shrink-0 cursor-pointer rounded-lg bg-ink-100 p-2">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoSelect(file);
                    }}
                  />
                </label>
              </div>
              {logoPreview && (
                <div className="mt-2 flex items-center gap-2">
                  <CachedImage
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-16 w-16 shrink-0 rounded object-cover"
                  />
                  {pendingLogoFile && (
                    <span className="text-xs text-green-600">Pending upload</span>
                  )}
                </div>
              )}
            </div>

            {/* Product image */}
            <div className="min-w-0">
              <label className={labelClass}>Product Image</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newBrand.product_images?.[0] || ''}
                  onChange={(e) => {
                    const imgs = [e.target.value];
                    setNewBrand({ ...newBrand, product_images: imgs });
                    setProductPreview(e.target.value);
                  }}
                  className={`${inputClass} flex-1`}
                />
                <label className="shrink-0 cursor-pointer rounded-lg bg-ink-100 p-2">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProductSelect(file);
                    }}
                  />
                </label>
              </div>
              {productPreview && (
                <div className="mt-2 flex items-center gap-2">
                  <CachedImage
                    src={productPreview}
                    alt="Product preview"
                    className="h-16 w-16 shrink-0 rounded object-cover"
                  />
                  {pendingProductFile && (
                    <span className="text-xs text-green-600">Pending upload</span>
                  )}
                </div>
              )}
            </div>

            {/* Active */}
            <div className="min-w-0">
              <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={newBrand.is_active}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, is_active: e.target.checked })
                  }
                />
                Active
              </label>
            </div>

            <BrandEditableFields brand={newBrand} setBrand={setNewBrand} />

            {/* Actions */}
            <div className="col-span-1 flex flex-col-reverse gap-2 md:col-span-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowAddForm(false)}
                className="w-full rounded-lg border px-4 py-2 text-sm sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm text-white sm:w-auto"
              >
                Create
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 flex justify-center overflow-x-auto">
            <div className="mx-auto w-fit">
              <BrandCard
                brandName={newBrand.name || 'Preview'}
                primaryColor={newBrand.primary_color || '#3B82F6'}
                secondaryColor={newBrand.secondary_color || '#1E40AF'}
                logoUrl={logoPreview || newBrand.logo_url || 'https://via.placeholder.com/100'}
                productImage={
                  productPreview ||
                  newBrand.product_images?.[0] ||
                  'https://via.placeholder.com/120/CCCCCC/999999?text=Product'
                }
                tagline={newBrand.tagline}
                categories={newBrand.categories}
                bottomLabel={newBrand.bottom_label}
                bottomIcon={newBrand.bottom_icon}
                config={newBrand.card_config || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* -------------------- Brand list -------------------- */}
      <div className="space-y-4">
        {filteredBrands.map((brand) => {
          const isEditing = editingId === brand.id;
          return (
            <div
              key={brand.id}
              className="overflow-hidden rounded-2xl border bg-white p-4 shadow-card"
            >
              {isEditing ? (
                <BrandEditForm
                  brand={brand}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                  productBrands={productBrands}
                />
              ) : (
                <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-lg font-bold">{brand.name}</h3>
                    <p className="text-sm text-ink-500">Order: {brand.sort_order}</p>
                    <p className="text-sm">{brand.is_active ? 'Active' : 'Inactive'}</p>
                    {brand.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-ink-600">
                        {brand.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => setEditingId(brand.id)}
                        className="rounded bg-brand-50 px-3 py-1 text-sm text-brand-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(brand.id)}
                        className="rounded bg-red-50 px-3 py-1 text-sm text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="flex shrink-0 justify-center overflow-x-auto">
                    <div className="w-fit">
                      <BrandCard
                        brandName={brand.name}
                        primaryColor={brand.primary_color}
                        secondaryColor={brand.secondary_color}
                        logoUrl={brand.logo_url}
                        productImage={
                          brand.product_images?.[0] ||
                          'https://via.placeholder.com/120/CCCCCC/999999?text=Product'
                        }
                        tagline={brand.tagline}
                        categories={brand.categories}
                        bottomLabel={brand.bottom_label}
                        bottomIcon={brand.bottom_icon}
                        config={brand.card_config || undefined}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, brandId: undefined, title: '', message: '' })
        }
      />
    </div>
  );
}