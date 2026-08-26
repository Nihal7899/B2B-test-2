import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
  useEffect,
} from 'react';
import {
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

import { Header } from '@/components/Header';
import { BottomNavigation } from '@/components/BottomNavigation';
import { SplashScreen } from '@/components/SplashScreen';
import { KeepAliveRenderer } from '@/components/KeepAliveRenderer';
import { setFullScreenSystemBars } from '@/hooks/useSystemBars';

import { HomeScreen } from '@/screens/HomeScreen';
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
import { FilteredProductsScreen } from '@/screens/FilteredProductsScreen';
import { BusinessRegistrationScreen } from '@/screens/BusinessRegistrationScreen';
import { AuthScreen } from '@/screens/AuthScreen';
import StoreScreen from '@/screens/StoreScreen';
import { CategoryScreen } from '@/screens/CategoryScreen';
import { BrandScreen } from '@/screens/BrandScreen';
import { BannerScreen } from '@/screens/BannerScreen';

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
} from '@/services/push';

const SCREEN_TO_PATH: Record<ScreenName, string> = {
  home: '/',
  categories: '/categories',
  orders: '/orders',
  cart: '/cart',
  account: '/account',
  product: '/product',
  admin: '/admin',
  warehouse: '/warehouse',
  delivery: '/delivery',
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
  banner: '/banner',
};

const PATH_TO_SCREEN: Record<string, ScreenName> =
  Object.fromEntries(
    Object.entries(SCREEN_TO_PATH).map(
      ([k, v]) => [v, k as ScreenName]
    )
  );

function pathFor(
  screen: ScreenName,
  params?: Record<string, string>
): string {
  const base = SCREEN_TO_PATH[screen] ?? '/';
  if (!params) return base;
  const qs = new URLSearchParams(params);
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
}

function parseRoute(pathname: string): {
  screen: ScreenName;
  key: string;
} {
  const screen = PATH_TO_SCREEN[pathname] ?? 'home';
  return { screen, key: pathname };
}

