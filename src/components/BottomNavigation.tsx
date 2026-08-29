import type { ScreenName } from '@/types';

interface BottomNavigationProps {
  active: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  wishlistCount?: number;
}

// Custom modern minimalist dual-tone / solid icons
function NavIcon({ id, isActive }: { id: ScreenName; isActive: boolean }) {
  switch (id) {
    case 'home':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M3 10.5L12 3.5L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={isActive ? '1.5' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'categories':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <rect
            x="3.5"
            y="3.5"
            width="7"
            height="7"
            rx="2.5"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="13.5"
            y="3.5"
            width="7"
            height="7"
            rx="2.5"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="3.5"
            y="13.5"
            width="7"
            height="7"
            rx="2.5"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="13.5"
            y="13.5"
            width="7"
            height="7"
            rx="2.5"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'orders':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M16.5 7.5L7.5 12.5M16.5 7.5V17M16.5 7.5L21 5M7.5 12.5L3 10M7.5 12.5V21.5M12 2L21 6.5V17.5L12 22L3 17.5V6.5L12 2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isActive ? 'currentColor' : 'none'}
            fillOpacity={isActive ? 0.18 : 0}
          />
          {isActive && (
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
          )}
        </svg>
      );
    case 'wishlist':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={isActive ? '1.2' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'account':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <circle
            cx="12"
            cy="7.5"
            r="4.2"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M4.5 20.2C5.6 16.8 8.5 15.2 12 15.2C15.5 15.2 18.4 16.8 19.5 20.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

const navItems: { id: ScreenName; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'categories', label: 'Categories' },
  { id: 'orders', label: 'Orders' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'account', label: 'Account' },
];

export function BottomNavigation({ active, onNavigate, wishlistCount }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-2xl border-t border-ink-100/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] safe-bottom">
      <div className="mx-auto max-w-[720px] h-[64px] flex items-center justify-around px-2">
        {navItems.map(({ id, label }) => {
          const isActive = active === id;
          const isWishlist = id === 'wishlist';

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`relative flex flex-col items-center justify-center gap-1 w-[60px] h-full tap-highlight transition-all duration-200 active:scale-90 ${
                isActive ? 'text-brand-600' : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              {/* Icon Container with active backdrop pill */}
              <div
                className={`relative flex items-center justify-center w-11 h-7 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-brand-50/90 text-brand-600 scale-105 shadow-xs' : 'bg-transparent'
                }`}
              >
                <NavIcon id={id} isActive={isActive} />

                {/* Wishlist Badge */}
                {isWishlist && wishlistCount !== undefined && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-0.5 h-3.5 min-w-3.5 px-1 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center shadow-xs animate-in zoom-in">
                    {wishlistCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight transition-all duration-200 ${
                  isActive ? 'font-bold text-brand-600' : 'font-medium text-ink-400'
                }`}
              >
                {label}
              </span>

              {/* Micro Dot Glow */}
              {isActive && (
                <span className="absolute -bottom-0.5 h-1 w-1.5 bg-brand-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
