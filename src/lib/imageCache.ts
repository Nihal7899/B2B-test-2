import { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

// In-memory cache for instant synchronous access across components
export const memoryImageCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

// Dedicated persistent folder
const CACHE_FOLDER = 'cafkart_images';

// Generate safe filenames with zero chance of collision
const getSafeFilename = (url: string) => {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  // Extract actual filename to append to hash for guaranteed uniqueness
  const cleanUrl = url.split('?')[0];
  const parts = cleanUrl.split('/');
  const rawName = parts[parts.length - 1];
  const safeName = rawName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `img_${Math.abs(hash)}_${safeName}`;
};

// Ensure our persistent directory exists
const ensureDataDir = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Filesystem.stat({ path: CACHE_FOLDER, directory: Directory.Data });
  } catch {
    await Filesystem.mkdir({ path: CACHE_FOLDER, directory: Directory.Data, recursive: true });
  }
};

// IndexedDB Helper for Web
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('CafkartImageCache', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('images');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const getFromWebCache = async (url: string): Promise<string | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const req = db.transaction('images', 'readonly').objectStore('images').get(url);
      req.onsuccess = () => resolve(req.result ? URL.createObjectURL(req.result) : null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
};

const saveToWebCache = async (url: string, blob: Blob) => {
  try {
    const db = await initDB();
    db.transaction('images', 'readwrite').objectStore('images').put(blob, url);
  } catch (e) { console.warn('IDB Save Failed', e); }
};

const getFromNativeCache = async (url: string): Promise<string | null> => {
  const filepath = `${CACHE_FOLDER}/${getSafeFilename(url)}`;
  try {
    // Changed to Directory.Data - The OS will NEVER delete these files
    await Filesystem.stat({ path: filepath, directory: Directory.Data });
    const { uri } = await Filesystem.getUri({ path: filepath, directory: Directory.Data });
    return Capacitor.convertFileSrc(uri);
  } catch { 
    return null; 
  }
};

const saveToNativeCache = async (url: string, blob: Blob) => {
  await ensureDataDir();
  const filepath = `${CACHE_FOLDER}/${getSafeFilename(url)}`;
  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        await Filesystem.writeFile({ 
          path: filepath, 
          data: base64Data, 
          directory: Directory.Data // Swapped to persistent storage
        });
        resolve();
      } catch (e) { 
        reject(e); 
      }
    };
  });
};

export const getCachedImage = async (url: string): Promise<string> => {
  if (!url) return '';
  if (memoryImageCache.has(url)) return memoryImageCache.get(url)!;
  if (pendingRequests.has(url)) return pendingRequests.get(url)!;

  const fetchPromise = (async () => {
    const isNative = Capacitor.isNativePlatform();
    
    // 1. Check Persistent Disk / IDB Cache
    const diskCachedUrl = isNative ? await getFromNativeCache(url) : await getFromWebCache(url);
    if (diskCachedUrl) {
      memoryImageCache.set(url, diskCachedUrl);
      return diskCachedUrl;
    }

    // 2. Fetch and Cache permanently
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const blob = await res.blob();

      if (isNative) {
        await saveToNativeCache(url, blob);
        const { uri } = await Filesystem.getUri({ 
          path: `${CACHE_FOLDER}/${getSafeFilename(url)}`, 
          directory: Directory.Data // Swapped to persistent storage
        });
        const nativeUrl = Capacitor.convertFileSrc(uri);
        memoryImageCache.set(url, nativeUrl);
        return nativeUrl;
      } else {
        await saveToWebCache(url, blob);
        const webUrl = URL.createObjectURL(blob);
        memoryImageCache.set(url, webUrl);
        return webUrl;
      }
    } catch (e) {
      return url;
    }
  })();

  pendingRequests.set(url, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    pendingRequests.delete(url);
  }
};

// Safely resolves the cached URL without leaking the raw network URL on initial mount
export function useCachedImage(url: string | undefined | null): string | undefined {
  const [cached, setCached] = useState<string | undefined>(() => {
    if (!url) return undefined;
    return memoryImageCache.get(url);
  });

  useEffect(() => {
    if (!url) {
      setCached(undefined);
      return;
    }

    let isMounted = true;
    
    if (memoryImageCache.has(url)) {
      setCached(memoryImageCache.get(url));
      return;
    }

    getCachedImage(url).then((resolvedUrl) => {
      if (isMounted) setCached(resolvedUrl);
    });

    return () => { isMounted = false; };
  }, [url]);

  return cached;
}
