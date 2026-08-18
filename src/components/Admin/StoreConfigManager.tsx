import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Store } from '@/types';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Upload, Search, X } from 'lucide-react';
import { uploadStoreImage } from '@/services/catalog';
import { StoreConfig, IconGridItem, CategoryCard, PromoBanner, PackagingItem, CategorySection, OtherStoreItem } from '@/types/storeConfig';

// ----- Main component (unchanged) -----
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

// ----- Editor with tabs -----
function StoreConfigEditor() {
  const { config, updateConfig } = useStore();
  const [activeTab, setActiveTab] = useState<'header' | 'iconGrid' | 'dietary' | 'promo' | 'categories' | 'packaging' | 'other'>('header');
  const [allStores, setAllStores] = useState<{ id: string; name: string; image_url: string }[]>([]);

  // Build category options from the store's own categories
  const categoryOptions = config.categories.map(c => ({ value: c.id, label: c.title }));

  // Fetch all stores for the "Other Stores" dropdown
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, image_url')
        .eq('is_active', true)
        .order('name');
      if (!error && data) setAllStores(data);
    })();
  }, []);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <div className="flex gap-2 border-b pb-2 mb-4 overflow-x-auto">
        {['header','iconGrid','dietary','promo','categories','packaging','other'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              activeTab === tab ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'header' && <HeaderEditor />}
      {activeTab === 'iconGrid' && (
        <ListEditor<IconGridItem>
          items={config.iconGrid}
          setItems={(items) => updateConfig({ ...config, iconGrid: items })}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'iconUrl', label: 'Icon (URL/Emoji)' },
          ]}
          selectField={{ key: 'categoryId', label: 'Category', options: categoryOptions }}
          imageField="iconUrl"
        />
      )}
      {activeTab === 'dietary' && (
        <ListEditor<CategoryCard>
          items={config.dietaryNeeds}
          setItems={(items) => updateConfig({ ...config, dietaryNeeds: items })}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'imageUrl', label: 'Image URL' },
          ]}
          selectField={{ key: 'categoryId', label: 'Category', options: categoryOptions }}
          imageField="imageUrl"
        />
      )}
      {activeTab === 'promo' && <PromoEditor />}
      {activeTab === 'categories' && <CategoriesEditor />}
      {activeTab === 'packaging' && (
        <ListEditor<PackagingItem>
          items={config.packaging}
          setItems={(items) => updateConfig({ ...config, packaging: items })}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'imageUrl', label: 'Image URL' },
          ]}
          imageField="imageUrl"
        />
      )}
      {activeTab === 'other' && (
        <ListEditor<OtherStoreItem>
          items={config.otherStores || []}
          setItems={(items) => updateConfig({ ...config, otherStores: items })}
          fields={[]}
          selectField={{ key: 'storeId', label: 'Store', options: allStores.map(s => ({ value: s.id, label: s.name })) }}
        />
      )}
    </div>
  );
}

