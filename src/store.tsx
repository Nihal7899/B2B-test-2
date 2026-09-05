import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
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

  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  // Core helper to validate & update promo against a specific items array
  const validateAndApplyPromo = useCallback(async (code: string, currentItems: CartItemType[]) => {
    if (currentItems.length === 0) {
      setAppliedPromo(null);
      return { valid: false, discount: 0, error: 'Cart is empty' };
    }
    const currentSubtotal = currentItems.reduce((sum, i) => sum + i.effectiveUnitPrice * i.quantity, 0);
    const result = await validatePromoCode(code, currentSubtotal, currentItems);

    if (result.valid && result.promoId) {
      setAppliedPromo({ code, discount: result.discount, promoId: result.promoId });
      return { valid: true, discount: result.discount };
    } else {
      setAppliedPromo(null);
      return { valid: false, discount: 0, error: result.error || 'Promo code is no longer applicable' };
    }
  }, []);

  const revalidatePromo = useCallback(async (targetItems?: CartItemType[]) => {
    if (!appliedPromo) return { valid: true, discount: 0 };
    const itemsToUse = targetItems ?? items;
    return await validateAndApplyPromo(appliedPromo.code, itemsToUse);
  }, [appliedPromo, items, validateAndApplyPromo]);

  const addToCart = useCallback(async (product: Product, quantity = 1) => {
    if (!cartId) return;
    const existing = items.find((i) => i.product.id === product.id);
    const newQty = (existing?.quantity ?? 0) + quantity;
    const effectivePrice = await getEffectiveUnitPrice(product, newQty);

    const updatedItems = existing
      ? items.map((i) => (i.product.id === product.id ? { ...i, quantity: newQty, effectiveUnitPrice: effectivePrice } : i))
      : [...items, { product, quantity: newQty, effectiveUnitPrice: effectivePrice }];

    setItems(updatedItems);

    if (existing) {
      await supabase.from('cart_items').update({ quantity: newQty }).eq('cart_id', cartId).eq('product_id', product.id);
    } else {
      await supabase.from('cart_items').insert({ cart_id: cartId, product_id: product.id, quantity: newQty });
    }

    if (appliedPromo) {
      await validateAndApplyPromo(appliedPromo.code, updatedItems);
    }
  }, [cartId, items, appliedPromo, validateAndApplyPromo]);

  const removeFromCart = useCallback(async (productId: string) => {
    const updatedItems = items.filter((i) => i.product.id !== productId);
    setItems(updatedItems);

    if (cartId) {
      await supabase.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
    }

    if (appliedPromo) {
      await validateAndApplyPromo(appliedPromo.code, updatedItems);
    }
  }, [cartId, items, appliedPromo, validateAndApplyPromo]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const product = items.find((i) => i.product.id === productId)?.product;
    if (product) {
      const effectivePrice = await getEffectiveUnitPrice(product, quantity);
      const updatedItems = items.map((i) =>
        i.product.id === productId ? { ...i, quantity, effectiveUnitPrice: effectivePrice } : i
      );
      setItems(updatedItems);

      if (cartId) {
        await supabase.from('cart_items').update({ quantity }).eq('cart_id', cartId).eq('product_id', productId);
      }

      if (appliedPromo) {
        await validateAndApplyPromo(appliedPromo.code, updatedItems);
      }
    }
  }, [cartId, items, appliedPromo, removeFromCart, validateAndApplyPromo]);

  const getQuantity = useCallback((productId: string) => items.find((i) => i.product.id === productId)?.quantity ?? 0, [items]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (cartId) await supabase.from('cart_items').delete().eq('cart_id', cartId);
    setAppliedPromo(null);
  }, [cartId]);

  const applyPromo = useCallback(async (code: string) => {
    const result = await validateAndApplyPromo(code, items);
    return { success: result.valid, discount: result.discount, error: result.error };
  }, [items, validateAndApplyPromo]);

  const clearPromo = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.effectiveUnitPrice * i.quantity, 0), [items]);
  const totalMrp = useMemo(() => items.reduce((sum, i) => sum + i.product.mrp * i.quantity, 0), [items]);
  const discount = useMemo(() => totalMrp - subtotal, [totalMrp, subtotal]);
  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  // Stable memoized object reference prevents parent/child re-render cascades
  const contextValue = useMemo<CartContextValue>(() => ({
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
  }), [
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
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}