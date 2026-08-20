// src/components/admin/StoreConfigManager.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Store } from '@/types';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Upload, X, Search } from 'lucide-react';
import { uploadStoreImage, deleteStoreImage, uploadIconImage } from '@/services/catalog';
import { getStoreIcon } from '@/data/storeIcons';

// ============================================================
// 100+ ICON OPTIONS
// ============================================================
const ICON_OPTIONS = [
  // Fruits
  'Apple', 'Banana', 'Cherry', 'Grape', 'Lemon', 'Orange', 'Strawberry', 'Tomato',
  // Vegetables
   'Carrot', 'Corn', 'Onion', 'Pepper', 'Potato', 'Salad',
  // Meat & Seafood
  'Beef', 'Chicken', 'Crab', 'Fish', 'Drumstick', 'Bone',
  // Dairy
  'Cheese', 'Egg', 'Milk',
  // Bakery & Snacks
  'Cake', 'Candy', 'Chips', 'Cookie', 'Popcorn', 'Pasta', 'Pizza',
  // Beverages
  'Beer', 'Coffee', 'CupSoda', 'Juice', 'Wine', 'IceCream',
  // Staples & Grains
  'Nut', 'Olive', 'Rice', 'Wheat', 'Soup', 'Sprout',
  // Spices & Cooking
  'Flame', 'Droplet',
  // Household & Cleaning
  'Trash2',
  // Other
  'Gift', 'Package', 'Sun', 'Star', 'TrendingUp', 'Truck',
  // Extra – remove any that don't exist
  'Avocado', 'Coconut', 'Garlic', 'Ginger', 'Mango', 'Papaya', 'Pineapple', 'Watermelon',
  'Cabbage', 'Cauliflower', 'Celery', 'Cucumber', 'Eggplant', 'Lettuce', 'Mushroom', 'Pumpkin',
  'Butter', 'Cream', 'Yogurt',
];

// ============================================================
// COLOR INPUT HELPER (color picker + hex text)
// ============================================================
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
export default function StoreConfigManager() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('stores').select('*').order('name');
      if (error) console.error(error);
      else setStores(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-4">Loading stores...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Store Content Editor</h2>
      <div className="flex flex-wrap gap-2">
        {stores.map(store => (
          <button
            key={store.id}
            onClick={() => setSelectedStoreId(store.id)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
              selectedStoreId === store.id
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            {store.name}
          </button>
        ))}
      </div>
      {selectedStoreId && (
        <div className="mt-4">
          <StoreProvider storeId={selectedStoreId}>
            <StoreConfigEditor />
          </StoreProvider>
        </div>
      )}
    </div>
  );
}

