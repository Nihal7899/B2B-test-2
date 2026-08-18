import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { useCart } from '@/store';

export function ProductGrid({ products, cart }: { products: Product[]; cart: ReturnType<typeof useCart> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map(product => (
        <ProductCard key={product.id} product={product} cart={cart} />
      ))}
    </div>
  );
}