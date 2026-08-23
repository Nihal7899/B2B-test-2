// components/admin/BrandsManager.tsx
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Loader2, Upload, Copy, X } from 'lucide-react';
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
import type { TrustedBrand } from '@/types';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { UploadProgress } from '@/components/ui/UploadProgress';
import { compressImage } from '@/lib/imageUtils';

// ---- Types ----
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

// ============================================================
// EDIT FORM (separate component to keep hooks at top level)
// ============================================================
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
  // State for the brand being edited
  const [editBrand, setEditBrand] = useState(brand);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingProductFile, setPendingProductFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(brand.logo_url);
  const [productPreview, setProductPreview] = useState<string | null>(
    brand.product_images?.[0] || null
  );

  // File selection handlers (preview only, no upload)
  const handleLogoSelect = (file: File) => {
    setPendingLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleProductSelect = (file: File) => {
    setPendingProductFile(file);
    setProductPreview(URL.createObjectURL(file));
  };

  // Helper: render editable fields (tagline, categories, etc.)
  const renderEditableFields = (
    brand: Partial<BrandWithColors>,
    setBrand: (b: any) => void
  ) => (
    <>
      <div>
        <label>Tagline (below name)</label>
        <input
          value={brand.tagline || ''}
          onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
          className="w-full border rounded p-2"
          placeholder="e.g. Goodness of Purity"
        />
      </div>
      <div>
        <label>Categories (comma separated, max 3)</label>
        <input
          value={(brand.categories || []).join(', ')}
          onChange={(e) => {
            const raw = e.target.value;
            const items = raw.split(/\s*,\s*/).filter(Boolean);
            setBrand({ ...brand, categories: items.slice(0, 3) });
          }}
          className="w-full border rounded p-2"
          placeholder="e.g. Dairy, Butter, Ice Cream"
        />
      </div>
      <div>
        <label>Bottom Label</label>
        <input
          value={brand.bottom_label || ''}
          onChange={(e) => setBrand({ ...brand, bottom_label: e.target.value })}
          className="w-full border rounded p-2"
          placeholder="e.g. Trusted by Generations"
        />
      </div>
      <div>
        <label>Bottom Icon</label>
        <select
          value={brand.bottom_icon || 'shield'}
          onChange={(e) =>
            setBrand({ ...brand, bottom_icon: e.target.value as any })
          }
          className="w-full border rounded p-2"
        >
          <option value="shield">Shield</option>
          <option value="crown">Crown</option>
          <option value="leaf">Leaf</option>
        </select>
      </div>
      <div>
        <label>Description</label>
        <textarea
          value={brand.description || ''}
          onChange={(e) => setBrand({ ...brand, description: e.target.value })}
          className="w-full border rounded p-2"
          rows={3}
          placeholder="Tell the story of this brand..."
        />
      </div>
    </>
  );

  // Handle save (call parent with the updated brand and pending files)
  const handleSave = () => {
    onSave(editBrand, pendingLogoFile, pendingProductFile);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        {/* Name with Copy helper */}
        <div>
          <label className="block text-sm font-medium">Name *</label>
          <div className="flex gap-2">
            <input
              value={editBrand.name}
              onChange={(e) => setEditBrand({ ...editBrand, name: e.target.value })}
              className="flex-1 border rounded p-2"
            />
            <select
              value=""
              onChange={(e) => {
                const selected = e.target.value;
                if (selected) {
                  setEditBrand({ ...editBrand, name: selected });
                }
              }}
              className="border rounded p-2 text-sm"
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

        <div>
          <label>Sort Order</label>
          <input
            type="number"
            value={editBrand.sort_order}
            onChange={(e) =>
              setEditBrand({ ...editBrand, sort_order: Number(e.target.value) })
            }
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label>Primary Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={editBrand.primary_color}
              onChange={(e) =>
                setEditBrand({ ...editBrand, primary_color: e.target.value })
              }
              className="h-10 w-10 p-1 border rounded"
            />
            <input
              type="text"
              value={editBrand.primary_color}
              onChange={(e) =>
                setEditBrand({ ...editBrand, primary_color: e.target.value })
              }
              className="flex-1 border rounded p-2"
            />
          </div>
        </div>

        <div>
          <label>Secondary Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={editBrand.secondary_color}
              onChange={(e) =>
                setEditBrand({ ...editBrand, secondary_color: e.target.value })
              }
              className="h-10 w-10 p-1 border rounded"
            />
            <input
              type="text"
              value={editBrand.secondary_color}
              onChange={(e) =>
                setEditBrand({ ...editBrand, secondary_color: e.target.value })
              }
              className="flex-1 border rounded p-2"
            />
          </div>
        </div>

        <div>
          <label>Logo</label>
          <div className="flex gap-2">
            <input
              value={editBrand.logo_url}
              onChange={(e) => {
                setEditBrand({ ...editBrand, logo_url: e.target.value });
                setLogoPreview(e.target.value);
              }}
              className="flex-1 border rounded p-2"
            />
            <label className="cursor-pointer bg-ink-100 p-2 rounded">
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
            <div className="mt-2">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="h-16 w-16 rounded object-cover"
              />
              {pendingLogoFile && (
                <span className="text-xs text-green-600 ml-2">Pending upload</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label>Product Image</label>
          <div className="flex gap-2">
            <input
              value={editBrand.product_images?.[0] || ''}
              onChange={(e) => {
                const imgs = [e.target.value];
                setEditBrand({ ...editBrand, product_images: imgs });
                setProductPreview(e.target.value);
              }}
              className="flex-1 border rounded p-2"
            />
            <label className="cursor-pointer bg-ink-100 p-2 rounded">
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
            <div className="mt-2">
              <img
                src={productPreview}
                alt="Product preview"
                className="h-16 w-16 rounded object-cover"
              />
              {pendingProductFile && (
                <span className="text-xs text-green-600 ml-2">Pending upload</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={editBrand.is_active}
              onChange={(e) =>
                setEditBrand({ ...editBrand, is_active: e.target.checked })
              }
            />{' '}
            Active
          </label>
        </div>

        {renderEditableFields(editBrand, setEditBrand)}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-brand-600 text-white rounded flex items-center gap-1"
          >
            <Save size={16} /> Save
          </button>
        </div>
      </div>

      {/* Preview in edit mode */}
      <div className="flex justify-center items-center bg-gray-50 rounded-xl p-4">
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
        />
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BrandsManager() {
  const [brands, setBrands] = useState<BrandWithColors[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [productBrands, setProductBrands] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
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

  // Upload progress state (for the overlay)
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

  // ----- Delete -----
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

  // ----- Save edit (called from BrandEditForm) -----
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

      // 1. Upload pending logo if exists
      if (logoFile) {
        const oldLogo = updatedBrand.logo_url;
        setUploadStatus('Compressing logo...');
        // Simulate compression progress (0-30%)
        for (let i = 0; i <= 6; i++) {
          const progress = Math.min(30, (i / 6) * 30);
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        const compressed = await compressImage(logoFile);
        setUploadStatus('Uploading logo...');
        setUploadProgress(30);
        const url = await uploadBrandImage(compressed, updatedBrand.id, 'logo_url', (p) => {
          const overall = 30 + (p * 0.7);
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading logo... ${Math.round(overall)}%`);
        });
        newLogoUrl = url;
        setUploadProgress(100);
        if (oldLogo && !oldLogo.includes('placeholder') && oldLogo !== url) {
          await deleteBrandImage(oldLogo);
        }
      }

      // 2. Upload pending product image if exists
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
          const overall = 30 + (p * 0.7);
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading product image... ${Math.round(overall)}%`);
        });
        newProductImage = url;
        setUploadProgress(100);
        if (oldProduct && !oldProduct.includes('placeholder') && oldProduct !== url) {
          await deleteBrandImage(oldProduct);
        }
      }

      // 3. Update the brand with new URLs
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

  // ----- Create brand (with pending uploads) -----
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

      // 1. Upload pending logo
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
          const overall = 30 + (p * 0.7);
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading logo... ${Math.round(overall)}%`);
        });
        newLogoUrl = url;
        setUploadProgress(100);
        setPendingLogoFile(null);
        setLogoPreview(null);
      }

      // 2. Upload pending product image
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
          const overall = 30 + (p * 0.7);
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading product image... ${Math.round(overall)}%`);
        });
        newProductImage = url;
        setUploadProgress(100);
        setPendingProductFile(null);
        setProductPreview(null);
      }

      // 3. Create the brand
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

  // Helper: render editable fields (shared between add form and edit form)
  const renderEditableFields = (
    brand: Partial<BrandWithColors>,
    setBrand: (b: any) => void
  ) => (
    <>
      <div>
        <label>Tagline (below name)</label>
        <input
          value={brand.tagline || ''}
          onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
          className="w-full border rounded p-2"
          placeholder="e.g. Goodness of Purity"
        />
      </div>
      <div>
        <label>Categories (comma separated, max 3)</label>
        <input
          value={(brand.categories || []).join(', ')}
          onChange={(e) => {
            const raw = e.target.value;
            const items = raw.split(/\s*,\s*/).filter(Boolean);
            setBrand({ ...brand, categories: items.slice(0, 3) });
          }}
          className="w-full border rounded p-2"
          placeholder="e.g. Dairy, Butter, Ice Cream"
        />
      </div>
      <div>
        <label>Bottom Label</label>
        <input
          value={brand.bottom_label || ''}
          onChange={(e) => setBrand({ ...brand, bottom_label: e.target.value })}
          className="w-full border rounded p-2"
          placeholder="e.g. Trusted by Generations"
        />
      </div>
      <div>
        <label>Bottom Icon</label>
        <select
          value={brand.bottom_icon || 'shield'}
          onChange={(e) =>
            setBrand({ ...brand, bottom_icon: e.target.value as any })
          }
          className="w-full border rounded p-2"
        >
          <option value="shield">Shield</option>
          <option value="crown">Crown</option>
          <option value="leaf">Leaf</option>
        </select>
      </div>
      <div>
        <label>Description</label>
        <textarea
          value={brand.description || ''}
          onChange={(e) => setBrand({ ...brand, description: e.target.value })}
          className="w-full border rounded p-2"
          rows={3}
          placeholder="Tell the story of this brand..."
        />
      </div>
    </>
  );

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  // Show upload progress overlay if uploading
  if (uploading) {
    return <UploadProgress progress={uploadProgress} statusText={uploadStatus} isComplete={uploadProgress >= 100} />;
  }

  return (
    <div className="space-y-6">
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))} />
        ))}
      </ToastContainer>

      {/* Add Brand Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="w-full h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add Brand
      </button>

      {/* ---- Add Form ---- */}
      {showAddForm && (
        <div className="bg-white border rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">New Brand</h3>
            <button onClick={() => setShowAddForm(false)} className="text-ink-400">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick import */}
            <div className="col-span-2">
              <label className="block font-medium text-sm text-ink-700 mb-1">
                Quick import from product brands
              </label>
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected) {
                      setNewBrand((prev) => ({ ...prev, name: selected }));
                    }
                  }}
                  className="flex-1 border rounded p-2"
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
                  className="px-3 py-2 bg-ink-100 rounded text-sm"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-ink-400 mt-1">
                Selecting a brand will fill the <strong>Name</strong> field below.
              </p>
            </div>

            {/* Name */}
            <div>
              <label>Name *</label>
              <input
                value={newBrand.name}
                onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label>Sort Order</label>
              <input
                type="number"
                value={newBrand.sort_order}
                onChange={(e) =>
                  setNewBrand({ ...newBrand, sort_order: Number(e.target.value) })
                }
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label>Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newBrand.primary_color}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, primary_color: e.target.value })
                  }
                  className="h-10 w-10 p-1 border rounded"
                />
                <input
                  type="text"
                  value={newBrand.primary_color}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, primary_color: e.target.value })
                  }
                  className="flex-1 border rounded p-2"
                />
              </div>
            </div>

            <div>
              <label>Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newBrand.secondary_color}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, secondary_color: e.target.value })
                  }
                  className="h-10 w-10 p-1 border rounded"
                />
                <input
                  type="text"
                  value={newBrand.secondary_color}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, secondary_color: e.target.value })
                  }
                  className="flex-1 border rounded p-2"
                />
              </div>
            </div>

            <div>
              <label>Logo</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newBrand.logo_url}
                  onChange={(e) => {
                    setNewBrand({ ...newBrand, logo_url: e.target.value });
                    setLogoPreview(e.target.value);
                  }}
                  className="flex-1 border rounded p-2"
                />
                <label className="cursor-pointer bg-ink-100 p-2 rounded">
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
                <div className="mt-2">
                  <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded object-cover" />
                  {pendingLogoFile && <span className="text-xs text-green-600 ml-2">Pending upload</span>}
                </div>
              )}
            </div>

            <div>
              <label>Product Image</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newBrand.product_images?.[0] || ''}
                  onChange={(e) => {
                    const imgs = [e.target.value];
                    setNewBrand({ ...newBrand, product_images: imgs });
                    setProductPreview(e.target.value);
                  }}
                  className="flex-1 border rounded p-2"
                />
                <label className="cursor-pointer bg-ink-100 p-2 rounded">
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
                <div className="mt-2">
                  <img src={productPreview} alt="Product preview" className="h-16 w-16 rounded object-cover" />
                  {pendingProductFile && <span className="text-xs text-green-600 ml-2">Pending upload</span>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={newBrand.is_active}
                  onChange={(e) =>
                    setNewBrand({ ...newBrand, is_active: e.target.checked })
                  }
                />{' '}
                Active
              </label>
            </div>

            {renderEditableFields(newBrand, setNewBrand)}

            <div className="flex justify-end gap-2 col-span-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-brand-600 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 flex justify-center">
            <BrandCard
              brandName={newBrand.name || 'Preview'}
              primaryColor={newBrand.primary_color || '#3B82F6'}
              secondaryColor={newBrand.secondary_color || '#1E40AF'}
              logoUrl={logoPreview || newBrand.logo_url || 'https://via.placeholder.com/100'}
              productImage={productPreview || newBrand.product_images?.[0] || 'https://via.placeholder.com/120/CCCCCC/999999?text=Product'}
              tagline={newBrand.tagline}
              categories={newBrand.categories}
              bottomLabel={newBrand.bottom_label}
              bottomIcon={newBrand.bottom_icon}
            />
          </div>
        </div>
      )}

      {/* ---- List of existing brands ---- */}
      <div className="space-y-4">
        {brands.map((brand) => {
          const isEditing = editingId === brand.id;
          return (
            <div
              key={brand.id}
              className="bg-white border rounded-2xl p-4 shadow-card"
            >
              {isEditing ? (
                // ---- EDIT MODE (uses separate BrandEditForm) ----
                <BrandEditForm
                  brand={brand}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                  productBrands={productBrands}
                />
              ) : (
                // ---- VIEW MODE ----
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{brand.name}</h3>
                    <p className="text-sm text-ink-500">
                      Order: {brand.sort_order}
                    </p>
                    <p className="text-sm">
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </p>
                    {brand.description && (
                      <p className="text-sm text-ink-600 mt-1 line-clamp-2">
                        {brand.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setEditingId(brand.id)}
                        className="px-3 py-1 bg-brand-50 text-brand-600 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(brand.id)}
                        className="px-3 py-1 bg-red-50 text-red-500 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <BrandCard
                      brandName={brand.name}
                      primaryColor={brand.primary_color}
                      secondaryColor={brand.secondary_color}
                      logoUrl={brand.logo_url}
                      productImage={brand.product_images?.[0] || 'https://via.placeholder.com/120/CCCCCC/999999?text=Product'}
                      tagline={brand.tagline}
                      categories={brand.categories}
                      bottomLabel={brand.bottom_label}
                      bottomIcon={brand.bottom_icon}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, brandId: undefined, title: '', message: '' })}
      />
    </div>
  );
}