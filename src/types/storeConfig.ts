// types/storeConfig.ts

export interface IconGridItem {
  id: string;
  title: string;
  iconUrl: string;
  categoryId: string;      // reference to category ID from config.categories
}

export interface CategoryCard {
  id: string;
  title: string;
  imageUrl: string;
  categoryId: string;      // reference to category ID from config.categories
}

export interface PromoBanner {
  badge: string;
  title: string;
  subtitle: string;
  backgroundTheme: string;
  floatingProductImages: string[];
}

export interface ProductTier {
  minQty: number;
  unitPrice: number;
}

export interface Product {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  imageUrl: string;
  packSize: string;
  price: number;
  originalPrice: number;
  tieredPricing: ProductTier[];
  inStock: boolean;
}

export interface SubCategoryTab {
  id: string;
  label: string;
  iconUrl: string;
}

export interface CategorySection {
  id: string;
  title: string;
  tabs: SubCategoryTab[];
  productIds: string[];
  pillFilters?: string[];
}

export interface PackagingItem {
  id: string;
  title: string;
  imageUrl: string;
}

export interface OtherStoreItem {
  id: string;
  storeId: string;
}

export interface HighlightItem {
  id: string;
  label: string;
  icon: string;      // Lucide icon name
  desc: string;
  productIds: string[];
}

export interface BannerItem {
  id: string;
  tag: string;
  title: string;
  sub: string;
  cta: string;
  icon: string;      // Lucide icon name
}

export interface FeatureItem {
  id: string;
  icon: string;      // emoji or image URL
  title: string;
  description: string;
}

export interface StoreTheme {
  from: string;      // hex color
  to: string;        // hex color
  accent: string;    // hex color
}

export interface StoreConfig {
  header: {
    title: string;
    subtitle: string;
    cartBadgeCount: number;
  };
  hero: {
    enabled: boolean;
    imageUrl: string;
    overlayColor: string;
    overlayOpacity: number;
    tagline: string;
    ctaText: string;
    ctaLink: string;
  };
  stats: {
    enabled: boolean;
    productsCount: number;
    customersCount: number;
    years: number;
    deliveriesCount: number;
  };
  promoStrip: {
    enabled: boolean;
    message: string;
    ctaText: string;
    ctaLink: string;
    backgroundColor: string;
    textColor: string;
  };
  features: {
    enabled: boolean;
    items: FeatureItem[];
  };
  iconGrid: IconGridItem[];
  dietaryNeeds: CategoryCard[];
  promoBanner: PromoBanner;
  categories: CategorySection[];
  packaging: PackagingItem[];
  otherStores: OtherStoreItem[];
  highlights: HighlightItem[];
  banners: BannerItem[];
  storeTheme: StoreTheme;
  blurb: string;
  trustBadge: string;
  story: string;
}