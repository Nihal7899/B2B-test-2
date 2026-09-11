import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActionType, DbCategory, DbProduct } from '@/types';

const ACTION_TYPES: ActionType[] = [
  'VIEW_CATEGORY', 'VIEW_BRAND', 'OPEN_STORE', 'VIEW_PRODUCT',
  'VIEW_OFFER', 'SEARCH', 'FILTER_PRODUCTS', 'OPEN_SMART_COLLECTION',
  'OPEN_CART', 'OPEN_ORDERS', 'OPEN_WISHLIST', 'OPEN_ADDRESS',
  'OPEN_SCREEN', 'OPEN_EXTERNAL_URL',
];

interface CtaActionEditorProps {
  actionType: ActionType;
  actionConfig: Record<string, any>;
  onChange: (actionType: ActionType, actionConfig: Record<string, any>) => void;
}

export function CtaActionEditor({ actionType, actionConfig, onChange }: CtaActionEditorProps) {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [smartCollections, setSmartCollections] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    void (async () => {
      const [
        { data: cats }, { data: prods }, { data: sc }, { data: brandData }, { data: storeData },
      ] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
        supabase.from('smart_collections').select('id, name').eq('is_active', true),
        supabase.from('trusted_brands').select('id, name').order('name'),
        supabase.from('stores').select('id, name').order('name'),
      ]);

      setCategories((cats as DbCategory[]) ?? []);
      setProducts((prods as DbProduct[]) ?? []);
      setSmartCollections((sc as any) ?? []);
      setBrands((brandData as any) ?? []);
      setStores((storeData as any) ?? []);
    })();
  }, []);

  const setConfig = (key: string, value: any) => {
    onChange(actionType, { ...actionConfig, [key]: value });
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-xl mt-3">
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Click Action Type</label>
        <select
          value={actionType || 'VIEW_CATEGORY'}
          onChange={(e) => onChange(e.target.value as ActionType, {})}
          className="w-full h-10 rounded-xl border border-gray-300 px-3 text-sm font-medium bg-white"
        >
          {ACTION_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {actionType === 'VIEW_CATEGORY' && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Category</label>
          <select
            value={actionConfig.category_id || ''}
            onChange={(e) => {
              const cat = categories.find(c => c.id === e.target.value);
              onChange(actionType, { ...actionConfig, category_id: e.target.value, category_name: cat?.name });
            }}
            className="w-full h-9 rounded-xl border border-gray-300 px-2.5 text-sm bg-white"
          >
            <option value="">Select category...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {actionType === 'VIEW_PRODUCT' && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Product</label>
          <select
            value={actionConfig.product_id || ''}
            onChange={(e) => {
              const p = products.find(x => x.id === e.target.value);
              onChange(actionType, { ...actionConfig, product_id: e.target.value, product_name: p?.name });
            }}
            className="w-full h-9 rounded-xl border border-gray-300 px-2.5 text-sm bg-white"
          >
            <option value="">Select product...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.brand} {p.name}</option>)}
          </select>
        </div>
      )}

      {actionType === 'VIEW_BRAND' && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Brand</label>
          <select
            value={actionConfig.brand_id || ''}
            onChange={(e) => setConfig('brand_id', e.target.value)}
            className="w-full h-9 rounded-xl border border-gray-300 px-2.5 text-sm bg-white"
          >
            <option value="">Select brand...</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {actionType === 'OPEN_STORE' && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Store</label>
          <select
            value={actionConfig.store_id || ''}
            onChange={(e) => setConfig('store_id', e.target.value)}
            className="w-full h-9 rounded-xl border border-gray-300 px-2.5 text-sm bg-white"
          >
            <option value="">Select store...</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {actionType === 'OPEN_EXTERNAL_URL' && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">External URL</label>
          <input
            value={actionConfig.url || ''}
            onChange={(e) => setConfig('url', e.target.value)}
            placeholder="https://..."
            className="w-full h-9 rounded-xl border border-gray-300 px-2.5 text-sm"
          />
        </div>
      )}

      {actionType === 'OPEN_SCREEN' && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Screen</label>
          <select
            value={actionConfig.screen || ''}
            onChange={(e) => setConfig('screen', e.target.value)}
            className="w-full h-9 rounded-xl border border-gray-300 px-2.5 text-sm bg-white"
          >
            <option value="">Select screen...</option>
            <option value="home">Home</option>
            <option value="categories">Categories</option>
            <option value="cart">Cart</option>
          </select>
        </div>
      )}

      {actionType === 'SEARCH' && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Search Query</label>
          <input
            value={actionConfig.query || ''}
            onChange={(e) => setConfig('query', e.target.value)}
            placeholder="e.g. basmati rice"
            className="w-full h-9 rounded-xl border border-gray-300 px-2.5 text-sm"
          />
        </div>
      )}
    </div>
  );
}
