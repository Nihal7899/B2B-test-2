// store.tsx

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Product, CartItem as CartItemType } from './types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import { getEffectiveUnitPrice, validatePromoCode } from '@/services/catalog';

interface CartContextValue {
  items: CartItemType[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getQuantity: (productId: string) => number;
  clearCart: () => void;
  subtotal: number;
  totalMrp: number;
  discount: number;
  totalItems: number;
  loading: boolean;
  cartId: string | null;
  // new
  appliedPromo: { code: string; discount: number; promoId: string } | null;
  applyPromo: (code: string) => Promise<{ success: boolean; discount: number; error?: string }>;
  clearPromo: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; promoId: string } | null>(null);

  // Load cart from DB
  const loadCart = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
      if (!cart) { setItems([]); setLoading(false); return; }
      setCartId(cart.id);

      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('product_id, quantity, products!inner(id, brand, name, pack_size, mrp, wholesale_price, image_url, moq, rating, description, stock_quantity, is_active, category_id, hsn_code, gst_percentage)')
        .eq('cart_id', cart.id);

      if (cartItems) {
        const { data: catData } = await supabase.from('categories').select('id, slug');
        const catMap: Record<string, string> = {};
        (catData as { id: string; slug: string }[] | null)?.forEach((c) => { catMap[c.id] = c.slug; });

        const mapped: CartItemType[] = await Promise.all(cartItems.map(async (row: Record<string, unknown>) => {
          const p = row.products as Record<string, unknown>;
          const product: Product = {
            id: p.id as string,
            brand: p.brand as string,
            name: p.name as string,
            packSize: p.pack_size as string,
            mrp: Number(p.mrp),
            price: Number(p.wholesale_price),
            image: p.image_url as string,
            category: catMap[p.category_id as string] ?? '',
            moq: p.moq as number,
            rating: Number(p.rating),
            description: p.description as string,
            inStock: (p.stock_quantity as number) > 0,
            hsn_code: p.hsn_code as string,
            gst_percentage: p.gst_percentage as number,
          };
          const qty = row.quantity as number;
          const effectivePrice = await getEffectiveUnitPrice(product, qty);
          return {
            product,
            quantity: qty,
            effectiveUnitPrice: effectivePrice,
          };
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error('Failed to load cart', err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadCart(); }, [loadCart]);

  // Refresh cart (e.g., after promo apply or volume change)
  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  const addToCart = useCallback(async (product: Product, quantity = 1) => {
    if (!cartId) return;
    const existing = items.find((i) => i.product.id === product.id);
    const newQty = (existing?.quantity ?? 0) + quantity;
    // Compute effective price for new quantity
    const effectivePrice = await getEffectiveUnitPrice(product, newQty);
    setItems((prev) => {
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: newQty, effectiveUnitPrice: effectivePrice } : i
        );
      }
      return [...prev, { product, quantity: newQty, effectiveUnitPrice: effectivePrice }];
    });
    // Update DB
    if (existing) {
      await supabase.from('cart_items').update({ quantity: newQty }).eq('cart_id', cartId).eq('product_id', product.id);
    } else {
      await supabase.from('cart_items').insert({ cart_id: cartId, product_id: product.id, quantity: newQty });
    }
  }, [cartId, items]);

  const removeFromCart = useCallback(async (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    if (cartId) await supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
  }, [cartId]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) { void removeFromCart(productId); return; }
    const product = items.find(i => i.product.id === productId)?.product;
    if (product) {
      const effectivePrice = await getEffectiveUnitPrice(product, quantity);
      setItems((prev) => prev.map((i) =>
        i.product.id === productId ? { ...i, quantity, effectiveUnitPrice: effectivePrice } : i
      ));
      if (cartId) await supabase.from('cart_items').update({ quantity }).eq('cart_id', cartId).eq('product_id', productId);
    }
  }, [cartId, items, removeFromCart]);

  const getQuantity = useCallback((productId: string) => items.find((i) => i.product.id === productId)?.quantity ?? 0, [items]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (cartId) await supabase.from('cart_items').delete().eq('cart_id', cartId);
  }, [cartId]);

  // Promo code functions
  const applyPromo = useCallback(async (code: string) => {
    // Compute subtotal (using effective prices)
    const subtotal = items.reduce((sum, i) => sum + i.effectiveUnitPrice * i.quantity, 0);
    const result = await validatePromoCode(code, subtotal, items);
    if (result.valid && result.promoId) {
      setAppliedPromo({ code, discount: result.discount, promoId: result.promoId });
      return { success: true, discount: result.discount };
    } else {
      return { success: false, discount: 0, error: result.error };
    }
  }, [items]);

  const clearPromo = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  // Computed values
  const subtotal = items.reduce((sum, i) => sum + i.effectiveUnitPrice * i.quantity, 0);
  const totalMrp = items.reduce((sum, i) => sum + i.product.mrp * i.quantity, 0);
  const discount = totalMrp - subtotal; // includes volume discount
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      getQuantity,
      clearCart,
      subtotal,
      totalMrp,
      discount,
      totalItems,
      loading,
      cartId,
      appliedPromo,
      applyPromo,
      clearPromo,
      refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}