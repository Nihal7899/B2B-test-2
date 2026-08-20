// context/StoreContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { StoreConfig } from '@/types/storeConfig';
import { fetchStoreConfig, updateStoreConfig } from '@/services/catalog';

// Cache for store configs
const configCache = new Map<string, { data: StoreConfig; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// 🔥 GLOBAL STORE THEME – persists across navigation
let globalStoreTheme: ThemeProps | null = null;

// 🔥 Get current store theme from global
export function getGlobalStoreTheme(): ThemeProps | null {
  return globalStoreTheme;
}

// 🔥 Set global store theme
export function setGlobalStoreTheme(theme: ThemeProps) {
  globalStoreTheme = theme;
}

interface ThemeProps {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  borderColor: string;
  buttonStyle: 'brand' | 'outline' | 'ghost';
  gradientFrom: string;
  gradientTo: string;
}

interface StoreContextType {
  config: StoreConfig;
  storeId: string;
  loading: boolean;
  theme: ThemeProps;
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
    hero: { enabled: true, image: '', gradientFrom: '#065f46', gradientTo: '#16a34a', title: '', subtitle: '', ctaText: 'Shop Now', ctaLink: '/categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
    stats: { enabled: false, productsCount: 0, customersCount: 0, years: 0, deliveriesCount: 0 },
    promoStrip: { enabled: false, message: '', ctaText: '', ctaLink: '', backgroundColor: '#10b981', textColor: '#ffffff' },
    features: { enabled: false, items: [] },
    iconGrid: [],
    dietaryNeeds: [],
    promoBanner: { badge: '', title: '', subtitle: '', backgroundTheme: 'bg-gray-100', floatingProductImages: [] },
    categories: [],
    packaging: [],
    otherStores: [],
    highlights: [],
    banners: [],
    storeTheme: { from: '#10b981', to: '#059669', accent: '#fbbf24' },
    blurb: '',
    trustBadge: '',
    story: '',
    bulkDeal: { enabled: false, tag: '', title: '', subtitle: '', cta: '', icon: 'Package', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
    trending: { enabled: false, title: 'Top categories', subtitle: 'Jump straight to what customers are buying most', iconButtons: [], ctaText: 'Browse all categories', ctaBgColor: '#ffffff', ctaTextColor: '#065f46' },
  });
  const [loading, setLoading] = useState(true);
  const isMounted = React.useRef(true);

  // Compute theme from config and update global
  const theme = useMemo(() => {
    const t = {
      primaryColor: config?.hero?.gradientFrom || '#10b981',
      secondaryColor: config?.hero?.gradientTo || '#059669',
      textColor: '#1f2937',
      borderColor: '#e5e7eb',
      buttonStyle: 'brand' as 'brand' | 'outline' | 'ghost',
      gradientFrom: config?.hero?.gradientFrom || '#065f46',
      gradientTo: config?.hero?.gradientTo || '#16a34a',
    };
    // 🔥 Update global theme
    setGlobalStoreTheme(t);
    return t;
  }, [config]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!storeId) return;

    const loadConfig = async () => {
      const cached = configCache.get(storeId);
      const now = Date.now();
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        if (isMounted.current) {
          setConfig(cached.data);
          setLoading(false);
        }
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
        theme,
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

// 🔥 Hook to get theme (works even without StoreProvider)
export function useStoreTheme(): ThemeProps {
  const context = useContext(StoreContext);
  if (context) {
    return context.theme;
  }
  const global = getGlobalStoreTheme();
  if (global) {
    return global;
  }
  return {
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
    buttonStyle: 'brand',
    gradientFrom: '#065f46',
    gradientTo: '#16a34a',
  };
}