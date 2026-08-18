import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoreConfig } from '@/types/storeConfig';
import { fetchStoreConfig, updateStoreConfig } from '@/services/catalog';

// Cache for store configs
const configCache = new Map<string, { data: StoreConfig; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface StoreContextType {
  config: StoreConfig;
  storeId: string;
  loading: boolean;
  updateConfig: (newConfig: StoreConfig) => void;
  updateHeader: (header: Partial<StoreConfig['header']>) => void;
  updateIconGrid: (items: StoreConfig['iconGrid']) => void;
  updateDietaryNeeds: (items: StoreConfig['dietaryNeeds']) => void;
  updatePromoBanner: (banner: StoreConfig['promoBanner']) => void;
  updateCategory: (categoryId: string, updates: Partial<StoreConfig['categories'][0]>) => void;
  addProduct: (categoryId: string, product: StoreConfig['categories'][0]['products'][0]) => void;
  updateProduct: (categoryId: string, productId: string, updates: Partial<StoreConfig['categories'][0]['products'][0]>) => void;
  deleteProduct: (categoryId: string, productId: string) => void;
  updatePackaging: (items: StoreConfig['packaging']) => void;
  updateOtherStores: (items: StoreConfig['otherStores']) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ storeId: string; children: ReactNode }> = ({ storeId, children }) => {
  const [config, setConfig] = useState<StoreConfig>({
    header: { title: 'Store', subtitle: '', cartBadgeCount: 0 },
    iconGrid: [],
    dietaryNeeds: [],
    promoBanner: { badge: '', title: '', subtitle: '', backgroundTheme: 'bg-gray-100', floatingProductImages: [] },
    categories: [],
    packaging: [],
    otherStores: [],
  });
  const [loading, setLoading] = useState(true);
  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!storeId) return;

    const loadConfig = async () => {
      // Check cache
      const cached = configCache.get(storeId);
      const now = Date.now();
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        if (isMounted.current) {
          setConfig(cached.data);
          setLoading(false);
        }
        // Refresh in background
        try {
          const fresh = await fetchStoreConfig(storeId);
          if (isMounted.current) {
            configCache.set(storeId, { data: fresh, timestamp: now });
            setConfig(fresh);
          }
        } catch (e) {
          console.error('Background refresh failed', e);
        }
        return;
      }

      try {
        const data = await fetchStoreConfig(storeId);
        if (isMounted.current) {
          configCache.set(storeId, { data, timestamp: now });
          setConfig(data);
        }
      } catch (e) {
        console.error('Failed to load store config', e);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadConfig();
  }, [storeId]);

  const updateConfig = async (newConfig: StoreConfig) => {
    setConfig(newConfig);
    configCache.set(storeId, { data: newConfig, timestamp: Date.now() });
    await updateStoreConfig(storeId, newConfig);
  };

  const updateHeader = (header: Partial<StoreConfig['header']>) =>
    updateConfig({ ...config, header: { ...config.header, ...header } });

  const updateIconGrid = (iconGrid: StoreConfig['iconGrid']) =>
    updateConfig({ ...config, iconGrid });

  const updateDietaryNeeds = (dietaryNeeds: StoreConfig['dietaryNeeds']) =>
    updateConfig({ ...config, dietaryNeeds });

  const updatePromoBanner = (promoBanner: StoreConfig['promoBanner']) =>
    updateConfig({ ...config, promoBanner });

  const updateCategory = (categoryId: string, updates: Partial<StoreConfig['categories'][0]>) => {
    const categories = config.categories.map(cat =>
      cat.id === categoryId ? { ...cat, ...updates } : cat
    );
    updateConfig({ ...config, categories });
  };

  const addProduct = (categoryId: string, product: StoreConfig['categories'][0]['products'][0]) => {
    const categories = config.categories.map(cat =>
      cat.id === categoryId ? { ...cat, products: [...cat.products, product] } : cat
    );
    updateConfig({ ...config, categories });
  };

  const updateProduct = (categoryId: string, productId: string, updates: Partial<StoreConfig['categories'][0]['products'][0]>) => {
    const categories = config.categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, products: cat.products.map(p => (p.id === productId ? { ...p, ...updates } : p)) }
        : cat
    );
    updateConfig({ ...config, categories });
  };

  const deleteProduct = (categoryId: string, productId: string) => {
    const categories = config.categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, products: cat.products.filter(p => p.id !== productId) }
        : cat
    );
    updateConfig({ ...config, categories });
  };

  const updatePackaging = (packaging: StoreConfig['packaging']) =>
    updateConfig({ ...config, packaging });

  const updateOtherStores = (otherStores: StoreConfig['otherStores']) =>
    updateConfig({ ...config, otherStores });

  return (
    <StoreContext.Provider
      value={{
        config,
        storeId,
        loading,
        updateConfig,
        updateHeader,
        updateIconGrid,
        updateDietaryNeeds,
        updatePromoBanner,
        updateCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        updatePackaging,
        updateOtherStores,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};