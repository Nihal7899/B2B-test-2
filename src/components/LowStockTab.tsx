// src/components/LowStockTab.tsx
import { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DbProduct } from '@/services/catalog';

export default function LowStockTab() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState(0);

  const load = useCallback(async () => {
    try {
      // Fetch products where stock_quantity < stock_threshold and threshold > 0
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock_threshold', 0)
        .filter('stock_quantity', 'lt', 'stock_threshold')
        .order('name');

      if (error) {
        console.error('Error loading low stock products:', error);
        setProducts([]);
      } else {
        setProducts((data as DbProduct[]) ?? []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStock = async (id: string) => {
    if (stockValue < 0) {
      alert('Stock cannot be negative.');
      return;
    }
    await supabase.from('products').update({ stock_quantity: stockValue }).eq('id', id);
    setEditId(null);
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle size={36} className="text-green-500" strokeWidth={1.5} />
        <p className="text-sm text-ink-500 mt-3">All products are well-stocked 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">
        Showing products where stock is below the threshold. Update stock quickly below.
      </p>
      {products.map((prod) => (
        <div
          key={prod.id}
          className="bg-white border border-red-200 rounded-2xl p-3.5 shadow-card flex items-center gap-3"
        >
          {prod.image_url && (
            <img src={prod.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-800 truncate">{prod.brand} {prod.name}</p>
            <p className="text-[10px] text-ink-400 mt-0.5">
              Stock: <span className="font-bold text-red-600">{prod.stock_quantity}</span>
              &nbsp;· Threshold: {prod.stock_threshold}
            </p>
          </div>
          {editId === prod.id ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(Number(e.target.value))}
                className="w-16 h-9 rounded-lg border border-ink-200 px-2 text-sm outline-none focus:border-brand-500"
              />
              <button
                onClick={() => void updateStock(prod.id)}
                className="h-9 px-3 rounded-lg bg-brand-600 text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditId(prod.id);
                setStockValue(prod.stock_quantity);
              }}
              className="h-9 px-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold"
            >
              Update stock
            </button>
          )}
        </div>
      ))}
    </div>
  );
}