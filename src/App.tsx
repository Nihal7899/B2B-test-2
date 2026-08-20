// App.tsx – full with conditional header on store screen and storeId passing

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

  if (!params) {
    return base;
  }

  const qs = new URLSearchParams(params);
  const str = qs.toString();

  return str
    ? `${base}?${str}`
    : base;
}


function parseRoute(pathname: string): {
  screen: ScreenName;
  key: string;
} {
  const screen =
    PATH_TO_SCREEN[pathname] ?? 'home';

  return {
    screen,
    key: pathname,
  };
}


// ============================================================
// BACK BUTTON HANDLER
// ============================================================

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  const { triggerBack } =
    useNavigation();

  const lastBackPress =
    useRef(0);

  const toastId =
    useRef<string | null>(null);

  const listenerRef =
    useRef<{ remove: () => void } | null>(null);


  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let mounted = true;


    const handleBack = () => {

      // 1. Try custom back handler
      if (triggerBack()) {
        return;
      }


      // 2. Default handling

      const now = Date.now();


      const mainRoutes = [
        '/',
        '/categories',
        '/orders',
        '/cart',
        '/account',
      ];


      if (mainRoutes.includes(location.pathname)) {

        if (
          now - lastBackPress.current < 2000
        ) {

          if (toastId.current) {
            toast.dismiss(
              toastId.current
            );
          }

          CapApp.exitApp();

        } else {

          lastBackPress.current = now;

          toastId.current = toast(
            'Press back again to exit',
            {
              duration: 2000,
              icon: '←',
              style: {
                background:
                  'var(--bg-card)',
                color:
                  'var(--text-primary)',
              },
            }
          );
        }

      } else if (
        location.pathname === '/login'
      ) {

        CapApp.exitApp();

      } else {

        navigate(-1);

      }
    };


    CapApp.addListener(
      'backButton',
      handleBack
    )
      .then((l) => {

        if (mounted) {
          listenerRef.current = l;
        }

      })
      .catch(() => {
        // silently ignore
      });


    return () => {

      mounted = false;

      if (listenerRef.current) {

        listenerRef.current.remove();

        listenerRef.current = null;
      }

    };

  }, [
    location.pathname,
    navigate,
    triggerBack,
  ]);


  return null;
}


// ============================================================
// MAIN APP
// ============================================================