// ----- Header Editor (unchanged) -----
function HeaderEditor() {
  const { config, updateHeader } = useStore();
  const { header } = config;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Header & Branding</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Store Title</label>
        <input
          type="text"
          value={header.title}
          onChange={e => updateHeader({ title: e.target.value })}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Subtitle</label>
        <input
          type="text"
          value={header.subtitle}
          onChange={e => updateHeader({ subtitle: e.target.value })}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Cart Badge Count (demo)</label>
        <input
          type="number"
          value={header.cartBadgeCount}
          onChange={e => updateHeader({ cartBadgeCount: Number(e.target.value) })}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

// ----- Promo Banner Editor (unchanged) -----
function PromoEditor() {
  const { config, updatePromoBanner } = useStore();
  const { promoBanner } = config;

  const handleChange = (field: keyof PromoBanner, value: string | string[]) => {
    updatePromoBanner({ ...promoBanner, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Promo Banner</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Badge</label>
        <input
          value={promoBanner.badge}
          onChange={e => handleChange('badge', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          value={promoBanner.title}
          onChange={e => handleChange('title', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Subtitle</label>
        <input
          value={promoBanner.subtitle}
          onChange={e => handleChange('subtitle', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Background Theme (Tailwind class)</label>
        <input
          value={promoBanner.backgroundTheme}
          onChange={e => handleChange('backgroundTheme', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Floating Images (URLs, comma separated)</label>
        <input
          value={promoBanner.floatingProductImages.join(', ')}
          onChange={e => handleChange('floatingProductImages', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

// ----- Categories Editor (unchanged) -----
function CategoriesEditor() {
  const { config, updateConfig } = useStore();
  const { categories, storeId } = config;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<{ id: string; brand: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, brand, name')
        .eq('is_active', true)
        .order('name');
      if (!error && data) {
        setAllProducts(data);
      }
    })();
  }, []);

  const handleAddCategory = () => {
    if (!newCategoryTitle.trim()) return;
    const newCat: CategorySection = {
      id: Date.now().toString(),
      title: newCategoryTitle.trim(),
      tabs: [],
      productIds: [],
      pillFilters: [],
    };
    updateConfig({ ...config, categories: [...categories, newCat] });
    setSelectedCategoryId(newCat.id);
    setNewCategoryTitle('');
    setShowAddCategory(false);
  };

  const handleAddProductId = (productId: string) => {
    if (!selectedCategory) return;
    if (selectedCategory.productIds.includes(productId)) return;
    const updatedCategories = categories.map(cat =>
      cat.id === selectedCategory.id
        ? { ...cat, productIds: [...cat.productIds, productId] }
        : cat
    );
    updateConfig({ ...config, categories: updatedCategories });
  };

  const handleRemoveProductId = (productId: string) => {
    if (!selectedCategory) return;
    const updatedCategories = categories.map(cat =>
      cat.id === selectedCategory.id
        ? { ...cat, productIds: cat.productIds.filter(id => id !== productId) }
        : cat
    );
    updateConfig({ ...config, categories: updatedCategories });
  };

  const updateCategoryField = (field: keyof CategorySection, value: any) => {
    if (!selectedCategory) return;
    const updatedCategories = categories.map(cat =>
      cat.id === selectedCategory.id ? { ...cat, [field]: value } : cat
    );
    updateConfig({ ...config, categories: updatedCategories });
  };

  const filteredExisting = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Categories & Products</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedCategoryId === cat.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {cat.title}
          </button>
        ))}
        <button
          onClick={() => setShowAddCategory(true)}
          className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-600 border border-green-200"
        >
          + Add Category
        </button>
      </div>

      {showAddCategory && (
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex gap-2 items-center">
          <input
            type="text"
            value={newCategoryTitle}
            onChange={e => setNewCategoryTitle(e.target.value)}
            placeholder="Category name..."
            className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button onClick={handleAddCategory} className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-sm font-medium">Add</button>
          <button onClick={() => setShowAddCategory(false)} className="p-1.5 rounded-full hover:bg-gray-200"><X size={16} /></button>
        </div>
      )}

      {selectedCategory && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-3">
            <input
              value={selectedCategory.title}
              onChange={e => updateCategoryField('title', e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-semibold"
            />
          </div>

          <div className="mb-3">
            <label className="text-xs text-gray-500">Tabs (comma separated labels)</label>
            <input
              value={selectedCategory.tabs.map(t => t.label).join(', ')}
              onChange={e => {
                const labels = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                const newTabs = labels.map((label, i) => ({
                  id: `tab-${i}`,
                  label,
                  iconUrl: '🍽️',
                }));
                updateCategoryField('tabs', newTabs);
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="mb-3">
            <label className="text-xs text-gray-500">Pill Filters (comma separated)</label>
            <input
              value={(selectedCategory.pillFilters || []).join(', ')}
              onChange={e => {
                const pills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                updateCategoryField('pillFilters', pills);
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-1">Add Existing Product to "{selectedCategory.title}"</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search product by name, brand..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 text-sm"
              />
            </div>
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {filteredExisting.length === 0 && (
                <p className="text-xs text-gray-400">No products found</p>
              )}
              {filteredExisting.map(p => {
                const alreadyAdded = selectedCategory.productIds.includes(p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded-lg">
                    <span className="text-xs">{p.name} <span className="text-gray-400">({p.brand})</span></span>
                    {alreadyAdded ? (
                      <span className="text-xs text-green-600 font-medium">Added</span>
                    ) : (
                      <button
                        onClick={() => handleAddProductId(p.id)}
                        className="text-xs text-blue-600 font-medium hover:underline"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Products in this category</h4>
            {selectedCategory.productIds.length === 0 && (
              <p className="text-xs text-gray-400">No products assigned yet.</p>
            )}
            {selectedCategory.productIds.map(productId => {
              const product = allProducts.find(p => p.id === productId);
              return (
                <div key={productId} className="flex items-center justify-between py-1 px-2 border-b border-gray-100">
                  <span className="text-sm">{product?.name || productId}</span>
                  <button onClick={() => handleRemoveProductId(productId)} className="text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Updated ListEditor with select dropdown support -----
function ListEditor<T extends { id: string }>({
  items,
  setItems,
  fields,
  selectField,
  imageField,
}: {
  items: T[];
  setItems: (items: T[]) => void;
  fields: { key: keyof T; label: string }[];
  selectField?: { key: keyof T; label: string; options: { value: string; label: string }[] };
  imageField?: keyof T;
}) {
  const [localItems, setLocalItems] = useState(items);

  const handleSave = () => setItems(localItems);

  const addItem = () => {
    const newItem: any = { id: Date.now().toString() };
    fields.forEach(f => (newItem[f.key] = ''));
    if (selectField) newItem[selectField.key] = '';
    setLocalItems([...localItems, newItem]);
  };

  const updateItem = (index: number, key: keyof T, value: string) => {
    const updated = [...localItems];
    updated[index] = { ...updated[index], [key]: value as any };
    setLocalItems(updated);
  };

  const deleteItem = (index: number) => {
    setLocalItems(localItems.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...localItems];
    const swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= localItems.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    setLocalItems(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <h3 className="font-semibold">Items</h3>
        <button onClick={addItem} className="flex items-center gap-1 text-sm text-green-600">
          <Plus size={16} /> Add
        </button>
      </div>
      {localItems.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2 border-b pb-2 flex-wrap">
          {fields.map(f => (
            <div key={String(f.key)} className="flex-1 min-w-[100px]">
              {f.key === imageField ? (
                <div className="flex items-center gap-1">
                  <input
                    value={String(item[f.key] || '')}
                    onChange={e => updateItem(idx, f.key, e.target.value)}
                    placeholder={f.label}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
                  />
                  <label className="cursor-pointer bg-gray-100 p-1 rounded hover:bg-gray-200">
                    <Upload size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // In real app, upload to storage
                          updateItem(idx, f.key, URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                <input
                  value={String(item[f.key] || '')}
                  onChange={e => updateItem(idx, f.key, e.target.value)}
                  placeholder={f.label}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
                />
              )}
            </div>
          ))}
          {selectField && (
            <div className="flex-1 min-w-[150px]">
              <select
                value={String(item[selectField.key] || '')}
                onChange={e => updateItem(idx, selectField.key, e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
              >
                <option value="">Select {selectField.label}</option>
                {selectField.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-1">
            <button onClick={() => moveItem(idx, 'up')}><ChevronUp size={16} /></button>
            <button onClick={() => moveItem(idx, 'down')}><ChevronDown size={16} /></button>
            <button onClick={() => deleteItem(idx)} className="text-red-400"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      <button onClick={handleSave} className="w-full py-2 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2">
        <Save size={16} /> Save Changes
      </button>
    </div>
  );
}

// Hero Editor
function HeroEditor() {
  const { config, updateConfig } = useStore();
  const { hero } = config;

  const updateHero = (field: string, value: any) => {
    updateConfig({ ...config, hero: { ...hero, [field]: value } });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Hero Banner</h3>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Enabled</label>
        <input
          type="checkbox"
          checked={hero.enabled}
          onChange={e => updateHero('enabled', e.target.checked)}
          className="accent-green-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Image URL</label>
        <input
          value={hero.imageUrl}
          onChange={e => updateHero('imageUrl', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
        {hero.imageUrl && (
          <img src={hero.imageUrl} alt="Hero" className="mt-2 h-32 w-full rounded-xl object-cover" />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Overlay Color</label>
        <input
          type="color"
          value={hero.overlayColor}
          onChange={e => updateHero('overlayColor', e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-300 p-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Overlay Opacity (0-100)</label>
        <input
          type="range"
          min="0"
          max="100"
          value={hero.overlayOpacity}
          onChange={e => updateHero('overlayOpacity', Number(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{hero.overlayOpacity}%</span>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tagline</label>
        <input
          value={hero.tagline}
          onChange={e => updateHero('tagline', e.target.value)}
          placeholder="e.g. Fresh from the farm to your table"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Text</label>
        <input
          value={hero.ctaText}
          onChange={e => updateHero('ctaText', e.target.value)}
          placeholder="e.g. Shop Now"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Link</label>
        <input
          value={hero.ctaLink}
          onChange={e => updateHero('ctaLink', e.target.value)}
          placeholder="e.g. /categories"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

// Stats Editor
function StatsEditor() {
  const { config, updateConfig } = useStore();
  const { stats } = config;

  const updateStats = (field: string, value: any) => {
    updateConfig({ ...config, stats: { ...stats, [field]: value } });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Stats Bar</h3>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Enabled</label>
        <input
          type="checkbox"
          checked={stats.enabled}
          onChange={e => updateStats('enabled', e.target.checked)}
          className="accent-green-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Products Count</label>
        <input
          type="number"
          value={stats.productsCount}
          onChange={e => updateStats('productsCount', Number(e.target.value))}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Happy Customers</label>
        <input
          type="number"
          value={stats.customersCount}
          onChange={e => updateStats('customersCount', Number(e.target.value))}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
        <input
          type="number"
          value={stats.years}
          onChange={e => updateStats('years', Number(e.target.value))}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Deliveries</label>
        <input
          type="number"
          value={stats.deliveriesCount}
          onChange={e => updateStats('deliveriesCount', Number(e.target.value))}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

// Promo Strip Editor
function PromoStripEditor() {
  const { config, updateConfig } = useStore();
  const { promoStrip } = config;

  const updatePromoStrip = (field: string, value: any) => {
    updateConfig({ ...config, promoStrip: { ...promoStrip, [field]: value } });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Promo Strip</h3>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Enabled</label>
        <input
          type="checkbox"
          checked={promoStrip.enabled}
          onChange={e => updatePromoStrip('enabled', e.target.checked)}
          className="accent-green-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Message</label>
        <input
          value={promoStrip.message}
          onChange={e => updatePromoStrip('message', e.target.value)}
          placeholder="e.g. 🎉 Festival Sale! Up to 40% off"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Text</label>
        <input
          value={promoStrip.ctaText}
          onChange={e => updatePromoStrip('ctaText', e.target.value)}
          placeholder="e.g. Grab Deal"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Link</label>
        <input
          value={promoStrip.ctaLink}
          onChange={e => updatePromoStrip('ctaLink', e.target.value)}
          placeholder="e.g. /products"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Background Color</label>
        <input
          type="color"
          value={promoStrip.backgroundColor}
          onChange={e => updatePromoStrip('backgroundColor', e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-300 p-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Text Color</label>
        <input
          type="color"
          value={promoStrip.textColor}
          onChange={e => updatePromoStrip('textColor', e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-300 p-1"
        />
      </div>
    </div>
  );
}

// Features Editor
function FeaturesEditor() {
  const { config, updateConfig } = useStore();
  const { features } = config;

  const updateFeatures = (newItems: FeatureItem[]) => {
    updateConfig({ ...config, features: { ...features, items: newItems } });
  };

  const toggleEnabled = () => {
    updateConfig({ ...config, features: { ...features, enabled: !features.enabled } });
  };

  const addItem = () => {
    const newItem: FeatureItem = {
      id: Date.now().toString(),
      icon: '⭐',
      title: 'New Feature',
      description: 'Description',
    };
    updateFeatures([...features.items, newItem]);
  };

  const updateItem = (index: number, field: keyof FeatureItem, value: string) => {
    const updated = [...features.items];
    updated[index] = { ...updated[index], [field]: value };
    updateFeatures(updated);
  };

  const removeItem = (index: number) => {
    updateFeatures(features.items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Features</h3>
        <button onClick={toggleEnabled} className="text-sm text-green-600 font-medium">
          {features.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
      {features.items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2 border-b pb-2">
          <input
            value={item.icon}
            onChange={e => updateItem(idx, 'icon', e.target.value)}
            placeholder="Icon (emoji or URL)"
            className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <input
            value={item.title}
            onChange={e => updateItem(idx, 'title', e.target.value)}
            placeholder="Title"
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <input
            value={item.description}
            onChange={e => updateItem(idx, 'description', e.target.value)}
            placeholder="Description"
            className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <button onClick={() => removeItem(idx)} className="text-red-400"><Trash2 size={16} /></button>
        </div>
      ))}
      <button onClick={addItem} className="flex items-center gap-1 text-sm text-green-600">
        <Plus size={16} /> Add Feature
      </button>
    </div>
  );
}

// Theme Editor
function ThemeEditor() {
  const { config, updateConfig } = useStore();
  const { theme } = config;

  const updateTheme = (field: string, value: any) => {
    updateConfig({ ...config, theme: { ...theme, [field]: value } });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Theme Settings</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Primary Color</label>
        <input
          type="color"
          value={theme.primaryColor}
          onChange={e => updateTheme('primaryColor', e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-300 p-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
        <input
          type="color"
          value={theme.secondaryColor}
          onChange={e => updateTheme('secondaryColor', e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-300 p-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Text Color</label>
        <input
          type="color"
          value={theme.textColor}
          onChange={e => updateTheme('textColor', e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-300 p-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Border Color</label>
        <input
          type="color"
          value={theme.borderColor}
          onChange={e => updateTheme('borderColor', e.target.value)}
          className="w-full h-10 rounded-xl border border-gray-300 p-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Button Style</label>
        <select
          value={theme.buttonStyle}
          onChange={e => updateTheme('buttonStyle', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="brand">Brand</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Card Radius</label>
        <select
          value={theme.cardRadius}
          onChange={e => updateTheme('cardRadius', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
          <option value="full">Full</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Shadow Intensity</label>
        <select
          value={theme.shadowIntensity}
          onChange={e => updateTheme('shadowIntensity', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </div>
    </div>
  );
}