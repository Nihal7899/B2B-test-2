import { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, ArrowRight, Loader2 } from 'lucide-react';
import type { Product } from '@/types';
import type { useCart } from '@/store';
import { fetchWishlist, toggleWishlist, fetchProductsByIds } from '@/services/catalog';
import { ProductCard } from '@/components/ProductCard';

interface WishlistScreenProps {
  cart: ReturnType<typeof useCart>;
  onProduct: (product: Product) => void;
  onShop: () => void;
}

const ITEMS_PER_PAGE = 20;

export function WishlistScreen({ cart, onProduct, onShop }: WishlistScreenProps) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Intersection Observer for Infinite Scroll
  const observer = useRef<IntersectionObserver | null>(null);

  const loadInitial = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const ids = await fetchWishlist();
      setWishlistIds(ids);

      const firstPageIds = ids.slice(0, ITEMS_PER_PAGE);
      if (firstPageIds.length > 0) {
        const fetchedProducts = await fetchProductsByIds(firstPageIds);
        // Maintain the exact chronological order of the wishlist
        const orderedProducts = firstPageIds
          .map((id) => fetchedProducts.find((p) => p.id === id))
          .filter((p): p is Product => Boolean(p));
        setProducts(orderedProducts);
      } else {
        setProducts([]);
      }
      
      setPage(1);
      setHasMore(ids.length > ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const nextIds = wishlistIds.slice((nextPage - 1) * ITEMS_PER_PAGE, nextPage * ITEMS_PER_PAGE);

      if (nextIds.length > 0) {
        const fetchedProducts = await fetchProductsByIds(nextIds);
        const orderedProducts = nextIds
          .map((id) => fetchedProducts.find((p) => p.id === id))
          .filter((p): p is Product => Boolean(p));

        setProducts((prev) => [...prev, ...orderedProducts]);
        setPage(nextPage);
        setHasMore(wishlistIds.length > nextPage * ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more wishlist items', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, wishlistIds]);

  // Attach observer to sentinel div at the bottom
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          void loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, loadMore]
  );

  useEffect(() => {
    void loadInitial(false);
  }, [loadInitial]);

  // Background Data Refresh Listeners
  useEffect(() => {
    let active = true;

    const handleWishlistChange = () => void loadInitial(true);
    
    const handleKeepAliveFocus = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (active && customEvent.detail?.key?.includes('/wishlist')) {
        void loadInitial(true);
      }
    };

    const handleVisibilityChange = () => {
      const isCurrentlyActive = window.location.pathname.includes('/wishlist');
      if (document.visibilityState === 'visible' && active && isCurrentlyActive) {
        void loadInitial(true);
      }
    };

    window.addEventListener('wishlist-updated', handleWishlistChange);
    window.addEventListener('keepalive:activated', handleKeepAliveFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('wishlist-updated', handleWishlistChange);
      window.removeEventListener('keepalive:activated', handleKeepAliveFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadInitial]);

  const handleWishlistToggle = async (productId: string) => {
    const isCurrentlyIn = wishlistIds.includes(productId);
    
    // Optimistically update screen
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
    setProducts((prev) => prev.filter((p) => p.id !== productId));

    try {
      await toggleWishlist(productId, isCurrentlyIn);
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId, wishlisted: !isCurrentlyIn },
        })
      );
    } catch (err) {
      console.error('Error toggling wishlist', err);
      void loadInitial(true); // Rollback on error silently
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="safe-top px-4 pb-6 space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Your wishlist</h1>
        <p className="text-xs text-ink-500 mt-1">
          {wishlistIds.length} saved {wishlistIds.length === 1 ? 'product' : 'products'}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="h-20 w-20 rounded-3xl bg-brand-50 flex items-center justify-center text-brand-600">
            <Heart size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-extrabold text-ink-900 mt-5">No saved products yet</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-[250px]">
            Tap the heart icon on products you want to save for later.
          </p>
          <button
            onClick={onShop}
            className="mt-5 h-11 px-5 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center gap-2 shadow-soft hover:bg-brand-700 transition"
          >
            Browse products <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={cart.getQuantity(product.id)}
              onAdd={() => cart.addToCart(product)}
              onIncrement={() => cart.addToCart(product)}
              onDecrement={() =>
                cart.updateQuantity(product.id, cart.getQuantity(product.id) - 1)
              }
              onClick={() => onProduct(product)}
              isWishlisted={true}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}

          {/* Sentinel Div for Intersection Observer (Triggers loadMore when scrolled into view) */}
          <div ref={sentinelRef} className="col-span-full h-10 flex items-center justify-center mt-4">
            {loadingMore && <Loader2 size={24} className="animate-spin text-brand-600" />}
          </div>
        </div>
      )}
    </div>
  );
}