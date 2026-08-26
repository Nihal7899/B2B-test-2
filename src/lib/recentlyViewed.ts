import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const STORAGE_KEY = 'sk_recently_viewed_product_ids';
const FILE_PATH = 'recently_viewed.json';
const MAX_RECENT_PRODUCTS = 10;

export async function recordRecentlyViewed(productId: string): Promise<void> {
  if (!productId) return;

  try {
    const currentIds = await getRecentlyViewedIds();
    const updatedIds = [productId, ...currentIds.filter((id) => id !== productId)].slice(0, MAX_RECENT_PRODUCTS);

    // 1. Save to browser localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds));
    } catch (err) {
      console.warn('Failed to save recently viewed to localStorage:', err);
    }

    // 2. Save to Capacitor Filesystem
    try {
      await Filesystem.writeFile({
        path: FILE_PATH,
        data: JSON.stringify(updatedIds),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    } catch {
      // Ignored when running in standard browser environments without native filesystem
    }
  } catch (err) {
    console.warn('Error recording recently viewed product:', err);
  }
}

export async function getRecentlyViewedIds(): Promise<string[]> {
  let ids: string[] = [];

  // Try reading from Capacitor Filesystem first
  try {
    const file = await Filesystem.readFile({
      path: FILE_PATH,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });

    if (file.data) {
      const parsed = typeof file.data === 'string' ? JSON.parse(file.data) : file.data;
      if (Array.isArray(parsed)) {
        ids = parsed;
      }
    }
  } catch {
    // Fallback to browser localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          ids = parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to read recently viewed from localStorage:', err);
    }
  }

  return ids.slice(0, MAX_RECENT_PRODUCTS);
}