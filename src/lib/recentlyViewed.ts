const RECENTLY_VIEWED_KEY = 'sk_recently_viewed_product_ids';

export function recordRecentlyViewed(productId: string): void {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const updated = [productId, ...ids.filter((id) => id !== productId)].slice(0, 10);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to record recently viewed product:', e);
  }
}

export function getRecentlyViewedIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