function BackButtonHandler() {
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
      if (triggerBack()) return;

      const now = Date.now();
      const mainRoutes = ['/', '/categories', '/orders', '/cart', '/account'];

      if (mainRoutes.includes(location.pathname)) {
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
      .then((l) => { if (mounted) listenerRef.current = l; })
      .catch(() => {});

    return () => {
      mounted = false;
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, [location.pathname, navigate, triggerBack]);

  return null;
}

function App() {
  const cart = useCart();
  const { user, role, loading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const filterConfigRef = useRef<FilterConfig | null>(null);
  const filterTitleRef = useRef('Products');
  const [showSplash, setShowSplash] = useState(true);

  const { screen } = useMemo(() => parseRoute(location.pathname), [location.pathname]);

  const key = useMemo(() => {
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
  }, [screen, location.pathname, location.search]);

  const isFullBleed = 
    screen === 'store' || 
    screen === 'categories' || 
    screen === 'categoryDetail' || 
    screen === 'brand' ||
    screen === 'banner';

  // Apply transparent edge-to-edge system bars
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const darkHeaderScreens = ['store', 'brand', 'categoryDetail'];
    const isDarkBg = showSplash || darkHeaderScreens.includes(screen);

    // true = Dark icons (for light backgrounds)
    // false = White icons (for dark/gradient backgrounds)
    setFullScreenSystemBars(!isDarkBg);
  }, [screen, showSplash]);

  const initPushRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!user) return;
    if (loading) return;
    if (initPushRef.current) return;
    initPushRef.current = true;
    initializePushNotifications(user.id);
  }, [user, loading]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!user) return;

    const setupListener = async () => {
      try {
        const module = await import('@onesignal/capacitor-plugin');
        const OneSignal = module.default || module.OneSignal || module;
        if (!OneSignal?.Notifications) return;

        OneSignal.Notifications.addEventListener('click', (event: any) => {
          const actionId = event.result?.actionId;
          const additionalData = event.notification?.additionalData || {};

          if (actionId) {
            switch (actionId) {
              case 'view_order': {
                const orderId = additionalData.order_id;
                navigate(orderId ? pathFor('orderDetail', { id: orderId }) : pathFor('orders'));
                break;
              }
              case 'view_product': {
                const productId = additionalData.product_id;
                navigate(productId ? pathFor('product', { id: productId }) : pathFor('home'));
                break;
              }
              case 'view_cart':
                navigate(pathFor('cart'));
                break;
              case 'track_delivery': {
                const orderId = additionalData.order_id;
                navigate(orderId ? pathFor('orderDetail', { id: orderId }) : pathFor('orders'));
                break;
              }
              case 'contact_support': {
                const supportUrl = additionalData.support_url || 'tel:+123456789';
                window.open(supportUrl, '_system');
                break;
              }
              case 'accept':
              case 'decline': {
                const orderId = additionalData.order_id;
                if (orderId) {
                  navigate(pathFor('orders'));
                }
                break;
              }
              default:
                navigate(pathFor('home'));
            }
          } else {
            if (additionalData.order_id) {
              navigate(pathFor('orderDetail', { id: additionalData.order_id }));
            } else if (additionalData.product_id) {
              navigate(pathFor('product', { id: additionalData.product_id }));
            } else {
              navigate(pathFor('home'));
            }
          }
        });
      } catch (e) {
        console.error("OneSignal setup error:", e);
      }
    };

    setupListener();
  }, [user, navigate]);

  const goTo = (next: ScreenName) => {
    navigate(pathFor(next));
  };

  const openProduct = (product: Product) => {
    const productId = product?.id || product?.product_id || product?._id;
    if (!productId) {
      navigate('/');
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const storeId = searchParams.get('storeId');

    const params: Record<string, string> = { id: productId };
    if (storeId) {
      params.storeId = storeId;
    }

    navigate(pathFor('product', params));
  };

  const openCategory = (category: Category) => {
    filterConfigRef.current = {
      category_ids: [category.id],
    };
    filterTitleRef.current = category.name;
    navigate(pathFor('filteredProducts'));
  };

  const openStore = (store: Store) => {
    navigate(pathFor('store', { storeId: store.id }));
  };

  const actionCtx: ActionContext = {
    setScreen: goTo,
    setSearch: setSearch,
    openProduct,
    openCategory,
    setFilterConfig: (config: FilterConfig | null) => {
      filterConfigRef.current = config;
    },
    setFilterTitle: (title: string) => {
      filterTitleRef.current = title;
    },
  };

  const handleBannerAction = async (banner: PromoBanner) => {
    await handleHomeAction(banner.actionType, banner.actionConfig, actionCtx);
  };

  const handleBusinessRegistered = (_business: Business) => {
    goTo('checkout');
  };

  const openOrder = (orderId: string) => {
    navigate(pathFor('orderDetail', { id: orderId }));
  };

  const openProtected = (next: ScreenName) => {
    const allowed =
      next === 'admin'
        ? role === 'admin'
        : next === 'warehouse'
        ? role === 'admin' || role === 'warehouse_manager'
        : next === 'delivery'
        ? role === 'admin' || role === 'delivery_partner'
        : true;

    goTo(allowed ? next : 'home');
  };

  if (loading) {
    return <SplashScreen onFinish={() => undefined} />;
  }

  if (!user) {
    return (
      <>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        {!showSplash && <AuthScreen />}
      </>
    );
  }

  const homeScreen = (
    <HomeScreen
      search={search}
      onSearchChange={setSearch}
      onCategory={openCategory}
      onProduct={openProduct}
      onViewAll={() => goTo('categories')}
      onStoreClick={openStore}
      cart={cart}
      onBannerAction={handleBannerAction}
    />
  );

  const renderScreen = (): ReactNode => {
    switch (screen) {
      case 'home':
        return homeScreen;

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
          />
        );

      case 'checkout':
        if (profile?.registration_status !== 'registered') {
          return (
            <BusinessRegistrationScreen
              onBack={() => goTo('cart')}
              onRegistered={handleBusinessRegistered}
            />
          );
        }
        return (
          <CheckoutScreen
            cart={cart}
            onBack={() => goTo('cart')}
            onOrderPlaced={openOrder}
            onAddAddress={() => goTo('addresses')}
          />
        );

      case 'orderDetail': {
        const orderId = new URLSearchParams(location.search).get('id');
        if (!orderId) {
          return <Navigate to="/orders" replace />;
        }
        return <OrderDetailScreen orderId={orderId} onBack={() => goTo('orders')} />;
      }

      case 'addresses':
        return <AddressesScreen onBack={() => goTo('account')} onSaved={() => goTo('checkout')} />;

      case 'wishlist':
        return <WishlistScreen cart={cart} onProduct={openProduct} onShop={() => goTo('home')} />;

      case 'account':
        return <AccountScreen onNavigate={openProtected} />;

      case 'admin':
        return role === 'admin' ? <AdminScreen onBack={() => goTo('account')} /> : homeScreen;

      case 'warehouse':
        return role === 'admin' || role === 'warehouse_manager'
          ? <WarehouseScreen onBack={() => goTo('account')} />
          : homeScreen;

      case 'delivery':
        return role === 'admin' || role === 'delivery_partner'
          ? <DeliveryScreen onBack={() => goTo('account')} />
          : homeScreen;

      case 'product': {
        const productId = new URLSearchParams(location.search).get('id');
        if (!productId) {
          return <Navigate to="/" replace />;
        }
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
        if (!filter) {
          return <Navigate to="/" replace />;
        }
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
        return <StoreScreen goTo={goTo} />;

      case 'brand':
        return <BrandScreen />;

      case 'banner':
        return <BannerScreen />;

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
        return homeScreen;
    }
  };

  return (
    <div className="min-h-screen bg-ink-100 flex flex-col justify-between">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="mx-auto flex-1 w-full max-w-[720px] bg-ink-50 shadow-2xl shadow-ink-200/50 relative flex flex-col">
        {!isFullBleed && (
          <Header
            cartCount={cart.totalItems}
            onCartClick={() => goTo('cart')}
          />
        )}

        <main className={`flex-1 ${isFullBleed ? 'pb-0 pt-0' : 'py-4 pb-24'}`}>
          <BackButtonHandler />
          <KeepAliveRenderer
            currentKey={key}
            render={renderScreen}
          />
        </main>

        {screen !== 'categoryDetail' && (
          <div className="safe-bottom bg-white border-t border-gray-100">
            <BottomNavigation
              active={screen}
              cartCount={cart.totalItems}
              onNavigate={goTo}
            />
          </div>
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
