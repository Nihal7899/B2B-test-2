import { MapPin, Bell, ShoppingBag, ChevronDown } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

export function Header({ cartCount, onCartClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] safe-top transition-all duration-300">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16 sm:h-20 max-w-7xl mx-auto">
        
        {/* Left Section: Brand & Location */}
        <div className="flex items-center gap-6 min-w-0">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20 transition-transform group-hover:scale-105 group-active:scale-95">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7l9-4 9 4-9 4-9-4z" />
                <path d="M3 12l9 4 9-4" />
                <path d="M3 17l9 4 9-4" />
              </svg>
            </div>
            <div className="flex flex-col leading-none justify-center">
              <span className="text-lg font-black text-gray-900 tracking-tight group-hover:text-brand-600 transition-colors">Stackknit</span>
              <span className="text-[10px] font-bold text-brand-600/80 tracking-[0.2em] uppercase mt-0.5">B2B Wholesale</span>
            </div>
          </div>

          {/* Location Selector (Modern Pill Design) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 hover:bg-gray-100 border border-gray-200/60 rounded-full cursor-pointer transition-colors min-w-0 group">
            <div className="p-1 bg-white rounded-full shadow-sm flex items-center justify-center">
              <MapPin size={14} className="text-brand-600" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[12px] font-semibold text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                Koramangala, BLR
              </span>
            </div>
            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 ml-1 transition-colors" />
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Notifications */}
          <button 
            className="relative h-10 w-10 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-50 tap-highlight active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500" 
            aria-label="Notifications"
          >
            <Bell size={22} strokeWidth={1.75} />
            {/* Modern Animated Notification Dot */}
            <span className="absolute top-2 right-2.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
            </span>
          </button>

          {/* Cart Button */}
          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 h-10 px-3 sm:px-4 rounded-full bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 tap-highlight active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 border border-gray-200/80 shadow-sm"
            aria-label="Cart"
          >
            <ShoppingBag size={20} strokeWidth={1.75} />
            <span className="hidden sm:block text-sm font-semibold">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-brand-600 text-white text-[11px] font-bold tabular-nums shadow-sm shadow-brand-600/30">
                {cartCount}
              </span>
            )}
          </button>
          
        </div>
      </div>
    </header>
  );
}
