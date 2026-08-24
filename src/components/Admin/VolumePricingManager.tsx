// src/components/admin/VolumePricingManager.tsx
import { useEffect, useState, useRef } from 'react';
import { Pencil, Trash2, Loader2, Save, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { VolumePricingTier } from '@/types';
import {
  fetchVolumePricing,
  createVolumePricingTier,
  updateVolumePricingTier,
  deleteVolumePricingTier,
} from '@/services/catalog';

export default function VolumePricingManager() {
  const [products, setProducts] = useState<{ id: string; brand: string; name: string; wholesale_price: number }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; brand: string; name: string; wholesale_price: number } | null>(null);
  const [tiers, setTiers] = useState<VolumePricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VolumePricingTier | null>(null);
  const [form, setForm] = useState({
    min_quantity: 1,
    max_quantity: '',
    unit_price: 0,
    discount_percent: '',
  });
  const [saving, setSaving] = useState(false);

  // Search/combobox state
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<typeof products>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Fetch products (including wholesale_price)
  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('id, brand, name, wholesale_price')
        .order('name');
      if (data && data.length > 0) {
        setProducts(data);
        // Select first product by default
        setSelectedProduct(data[0]);
        setFilteredProducts(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (!searchProductQuery.trim()) {
      setFilteredProducts(products.slice(0, 10));
    } else {
      const q = searchProductQuery.toLowerCase();
      setFilteredProducts(
        products
          .filter(p => (p.brand + ' ' + p.name).toLowerCase().includes(q))
          .slice(0, 10)
      );
    }
  }, [searchProductQuery, products]);

  // Fetch tiers when selected product changes
  useEffect(() => {
    if (!selectedProduct) return;
    async function loadTiers() {
      setLoading(true);
      const tiersData = await fetchVolumePricing(selectedProduct.id);
      setTiers(tiersData);
      setLoading(false);
    }
    loadTiers();
  }, [selectedProduct]);

  // Handle product selection
  const handleSelectProduct = (product: typeof products[0]) => {
    setSelectedProduct(product);
    setSearchProductQuery(product.brand + ' ' + product.name);
    setShowSuggestions(false);
  };

  // Handle save tier
  const handleSaveTier = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    const payload = {
      product_id: selectedProduct.id,
      min_quantity: form.min_quantity,
      max_quantity: form.max_quantity ? parseInt(form.max_quantity) : null,
      unit_price: form.unit_price,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
    };
    if (editing) {
      await updateVolumePricingTier(editing.id, payload);
    } else {
      await createVolumePricingTier(payload);
    }
    const tiersData = await fetchVolumePricing(selectedProduct.id);
    setTiers(tiersData);
    setEditing(null);
    setForm({ min_quantity: 1, max_quantity: '', unit_price: 0, discount_percent: '' });
    setSaving(false);
  };

  const handleDeleteTier = async (id: string) => {
    if (!selectedProduct) return;
    await deleteVolumePricingTier(id);
    const tiersData = await fetchVolumePricing(selectedProduct.id);
    setTiers(tiersData);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading && products.length === 0) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-4">
      {/* Product Search Combobox */}
      <div className="relative" ref={comboboxRef}>
        <label className="block text-xs font-bold text-ink-600 mb-1">Select Product</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
          <input
            type="text"
            placeholder="Search by brand or name..."
            value={searchProductQuery}
            onChange={(e) => {
              setSearchProductQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full h-10 rounded-xl border border-ink-200 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
          />
          {searchProductQuery && (
            <button
              onClick={() => {
                setSearchProductQuery('');
                setSelectedProduct(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredProducts.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-ink-200 rounded-xl shadow-lg">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                className="px-3 py-2 cursor-pointer hover:bg-brand-50 flex justify-between items-center"
              >
                <span className="text-sm">{p.brand} {p.name}</span>
                <span className="text-xs text-ink-400">₹{p.wholesale_price}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected product details - show wholesale price */}
      {selectedProduct && (
        <div className="bg-ink-50 border border-ink-100 rounded-xl p-3 flex justify-between items-center">
          <span className="text-sm font-medium text-ink-700">
            Selected: <span className="font-bold">{selectedProduct.brand} {selectedProduct.name}</span>
          </span>
          <span className="text-sm text-brand-600 font-bold">Wholesale Price: ₹{selectedProduct.wholesale_price}</span>
        </div>
      )}

      {/* Add / Edit Tier Form */}
      <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-ink-900">{editing ? 'Edit' : 'Add'} Volume Tier</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Min Quantity</label>
            <input
              type="number"
              value={form.min_quantity}
              onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Max Quantity (empty = unlimited)</label>
            <input
              type="number"
              value={form.max_quantity}
              onChange={(e) => setForm({ ...form, max_quantity: e.target.value })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Unit Price</label>
            <input
              type="number"
              step="0.01"
              value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })}
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Discount % (optional)</label>
            <input
              type="number"
              step="0.1"
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
              placeholder="e.g. 10"
              className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <button
          onClick={handleSaveTier}
          disabled={saving || !form.unit_price || !selectedProduct}
          className="w-full h-10 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {editing ? 'Update Tier' : 'Add Tier'}
        </button>
      </div>

      {/* Existing Tiers */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-ink-600">Existing Tiers</p>
        {tiers.length === 0 ? (
          <p className="text-xs text-ink-400">No volume tiers defined for this product.</p>
        ) : (
          tiers.map((tier) => (
            <div key={tier.id} className="bg-white border border-ink-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-ink-800">
                  {tier.min_quantity} – {tier.max_quantity ?? '∞'} qty
                </span>
                <span className="ml-3 text-sm text-brand-600">₹{tier.unit_price}</span>
                {tier.discount_percent && <span className="ml-2 text-xs text-ink-500">({tier.discount_percent}% off)</span>}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(tier);
                    setForm({
                      min_quantity: tier.min_quantity,
                      max_quantity: tier.max_quantity?.toString() ?? '',
                      unit_price: tier.unit_price,
                      discount_percent: tier.discount_percent?.toString() ?? '',
                    });
                  }}
                  className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => void handleDeleteTier(tier.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}