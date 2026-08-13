// App.tsx
import { useMemo, useRef, useState, type ReactNode, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';
import { Header } from '@/components/Header';
import { BottomNavigation } from '@/components/BottomNavigation';
import { SplashScreen } from '@/components/SplashScreen';
import { KeepAliveRenderer } from '@/components/KeepAliveRenderer';
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
import type { Category, Product, ScreenName, FilterConfig, PromoBanner, Business, Store } from '@/types';
import { useCart } from '@/store';
import { useAuth } from '@/auth';
import { AuthScreen } from '@/screens/AuthScreen';
import { handleHomeAction, type ActionContext } from '@/services/actionResolver';
import { NavigationProvider, useNavigation } from '@/context/NavigationContext';

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
};

const PATH_TO_SCREEN: Record<string, ScreenName> = Object.fromEntries(
  Object.entries(SCREEN_TO_PATH).map(([k, v]) => [v, k as ScreenName])
);

function pathFor(screen: ScreenName, params?: Record<string, string>): string {
  const base = SCREEN_TO_PATH[screen] ?? '/';
  if (!params) return base;
  const qs = new URLSearchParams(params);
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
}

function parseRoute(pathname: string): { screen: ScreenName; key: string } {
  const screen = PATH_TO_SCREEN[pathname] ?? 'home';
  return { screen, key: pathname };
}

// ========== BACK BUTTON HANDLER ==========
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
      // 1. Try custom back handler (if any screen registers one)
      if (triggerBack()) {
        return;
      }

      // 2. Default handling
      const now = Date.now();
      // Define main tabs (screens where double-back exits the app)
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

    CapApp.addListener('backButton', handleBack).then(l => {
      if (mounted) listenerRef.current = l;
    }).catch(err => console.warn('BackButton listener failed:', err));

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

// ========== MAIN APP ==========
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
  const key = location.pathname + '|' + location.key;

  const goTo = (next: ScreenName) => {
    navigate(pathFor(next));
  };

// Inside App component
const openProduct = (product: Product) => {
  // Ensure we have an id
  const productId = product?.id || product?.product_id || product?._id;
  if (!productId) {
    console.warn('Product ID is undefined – check product data', product);
    // Fallback: navigate to home to avoid broken page
    navigate('/');
    return;
  }
  navigate(pathFor('product', { id: productId }));
};

  const openCategory = (category: Category) => {
    filterConfigRef.current = { category_ids: [category.id] };
    filterTitleRef.current = category.name;
    navigate(pathFor('filteredProducts'));
  };

  const openStore = (store: Store) => {
    if (store.product_ids && store.product_ids.length > 0) {
      filterConfigRef.current = { product_ids: store.product_ids };
      filterTitleRef.current = store.name;
      navigate(pathFor('filteredProducts'));
    } else {
      navigate(pathFor('home'));
    }
  };

  const actionCtx: ActionContext = {
    setScreen: goTo,
    setSearch: setSearch,
    openProduct,
    openCategory,
    setFilterConfig: (config: FilterConfig | null) => { filterConfigRef.current = config; },
    setFilterTitle: (title: string) => { filterTitleRef.current = title; },
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

  if (loading) return <SplashScreen onFinish={() => undefined} />;
  if (!user)
    return (
      <>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        {!showSplash && <AuthScreen />}
      </>
    );

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
        return <CategoriesScreen onCategory={openCategory} />;
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
        if (!orderId) return <Navigate to="/orders" replace />;
        return <OrderDetailScreen orderId={orderId} onBack={() => goTo('orders')} />;
      }
      case 'addresses':
        return <AddressesScreen onBack={() => goTo('account')} onSaved={() => goTo('checkout')} />;
      case 'wishlist':
        return <WishlistScreen cart={cart} onProduct={openProduct} onShop={() => goTo('home')} />;
      case 'account':
        return <AccountScreen onNavigate={openProtected} />;
      case 'admin':
        return role === 'admin' ? (
          <AdminScreen onBack={() => goTo('account')} />
        ) : homeScreen;
      case 'warehouse':
        return role === 'admin' || role === 'warehouse_manager' ? (
          <WarehouseScreen onBack={() => goTo('account')} />
        ) : homeScreen;
      case 'delivery':
        return role === 'admin' || role === 'delivery_partner' ? (
          <DeliveryScreen onBack={() => goTo('account')} />
        ) : homeScreen;
      case 'product': {
        const productId = new URLSearchParams(location.search).get('id');
        if (!productId) return <Navigate to="/" replace />;
        return (
          <ProductDetailScreen
            productId={productId}
            cart={cart}
            onBack={() => goTo('home')}
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
    <div className="min-h-screen bg-ink-100">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <div className="mx-auto min-h-screen max-w-[720px] bg-ink-50 shadow-2xl shadow-ink-200/50">
        <Header cartCount={cart.totalItems} onCartClick={() => goTo('cart')} />
        <main className="py-4 pb-24 animate-fade-up">
          <BackButtonHandler />
          <KeepAliveRenderer currentKey={key} render={renderScreen} />
        </main>
        <BottomNavigation
          active={screen}
          cartCount={cart.totalItems}
          onNavigate={goTo}
        />
      </div>
    </div>
  );
}

// ========== ROOT WITH PROVIDERS ==========
export default function RootApp() {
  return (
    <NavigationProvider>
      <App />
    </NavigationProvider>
  );
}