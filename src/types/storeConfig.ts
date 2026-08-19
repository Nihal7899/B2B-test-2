// types/storeConfig.ts

export interface CategoryItem {
  id: string;
  title: string;
  icon: string;      // Lucide icon name (e.g., "Apple", "Wheat")
  description: string;
  productIds: string[];
}

export interface HighlightItem {
  id: string;
  label: string;
  icon: string;      // Lucide icon name
  categoryId: string; // Links to a category ID
}

export interface BulkDeal {
  enabled: boolean;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  icon: string;      // Lucide icon name
}

export interface TrendingIconButton {
  id: string;
  label: string;
  icon: string;      // Lucide icon name
  categoryId: string; // Links to a category ID
}

export interface TrendingBanner {
  enabled: boolean;
  title: string;
  subtitle: string;
  iconButtons: TrendingIconButton[];
  ctaText: string;
}

export interface HeroBanner {
  enabled: boolean;
  image: string;
  gradientFrom: string;
  gradientTo: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export interface StoreConfig {
  hero: HeroBanner;
  highlights: HighlightItem[];
  categories: CategoryItem[];
  bulkDeal: BulkDeal;
  trending: TrendingBanner;
}