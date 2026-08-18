export interface IconGridItem {
  id: string;
  title: string;
  iconUrl: string;
  categoryId: string;   // reference to a category ID
}

export interface CategoryCard {
  id: string;
  title: string;
  imageUrl: string;
  categoryId: string;   // reference to a category ID
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
  productIds: string[];   // <-- now stores IDs only
  pillFilters?: string[];
  // ... no products array
}

// The rest of the types remain the same

export interface PackagingItem {
  id: string;
  title: string;
  imageUrl: string;
}

export interface OtherStoreItem {
  id: string;
  storeId: string;      // reference to a store ID
}

export interface StoreConfig {
  header: {
    title: string;
    subtitle: string;
    cartBadgeCount: number;
  };
  iconGrid: IconGridItem[];
  dietaryNeeds: CategoryCard[];
  promoBanner: PromoBanner;
  categories: CategorySection[];
  packaging: PackagingItem[];
  otherStores: OtherStoreItem[];}