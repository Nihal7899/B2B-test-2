import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store } from '@/types';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { Edit, Save, Upload, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { uploadStoreImage } from '@/services/catalog';
import { StoreConfig, IconGridItem, CategoryCard, PromoBanner, PackagingItem, CategorySection, Product } from '@/types/storeConfig';

// Main component
export default function StoreManager() {
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
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Store Manager</h1>
      <div className="flex flex-wrap gap-2 border-b pb-3">
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

// ----- StoreConfigEditor with tabs -----
function StoreConfigEditor() {
  const { config, updateConfig } = useStore();
  const [activeTab, setActiveTab] = useState<'header' | 'iconGrid' | 'dietary' | 'promo' | 'categories' | 'packaging' | 'other'>('header');

  const tabs = [
    { id: 'header', label: 'Header' },
    { id: 'iconGrid', label: 'Icon Grid' },
    { id: 'dietary', label: 'Dietary Needs' },
    { id: 'promo', label: 'Promo Banner' },
    { id: 'categories', label: 'Categories' },
    { id: 'packaging', label: 'Packaging' },
    { id: 'other', label: 'Other Stores' },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <div className="flex gap-2 border-b pb-2 mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              activeTab === tab.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
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
            { key: 'route', label: 'Route' },
          ]}
          imageField="iconUrl"
          storeId={config.storeId}
        />
      )}
      {activeTab === 'dietary' && (
        <ListEditor<CategoryCard>
          items={config.dietaryNeeds}
          setItems={(items) => updateConfig({ ...config, dietaryNeeds: items })}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'imageUrl', label: 'Image URL' },
            { key: 'route', label: 'Route' },
          ]}
          imageField="imageUrl"
          storeId={config.storeId}
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
          storeId={config.storeId}
        />
      )}
      {activeTab === 'other' && (
        <ListEditor<CategoryCard>
          items={config.otherStores}
          setItems={(items) => updateConfig({ ...config, otherStores: items })}
          fields={[
            { key: 'title', label: 'Title' },
            { key: 'imageUrl', label: 'Image URL' },
            { key: 'route', label: 'Route' },
          ]}
          imageField="imageUrl"
          storeId={config.storeId}
        />
      )}
    </div>
  );
}

// ----- Header Editor -----
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

// ----- Promo Banner Editor -----
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

// ----- Categories Editor (with nested product editor) -----
function CategoriesEditor() {
  const { config, updateCategory, addProduct, updateProduct, deleteProduct } = useStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const selectedCategory = config.categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Categories & Products</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {config.categories.map(cat => (
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
          onClick={() => {
            const title = prompt('New category title?');
            if (title) {
              const newCat: CategorySection = {
                id: Date.now().toString(),
                title,
                tabs: [],
                products: [],
                pillFilters: [],
              };
              updateCategory(newCat.id, newCat);
              setSelectedCategoryId(newCat.id);
            }
          }}
          className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-600 border border-green-200"
        >
          + Add Category
        </button>
      </div>

      {selectedCategory && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-3">
            <input
              value={selectedCategory.title}
              onChange={e => updateCategory(selectedCategory.id, { title: e.target.value })}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
            />
            <button
              onClick={() => {
                const newProduct: Product = {
                  id: Date.now().toString(),
                  title: 'New Product',
                  category: selectedCategory.title,
                  subCategory: selectedCategory.tabs[0]?.label || '',
                  imageUrl: 'https://picsum.photos/200/200?random=' + Date.now(),
                  packSize: '200g',
                  price: 99,
                  originalPrice: 129,
                  tieredPricing: [{ minQty: 6, unitPrice: 85 }],
                  inStock: true,
                };
                addProduct(selectedCategory.id, newProduct);
              }}
              className="flex items-center gap-1 text-sm text-green-600 font-medium"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>

          {/* Tabs editor (simplified) */}
          <div className="mb-3">
            <label className="text-xs text-gray-500">Tabs (comma separated icons)</label>
            <input
              value={selectedCategory.tabs.map(t => t.label).join(', ')}
              onChange={e => {
                const labels = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                const newTabs = labels.map((label, i) => ({
                  id: `tab-${i}`,
                  label,
                  iconUrl: '🍽️', // default emoji; could be improved
                }));
                updateCategory(selectedCategory.id, { tabs: newTabs });
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          {/* Product list */}
          <div className="space-y-2">
            {selectedCategory.products.map(product => (
              <div key={product.id} className="flex items-center gap-2 border-b border-gray-100 py-1 flex-wrap">
                <img src={product.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                <input
                  value={product.title}
                  onChange={e => updateProduct(selectedCategory.id, product.id, { title: e.target.value })}
                  className="flex-1 min-w-[120px] rounded border border-gray-200 px-2 py-0.5 text-sm"
                />
                <input
                  type="number"
                  value={product.price}
                  onChange={e => updateProduct(selectedCategory.id, product.id, { price: Number(e.target.value) })}
                  className="w-16 rounded border border-gray-200 px-1 py-0.5 text-sm"
                />
                <button
                  onClick={() => {
                    // Upload image for this product
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        try {
                          const url = await uploadStoreImage(selectedCategory.storeId, file, 'products');
                          updateProduct(selectedCategory.id, product.id, { imageUrl: url });
                        } catch (err) {
                          console.error('Upload failed', err);
                        }
                      }
                    };
                    input.click();
                  }}
                  className="text-blue-500 text-xs"
                >
                  Upload
                </button>
                <button onClick={() => deleteProduct(selectedCategory.id, product.id)} className="text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Reusable ListEditor with image upload support -----
function ListEditor<T extends { id: string }>({
  items,
  setItems,
  fields,
  imageField,
  storeId,
}: {
  items: T[];
  setItems: (items: T[]) => void;
  fields: { key: keyof T; label: string }[];
  imageField?: keyof T;
  storeId: string;
}) {
  const [localItems, setLocalItems] = useState(items);

  const handleSave = () => setItems(localItems);

  const addItem = () => {
    const newItem: any = { id: Date.now().toString() };
    fields.forEach(f => (newItem[f.key] = ''));
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

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const url = await uploadStoreImage(storeId, file, 'listEditor');
      updateItem(index, imageField!, url);
    } catch (e) {
      console.error('Upload failed', e);
    }
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
                        if (file) await handleImageUpload(idx, file);
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