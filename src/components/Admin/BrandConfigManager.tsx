// components/Admin/BrandConfigManager.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { TrustedBrand } from '@/types';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Upload, X, Search, Loader2 } from 'lucide-react';
import { uploadBrandIconImage, updateTrustedBrand, deleteBrandImage } from '@/services/catalog';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { UploadProgress } from '@/components/ui/UploadProgress';
import { compressImage } from '@/lib/imageUtils';

const ICON_OPTIONS = [
  'Apple', 'Wheat', 'Flame', 'Coffee', 'Cookie', 'Milk', 'Croissant',
  'Fish', 'SprayCan', 'ChefHat', 'Package', 'TrendingUp', 'ShieldCheck',
  'Truck', 'Star', 'Leaf', 'Salad', 'Sun', 'Soup', 'Bean', 'Carrot',
  'Cherry', 'CookingPot', 'Drumstick', 'Droplet', 'Egg', 'Gift',
  'GlassWater', 'IceCreamCone', 'Plane', 'Popcorn', 'Shell', 'Sprout',
  'Utensils', 'Beef'
];

function ColorInput({ value, onChange, label }: { value: string; onChange: (val: string) => void; label: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 rounded-xl border border-gray-300 p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-10 rounded-xl border border-gray-300 px-3 text-sm font-mono outline-none focus:border-green-500"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BrandConfigManager() {
  const [brands, setBrands] = useState<TrustedBrand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('trusted_brands').select('*').order('name');
      if (error) {
        addToast('Failed to load brands', 'error');
        console.error(error);
      } else setBrands(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-4">Loading brands...</div>;

  return (
    <div className="space-y-6">
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))} />
        ))}
      </ToastContainer>

      <h2 className="text-xl font-bold">Brand Content Editor</h2>
      <div className="flex flex-wrap gap-2">
        {brands.map(brand => (
          <button
            key={brand.id}
            onClick={() => setSelectedBrandId(brand.id)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
              selectedBrandId === brand.id
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {brand.name}
          </button>
        ))}
      </div>
      {selectedBrandId && (
        <div className="mt-4">
          <BrandConfigEditor brandId={selectedBrandId} addToast={addToast} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// EDITOR WITH DRAFT & SAVE
// ============================================================
function BrandConfigEditor({ brandId, addToast }: { brandId: string; addToast: (msg: string, type: any) => void }) {
  const [brand, setBrand] = useState<TrustedBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'highlights' | 'categories' | 'bulkDeal' | 'trending'>('highlights');

  const [draft, setDraft] = useState<any>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showUploadProgress, setShowUploadProgress] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('trusted_brands')
        .select('*')
        .eq('id', brandId)
        .single();
      if (error) {
        console.error(error);
        addToast('Failed to load brand', 'error');
      } else {
        setBrand(data);
        const config = data.config || {};
        setDraft({
          highlights: config.highlights || [],
          categories: config.categories || [],
          bulkDeal: config.bulkDeal || { enabled: false, tag: '', title: '', subtitle: '', cta: '', icon: 'Package', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
          trending: config.trending || { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
        });
        setPendingFiles({});
      }
      setLoading(false);
    })();
  }, [brandId]);

  const updateDraftSection = (section: string, value: any) => {
    setDraft((prev: any) => ({ ...prev, [section]: value }));
  };

  const setPendingFile = (fieldPath: string, file: File) => {
    setPendingFiles((prev) => ({ ...prev, [fieldPath]: file }));
  };

  const clearPendingFile = (fieldPath: string) => {
    setPendingFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[fieldPath];
      return newFiles;
    });
  };

  const deleteOrphanedImages = async (original: any, updated: any) => {
    if (!original || !updated) return;

    const checkAndDelete = (orig: any, upd: any) => {
      if (typeof orig === 'string' && orig.includes('/storage/v1/object/public/brands/')) {
        const urlExists = (obj: any): boolean => {
          if (obj === orig) return true;
          if (typeof obj === 'object' && obj !== null) {
            for (const k of Object.keys(obj)) {
              if (urlExists(obj[k])) return true;
            }
          }
          if (Array.isArray(obj)) {
            for (const item of obj) {
              if (urlExists(item)) return true;
            }
          }
          return false;
        };
        if (!urlExists(upd)) {
          deleteBrandImage(orig).catch(console.error);
        }
      }
      if (typeof orig === 'object' && orig !== null && typeof upd === 'object' && upd !== null) {
        const keys = new Set([...Object.keys(orig), ...Object.keys(upd)]);
        for (const key of keys) {
          checkAndDelete(orig[key], upd[key]);
        }
      }
    };
    checkAndDelete(original, updated);
  };

  const handleSave = async () => {
    if (!draft || !brand) return;
    setSaving(true);
    setShowUploadProgress(true);
    setUploadProgress(0);
    setUploadStatus('Preparing to save...');

    try {
      const finalDraft = JSON.parse(JSON.stringify(draft));
      const originalConfig = brand.config || {};
      await deleteOrphanedImages(originalConfig, finalDraft);

      // Highlights icons
      for (let i = 0; i < finalDraft.highlights.length; i++) {
        const key = `highlights.${i}.icon`;
        if (pendingFiles[key]) {
          const file = pendingFiles[key];
          const oldUrl = draft.highlights[i]?.icon;
          setUploadStatus(`Uploading highlight icon ${i+1}...`);
          const compressed = await compressImage(file);
          const url = await uploadBrandIconImage(brandId, compressed, 'brand-highlights', (p) => {
            const overall = 30 + (p * 0.7);
            setUploadProgress(Math.min(100, overall));
            setUploadStatus(`Uploading icon ${i+1}... ${Math.round(overall)}%`);
          });
          finalDraft.highlights[i].icon = url;
          if (oldUrl && oldUrl !== url) {
            await deleteBrandImage(oldUrl);
          }
        }
      }

      // Categories icons
      for (let i = 0; i < finalDraft.categories.length; i++) {
        const key = `categories.${i}.icon`;
        if (pendingFiles[key]) {
          const file = pendingFiles[key];
          const oldUrl = draft.categories[i]?.icon;
          setUploadStatus(`Uploading category icon ${i+1}...`);
          const compressed = await compressImage(file);
          const url = await uploadBrandIconImage(brandId, compressed, 'brand-categories', (p) => {
            const overall = 30 + (p * 0.7);
            setUploadProgress(Math.min(100, overall));
            setUploadStatus(`Uploading icon ${i+1}... ${Math.round(overall)}%`);
          });
          finalDraft.categories[i].icon = url;
          if (oldUrl && oldUrl !== url) {
            await deleteBrandImage(oldUrl);
          }
        }
      }

      // Trending icon buttons
      for (let i = 0; i < finalDraft.trending.iconButtons.length; i++) {
        const key = `trending.iconButtons.${i}.icon`;
        if (pendingFiles[key]) {
          const file = pendingFiles[key];
          const oldUrl = draft.trending.iconButtons[i]?.icon;
          setUploadStatus(`Uploading trending icon ${i+1}...`);
          const compressed = await compressImage(file);
          const url = await uploadBrandIconImage(brandId, compressed, 'brand-trending', (p) => {
            const overall = 30 + (p * 0.7);
            setUploadProgress(Math.min(100, overall));
            setUploadStatus(`Uploading icon ${i+1}... ${Math.round(overall)}%`);
          });
          finalDraft.trending.iconButtons[i].icon = url;
          if (oldUrl && oldUrl !== url) {
            await deleteBrandImage(oldUrl);
          }
        }
      }

      await updateTrustedBrand(brandId, { config: finalDraft });
      setBrand({ ...brand, config: finalDraft });
      addToast('Brand content saved successfully!', 'success');
      setPendingFiles({});
      setUploadProgress(100);
      setUploadStatus('Save complete!');
      setTimeout(() => setShowUploadProgress(false), 1000);
    } catch (err) {
      console.error(err);
      addToast('Failed to save. Check console.', 'error');
    } finally {
      setSaving(false);
      setShowUploadProgress(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  if (loading || !brand) return <div>Loading...</div>;

  if (showUploadProgress) {
    return <UploadProgress progress={uploadProgress} statusText={uploadStatus} isComplete={uploadProgress >= 100} />;
  }

  const config = brand.config || {};
  const safeConfig = {
    highlights: config.highlights || [],
    categories: config.categories || [],
    bulkDeal: config.bulkDeal || { enabled: false, tag: '', title: '', subtitle: '', cta: '', icon: 'Package', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
    trending: config.trending || { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Edit Brand Content</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition disabled:opacity-60"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2 mb-4 overflow-x-auto">
        {['highlights', 'categories', 'bulkDeal', 'trending'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              activeTab === tab ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab === 'highlights' ? 'What\'s in Brand' :
             tab === 'categories' ? 'Categories' :
             tab === 'bulkDeal' ? 'Bulk Deal Banner' :
             'Trending Banner'}
          </button>
        ))}
      </div>

      {activeTab === 'highlights' && (
        <HighlightsEditor
          draft={draft}
          setDraft={updateDraftSection}
          setPendingFile={setPendingFile}
          clearPendingFile={clearPendingFile}
          pendingFiles={pendingFiles}
        />
      )}
      {activeTab === 'categories' && (
        <CategoriesEditor
          draft={draft}
          setDraft={updateDraftSection}
          setPendingFile={setPendingFile}
          clearPendingFile={clearPendingFile}
          pendingFiles={pendingFiles}
          brandName={brand.name}
        />
      )}
      {activeTab === 'bulkDeal' && (
        <BulkDealEditor draft={draft} setDraft={updateDraftSection} />
      )}
      {activeTab === 'trending' && (
        <TrendingEditor
          draft={draft}
          setDraft={updateDraftSection}
          setPendingFile={setPendingFile}
          clearPendingFile={clearPendingFile}
          pendingFiles={pendingFiles}
        />
      )}
    </div>
  );
}

// ============================================================
// HIGHLIGHTS EDITOR (draft)
// ============================================================
function HighlightsEditor({ draft, setDraft, setPendingFile, clearPendingFile, pendingFiles }: {
  draft: any;
  setDraft: (section: string, value: any) => void;
  setPendingFile: (path: string, file: File) => void;
  clearPendingFile: (path: string) => void;
  pendingFiles: Record<string, File>;
}) {
  const { highlights = [], categories = [] } = draft;
  const categoryOptions = categories.map((c: any) => ({ value: c.id, label: c.title }));

  const updateHighlights = (newItems: any[]) => setDraft('highlights', newItems);

  const addItem = () => {
    const newItem = { id: Date.now().toString(), label: 'New Highlight', icon: 'Package', categoryId: categoryOptions.length > 0 ? categoryOptions[0].value : '' };
    updateHighlights([...highlights, newItem]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...highlights];
    updated[index] = { ...updated[index], [field]: value };
    updateHighlights(updated);
  };

  const removeItem = (index: number) => updateHighlights(highlights.filter((_, i) => i !== index));
  const moveItem = (index: number, dir: 'up' | 'down') => {
    const newItems = [...highlights];
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= highlights.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    updateHighlights(newItems);
  };

  const handleIconSelect = (index: number, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const updated = [...highlights];
    updated[index] = { ...updated[index], icon: objectUrl };
    updateHighlights(updated);
    setPendingFile(`highlights.${index}.icon`, file);
  };

  const handleIconOptionChange = (index: number, value: string) => {
    if (value === '__custom') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleIconSelect(index, file);
      };
      input.click();
      return;
    }
    clearPendingFile(`highlights.${index}.icon`);
    updateItem(index, 'icon', value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">What's in this Brand</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Enabled</label>
          <input type="checkbox" checked={highlights.enabled !== false} onChange={e => updateHighlights({ ...highlights, enabled: e.target.checked })} className="accent-green-600" />
        </div>
      </div>

      {highlights.map((h: any, idx: number) => (
        <div key={h.id} className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 mb-2">
          <input value={h.label} onChange={e => updateItem(idx, 'label', e.target.value)} placeholder="Label" className="flex-1 min-w-[100px] rounded-lg border border-gray-200 px-2 py-1 text-sm" />

          <div className="flex items-center gap-1">
            <select value={h.icon || 'Package'} onChange={e => handleIconOptionChange(idx, e.target.value)} className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-sm">
              {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              <option value="__custom">Custom (upload)</option>
            </select>
            {h.icon?.startsWith('http') && (
              <img src={h.icon} alt="custom" className="w-6 h-6 rounded object-cover" />
            )}
            {pendingFiles[`highlights.${idx}.icon`] && (
              <span className="text-xs text-green-600">Pending</span>
            )}
          </div>

          <select value={h.categoryId || ''} onChange={e => updateItem(idx, 'categoryId', e.target.value)} className="flex-1 min-w-[140px] rounded-lg border border-gray-200 px-2 py-1 text-sm">
            <option value="">Select Category</option>
            {categoryOptions.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <div className="flex gap-1">
            <button onClick={() => moveItem(idx, 'up')}><ChevronUp size={16} /></button>
            <button onClick={() => moveItem(idx, 'down')}><ChevronDown size={16} /></button>
            <button onClick={() => removeItem(idx)} className="text-red-400"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="flex items-center gap-1 text-sm text-green-600"><Plus size={16} /> Add Highlight</button>
    </div>
  );
}

// ============================================================
// CATEGORIES EDITOR (draft + brand filter)
// ============================================================
function CategoriesEditor({ draft, setDraft, setPendingFile, clearPendingFile, pendingFiles, brandName }: {
  draft: any;
  setDraft: (section: string, value: any) => void;
  setPendingFile: (path: string, file: File) => void;
  clearPendingFile: (path: string) => void;
  pendingFiles: Record<string, File>;
  brandName: string;
}) {
  const { categories = [] } = draft;
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; brand: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const query = supabase
        .from('products')
        .select('id, name, brand')
        .eq('is_active', true)
        .eq('brand', brandName)
        .order('name');
      const { data, error } = await query;
      if (!error && data) setAllProducts(data);
      else console.error('Failed to fetch products for brand:', error);
    })();
  }, [brandName]);

  const updateCategories = (newItems: any[]) => setDraft('categories', newItems);

  const addItem = () => {
    const newItem = { id: Date.now().toString(), title: 'New Category', icon: 'Package', description: 'Category description', productIds: [], color: '#10b981', textColor: '#ffffff' };
    updateCategories([...categories, newItem]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    updateCategories(updated);
  };

  const removeItem = (index: number) => updateCategories(categories.filter((_, i) => i !== index));
  const moveItem = (index: number, dir: 'up' | 'down') => {
    const newItems = [...categories];
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= categories.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    updateCategories(newItems);
  };

  const toggleProductSelection = (productId: string, categoryIndex: number) => {
    const cat = categories[categoryIndex];
    const current = cat.productIds || [];
    const updated = current.includes(productId) ? current.filter((id: string) => id !== productId) : [...current, productId];
    updateItem(categoryIndex, 'productIds', updated);
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleIconSelect = (index: number, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const updated = [...categories];
    updated[index] = { ...updated[index], icon: objectUrl };
    updateCategories(updated);
    setPendingFile(`categories.${index}.icon`, file);
  };

  const handleIconOptionChange = (index: number, value: string) => {
    if (value === '__custom') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleIconSelect(index, file);
      };
      input.click();
      return;
    }
    clearPendingFile(`categories.${index}.icon`);
    updateItem(index, 'icon', value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">Categories</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Enabled</label>
          <input type="checkbox" checked={categories.enabled !== false} onChange={e => updateCategories({ ...categories, enabled: e.target.checked })} className="accent-green-600" />
        </div>
        <span className="text-xs text-gray-500">Showing products for brand: <strong>{brandName}</strong></span>
      </div>

      {categories.map((c: any, idx: number) => (
        <div key={c.id} className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 mb-2">
          <input value={c.title} onChange={e => updateItem(idx, 'title', e.target.value)} placeholder="Title" className="flex-1 min-w-[100px] rounded-lg border border-gray-200 px-2 py-1 text-sm" />

          <div className="flex items-center gap-1">
            <select value={c.icon || 'Package'} onChange={e => handleIconOptionChange(idx, e.target.value)} className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-sm">
              {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              <option value="__custom">Custom (upload)</option>
            </select>
            {c.icon?.startsWith('http') && (
              <img src={c.icon} alt="custom" className="w-6 h-6 rounded object-cover" />
            )}
            {pendingFiles[`categories.${idx}.icon`] && (
              <span className="text-xs text-green-600">Pending</span>
            )}
          </div>

          <input value={c.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Description" className="flex-1 min-w-[120px] rounded-lg border border-gray-200 px-2 py-1 text-sm" />

          <div className="flex items-center gap-1">
            <ColorInput value={c.color || '#10b981'} onChange={(val) => updateItem(idx, 'color', val)} label="" />
            <ColorInput value={c.textColor || '#ffffff'} onChange={(val) => updateItem(idx, 'textColor', val)} label="" />
          </div>

          <button
            onClick={() => { setEditingCategoryIndex(idx); setShowProductPicker(true); }}
            className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700 border border-gray-200 whitespace-nowrap"
          >
            {c.productIds?.length || 0} products
          </button>

          <div className="flex gap-1">
            <button onClick={() => moveItem(idx, 'up')}><ChevronUp size={16} /></button>
            <button onClick={() => moveItem(idx, 'down')}><ChevronDown size={16} /></button>
            <button onClick={() => removeItem(idx)} className="text-red-400"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}

      <button onClick={addItem} className="flex items-center gap-1 text-sm text-green-600"><Plus size={16} /> Add Category</button>

      {showProductPicker && editingCategoryIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold text-sm">Select Products</h4>
              <button onClick={() => setShowProductPicker(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="p-4 flex-1 overflow-hidden">
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1">
                {filteredProducts.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No products found for this brand. 
                    {brandName && ` Products must have brand = "${brandName}"`}
                  </p>
                )}
                {filteredProducts.map(p => {
                  const isSelected = categories[editingCategoryIndex]?.productIds?.includes(p.id) || false;
                  return (
                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleProductSelection(p.id, editingCategoryIndex)} className="accent-green-600" />
                      <span className="text-sm">{p.name} <span className="text-gray-400 text-xs">({p.brand})</span></span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button onClick={() => setShowProductPicker(false)} className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// BULK DEAL EDITOR
// ============================================================
function BulkDealEditor({ draft, setDraft }: { draft: any; setDraft: (section: string, value: any) => void }) {
  const { bulkDeal } = draft;

  const updateBulkDeal = (field: string, value: any) => {
    setDraft('bulkDeal', { ...bulkDeal, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">Bulk Deal Banner</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Enabled</label>
          <input type="checkbox" checked={bulkDeal.enabled} onChange={e => updateBulkDeal('enabled', e.target.checked)} className="accent-green-600" />
        </div>
      </div>

      <div><label className="block text-sm font-medium text-gray-700">Tag</label><input value={bulkDeal.tag} onChange={e => updateBulkDeal('tag', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="block text-sm font-medium text-gray-700">Title</label><input value={bulkDeal.title} onChange={e => updateBulkDeal('title', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="block text-sm font-medium text-gray-700">Subtitle</label><input value={bulkDeal.subtitle} onChange={e => updateBulkDeal('subtitle', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="block text-sm font-medium text-gray-700">CTA Text</label><input value={bulkDeal.cta} onChange={e => updateBulkDeal('cta', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="block text-sm font-medium text-gray-700">Icon</label><select value={bulkDeal.icon || 'Package'} onChange={e => updateBulkDeal('icon', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">{ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ColorInput value={bulkDeal.ctaBgColor || '#ffffff'} onChange={(val) => updateBulkDeal('ctaBgColor', val)} label="CTA Background" />
        <ColorInput value={bulkDeal.ctaTextColor || '#065f46'} onChange={(val) => updateBulkDeal('ctaTextColor', val)} label="CTA Text Color" />
      </div>
    </div>
  );
}

// ============================================================
// TRENDING EDITOR
// ============================================================
function TrendingEditor({ draft, setDraft, setPendingFile, clearPendingFile, pendingFiles }: {
  draft: any;
  setDraft: (section: string, value: any) => void;
  setPendingFile: (path: string, file: File) => void;
  clearPendingFile: (path: string) => void;
  pendingFiles: Record<string, File>;
}) {
  const { trending = { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' }, categories = [] } = draft;
  const categoryOptions = categories.map((c: any) => ({ value: c.id, label: c.title }));

  const updateTrending = (field: string, value: any) => {
    setDraft('trending', { ...trending, [field]: value });
  };

  const updateIconButtons = (newItems: any[]) => {
    setDraft('trending', { ...trending, iconButtons: newItems });
  };

  const addIconButton = () => {
    const newItem = { id: Date.now().toString(), label: 'New Category', icon: 'Package', categoryId: categoryOptions.length > 0 ? categoryOptions[0].value : '' };
    updateIconButtons([...trending.iconButtons, newItem]);
  };

  const updateIconButton = (index: number, field: string, value: any) => {
    const updated = [...trending.iconButtons];
    updated[index] = { ...updated[index], [field]: value };
    updateIconButtons(updated);
  };

  const removeIconButton = (index: number) => updateIconButtons(trending.iconButtons.filter((_, i) => i !== index));
  const moveIconButton = (index: number, dir: 'up' | 'down') => {
    const newItems = [...trending.iconButtons];
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= trending.iconButtons.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    updateIconButtons(newItems);
  };

  const handleIconSelect = (index: number, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const updated = [...trending.iconButtons];
    updated[index] = { ...updated[index], icon: objectUrl };
    updateIconButtons(updated);
    setPendingFile(`trending.iconButtons.${index}.icon`, file);
  };

  const handleIconOptionChange = (index: number, value: string) => {
    if (value === '__custom') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleIconSelect(index, file);
      };
      input.click();
      return;
    }
    clearPendingFile(`trending.iconButtons.${index}.icon`);
    updateIconButton(index, 'icon', value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">Trending Banner</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Enabled</label>
          <input type="checkbox" checked={trending.enabled} onChange={e => updateTrending('enabled', e.target.checked)} className="accent-green-600" />
        </div>
      </div>

      <div><label className="block text-sm font-medium text-gray-700">Title</label><input value={trending.title} onChange={e => updateTrending('title', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="block text-sm font-medium text-gray-700">Subtitle</label><input value={trending.subtitle} onChange={e => updateTrending('subtitle', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="block text-sm font-medium text-gray-700">CTA Text</label><input value={trending.ctaText} onChange={e => updateTrending('ctaText', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ColorInput value={trending.ctaBgColor || '#ffffff'} onChange={(val) => updateTrending('ctaBgColor', val)} label="CTA Background" />
        <ColorInput value={trending.ctaTextColor || '#065f46'} onChange={(val) => updateTrending('ctaTextColor', val)} label="CTA Text Color" />
      </div>

      <div className="mt-4">
        <h4 className="font-medium text-sm text-gray-700 mb-2">Icon Buttons</h4>
        {trending.iconButtons.map((btn: any, idx: number) => (
          <div key={btn.id} className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 mt-2">
            <input value={btn.label} onChange={e => updateIconButton(idx, 'label', e.target.value)} placeholder="Label" className="flex-1 min-w-[100px] rounded-lg border border-gray-200 px-2 py-1 text-sm" />

            <div className="flex items-center gap-1">
              <select value={btn.icon || 'Package'} onChange={e => handleIconOptionChange(idx, e.target.value)} className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-sm">
                {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                <option value="__custom">Custom (upload)</option>
              </select>
              {btn.icon?.startsWith('http') && (
                <img src={btn.icon} alt="custom" className="w-6 h-6 rounded object-cover" />
              )}
              {pendingFiles[`trending.iconButtons.${idx}.icon`] && (
                <span className="text-xs text-green-600">Pending</span>
              )}
            </div>

            <select value={btn.categoryId || ''} onChange={e => updateIconButton(idx, 'categoryId', e.target.value)} className="flex-1 min-w-[140px] rounded-lg border border-gray-200 px-2 py-1 text-sm">
              <option value="">Select Category</option>
              {categoryOptions.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <div className="flex gap-1">
              <button onClick={() => moveIconButton(idx, 'up')}><ChevronUp size={16} /></button>
              <button onClick={() => moveIconButton(idx, 'down')}><ChevronDown size={16} /></button>
              <button onClick={() => removeIconButton(idx)} className="text-red-400"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        <button onClick={addIconButton} className="flex items-center gap-1 text-sm text-green-600 mt-2"><Plus size={16} /> Add Icon Button</button>
      </div>
    </div>
  );
}