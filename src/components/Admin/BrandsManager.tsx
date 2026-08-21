import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import { BrandCard } from '@/components/BrandCard';
import {
  fetchAllTrustedBrands,
  createTrustedBrand,
  updateTrustedBrand,
  deleteTrustedBrand,
  uploadBrandImage,
} from '@/services/catalog';
import type { TrustedBrand } from '@/types';

interface BrandWithColors extends TrustedBrand {
  primary_color: string;
  secondary_color: string;
  product_images: string[];
}

export default function BrandsManager() {
  const [brands, setBrands] = useState<BrandWithColors[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewBrandId, setPreviewBrandId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newBrand, setNewBrand] = useState<Partial<BrandWithColors>>({
    name: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    product_images: [''],
    sort_order: 0,
    is_active: true,
  });

  const loadBrands = async () => {
    const data = await fetchAllTrustedBrands();
    setBrands(data as BrandWithColors[]);
    setLoading(false);
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this brand?')) {
      await deleteTrustedBrand(id);
      await loadBrands();
    }
  };

  const handleSaveEdit = async (brand: BrandWithColors) => {
    await updateTrustedBrand(brand.id, {
      name: brand.name,
      logo_url: brand.logo_url,
      sort_order: brand.sort_order,
      is_active: brand.is_active,
      primary_color: brand.primary_color,
      secondary_color: brand.secondary_color,
      product_images: brand.product_images,
    });
    setEditingId(null);
    await loadBrands();
  };

  const handleCreate = async () => {
    if (!newBrand.name || !newBrand.logo_url) return;
    await createTrustedBrand({
      name: newBrand.name,
      logo_url: newBrand.logo_url,
      sort_order: newBrand.sort_order || 0,
      is_active: newBrand.is_active ?? true,
      primary_color: newBrand.primary_color || '#3B82F6',
      secondary_color: newBrand.secondary_color || '#1E40AF',
      product_images: newBrand.product_images || [''],
    });
    setNewBrand({
      name: '',
      logo_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      product_images: [''],
      sort_order: 0,
      is_active: true,
    });
    setShowAddForm(false);
    await loadBrands();
  };

  const handleImageUpload = async (
    file: File,
    brandId: string | null,
    field: 'logo_url' | 'product_images',
    index?: number
  ) => {
    const url = await uploadBrandImage(file, brandId, field);
    if (brandId) {
      const brand = brands.find(b => b.id === brandId);
      if (!brand) return;
      if (field === 'logo_url') {
        brand.logo_url = url;
      } else if (field === 'product_images' && index !== undefined) {
        brand.product_images[index] = url;
      }
      setBrands([...brands]);
    } else {
      if (field === 'logo_url') {
        setNewBrand({ ...newBrand, logo_url: url });
      } else if (field === 'product_images' && index !== undefined) {
        const newImages = [...(newBrand.product_images || [''])];
        newImages[index] = url;
        setNewBrand({ ...newBrand, product_images: newImages });
      }
    }
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-6">
      <button
        onClick={() => setShowAddForm(true)}
        className="w-full h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add Brand
      </button>

      {showAddForm && (
        <div className="bg-white border rounded-2xl p-4 shadow-card">
          <h3 className="font-bold mb-3">New Brand</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label>Name *</label>
              <input
                value={newBrand.name}
                onChange={e => setNewBrand({ ...newBrand, name: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label>Sort Order</label>
              <input
                type="number"
                value={newBrand.sort_order}
                onChange={e => setNewBrand({ ...newBrand, sort_order: Number(e.target.value) })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label>Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newBrand.primary_color}
                  onChange={e => setNewBrand({ ...newBrand, primary_color: e.target.value })}
                  className="h-10 w-10 p-1 border rounded"
                />
                <input
                  type="text"
                  value={newBrand.primary_color}
                  onChange={e => setNewBrand({ ...newBrand, primary_color: e.target.value })}
                  className="flex-1 border rounded p-2"
                  placeholder="#HEX"
                />
              </div>
            </div>
            <div>
              <label>Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newBrand.secondary_color}
                  onChange={e => setNewBrand({ ...newBrand, secondary_color: e.target.value })}
                  className="h-10 w-10 p-1 border rounded"
                />
                <input
                  type="text"
                  value={newBrand.secondary_color}
                  onChange={e => setNewBrand({ ...newBrand, secondary_color: e.target.value })}
                  className="flex-1 border rounded p-2"
                  placeholder="#HEX"
                />
              </div>
            </div>
            <div>
              <label>Logo</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newBrand.logo_url}
                  onChange={e => setNewBrand({ ...newBrand, logo_url: e.target.value })}
                  className="flex-1 border rounded p-2"
                  placeholder="URL"
                />
                <label className="cursor-pointer bg-ink-100 p-2 rounded">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleImageUpload(file, null, 'logo_url');
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label>Product Image</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newBrand.product_images?.[0] || ''}
                  onChange={e => {
                    const imgs = [e.target.value];
                    setNewBrand({ ...newBrand, product_images: imgs });
                  }}
                  className="flex-1 border rounded p-2"
                  placeholder="URL"
                />
                <label className="cursor-pointer bg-ink-100 p-2 rounded">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleImageUpload(file, null, 'product_images', 0);
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={newBrand.is_active}
                  onChange={e => setNewBrand({ ...newBrand, is_active: e.target.checked })}
                /> Active
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-brand-600 text-white rounded">Create</button>
            </div>
          </div>
          {/* Preview always visible in add form */}
          <div className="mt-4 flex justify-center">
            <BrandCard
              brandName={newBrand.name || 'Preview'}
              primaryColor={newBrand.primary_color || '#3B82F6'}
              secondaryColor={newBrand.secondary_color || '#1E40AF'}
              logoUrl={newBrand.logo_url || 'https://via.placeholder.com/100'}
              productImage={newBrand.product_images?.[0] || 'https://via.placeholder.com/120/CCCCCC/999999?text=Product'}
            />
          </div>
        </div>
      )}

      {/* List of existing brands */}
      <div className="space-y-4">
        {brands.map((brand) => {
          const isEditing = editingId === brand.id;
          return (
            <div key={brand.id} className="bg-white border rounded-2xl p-4 shadow-card">
              {isEditing ? (
                // ---- EDIT MODE (preview always visible) ----
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label>Name</label>
                      <input
                        value={brand.name}
                        onChange={e => {
                          const updated = { ...brand, name: e.target.value };
                          setBrands(brands.map(b => b.id === brand.id ? updated : b));
                        }}
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div>
                      <label>Sort Order</label>
                      <input
                        type="number"
                        value={brand.sort_order}
                        onChange={e => {
                          const updated = { ...brand, sort_order: Number(e.target.value) };
                          setBrands(brands.map(b => b.id === brand.id ? updated : b));
                        }}
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div>
                      <label>Primary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={brand.primary_color}
                          onChange={e => {
                            const updated = { ...brand, primary_color: e.target.value };
                            setBrands(brands.map(b => b.id === brand.id ? updated : b));
                          }}
                          className="h-10 w-10 p-1 border rounded"
                        />
                        <input
                          type="text"
                          value={brand.primary_color}
                          onChange={e => {
                            const updated = { ...brand, primary_color: e.target.value };
                            setBrands(brands.map(b => b.id === brand.id ? updated : b));
                          }}
                          className="flex-1 border rounded p-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label>Secondary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={brand.secondary_color}
                          onChange={e => {
                            const updated = { ...brand, secondary_color: e.target.value };
                            setBrands(brands.map(b => b.id === brand.id ? updated : b));
                          }}
                          className="h-10 w-10 p-1 border rounded"
                        />
                        <input
                          type="text"
                          value={brand.secondary_color}
                          onChange={e => {
                            const updated = { ...brand, secondary_color: e.target.value };
                            setBrands(brands.map(b => b.id === brand.id ? updated : b));
                          }}
                          className="flex-1 border rounded p-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label>Logo</label>
                      <div className="flex gap-2">
                        <input
                          value={brand.logo_url}
                          onChange={e => {
                            const updated = { ...brand, logo_url: e.target.value };
                            setBrands(brands.map(b => b.id === brand.id ? updated : b));
                          }}
                          className="flex-1 border rounded p-2"
                        />
                        <label className="cursor-pointer bg-ink-100 p-2 rounded">
                          <Upload size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) await handleImageUpload(file, brand.id, 'logo_url');
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label>Product Image</label>
                      <div className="flex gap-2">
                        <input
                          value={brand.product_images?.[0] || ''}
                          onChange={e => {
                            const imgs = [e.target.value];
                            const updated = { ...brand, product_images: imgs };
                            setBrands(brands.map(b => b.id === brand.id ? updated : b));
                          }}
                          className="flex-1 border rounded p-2"
                        />
                        <label className="cursor-pointer bg-ink-100 p-2 rounded">
                          <Upload size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) await handleImageUpload(file, brand.id, 'product_images', 0);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={brand.is_active}
                          onChange={e => {
                            const updated = { ...brand, is_active: e.target.checked };
                            setBrands(brands.map(b => b.id === brand.id ? updated : b));
                          }}
                        /> Active
                      </label>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 border rounded">Cancel</button>
                      <button onClick={() => handleSaveEdit(brand)} className="px-4 py-2 bg-brand-600 text-white rounded flex items-center gap-1">
                        <Save size={16} /> Save
                      </button>
                    </div>
                  </div>
                  {/* Preview in edit mode – always visible */}
                  <div className="flex justify-center items-center bg-gray-50 rounded-xl p-4">
                    <BrandCard
                      brandName={brand.name}
                      primaryColor={brand.primary_color}
                      secondaryColor={brand.secondary_color}
                      logoUrl={brand.logo_url}
                      productImage={brand.product_images?.[0] || 'https://via.placeholder.com/120/CCCCCC/999999?text=Product'}
                    />
                  </div>
                </div>
              ) : (
                // ---- VIEW MODE (preview only when eye clicked, no placeholder) ----
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  {previewBrandId === brand.id && (
                    <BrandCard
                      brandName={brand.name}
                      primaryColor={brand.primary_color}
                      secondaryColor={brand.secondary_color}
                      logoUrl={brand.logo_url}
                      productImage={brand.product_images?.[0] || 'https://via.placeholder.com/120/CCCCCC/999999?text=Product'}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{brand.name}</h3>
                    <p className="text-sm text-ink-500">Order: {brand.sort_order}</p>
                    <p className="text-sm">{brand.is_active ? 'Active' : 'Inactive'}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setPreviewBrandId(prev => prev === brand.id ? null : brand.id)}
                        className="px-3 py-1 bg-gray-100 rounded flex items-center gap-1"
                      >
                        {previewBrandId === brand.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        {previewBrandId === brand.id ? 'Hide' : 'Preview'}
                      </button>
                      <button onClick={() => setEditingId(brand.id)} className="px-3 py-1 bg-brand-50 text-brand-600 rounded">Edit</button>
                      <button onClick={() => handleDelete(brand.id)} className="px-3 py-1 bg-red-50 text-red-500 rounded">Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}