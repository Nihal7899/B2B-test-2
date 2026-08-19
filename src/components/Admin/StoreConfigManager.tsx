// src/components/admin/StoreConfigManager.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Store } from '@/types';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Upload, X } from 'lucide-react';
import { getStoreIcon } from '@/data/storeIcons';
import {
  StoreConfig,
  CategoryItem,
  HighlightItem,
  BulkDeal,
  TrendingBanner,
  TrendingIconButton,
} from '@/types/storeConfig';

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

  // Safe defaults
  const safeConfig = {
    hero: config?.hero || { enabled: true, image: '', gradientFrom: '#065f46', gradientTo: '#16a34a', title: '', subtitle: '', ctaText: 'Shop Now', ctaLink: '/categories' },
    highlights: config?.highlights || [],
    categories: config?.categories || [],
    bulkDeal: config?.bulkDeal || { enabled: false, tag: '', title: '', subtitle: '', cta: '', icon: 'Package' },
    trending: config?.trending || { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories' },
  };

  const [activeTab, setActiveTab] = useState<'hero' | 'highlights' | 'categories' | 'bulkDeal' | 'trending'>('hero');

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <div className="flex gap-2 border-b pb-2 mb-4 overflow-x-auto">
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

// ----- Hero Banner Editor -----
function HeroEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
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
          value={hero.image}
          onChange={e => updateHero('image', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
        {hero.image && (
          <img src={hero.image} alt="Hero" className="mt-2 h-32 w-full rounded-xl object-cover" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Gradient From</label>
          <input
            type="color"
            value={hero.gradientFrom}
            onChange={e => updateHero('gradientFrom', e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-300 p-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Gradient To</label>
          <input
            type="color"
            value={hero.gradientTo}
            onChange={e => updateHero('gradientTo', e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-300 p-1"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          value={hero.title}
          onChange={e => updateHero('title', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Subtitle</label>
        <input
          value={hero.subtitle}
          onChange={e => updateHero('subtitle', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Text</label>
        <input
          value={hero.ctaText}
          onChange={e => updateHero('ctaText', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Link</label>
        <input
          value={hero.ctaLink}
          onChange={e => updateHero('ctaLink', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

// ----- Highlights Editor (What's in Store) -----
function HighlightsEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
  const { highlights = [], categories = [] } = config;

  const updateHighlights = (newItems: HighlightItem[]) => {
    updateConfig({ ...config, highlights: newItems });
  };

  const categoryOptions = categories.map((c: any) => ({ value: c.id, label: c.title }));

  const addItem = () => {
    const newItem: HighlightItem = {
      id: Date.now().toString(),
      label: 'New Highlight',
      icon: 'Package',
      categoryId: categoryOptions.length > 0 ? categoryOptions[0].value : '',
    };
    updateHighlights([...highlights, newItem]);
  };

  const updateItem = (index: number, field: keyof HighlightItem, value: any) => {
    const updated = [...highlights];
    updated[index] = { ...updated[index], [field]: value };
    updateHighlights(updated);
  };

  const removeItem = (index: number) => {
    updateHighlights(highlights.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, dir: 'up' | 'down') => {
    const newItems = [...highlights];
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= highlights.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    updateHighlights(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">What's in the Store</h3>
        <span className="text-xs text-gray-400">These icons appear below the hero banner</span>
      </div>
      {highlights.map((h: HighlightItem, idx: number) => (
        <div key={h.id} className="flex flex-wrap items-center gap-2 border-b pb-2">
          <input
            value={h.label}
            onChange={e => updateItem(idx, 'label', e.target.value)}
            placeholder="Label (e.g. Fresh Fruits)"
            className="flex-1 min-w-[120px] rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <input
            value={h.icon}
            onChange={e => updateItem(idx, 'icon', e.target.value)}
            placeholder="Icon (e.g. Apple)"
            className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <select
            value={h.categoryId || ''}
            onChange={e => updateItem(idx, 'categoryId', e.target.value)}
            className="flex-1 min-w-[140px] rounded-lg border border-gray-200 px-2 py-1 text-sm"
          >
            <option value="">Select Category</option>
            {categoryOptions.map((opt: any) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <button onClick={() => moveItem(idx, 'up')}><ChevronUp size={16} /></button>
            <button onClick={() => moveItem(idx, 'down')}><ChevronDown size={16} /></button>
            <button onClick={() => removeItem(idx)} className="text-red-400"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="flex items-center gap-1 text-sm text-green-600">
        <Plus size={16} /> Add Highlight
      </button>
    </div>
  );
}

// ----- Categories Editor -----
function CategoriesEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
  const { categories = [] } = config;

  const updateCategories = (newItems: CategoryItem[]) => {
    updateConfig({ ...config, categories: newItems });
  };

  const addItem = () => {
    const newItem: CategoryItem = {
      id: Date.now().toString(),
      title: 'New Category',
      icon: 'Package',
      description: 'Category description',
      productIds: [],
    };
    updateCategories([...categories, newItem]);
  };

  const updateItem = (index: number, field: keyof CategoryItem, value: any) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    updateCategories(updated);
  };

  const removeItem = (index: number) => {
    updateCategories(categories.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, dir: 'up' | 'down') => {
    const newItems = [...categories];
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= categories.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    updateCategories(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Categories</h3>
        <span className="text-xs text-gray-400">Each category has an icon and description</span>
      </div>
      {categories.map((c: CategoryItem, idx: number) => (
        <div key={c.id} className="flex flex-wrap items-center gap-2 border-b pb-2">
          <input
            value={c.title}
            onChange={e => updateItem(idx, 'title', e.target.value)}
            placeholder="Category title"
            className="flex-1 min-w-[120px] rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <input
            value={c.icon}
            onChange={e => updateItem(idx, 'icon', e.target.value)}
            placeholder="Icon (e.g. Apple)"
            className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <input
            value={c.description}
            onChange={e => updateItem(idx, 'description', e.target.value)}
            placeholder="Description"
            className="flex-1 min-w-[120px] rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <input
            value={c.productIds.join(', ')}
            onChange={e => updateItem(idx, 'productIds', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
            placeholder="Product IDs (comma)"
            className="flex-1 min-w-[120px] rounded-lg border border-gray-200 px-2 py-1 text-sm"
          />
          <div className="flex gap-1">
            <button onClick={() => moveItem(idx, 'up')}><ChevronUp size={16} /></button>
            <button onClick={() => moveItem(idx, 'down')}><ChevronDown size={16} /></button>
            <button onClick={() => removeItem(idx)} className="text-red-400"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="flex items-center gap-1 text-sm text-green-600">
        <Plus size={16} /> Add Category
      </button>
    </div>
  );
}

// ----- Bulk Deal Banner Editor -----
function BulkDealEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
  const { bulkDeal } = config;

  const updateBulkDeal = (field: string, value: any) => {
    updateConfig({ ...config, bulkDeal: { ...bulkDeal, [field]: value } });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Bulk Deal Banner</h3>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Enabled</label>
        <input
          type="checkbox"
          checked={bulkDeal.enabled}
          onChange={e => updateBulkDeal('enabled', e.target.checked)}
          className="accent-green-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tag</label>
        <input
          value={bulkDeal.tag}
          onChange={e => updateBulkDeal('tag', e.target.value)}
          placeholder="e.g. FARM DIRECT"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          value={bulkDeal.title}
          onChange={e => updateBulkDeal('title', e.target.value)}
          placeholder="e.g. Morning harvest sale"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Subtitle</label>
        <input
          value={bulkDeal.subtitle}
          onChange={e => updateBulkDeal('subtitle', e.target.value)}
          placeholder="e.g. Book before 8 AM · 15% off"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Text</label>
        <input
          value={bulkDeal.cta}
          onChange={e => updateBulkDeal('cta', e.target.value)}
          placeholder="e.g. Shop fresh"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Icon Name</label>
        <input
          value={bulkDeal.icon}
          onChange={e => updateBulkDeal('icon', e.target.value)}
          placeholder="e.g. Sun, Package, Wheat"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

// ----- Trending Banner Editor -----
function TrendingEditor({ config, updateConfig }: { config: any; updateConfig: (newConfig: any) => void }) {
  const { trending = { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories' }, categories = [] } = config;

  const updateTrending = (field: string, value: any) => {
    updateConfig({ ...config, trending: { ...trending, [field]: value } });
  };

  const updateIconButtons = (newItems: TrendingIconButton[]) => {
    updateConfig({ ...config, trending: { ...trending, iconButtons: newItems } });
  };

  const categoryOptions = categories.map((c: any) => ({ value: c.id, label: c.title }));

  const addIconButton = () => {
    const newItem: TrendingIconButton = {
      id: Date.now().toString(),
      label: 'New Category',
      icon: 'Package',
      categoryId: categoryOptions.length > 0 ? categoryOptions[0].value : '',
    };
    updateIconButtons([...trending.iconButtons, newItem]);
  };

  const updateIconButton = (index: number, field: keyof TrendingIconButton, value: any) => {
    const updated = [...trending.iconButtons];
    updated[index] = { ...updated[index], [field]: value };
    updateIconButtons(updated);
  };

  const removeIconButton = (index: number) => {
    updateIconButtons(trending.iconButtons.filter((_: any, i: number) => i !== index));
  };

  const moveIconButton = (index: number, dir: 'up' | 'down') => {
    const newItems = [...trending.iconButtons];
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= trending.iconButtons.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    updateIconButtons(newItems);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Trending Banner (Middle Banner)</h3>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Enabled</label>
        <input
          type="checkbox"
          checked={trending.enabled}
          onChange={e => updateTrending('enabled', e.target.checked)}
          className="accent-green-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          value={trending.title}
          onChange={e => updateTrending('title', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Subtitle</label>
        <input
          value={trending.subtitle}
          onChange={e => updateTrending('subtitle', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CTA Text</label>
        <input
          value={trending.ctaText}
          onChange={e => updateTrending('ctaText', e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4">
        <h4 className="font-medium text-sm text-gray-700">Icon Buttons</h4>
        {trending.iconButtons.map((btn: TrendingIconButton, idx: number) => (
          <div key={btn.id} className="flex flex-wrap items-center gap-2 border-b pb-2 mt-2">
            <input
              value={btn.label}
              onChange={e => updateIconButton(idx, 'label', e.target.value)}
              placeholder="Label"
              className="flex-1 min-w-[120px] rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
            <input
              value={btn.icon}
              onChange={e => updateIconButton(idx, 'icon', e.target.value)}
              placeholder="Icon (e.g. Apple)"
              className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
            <select
              value={btn.categoryId || ''}
              onChange={e => updateIconButton(idx, 'categoryId', e.target.value)}
              className="flex-1 min-w-[140px] rounded-lg border border-gray-200 px-2 py-1 text-sm"
            >
              <option value="">Select Category</option>
              {categoryOptions.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button onClick={() => moveIconButton(idx, 'up')}><ChevronUp size={16} /></button>
              <button onClick={() => moveIconButton(idx, 'down')}><ChevronDown size={16} /></button>
              <button onClick={() => removeIconButton(idx)} className="text-red-400"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        <button onClick={addIconButton} className="flex items-center gap-1 text-sm text-green-600 mt-2">
          <Plus size={16} /> Add Icon Button
        </button>
      </div>
    </div>
  );
}