function App() {

  const cart = useCart();

  const {
    user,
    role,
    loading,
    profile,
  } = useAuth();


  const navigate =
    useNavigate();

  const location =
    useLocation();


  const [search, setSearch] =
    useState('');


  const filterConfigRef =
    useRef<FilterConfig | null>(null);


  const filterTitleRef =
    useRef('Products');


  const [showSplash, setShowSplash] =
    useState(true);


  const {
    screen,
  } = useMemo(
    () =>
      parseRoute(
        location.pathname
      ),
    [location.pathname]
  );


  const key =
    location.pathname +
    '|' +
    location.key;


  const initPushRef =
    useRef(false);


  // ==========================================================
  // ONESIGNAL INITIALIZATION
  // ==========================================================

  useEffect(() => {

    if (
      !Capacitor.isNativePlatform()
    ) {
      return;
    }


    if (!user) {
      return;
    }


    if (loading) {
      return;
    }


    if (initPushRef.current) {
      return;
    }


    initPushRef.current = true;


    initializePushNotifications(
      user.id
    );

  }, [
    user,
    loading,
  ]);


  // ==========================================================
  // NEW: HANDLE NOTIFICATION ACTION BUTTON CLICKS
  // ==========================================================

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!user) return;

    const setupListener = async () => {
      try {
        const module = await import('@onesignal/capacitor-plugin');
        const OneSignal = module.default || module.OneSignal || module;
        if (!OneSignal?.Notifications) return;

        OneSignal.Notifications.addEventListener('click', (event: any) => {
          const actionId = event.actionId;
          const additionalData = event.notification?.additionalData || {};

          // No actionId → user tapped the notification itself
          if (!actionId) {
            navigate(pathFor('home'));
            return;
          }

          // Map action IDs to navigation
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
              // Example: open a support URL or phone number
              const supportUrl = additionalData.support_url || 'tel:+123456789';
              window.open(supportUrl, '_system');
              break;
            }
            case 'accept':
            case 'decline': {
              // Example: handle accept/decline for delivery
              const orderId = additionalData.order_id;
              if (orderId) {
                // You could call an API to update order status
                // Then navigate to orders
                navigate(pathFor('orders'));
              }
              break;
            }
            default:
              navigate(pathFor('home'));
          }
        });
      } catch (e) {
        // ignore
      }
    };

    setupListener();
  }, [user]);


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const goTo = (
    next: ScreenName
  ) => {

    navigate(
      pathFor(next)
    );

  };


  // ==========================================================
  // PRODUCT (UPDATED: passes storeId if on store screen)
  // ==========================================================

  const openProduct = (
    product: Product
  ) => {

    const productId =
      product?.id ||
      product?.product_id ||
      product?._id;


    if (!productId) {

      navigate('/');

      return;
    }

    // Check if we're on the store screen and get storeId
    const searchParams = new URLSearchParams(location.search);
    const storeId = searchParams.get('storeId');

    const params: Record<string, string> = { id: productId };
    if (storeId) {
      params.storeId = storeId;
    }

    navigate(
      pathFor(
        'product',
        params
      )
    );

  };


  // ==========================================================
  // CATEGORY
  // ==========================================================

  const openCategory = (
    category: Category
  ) => {

    filterConfigRef.current = {
      category_ids: [
        category.id,
      ],
    };


    filterTitleRef.current =
      category.name;


    navigate(
      pathFor(
        'filteredProducts'
      )
    );

  };


  // ==========================================================
  // STORE (UPDATED to navigate to StoreScreen)
  // ==========================================================

  const openStore = (
    store: Store
  ) => {

    // Navigate to the dedicated StoreScreen with storeId as query param
    navigate(
      pathFor(
        'store',
        { storeId: store.id }
      )
    );

  };


  // ==========================================================
  // ACTION CONTEXT
  // ==========================================================

  const actionCtx: ActionContext = {

    setScreen: goTo,

    setSearch: setSearch,

    openProduct,

    openCategory,

    setFilterConfig: (
      config:
        FilterConfig | null
    ) => {

      filterConfigRef.current =
        config;

    },

    setFilterTitle: (
      title: string
    ) => {

      filterTitleRef.current =
        title;

    },

  };


  // ==========================================================
  // BANNER ACTION
  // ==========================================================

  const handleBannerAction =
    async (
      banner: PromoBanner
    ) => {

      await handleHomeAction(
        banner.actionType,
        banner.actionConfig,
        actionCtx
      );

    };


  // ==========================================================
  // BUSINESS REGISTERED
  // ==========================================================

  const handleBusinessRegistered =
    (_business: Business) => {

      goTo('checkout');

    };


  // ==========================================================
  // ORDER
  // ==========================================================

  const openOrder = (
    orderId: string
  ) => {

    navigate(
      pathFor(
        'orderDetail',
        {
          id: orderId,
        }
      )
    );

  };


  // ==========================================================
  // PROTECTED ROUTES
  // ==========================================================

  const openProtected = (
    next: ScreenName
  ) => {

    const allowed =
      next === 'admin'
        ? role === 'admin'

        : next === 'warehouse'
        ? role === 'admin' ||
          role ===
            'warehouse_manager'

        : next === 'delivery'
        ? role === 'admin' ||
          role ===
            'delivery_partner'

        : true;


    goTo(
      allowed
        ? next
        : 'home'
    );

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <SplashScreen
        onFinish={() =>
          undefined
        }
      />
    );

  }


  // ==========================================================
  // AUTH
  // ==========================================================

  if (!user) {

    return (
      <>
        {showSplash && (
          <SplashScreen
            onFinish={() =>
              setShowSplash(false)
            }
          />
        )}

        {!showSplash && (
          <AuthScreen />
        )}
      </>
    );

  }


  // ==========================================================
  // HOME
  // ==========================================================

  const homeScreen = (
    <HomeScreen
      search={search}
      onSearchChange={
        setSearch
      }
      onCategory={
        openCategory
      }
      onProduct={
        openProduct   // <-- updated to pass storeId
      }
      onViewAll={() =>
        goTo('categories')
      }
      onStoreClick={
        openStore
      }
      cart={cart}
      onBannerAction={
        handleBannerAction
      }
    />
  );


  // ==========================================================
  // RENDER SCREEN
  // ==========================================================

  const renderScreen =
    (): ReactNode => {

      switch (screen) {

        case 'home':

          return homeScreen;


        case 'categories':

          return (
            <CategoriesScreen
              onCategory={
                openCategory
              }
            />
          );


        case 'orders':

          return (
            <OrdersScreen
              onOrderClick={
                openOrder
              }
            />
          );


        case 'cart':

          return (
            <CartScreen
              cart={cart}
              onProduct={
                openProduct
              }
              onShop={() =>
                goTo('home')
              }
              onCheckout={() =>
                goTo('checkout')
              }
            />
          );


        case 'checkout':

          if (
            profile?.registration_status !==
            'registered'
          ) {

            return (
              <BusinessRegistrationScreen
                onBack={() =>
                  goTo('cart')
                }
                onRegistered={
                  handleBusinessRegistered
                }
              />
            );

          }


          return (
            <CheckoutScreen
              cart={cart}
              onBack={() =>
                goTo('cart')
              }
              onOrderPlaced={
                openOrder
              }
              onAddAddress={() =>
                goTo('addresses')
              }
            />
          );


        case 'orderDetail': {

          const orderId =
            new URLSearchParams(
              location.search
            ).get('id');


          if (!orderId) {

            return (
              <Navigate
                to="/orders"
                replace
              />
            );

          }


          return (
            <OrderDetailScreen
              orderId={
                orderId
              }
              onBack={() =>
                goTo('orders')
              }
            />
          );

        }


        case 'addresses':

          return (
            <AddressesScreen
              onBack={() =>
                goTo('account')
              }
              onSaved={() =>
                goTo('checkout')
              }
            />
          );


        case 'wishlist':

          return (
            <WishlistScreen
              cart={cart}
              onProduct={
                openProduct
              }
              onShop={() =>
                goTo('home')
              }
            />
          );


        case 'account':

          return (
            <AccountScreen
              onNavigate={
                openProtected
              }
            />
          );


        case 'admin':

          return role === 'admin'
            ? (
                <AdminScreen
                  onBack={() =>
                    goTo('account')
                  }
                />
              )
            : homeScreen;


        case 'warehouse':

          return role === 'admin' ||
            role ===
              'warehouse_manager'
            ? (
                <WarehouseScreen
                  onBack={() =>
                    goTo('account')
                  }
                />
              )
            : homeScreen;


        case 'delivery':

          return role === 'admin' ||
            role ===
              'delivery_partner'
            ? (
                <DeliveryScreen
                  onBack={() =>
                    goTo('account')
                  }
                />
              )
            : homeScreen;


        case 'product': {
          const productId = new URLSearchParams(location.search).get('id');
          if (!productId) {
            return <Navigate to="/" replace />;
          }
          
          // Use a unique key that includes productId so KeepAliveRenderer treats different products separately
          const productKey = `product-${productId}`;
          
          return (
            <KeepAliveRenderer key={productKey} currentKey={key} render={() => (
              <ProductDetailScreen
                productId={productId}
                cart={cart}
                onBack={() => goTo('home')}
                onProduct={openProduct}
              />
            )} />
          );
        }


          if (!productId) {

            return (
              <Navigate
                to="/"
                replace
              />
            );

          }


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

          const filter =
            filterConfigRef.current;


          if (!filter) {

            return (
              <Navigate
                to="/"
                replace
              />
            );

          }


          return (
            <FilteredProductsScreen
              filter={filter}
              title={
                filterTitleRef.current
              }
              cart={cart}
              onBack={() =>
                goTo('home')
              }
              onProduct={
                openProduct
              }
            />
          );

        }


        // ============================================================
        // STORE SCREEN
        // ============================================================
        case 'store': {
          return <StoreScreen goTo={goTo} />;
        }


        case 'businessRegistration':

          return (
            <BusinessRegistrationScreen
              onBack={() =>
                goTo('account')
              }
              onRegistered={
                handleBusinessRegistered
              }
            />
          );


        default:

          return homeScreen;

      }

    };


  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-ink-100">

      {showSplash && (
        <SplashScreen
          onFinish={() =>
            setShowSplash(false)
          }
        />
      )}


      <div className="mx-auto min-h-screen max-w-[720px] bg-ink-50 shadow-2xl shadow-ink-200/50">

        {/* 🔥 HIDE HEADER ON STORE SCREEN – store has its own header */}
        {screen !== 'store' && (
          <Header
            cartCount={cart.totalItems}
            onCartClick={() => goTo('cart')}
          />
        )}


        <main className="py-4 pb-24 animate-fade-up">

          <BackButtonHandler />

          <KeepAliveRenderer
            currentKey={key}
            render={
              renderScreen
            }
          />

        </main>


        <BottomNavigation
          active={screen}
          cartCount={cart.totalItems}
          onNavigate={
            goTo
          }
        />

      </div>

    </div>
  );
}


// ============================================================
// ROOT WITH PROVIDERS
// ============================================================

export default function RootApp() {

  return (

    <NavigationProvider>

      <App />

    </NavigationProvider>

  );
}