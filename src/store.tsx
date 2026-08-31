import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Product, CartItem as CartItemType } from './types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import { getEffectiveUnitPrice, validatePromoCode } from '@/services/catalog';

interface CartContextValue {
  items: CartItemType[];
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  getQuantity: (productId: string) => number;
  clearCart: () => Promise<void>;
  subtotal: number;
  totalMrp: number;
  discount: number;
  totalItems: number;
  loading: boolean;
  cartId: string | null;
  appliedPromo: { code: string; discount: number; promoId: string } | null;
  applyPromo: (code: string) => Promise<{ success: boolean; discount: number; error?: string }>;
  clearPromo: () => void;
  refreshCart: () => Promise<void>;
  revalidatePromo: (currentItems?: CartItemType[]) => Promise<{ valid: boolean; discount: number; error?: string }>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartId, setCartId] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; promoId: string } | null>(null);

  // Ensure cart exists in Supabase
  const getOrCreateCartId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    if (cartId) return cartId;

    try {
      const { data: existing } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
      if (existing?.id) {
        setCartId(existing.id);
        return existing.id;
      }
      const { data: created, error } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single();
      if (error || !created) return null;
      setCartId(created.id);
      return created.id;
    } catch {
      return null;
    }
  }, [user, cartId]);

  const loadCart = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      let activeCartId = cartId;
      if (!activeCartId) {
        activeCartId = await getOrCreateCartId();
      }
      if (!activeCartId) { setLoading(false); return; }

      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('product_id, quantity, products!inner(id, brand, name, pack_size, mrp, wholesale_price, image_url, moq, rating, description, stock_quantity, is_active, category_id, hsn_code, gst_percentage)')
        .eq('cart_id', activeCartId);

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
          const effectivePrice = await getEffectiveUnitPrice(product, qty).catch(() => product.price);
          return { product, quantity: qty, effectiveUnitPrice: effectivePrice };
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setLoading(false);
    }
  }, [user, cartId, getOrCreateCartId]);

  useEffect(() => { void loadCart(); }, [loadCart]);

  const validateAndApplyPromo = useCallback(async (code: string, currentItems: CartItemType[]) => {
    if (currentItems.length === 0) {
      setAppliedPromo(null);
      return { valid: false, discount: 0, error: 'Cart is empty' };
    }
    try {
      const currentSubtotal = currentItems.reduce((sum, i) => sum + i.effectiveUnitPrice * i.quantity, 0);
      const result = await validatePromoCode(code, currentSubtotal, currentItems);
      if (result.valid && result.promoId) {
        setAppliedPromo({ code, discount: result.discount, promoId: result.promoId });
        return { valid: true, discount: result.discount };
      }
    } catch (e) {
      console.error('Promo revalidation error:', e);
    }
    setAppliedPromo(null);
    return { valid: false, discount: 0, error: 'Promo code is no longer applicable' };
  }, []);

  const revalidatePromo = useCallback(async (targetItems?: CartItemType[]) => {
    if (!appliedPromo) return { valid: true, discount: 0 };
    return await validateAndApplyPromo(appliedPromo.code, targetItems ?? items);
  }, [appliedPromo, items, validateAndApplyPromo]);

  // Optimistic addToCart
  const addToCart = useCallback(async (product: Product, quantity = 1) => {
    const activeCartId = await getOrCreateCartId();
    const existing = items.find((i) => i.product.id === product.id);
    const newQty = (existing?.quantity ?? 0) + quantity;

    // 1. Optimistic instant UI update
    const updatedItems = existing
      ? items.map((i) => (i.product.id === product.id ? { ...i, quantity: newQty } : i))
      : [...items, { product, quantity: newQty, effectiveUnitPrice: product.price }];
    setItems(updatedItems);

    // 2. Async DB update and price tier recalculation in background
    try {
      const effectivePrice = await getEffectiveUnitPrice(product, newQty).catch(() => product.price);
      setItems((prev) =>
        prev.map((i) => (i.product.id === product.id ? { ...i, effectiveUnitPrice: effectivePrice } : i))
      );

      if (activeCartId) {
        if (existing) {
          await supabase.from('cart_items').update({ quantity: newQty }).eq('cart_id', activeCartId).eq('product_id', product.id);
        } else {
          await supabase.from('cart_items').insert({ cart_id: activeCartId, product_id: product.id, quantity: newQty });
        }
      }
      if (appliedPromo) {
        await validateAndApplyPromo(appliedPromo.code, updatedItems);
      }
    } catch (err) {
      console.error('Failed to sync addToCart with database:', err);
    }
  }, [getOrCreateCartId, items, appliedPromo, validateAndApplyPromo]);

  // Optimistic removeFromCart
  const removeFromCart = useCallback(async (productId: string) => {
    const updatedItems = items.filter((i) => i.product.id !== productId);
    setItems(updatedItems);

    try {
      const activeCartId = await getOrCreateCartId();
      if (activeCartId) {
        await supabase.from('cart_items').delete().eq('cart_id', activeCartId).eq('product_id', productId);
      }
      if (appliedPromo) {
        await validateAndApplyPromo(appliedPromo.code, updatedItems);
      }
    } catch (err) {
      console.error('Failed to sync removeFromCart with database:', err);
    }
  }, [items, getOrCreateCartId, appliedPromo, validateAndApplyPromo]);

  // Optimistic updateQuantity
  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    const product = items.find((i) => i.product.id === productId)?.product;
    if (!product) return;

    // 1. Optimistic instant UI update
    const updatedItems = items.map((i) =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    setItems(updatedItems);

    // 2. Async DB sync
    try {
      const activeCartId = await getOrCreateCartId();
      const effectivePrice = await getEffectiveUnitPrice(product, quantity).catch(() => product.price);
      setItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, effectiveUnitPrice: effectivePrice } : i))
      );

      if (activeCartId) {
        await supabase.from('cart_items').update({ quantity }).eq('cart_id', activeCartId).eq('product_id', productId);
      }
      if (appliedPromo) {
        await validateAndApplyPromo(appliedPromo.code, updatedItems);
      }
    } catch (err) {
      console.error('Failed to sync updateQuantity with database:', err);
    }
  }, [items, removeFromCart, getOrCreateCartId, appliedPromo, validateAndApplyPromo]);

  const getQuantity = useCallback((productId: string) => items.find((i) => i.product.id === productId)?.quantity ?? 0, [items]);

  const clearCart = useCallback(async () => {
    setItems([]);
    setAppliedPromo(null);
    try {
      const activeCartId = await getOrCreateCartId();
      if (activeCartId) {
        await supabase.from('cart_items').delete().eq('cart_id', activeCartId);
      }
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  }, [getOrCreateCartId]);

  const applyPromo = useCallback(async (code: string) => {
    const result = await validateAndApplyPromo(code, items);
    return { success: result.valid, discount: result.discount, error: result.error };
  }, [items, validateAndApplyPromo]);

  const clearPromo = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  const subtotal = items.reduce((sum, i) => sum + i.effectiveUnitPrice * i.quantity, 0);
  const totalMrp = items.reduce((sum, i) => sum + i.product.mrp * i.quantity, 0);
  const discount = totalMrp - subtotal;
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
      revalidatePromo,
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
