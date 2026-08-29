import { Heart } from 'lucide-react';
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
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M8 8.5C8 5.6 9.8 3.8 12 3.8C14.2 3.8 16 5.6 16 8.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M4.5 8.5H19.5C20.3 8.5 20.9 9.15 20.8 9.95L19.2 18.2C18.9 19.7 17.6 20.8 16.1 20.8H7.9C6.4 20.8 5.1 19.7 4.8 18.2L3.2 9.95C3.1 9.15 3.7 8.5 4.5 8.5Z"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
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
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" stroke="currentColor" strokeWidth="1.9" fill={isActive ? 'currentColor' : 'none'} />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2.2" stroke="currentColor" strokeWidth="1.9" fill={isActive ? 'currentColor' : 'none'} />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" stroke="currentColor" strokeWidth="1.9" fill={isActive ? 'currentColor' : 'none'} />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" stroke="currentColor" strokeWidth="1.9" fill={isActive ? 'currentColor' : 'none'} />
        </svg>
      );

    case 'wishlist': // Lucide Heart
      return (
        <Heart
          size={23}
          strokeWidth={isActive ? 2.2 : 1.9}
          className={`transition-all duration-200 ${
            isActive ? 'fill-brand-600 text-brand-600' : 'text-ink-500'
          }`}
        />
      );

    case 'orders': // Handbag with horizontal divider & center clasp
      return (
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
          <path
            d="M8.5 8.5V6.2C8.5 4.4 10 3 12 3C14 3 15.5 4.4 15.5 6.2V8.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M5.2 8.5H18.8C19.5 8.5 20 9.05 19.9 9.75L18.8 18.75C18.6 20 17.6 20.9 16.3 20.9H7.7C6.4 20.9 5.4 20 5.2 18.75L4.1 9.75C4 9.05 4.5 8.5 5.2 8.5Z"
            fill={isActive ? 'currentColor' : 'none'}
            fillOpacity={isActive ? 0.12 : 0}
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path d="M4.6 13.8H19.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10.8 16.8H13.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );

    case 'account': // Circular User Profile
      return (
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200">
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

const navItems: { id: ScreenName; label: string }[] = [
  { id: 'home', label: 'Shop' },
  { id: 'categories', label: 'Categories' },
  { id: 'wishlist', label: 'My list' },
  { id: 'orders', label: 'Orders' },
  { id: 'account', label: 'Account' },
];

export function BottomNavigation({ active, onNavigate, wishlistCount }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-ink-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] safe-bottom">
      <div className="mx-auto max-w-[720px] h-[64px] flex items-center justify-around px-2">
        {navItems.map(({ id, label }) => {
          const isActive = active === id;

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`relative flex flex-col items-center justify-center gap-1 min-w-[58px] h-full tap-highlight transition-transform active:scale-95 ${
                isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <NavIcon id={id} isActive={isActive} />

                {id === 'wishlist' && wishlistCount !== undefined && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 h-3.5 min-w-3.5 px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>

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
