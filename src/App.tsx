// src/App.tsx
import {
  useState,
  useMemo,
  useRef,
  type ReactNode,
  useEffect,
  useCallback,
} from 'react';
import {
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import { isVersionOutdated } from '@/utils/version';
import { AppUpdateBottomSheet, type AppVersionData } from '@/components/AppUpdateBottomSheet';

import { SplashScreen } from '@/components/SplashScreen';
import { BottomNavigation } from '@/components/BottomNavigation';
import { KeepAliveRenderer } from '@/components/KeepAliveRenderer';
import { setFullScreenSystemBars } from '@/hooks/useSystemBars';

import { HomeScreen } from '@/screens/HomeScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { CategoriesScreen } from '@/screens/CategoriesScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { CartScreen } from '@/screens/CartScreen';
import { AccountScreen } from '@/screens/AccountScreen';
import { ProductDetailScreen } from '@/screens/ProductDetailScreen';
import { CheckoutScreen } from '@/screens/CheckoutScreen';
import { OrderDetailScreen } from '@/screens/OrderDetailScreen';
import { AddressesScreen } from '@/screens/AddressesScreen';
import { WishlistScreen } from '@/screens/WishlistScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import { WarehouseScreen } from '@/screens/WarehouseScreen';
import { DeliveryScreen } from '@/screens/DeliveryScreen';
import { InvestorScreen } from '@/screens/InvestorScreen'; 
import { FilteredProductsScreen } from '@/screens/FilteredProductsScreen';
import { BusinessRegistrationScreen } from '@/screens/BusinessRegistrationScreen';
import { AuthScreen } from '@/screens/AuthScreen';
import StoreScreen from '@/screens/StoreScreen';
import { CategoryScreen } from '@/screens/CategoryScreen';
import { BrandScreen } from '@/screens/BrandScreen';
import { WalletScreen } from '@/screens/WalletScreen';
import { HomeLoadingScreen } from '@/components/HomeLoadingScreen';
import type {
  Category,
  Product,
  ScreenName,
  FilterConfig,
  PromoBanner,
  Business,
  Store,
} from '@/types';

import { useCart } from '@/store';
import { useAuth } from '@/auth';

import {
  handleHomeAction,
  type ActionContext,
} from '@/services/actionResolver';

import {
  NavigationProvider,
  useNavigation,
} from '@/context/NavigationContext';

import {
  initializePushNotifications,
  getPendingPushData,
} from '@/services/push';

import { getOrFetchHomeData, getHomeDataSync } from '@/services/homePreload';
import { startContinuousLocationWatch, stopContinuousLocationWatch } from '@/services/location';
import HelpCenterScreen from '@/screens/HelpCenterScreen';

// ----------------------------------------------------
// CURRENT APP VERSION CONSTANT
// ----------------------------------------------------
export const CURRENT_APP_VERSION = '1.0.0';

const SCREEN_TO_PATH: Record<ScreenName | 'investor', string> = {
  home: '/',
  search: '/search',
  categories: '/categories',
  orders: '/orders',
  cart: '/cart',
  account: '/account',
  product: '/product',
  admin: '/admin',
  warehouse: '/warehouse',
  delivery: '/delivery',
  investor: '/investor', 
  addresses: '/addresses',
  wishlist: '/wishlist',
  checkout: '/checkout',
  orderDetail: '/order',
  businessRegistration: '/business-registration',
  businessSelect: '/business-select',
  outletSelect: '/outlet-select',
  filteredProducts: '/filtered',
  store: '/store',
  categoryDetail: '/category',
  brand: '/brand',
  wallet: '/wallet',
  helpCenter: '/help',
};

const PATH_TO_SCREEN: Record<string, ScreenName | 'investor'> =
  Object.fromEntries(
    Object.entries(SCREEN_TO_PATH).map(
      ([k, v]) => [v, k as ScreenName | 'investor']
    )
  );

function pathFor(screen: ScreenName | 'investor', params?: Record<string, string>): string {
  const base = SCREEN_TO_PATH[screen] ?? '/';
  if (!params) return base;
  const qs = new URLSearchParams(params);
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
}

function parseRoute(pathname: string): { screen: ScreenName | 'investor'; key: string } {
  const screen = PATH_TO_SCREEN[pathname] ?? 'home';
  return { screen, key: pathname };
}

function BackButtonHandler({ disableBack }: { disableBack?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerBack } = useNavigation();
  const lastBackPress = useRef(0);
  const toastId = useRef<string | null>(null);
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let mounted = true;

    const handleBack = () => {
      if (disableBack) {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          if (toastId.current) toast.dismiss(toastId.current);
          CapApp.exitApp();
        } else {
          lastBackPress.current = now;
          toastId.current = toast('Press back again to exit', {
            duration: 2000,
            icon: '←',
            style: { background: 'var(--bg-card)', color: 'var(--text-primary)' },
          });
        }
        return;
      }

      if (triggerBack()) return;

      const now = Date.now();
      const isHomeScreen = location.pathname === '/';

      if (isHomeScreen) {
        if (now - lastBackPress.current < 2000) {
          if (toastId.current) toast.dismiss(toastId.current);
          CapApp.exitApp();
        } else {
          lastBackPress.current = now;
          toastId.current = toast('Press back again to exit', {
            duration: 2000,
            icon: '←',
            style: { background: 'var(--bg-card)', color: 'var(--text-primary)' },
          });
        }
      } else if (location.pathname === '/login') {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    };

    CapApp.addListener('backButton', handleBack)
      .then((l) => {
        if (mounted) listenerRef.current = l;
      })
      .catch(() => {});

    return () => {
      mounted = false;
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, [location.pathname, navigate, triggerBack, disableBack]);

  return null;
}

function App() {
  const cart = useCart();
  const { user, role, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showSplash, setShowSplash] = useState(true);
  const [isHomeReady, setIsHomeReady] = useState(() => {
    const cache = getHomeDataSync();
    return Boolean(cache && cache._userId);
  });
  
  const [showHomeLoader, setShowHomeLoader] = useState(() => {
    const cache = getHomeDataSync();
    return !Boolean(cache && cache._userId);
  });

  // --- APP UPDATE STATE ---
  const [versionData, setVersionData] = useState<AppVersionData | null>(null);
  const [needsForceUpdate, setNeedsForceUpdate] = useState(false);

  useEffect(() => {
    let active = true;

    // 1. Exit immediately if running in a web browser
    if (!Capacitor.isNativePlatform()) return;

    const checkAppVersion = async () => {
      try {
        const { data, error } = await supabase
          .from('app_versions')
          .select('app_version, playstore_link, app_store_link, release_notes')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Failed to fetch app version:', error);
          return;
        }

        if (data && active) {
          setVersionData(data);
          if (isVersionOutdated(CURRENT_APP_VERSION, data.app_version)) {
            setNeedsForceUpdate(true);
          }
        }
      } catch (err) {
        console.warn('App version check exception:', err);
      }
    };

    checkAppVersion();

    return () => {
      active = false;
    };
  }, []);
  // ------------------------

  useEffect(() => {
    let active = true;

    if (authLoading) return;

    if (!user) {
      setShowSplash(false);
      setIsHomeReady(false);
      setShowHomeLoader(true);
      return;
    }

    const bootAndWarmUpCache = async () => {
      try {
        await getOrFetchHomeData(false);
      } catch (error) {
        console.warn('Cache warmup interrupted:', error);
      } finally {
        if (active) {
          setIsHomeReady(true);
        }
      }
    };

    bootAndWarmUpCache();

    return () => {
      active = false;
    };
  }, [user, authLoading]);



  const filterConfigRef = useRef<FilterConfig | null>(null);
  const filterTitleRef = useRef('Products');

  const { screen } = useMemo(() => parseRoute(location.pathname), [location.pathname]);

  const isDeliveryPartner = role === 'delivery_partner';
  const isWarehouseManager = role === 'warehouse_manager';
  const isInvestor = role === 'investor';
  const isDedicatedStaff = isDeliveryPartner || isWarehouseManager;

  // --- ZOMATO-STYLE CONTINUOUS FOREGROUND GPS STREAM ---
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user || isDedicatedStaff) return;

    // Start continuous hardware watch
    void startContinuousLocationWatch();

    return () => {
      void stopContinuousLocationWatch();
    };
  }, [user, isDedicatedStaff]);
  // -----------------------------------------------------

  const deliveryTab = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab === 'pending' || tab === 'picked_up' || tab === 'delivered' || tab === 'account' || tab === 'dashboard') {
      return tab;
    }
    return 'dashboard';
  }, [location.search]);

  const handlePushNavigation = useCallback(
    (data: any) => {
      if (!data || needsForceUpdate) return;

      const targetTab = data.tab;
      const targetScreen = data.screen;
      const targetOrderId = data.order_id || data.orderId;
      const actionId = data.actionId;

      if (targetTab === 'pending' || targetScreen === 'delivery' || actionId === 'view_pending') {
        navigate('/delivery?tab=pending');
        return;
      }

      if (targetScreen === 'orderDetail' || actionId === 'view_order') {
        if (targetOrderId) {
          navigate(`/order?id=${targetOrderId}`);
        } else {
          navigate('/orders');
        }
        return;
      }

      if (data.url) {
        navigate(data.url);
      }
    },
    [navigate, needsForceUpdate]
  );

  useEffect(() => {
    const coldData = getPendingPushData();
    if (coldData) {
      setTimeout(() => {
        handlePushNavigation(coldData);
      }, 350);
    }

    let urlListener: Promise<{ remove: () => void }> | null = null;
    if (Capacitor.isNativePlatform()) {
      urlListener = CapApp.addListener('appUrlOpen', ({ url }) => {
        if (needsForceUpdate) return;
        try {
          const parsed = new URL(url);
          const path = parsed.pathname || parsed.host;
          const search = parsed.search || '';

          if (path.includes('delivery')) {
            navigate(`/delivery${search ? search : '?tab=pending'}`);
          } else if (path.includes('order')) {
            navigate(`/order${search}`);
          } else if (path.includes('orders')) {
            navigate('/orders');
          }
        } catch (err) {
          console.error('Deep link parse error:', err);
        }
      });
    }

    const onPushClick = (event: CustomEvent) => {
      handlePushNavigation(event.detail);
    };

    window.addEventListener('push_notification_click' as any, onPushClick);

    return () => {
      if (urlListener) {
        urlListener.then((l) => l.remove()).catch(() => {});
      }
      window.removeEventListener('push_notification_click' as any, onPushClick);
    };
  }, [handlePushNavigation, navigate, needsForceUpdate]);

  const key = useMemo(() => {
    if (isDeliveryPartner) return `delivery_dedicated_${deliveryTab}`;
    if (isWarehouseManager) return 'warehouse_dedicated';
    if (isInvestor) return 'investor_dedicated'; 
    if (screen === 'store') {
      const searchParams = new URLSearchParams(location.search);
      const storeId = searchParams.get('storeId') || 'default';
      return `store|${storeId}`;
    }
    if (screen === 'brand') {
      const brandId = new URLSearchParams(location.search).get('id') || 'default';
      return `brand|${brandId}`;
    }
    if (screen === 'product') {
      const searchParams = new URLSearchParams(location.search);
      const productId = searchParams.get('id') || 'default';
      return `product|${productId}`;
    }
    if (screen === 'categoryDetail') {
      const searchParams = new URLSearchParams(location.search);
      const categoryId = searchParams.get('id') || 'default';
      return `category|${categoryId}`;
    }
    return location.pathname;
  }, [screen, location.pathname, location.search, isDeliveryPartner, isWarehouseManager, isInvestor, deliveryTab]);

  const isFullBleed =
    isDedicatedStaff ||
    screen === 'home' ||
    screen === 'store' ||
    screen === 'categories' ||
    screen === 'categoryDetail' ||
    screen === 'brand' ||
    screen === 'search' ||
    screen === 'product' ||
    screen === 'investor'; 

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const darkHeaderScreens = ['home', 'store', 'brand', 'categoryDetail', 'search', 'product', 'investor']; 
    const isDarkBg = darkHeaderScreens.includes(screen);
    setFullScreenSystemBars(!isDarkBg);
  }, [screen]);

  const initPushRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!user) return;
    if (authLoading) return;
    if (initPushRef.current) return;
    initPushRef.current = true;
    initializePushNotifications(user.id);
  }, [user, authLoading]);

  const goTo = useCallback(
    (next: ScreenName | 'investor') => {
      if (isDedicatedStaff || needsForceUpdate) return;
      navigate(pathFor(next));
    },
    [isDedicatedStaff, navigate, needsForceUpdate]
  );

  const goToCategories = useCallback(() => {
    goTo('categories');
  }, [goTo]);

  const openProduct = useCallback(
    (product: Product | { id: string; name?: string }) => {
      if (needsForceUpdate) return;
      const productId = (product as any)?.id || (product as any)?.product_id || (product as any)?._id;
      if (!productId) {
        navigate('/');
        return;
      }
      navigate(pathFor('product', { id: productId }));
    },
    [navigate, needsForceUpdate]
  );

  const openCategory = useCallback(
    (category: Category | { id: string; name?: string }) => {
      if (needsForceUpdate) return;
      navigate(pathFor('categoryDetail', { id: category.id }));
    },
    [navigate, needsForceUpdate]
  );

  const openStore = useCallback(
    (store: Store | { id: string }) => {
      if (needsForceUpdate) return;
      navigate(pathFor('store', { storeId: store.id }));
    },
    [navigate, needsForceUpdate]
  );

  const openBrand = useCallback(
    (brand: { id: string }) => {
      if (needsForceUpdate) return;
      navigate(pathFor('brand', { id: brand.id }));
    },
    [navigate, needsForceUpdate]
  );

  const actionCtx: ActionContext = useMemo(
    () => ({
      setScreen: goTo as any,
      setSearch: (query: string) => {
        if (needsForceUpdate) return;
        navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
      },
      openProduct,
      openCategory,
      openBrand,
      openStore,
      navigate: (path: string) => {
        if (needsForceUpdate) return;
        navigate(path);
      },
      setFilterConfig: (config) => {
        filterConfigRef.current = config;
      },
      setFilterTitle: (title) => {
        filterTitleRef.current = title;
      },
    }),
    [goTo, openProduct, openCategory, openBrand, openStore, navigate, needsForceUpdate]
  );

  const handleBannerAction = useCallback(
    async (banner: PromoBanner) => {
      if (needsForceUpdate) return;
      await handleHomeAction(banner.actionType, banner.actionConfig, actionCtx);
    },
    [actionCtx, needsForceUpdate]
  );

  const handleBusinessRegistered = useCallback(
    (_business: Business) => {
      goTo('checkout');
    },
    [goTo]
  );

  const openOrder = useCallback(
    (orderId: string) => {
      if (needsForceUpdate) return;
      navigate(pathFor('orderDetail', { id: orderId }));
    },
    [navigate, needsForceUpdate]
  );

  const openProtected = useCallback(
    (next: ScreenName | 'investor') => {
      if (needsForceUpdate) return;
      const allowed =
        next === 'admin'
          ? role === 'admin'
          : next === 'warehouse'
          ? role === 'admin' || role === 'warehouse_manager'
          : next === 'delivery'
          ? role === 'admin' || role === 'delivery_partner'
          : next === 'investor' 
          ? role === 'admin' || role === 'investor'
          : true;

      goTo(allowed ? next : 'home');
    },
    [role, goTo, needsForceUpdate]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#02402c]">
        {showSplash && <SplashScreen isReady={false} onFinish={() => setShowSplash(false)} />}
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderScreen = (): ReactNode => {
    if (isDeliveryPartner) {
      return <DeliveryScreen isDedicatedRole={true} initialTab={deliveryTab} />;
    }

    if (isWarehouseManager) {
      return <WarehouseScreen isDedicatedRole={true} />;
    }

    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            onCategory={openCategory}
            onProduct={openProduct}
            onViewAll={goToCategories}
            onStoreClick={openStore}
            onBannerAction={handleBannerAction}
          />
        );

      case 'search':
        return (
          <SearchScreen
            cart={cart}
            onCartClick={() => goTo('cart')}
            onProductClick={openProduct}
            onBannerAction={handleBannerAction}
          />
        );

      case 'categories':
        return <CategoriesScreen onBack={() => goTo('home')} />;

      case 'orders':
        return <OrdersScreen onOrderClick={openOrder} />;

      case 'cart':
        return (
          <CartScreen
            cart={cart}
            onProduct={openProduct}
            onShop={() => goTo('home')}
            onCheckout={() => goTo('checkout')}
            onBack={() => navigate(-1)}
          />
        );

      case 'checkout':
        if (profile?.registration_status !== 'registered') {
          return (
            <BusinessRegistrationScreen
              onBack={() => navigate(-1)}
              onRegistered={handleBusinessRegistered}
            />
          );
        }
        return (
          <CheckoutScreen
            cart={cart}
            onBack={() => navigate(-1)}
            onOrderPlaced={openOrder}
            onAddAddress={() => navigate(pathFor('addresses', { from: 'checkout' }))} 
          />
        );



      case 'orderDetail': {
        const orderId = new URLSearchParams(location.search).get('id');
        if (!orderId) return <Navigate to="/orders" replace />;
        return <OrderDetailScreen orderId={orderId} onBack={() => goTo('orders')} />;
      }

      case 'addresses': {
        const isFromCheckout = new URLSearchParams(location.search).get('from') === 'checkout';
        return (
          <AddressesScreen 
            onBack={() => navigate(-1)} 
            onSaved={() => {
              if (isFromCheckout) {
                navigate(-1); // Safely returns to checkout without creating a loop
              }
              // If not from checkout, do nothing (stays on the addresses screen)
            }} 
          />
        );
      }


      case 'wishlist':
        return <WishlistScreen cart={cart} onProduct={openProduct} onShop={() => goTo('home')} />;

      case 'account':
        return <AccountScreen onNavigate={openProtected as any} />;

      case 'wallet':
        return <WalletScreen onBack={() => goTo('account')} />;

      case 'admin':
        return role === 'admin' ? (
          <AdminScreen onBack={() => goTo('account')} />
        ) : (
          <HomeScreen
            onCategory={openCategory}
            onProduct={openProduct}
            onViewAll={goToCategories}
            onStoreClick={openStore}
            onBannerAction={handleBannerAction}
          />
        );

      case 'investor': 
        return role === 'admin' || role === 'investor' ? (
          <InvestorScreen onBack={() => goTo('account')} />
        ) : (
          <HomeScreen
            onCategory={openCategory}
            onProduct={openProduct}
            onViewAll={goToCategories}
            onStoreClick={openStore}
            onBannerAction={handleBannerAction}
          />
        );

      case 'warehouse':
        return role === 'admin' || role === 'warehouse_manager' ? (
          <WarehouseScreen onBack={() => goTo('account')} />
        ) : (
          <HomeScreen
            onCategory={openCategory}
            onProduct={openProduct}
            onViewAll={goToCategories}
            onStoreClick={openStore}
            onBannerAction={handleBannerAction}
          />
        );

      case 'delivery':
        return role === 'admin' || role === 'delivery_partner' ? (
          <DeliveryScreen onBack={() => goTo('account')} initialTab={deliveryTab} />
        ) : (
          <HomeScreen
            onCategory={openCategory}
            onProduct={openProduct}
            onViewAll={goToCategories}
            onStoreClick={openStore}
            onBannerAction={handleBannerAction}
          />
        );

      case 'product': {
        const productId = new URLSearchParams(location.search).get('id');
        if (!productId) return <Navigate to="/" replace />;
        return (
          <ProductDetailScreen
            productId={productId}
            cart={cart}
            onBack={() => navigate(-1)}
            onProduct={openProduct}
          />
        );
      }

      case 'filteredProducts': {
        const filter = filterConfigRef.current;
        if (!filter) return <Navigate to="/" replace />;
        return (
          <FilteredProductsScreen
            filter={filter}
            title={filterTitleRef.current}
            cart={cart}
            onBack={() => goTo('home')}
            onProduct={openProduct}
          />
        );
      }

      case 'store':
        return <StoreScreen goTo={goTo as any} />;
        
      case 'helpCenter':
        return <HelpCenterScreen />;

      case 'brand':
        return <BrandScreen />;

      case 'categoryDetail':
        return <CategoryScreen onBack={() => navigate(-1)} onProduct={openProduct} cart={cart} />;

      case 'businessRegistration':
        return (
          <BusinessRegistrationScreen
            onBack={() => goTo('account')}
            onRegistered={handleBusinessRegistered}
          />
        );

      default:
        return (
          <HomeScreen
            onCategory={openCategory}
            onProduct={openProduct}
            onViewAll={goToCategories}
            onStoreClick={openStore}
            onBannerAction={handleBannerAction}
          />
        );
    }
  };

  const isWarehouseView = isWarehouseManager || screen === 'warehouse';
  const isLargeScreenView = isWarehouseView || isInvestor || screen === 'investor' || screen === 'admin';

  return (
    <div className="min-h-screen bg-ink-100 flex flex-col justify-between">
      <div
        className={`mx-auto flex-1 w-full bg-ink-50 shadow-2xl shadow-ink-200/50 relative flex flex-col ${
          isLargeScreenView ? 'max-w-7xl' : 'max-w-[720px]'
        }`}
      >
        <main className={`flex-1 ${isFullBleed ? 'pb-0 pt-0' : 'safe-top pt-4 pb-24'}`}>
          <BackButtonHandler disableBack={isDedicatedStaff || needsForceUpdate} />
          
          {isHomeReady && (
            <KeepAliveRenderer
              currentKey={key}
              render={renderScreen}
              excludeKeys={['/wallet', '/account', '/order', '/investor', '/cart']}
            />
          )}

          {showHomeLoader && (
            <HomeLoadingScreen 
              isReady={isHomeReady} 
              onFinish={() => setShowHomeLoader(false)} 
            />
          )}
        </main>

        {!isDedicatedStaff &&
          !needsForceUpdate &&
          screen !== 'categoryDetail' &&
          screen !== 'search' &&
          screen !== 'product' &&
          screen !== 'cart' &&
          screen !== 'checkout' &&   // <-- add this
          screen !== 'warehouse' &&
          screen !== 'investor' &&
          screen !== 'delivery' &&
          screen !== 'store' &&
          screen !== 'brand' && (
            <div className="safe-bottom bg-white border-t border-gray-100">
              <BottomNavigation
                active={screen as any}
                onNavigate={goTo as any}
              />
            </div>
          )}

        {/* Forced Update Bottom Sheet - Displays after splash screen finishes */}
        {!showSplash && needsForceUpdate && versionData && (
          <AppUpdateBottomSheet
            versionData={versionData}
            currentVersion={CURRENT_APP_VERSION}
          />
        )}

        {showSplash && (
          <SplashScreen
            isReady={isHomeReady}
            onFinish={() => {
              setShowSplash(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function RootApp() {
  return (
    <NavigationProvider>
      <App />
    </NavigationProvider>
  );
}