// ============================================================
// EDITOR WITH TABS
// ============================================================
function StoreConfigEditor() {
  const { config, updateConfig } = useStore();
  const [activeTab, setActiveTab] = useState<'hero' | 'highlights' | 'categories' | 'bulkDeal' | 'trending'>('hero');

  const safeConfig = {
    hero: config?.hero || { enabled: true, image: '', gradientFrom: '#065f46', gradientTo: '#16a34a', title: '', subtitle: '', ctaText: 'Shop Now', ctaLink: '/categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
    highlights: config?.highlights || [],
    categories: config?.categories || [],
    bulkDeal: config?.bulkDeal || { enabled: false, tag: '', title: '', subtitle: '', cta: '', icon: 'Package', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
    trending: config?.trending || { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-2 border-b pb-2 mb-4 overflow-x-auto">
        {['hero', 'highlights', 'categories', 'bulkDeal', 'trending'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              activeTab === tab ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab === 'hero' ? 'Hero Banner' :
             tab === 'highlights' ? 'What\'s in Store' :
             tab === 'categories' ? 'Categories' :
             tab === 'bulkDeal' ? 'Bulk Deal Banner' :
             'Trending Banner'}
          </button>
        ))}
      </div>

      {activeTab === 'hero' && <HeroEditor config={safeConfig} updateConfig={updateConfig} />}
      {activeTab === 'highlights' && <HighlightsEditor config={safeConfig} updateConfig={updateConfig} />}
      {activeTab === 'categories' && <CategoriesEditor config={safeConfig} updateConfig={updateConfig} />}
      {activeTab === 'bulkDeal' && <BulkDealEditor config={safeConfig} updateConfig={updateConfig} />}
      {activeTab === 'trending' && <TrendingEditor config={safeConfig} updateConfig={updateConfig} />}
    </div>
  );
}

// ============================================================
// HERO EDITOR
// ============================================================
function HeroEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
  const { hero } = config;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateHero = (field: string, value: any) => {
    updateConfig({ ...config, hero: { ...hero, [field]: value } });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (hero.image) await deleteStoreImage(config.storeId, hero.image);
      const url = await uploadStoreImage(config.storeId, file, 'hero');
      updateHero('image', url);
    } catch (err) { console.error('Upload failed', err); }
  };

  const handleRemoveImage = async () => {
    if (hero.image) {
      await deleteStoreImage(config.storeId, hero.image);
      updateHero('image', '');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">Hero Banner</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Enabled</label>
          <input type="checkbox" checked={hero.enabled} onChange={e => updateHero('enabled', e.target.checked)} className="accent-green-600" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Image</label>
        <div className="flex flex-wrap gap-2">
          <input value={hero.image} onChange={e => updateHero('image', e.target.value)} className="flex-1 min-w-[150px] rounded-xl border border-gray-300 px-3 py-2 text-sm" />
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium whitespace-nowrap">Upload</button>
          {hero.image && <button onClick={handleRemoveImage} className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium whitespace-nowrap">Remove</button>}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
        {hero.image && <img src={hero.image} alt="Hero" className="mt-2 h-32 w-full rounded-xl object-cover" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ColorInput value={hero.gradientFrom} onChange={(val) => updateHero('gradientFrom', val)} label="Gradient From" />
        <ColorInput value={hero.gradientTo} onChange={(val) => updateHero('gradientTo', val)} label="Gradient To" />
      </div>

      <div><label className="block text-sm font-medium text-gray-700">Title</label><input value={hero.title} onChange={e => updateHero('title', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="block text-sm font-medium text-gray-700">Subtitle</label><input value={hero.subtitle} onChange={e => updateHero('subtitle', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="block text-sm font-medium text-gray-700">CTA Text</label><input value={hero.ctaText} onChange={e => updateHero('ctaText', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>
      <div><label className="block text-sm font-medium text-gray-700">CTA Link</label><input value={hero.ctaLink} onChange={e => updateHero('ctaLink', e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" /></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ColorInput value={hero.ctaBgColor || '#ffffff'} onChange={(val) => updateHero('ctaBgColor', val)} label="CTA Background" />
        <ColorInput value={hero.ctaTextColor || '#065f46'} onChange={(val) => updateHero('ctaTextColor', val)} label="CTA Text Color" />
      </div>
    </div>
  );
}

// ============================================================
// HIGHLIGHTS EDITOR (with icon upload)
// ============================================================
function HighlightsEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
  const { highlights = [], categories = [], storeId } = config;
  const categoryOptions = categories.map((c: any) => ({ value: c.id, label: c.title }));

  const updateHighlights = (newItems: any[]) => {
    updateConfig({ ...config, highlights: newItems });
  };

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

  const handleIconUpload = async (index: number, file: File) => {
    try {
      const url = await uploadIconImage(storeId, file, 'highlights');
      const updated = [...highlights];
      updated[index] = { ...updated[index], icon: url };
      updateHighlights(updated);
    } catch (err) {
      console.error('Icon upload failed', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">What's in the Store</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Enabled</label>
          <input type="checkbox" checked={highlights.enabled !== false} onChange={e => updateHighlights({ ...highlights, enabled: e.target.checked })} className="accent-green-600" />
        </div>
      </div>

      {highlights.map((h: any, idx: number) => (
        <div key={h.id} className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 mb-2">
          <input value={h.label} onChange={e => updateItem(idx, 'label', e.target.value)} placeholder="Label" className="flex-1 min-w-[100px] rounded-lg border border-gray-200 px-2 py-1 text-sm" />

          <div className="flex items-center gap-1">
            <select value={h.icon || 'Package'} onChange={e => updateItem(idx, 'icon', e.target.value)} className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-sm">
              {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              <option value="__custom">Custom (upload)</option>
            </select>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleIconUpload(idx, file);
                };
                input.click();
              }}
              className="px-2 py-1 rounded-lg bg-blue-500 text-white text-xs hover:bg-blue-600"
            >
              Upload
            </button>
            {h.icon?.startsWith('http') && (
              <img src={h.icon} alt="custom" className="w-6 h-6 rounded object-cover" />
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
// CATEGORIES EDITOR (with icon upload + color pickers + product picker modal)
// ============================================================
function CategoriesEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
  const { categories = [], storeId } = config;
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; brand: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('products').select('id, name, brand').eq('is_active', true).order('name');
      if (!error && data) setAllProducts(data);
    })();
  }, []);

  const updateCategories = (newItems: any[]) => updateConfig({ ...config, categories: newItems });

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

  const handleIconUpload = async (index: number, file: File) => {
    try {
      const url = await uploadIconImage(storeId, file, 'categories');
      const updated = [...categories];
      updated[index] = { ...updated[index], icon: url };
      updateCategories(updated);
    } catch (err) {
      console.error('Icon upload failed', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">Categories</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Enabled</label>
          <input type="checkbox" checked={categories.enabled !== false} onChange={e => updateCategories({ ...categories, enabled: e.target.checked })} className="accent-green-600" />
        </div>
      </div>

      {categories.map((c: any, idx: number) => (
        <div key={c.id} className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 mb-2">
          <input value={c.title} onChange={e => updateItem(idx, 'title', e.target.value)} placeholder="Title" className="flex-1 min-w-[100px] rounded-lg border border-gray-200 px-2 py-1 text-sm" />

          <div className="flex items-center gap-1">
            <select value={c.icon || 'Package'} onChange={e => updateItem(idx, 'icon', e.target.value)} className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-sm">
              {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
              <option value="__custom">Custom (upload)</option>
            </select>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleIconUpload(idx, file);
                };
                input.click();
              }}
              className="px-2 py-1 rounded-lg bg-blue-500 text-white text-xs hover:bg-blue-600"
            >
              Upload
            </button>
            {c.icon?.startsWith('http') && (
              <img src={c.icon} alt="custom" className="w-6 h-6 rounded object-cover" />
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

      {/* Product Picker Modal */}
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
                  <p className="text-sm text-gray-400 text-center py-4">No products found</p>
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
// BULK DEAL EDITOR (with color pickers)
// ============================================================
function BulkDealEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
  const { bulkDeal } = config;

  const updateBulkDeal = (field: string, value: any) => {
    updateConfig({ ...config, bulkDeal: { ...bulkDeal, [field]: value } });
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
// TRENDING EDITOR (with icon upload + color pickers)
// ============================================================
function TrendingEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
  const { trending = { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' }, categories = [], storeId } = config;

  const updateTrending = (field: string, value: any) => {
    updateConfig({ ...config, trending: { ...trending, [field]: value } });
  };

  const updateIconButtons = (newItems: any[]) => {
    updateConfig({ ...config, trending: { ...trending, iconButtons: newItems } });
  };

  const categoryOptions = categories.map((c: any) => ({ value: c.id, label: c.title }));

  const addIconButton = () => {
    const newItem = { id: Date.now().toString(), label: 'New Category', icon: 'Package', categoryId: categoryOptions.length > 0 ? categoryOptions[0].value : '' };
    updateIconButtons([...trending.iconButtons, newItem]);
  };

  const updateIconButton = (index: number, field: string, value: any) => {
    const updated = [...trending.iconButtons];
    updated[index] = { ...updated[index], [field]: value };
    updateIconButtons(updated);
  };

  const removeIconButton = (index: number) => {
    updateIconButtons(trending.iconButtons.filter((_, i) => i !== index));
  };

  const moveIconButton = (index: number, dir: 'up' | 'down') => {
    const newItems = [...trending.iconButtons];
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= trending.iconButtons.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    updateIconButtons(newItems);
  };

  const handleIconUpload = async (index: number, file: File) => {
    try {
      const url = await uploadIconImage(storeId, file, 'trending');
      const updated = [...trending.iconButtons];
      updated[index] = { ...updated[index], icon: url };
      updateIconButtons(updated);
    } catch (err) {
      console.error('Icon upload failed', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-lg">Trending Banner (Middle)</h3>
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
              <select value={btn.icon || 'Package'} onChange={e => updateIconButton(idx, 'icon', e.target.value)} className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-sm">
                {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                <option value="__custom">Custom (upload)</option>
              </select>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleIconUpload(idx, file);
                  };
                  input.click();
                }}
                className="px-2 py-1 rounded-lg bg-blue-500 text-white text-xs hover:bg-blue-600"
              >
                Upload
              </button>
              {btn.icon?.startsWith('http') && (
                <img src={btn.icon} alt="custom" className="w-6 h-6 rounded object-cover" />
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