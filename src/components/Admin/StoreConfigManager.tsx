import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Store } from '@/types';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Upload, Search, X } from 'lucide-react';
import { uploadStoreImage } from '@/services/catalog';
import { StoreConfig, IconGridItem, CategoryCard, PromoBanner, PackagingItem, CategorySection, Product } from '@/types/storeConfig';

// ----- Main component -----
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

// ----- Categories Editor with Inline Forms -----
function CategoriesEditor() {
  const { config, updateConfig } = useStore();
  const { categories, storeId } = config;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<{ id: string; brand: string; name: string; category: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductPackSize, setNewProductPackSize] = useState('');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  // Load all products from main catalog
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, brand, name, category_id')
        .eq('is_active', true)
        .order('name');
      if (!error && data) {
        const catIds = data.map(p => p.category_id).filter(Boolean);
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', catIds);
        const catMap: Record<string, string> = {};
        (cats || []).forEach(c => catMap[c.id] = c.name);
        setAllProducts(data.map(p => ({
          id: p.id,
          brand: p.brand,
          name: p.name,
          category: catMap[p.category_id] || 'Uncategorized',
        })));
      }
    })();
  }, []);

  // Add new category
  const handleAddCategory = () => {
    if (!newCategoryTitle.trim()) return;
    const newCat: CategorySection = {
      id: Date.now().toString(),
      title: newCategoryTitle.trim(),
      tabs: [],
      products: [],
      pillFilters: [],
    };
    updateConfig({ ...config, categories: [...categories, newCat] });
    setSelectedCategoryId(newCat.id);
    setNewCategoryTitle('');
    setShowAddCategory(false);
  };

  // Add new product (store-specific)
  const handleAddProduct = () => {
    if (!selectedCategory || !newProductTitle.trim()) return;
    const newProduct: Product = {
      id: Date.now().toString(),
      title: newProductTitle.trim(),
      category: selectedCategory.title,
      subCategory: selectedCategory.tabs[0]?.label || '',
      imageUrl: '',
      packSize: newProductPackSize || '200g',
      price: parseFloat(newProductPrice) || 0,
      originalPrice: parseFloat(newProductPrice) || 0,
      tieredPricing: [],
      inStock: true,
    };
    const updatedCategories = categories.map(cat =>
      cat.id === selectedCategory.id
        ? { ...cat, products: [...cat.products, newProduct] }
        : cat
    );
    updateConfig({ ...config, categories: updatedCategories });
    setNewProductTitle('');
    setNewProductPrice('');
    setNewProductPackSize('');
    setShowAddProduct(false);
  };

  // Add existing product to category
  const handleAddExistingProduct = (productId: string) => {
    if (!selectedCategory) return;
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const newProduct: Product = {
      id: productId,
      title: product.name,
      category: selectedCategory.title,
      subCategory: selectedCategory.tabs[0]?.label || '',
      imageUrl: '',
      packSize: '',
      price: 0,
      originalPrice: 0,
      tieredPricing: [],
      inStock: true,
    };
    const updatedCategories = categories.map(cat =>
      cat.id === selectedCategory.id
        ? { ...cat, products: [...cat.products, newProduct] }
        : cat
    );
    updateConfig({ ...config, categories: updatedCategories });
  };

  // Remove product
  const handleRemoveProduct = (categoryId: string, productId: string) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, products: cat.products.filter(p => p.id !== productId) }
        : cat
    );
    updateConfig({ ...config, categories: updatedCategories });
  };

  // Update product field inline
  const updateProductField = (categoryId: string, productId: string, field: keyof Product, value: any) => {
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            products: cat.products.map(p =>
              p.id === productId ? { ...p, [field]: value } : p
            ),
          }
        : cat
    );
    updateConfig({ ...config, categories: updatedCategories });
  };

  const filteredExisting = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Add Category Inline Form */}
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
              onChange={e => {
                const updated = categories.map(cat =>
                  cat.id === selectedCategory.id ? { ...cat, title: e.target.value } : cat
                );
                updateConfig({ ...config, categories: updated });
              }}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-semibold"
            />
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-1 text-sm text-green-600 font-medium"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>

          {/* Add Product Inline Form */}
          {showAddProduct && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <input
                type="text"
                value={newProductTitle}
                onChange={e => setNewProductTitle(e.target.value)}
                placeholder="Product title"
                className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newProductPrice}
                  onChange={e => setNewProductPrice(e.target.value)}
                  placeholder="Price"
                  className="w-1/2 rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
                />
                <input
                  type="text"
                  value={newProductPackSize}
                  onChange={e => setNewProductPackSize(e.target.value)}
                  placeholder="Pack size (e.g. 200g)"
                  className="w-1/2 rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddProduct} className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-sm font-medium">Add</button>
                <button onClick={() => setShowAddProduct(false)} className="px-3 py-1.5 rounded-xl bg-gray-200 text-sm font-medium">Cancel</button>
              </div>
            </div>
          )}

          {/* Tabs editor */}
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
                const updated = categories.map(cat =>
                  cat.id === selectedCategory.id ? { ...cat, tabs: newTabs } : cat
                );
                updateConfig({ ...config, categories: updated });
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          {/* Pill filters */}
          <div className="mb-3">
            <label className="text-xs text-gray-500">Pill Filters (comma separated)</label>
            <input
              value={(selectedCategory.pillFilters || []).join(', ')}
              onChange={e => {
                const pills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                const updated = categories.map(cat =>
                  cat.id === selectedCategory.id ? { ...cat, pillFilters: pills } : cat
                );
                updateConfig({ ...config, categories: updated });
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          {/* Add Existing Product */}
          <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-1">Add Existing Product to "{selectedCategory.title}"</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search product by name, brand, category..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 text-sm"
              />
            </div>
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {filteredExisting.length === 0 && (
                <p className="text-xs text-gray-400">No products found</p>
              )}
              {filteredExisting.map(p => {
                const alreadyAdded = selectedCategory.products.some(prod => prod.id === p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded-lg">
                    <span className="text-xs">{p.name} <span className="text-gray-400">({p.brand})</span> <span className="text-[10px] text-gray-400">— {p.category}</span></span>
                    {alreadyAdded ? (
                      <span className="text-xs text-green-600 font-medium">Added</span>
                    ) : (
                      <button
                        onClick={() => handleAddExistingProduct(p.id)}
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

          {/* Product list */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Products in this category</h4>
            {selectedCategory.products.length === 0 && (
              <p className="text-xs text-gray-400">No products assigned yet.</p>
            )}
            {selectedCategory.products.map(product => (
              <div key={product.id} className="flex items-center gap-2 border-b border-gray-100 py-1 flex-wrap">
                <img src={product.imageUrl || 'https://placehold.co/40x40/EEE/999?text=?'} alt="" className="w-10 h-10 rounded object-cover" />
                <input
                  value={product.title}
                  onChange={e => updateProductField(selectedCategory.id, product.id, 'title', e.target.value)}
                  className="flex-1 min-w-[120px] rounded border border-gray-200 px-2 py-0.5 text-sm"
                />
                <input
                  type="number"
                  value={product.price}
                  onChange={e => updateProductField(selectedCategory.id, product.id, 'price', Number(e.target.value))}
                  className="w-16 rounded border border-gray-200 px-1 py-0.5 text-sm"
                />
                <input
                  type="number"
                  value={product.originalPrice}
                  onChange={e => updateProductField(selectedCategory.id, product.id, 'originalPrice', Number(e.target.value))}
                  className="w-16 rounded border border-gray-200 px-1 py-0.5 text-sm"
                />
                <input
                  value={product.packSize}
                  onChange={e => updateProductField(selectedCategory.id, product.id, 'packSize', e.target.value)}
                  placeholder="Pack size"
                  className="w-20 rounded border border-gray-200 px-1 py-0.5 text-sm"
                />
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        try {
                          const url = await uploadStoreImage(storeId, file, 'products');
                          updateProductField(selectedCategory.id, product.id, 'imageUrl', url);
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
                <button onClick={() => handleRemoveProduct(selectedCategory.id, product.id)} className="text-red-400">
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

// ----- Reusable ListEditor -----
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