import { Product } from '@/types';
import { useCart } from '@/store';

export function ProductListView({ products, cart }: { products: Product[]; cart: ReturnType<typeof useCart> }) {
  return (
    <div className="space-y-3">
      {products.map(product => (
        <div key={product.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-ink-100">
          <img src={product.image} alt={product.name} className="h-20 w-20 rounded-xl object-cover" />
          <div className="flex-1">
            <p className="text-xs text-brand-600 font-bold">{product.brand}</p>
            <h3 className="text-sm font-bold">{product.name}</h3>
            <p className="text-xs text-ink-400">{product.packSize}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-brand-700">₹{product.price}</span>
              <span className="text-xs text-ink-400 line-through">₹{product.mrp}</span>
            </div>
          </div>
          <button
            onClick={() => cart.addToCart(product)}
            className="h-9 px-4 rounded-xl bg-brand-600 text-white text-sm font-bold"
          >
            Add
          </button>
        </div>
      ))}
    </div>
  );
}