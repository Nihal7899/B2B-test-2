import type { ScreenName } from '@/types';

interface BottomNavigationProps {
  active: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  wishlistCount?: number;
}

function NavIcon({ id, isActive }: { id: ScreenName; isActive: boolean }) {
  switch (id) {
    case 'home': // Shop Basket
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          {/* Top Arch Handle */}
          <path
            d="M8 8.5C8 5.6 9.8 3.8 12 3.8C14.2 3.8 16 5.6 16 8.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Basket Body */}
          <path
            d="M4.5 8.5H19.5C20.3 8.5 20.9 9.15 20.8 9.95L19.2 18.2C18.9 19.7 17.6 20.8 16.1 20.8H7.9C6.4 20.8 5.1 19.7 4.8 18.2L3.2 9.95C3.1 9.15 3.7 8.5 4.5 8.5Z"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          {/* 3 Vertical Slats */}
          <path
            d="M9.5 12.5V16.5M12 12.5V16.5M14.5 12.5V16.5"
            stroke={isActive ? '#FFFFFF' : 'currentColor'}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'categories': // 4-Squircle Grid
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" stroke="currentColor" strokeWidth="1.9" fill={isActive ? 'currentColor' : 'none'} />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2.2" stroke="currentColor" strokeWidth="1.9" fill={isActive ? 'currentColor' : 'none'} />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" stroke="currentColor" strokeWidth="1.9" fill={isActive ? 'currentColor' : 'none'} />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" stroke="currentColor" strokeWidth="1.9" fill={isActive ? 'currentColor' : 'none'} />
        </svg>
      );

    case 'wishlist': // Heart Icon
      return (
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M12 20.5S4.5 15.2 4.5 9.5C4.5 6.5 6.8 4.5 9.6 4.5C11.1 4.5 12.2 5.3 12 5.9C12.2 5.3 13.3 4.5 14.8 4.5C17.6 4.5 19.9 6.5 19.9 9.5C19.9 15.2 12 20.5 12 20.5Z"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'orders': // Handbag with horizontal divider & center clasp
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          {/* Arch Handle */}
          <path
            d="M8.5 8.5V6.2C8.5 4.4 10 3 12 3C14 3 15.5 4.4 15.5 6.2V8.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {/* Trapezoid Bag Body */}
          <path
            d="M5.2 8.5H18.8C19.5 8.5 20 9.05 19.9 9.75L18.8 18.75C18.6 20 17.6 20.9 16.3 20.9H7.7C6.4 20.9 5.4 20 5.2 18.75L4.1 9.75C4 9.05 4.5 8.5 5.2 8.5Z"
            fill={isActive ? 'currentColor' : 'none'}
            fillOpacity={isActive ? 0.12 : 0}
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          {/* Middle Stitch Line */}
          <path
            d="M4.6 13.8H19.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Center Latch */}
          <path
            d="M10.8 16.8H13.2"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'account': // Circular User Profile
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.9" />
          <circle cx="12" cy="9.2" r="3" stroke="currentColor" strokeWidth="1.9" />
          <path
            d="M6.8 17.8C7.6 15.2 9.6 14 12 14C14.4 14 16.4 15.2 17.2 17.8"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

const navItems: { id: ScreenName; label: string; showNewBadge?: boolean }[] = [
  { id: 'home', label: 'Shop' },
  { id: 'categories', label: 'Categories' },
  { id: 'wishlist', label: 'My list', showNewBadge: true },
  { id: 'orders', label: 'Orders' },
  { id: 'account', label: 'Account' },
];

export function BottomNavigation({ active, onNavigate, wishlistCount }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-ink-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] safe-bottom">
      <div className="mx-auto max-w-[720px] h-[64px] flex items-center justify-around px-2">
        {navItems.map(({ id, label, showNewBadge }) => {
          const isActive = active === id;

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`relative flex flex-col items-center justify-center gap-1 min-w-[58px] h-full tap-highlight transition-transform active:scale-95 ${
                isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {/* Icon Container */}
              <div className="relative flex items-center justify-center">
                <NavIcon id={id} isActive={isActive} />

                {/* "NEW" Badge */}
                {showNewBadge && (
                  <span className="absolute -top-1.5 -right-3.5 px-1.5 py-0.5 rounded-full bg-[#008b8b] text-white text-[8px] font-black tracking-tight leading-none shadow-xs">
                    NEW
                  </span>
                )}

                {/* Wishlist Count Badge fallback if needed */}
                {!showNewBadge && id === 'wishlist' && wishlistCount !== undefined && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>

              {/* Text Label */}
              <span
                className={`text-[11px] tracking-tight leading-none ${
                  isActive ? 'font-extrabold text-brand-600' : 'font-medium text-ink-500'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
