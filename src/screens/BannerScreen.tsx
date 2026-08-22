// screens/BannerScreen.tsx
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Filter, 
  ArrowDownUp, 
  Sparkles, 
  Zap, 
  Flame, 
  ChevronRight,
  Search,
  Star
} from 'lucide-react';

// --- Static Mock Data ---
const MOCK_FILTERS = ['All Deals', 'Festive Gifting', 'Electronics', 'Packaging', 'Sweets & Snacks'];

const FLASH_DEALS = [
  {
    id: 'f1',
    name: 'Premium Dry Fruits Gift Box (1kg)',
    brand: 'NATURE FARMS',
    image: 'https://images.unsplash.com/photo-1596422846543-7ce3cb0d2798?q=80&w=400&auto=format&fit=crop',
    mrp: 1200,
    price: 750,
    moq: 20,
    margin: '37%',
    soldOut: false,
    progress: 85, // 85% claimed
  },
  {
    id: 'f2',
    name: 'Diwali Diya Set (Pack of 50)',
    brand: 'FESTIVAL GLOW',
    image: 'https://images.unsplash.com/photo-1603812859700-349f481c5a96?q=80&w=400&auto=format&fit=crop',
    mrp: 500,
    price: 150,
    moq: 100,
    margin: '70%',
    soldOut: false,
    progress: 40,
  }
];

const ALL_PRODUCTS = [
  {
    id: 'p1',
    name: 'Assorted Chocolate Hampers (Large)',
    brand: 'SWEET TOOTH',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=400&auto=format&fit=crop',
    mrp: 899,
    price: 550,
    moq: 30,
    rating: 4.8,
  },
  {
    id: 'p2',
    name: 'Copper Water Bottle (1L)',
    brand: 'AURA METALS',
    image: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?q=80&w=400&auto=format&fit=crop',
    mrp: 999,
    price: 450,
    moq: 50,
    rating: 4.5,
  },
  {
    id: 'p3',
    name: 'Decorative Fairy Lights (10m) Wholesale',
    brand: 'LUMINA',
    image: 'https://images.unsplash.com/photo-1512413914421-482f6e9171e2?q=80&w=400&auto=format&fit=crop',
    mrp: 299,
    price: 99,
    moq: 200,
    rating: 4.9,
  },
  {
    id: 'p4',
    name: 'Eco-Friendly Jute Tote Bags',
    brand: 'GREEN EARTH',
    image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640df1?q=80&w=400&auto=format&fit=crop',
    mrp: 199,
    price: 85,
    moq: 150,
    rating: 4.2,
  },
];

export function BannerScreen() {
  const [activeFilter, setActiveFilter] = useState('All Deals');

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans selection:bg-indigo-500/30">
      
      {/* ===== HERO SECTION ===== */}
      <div className="relative overflow-hidden bg-slate-900 pb-10 pt-4 text-white">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-600/40 blur-[80px]" />
        <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-indigo-600/50 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-full -translate-x-1/2 rounded-full bg-amber-500/20 blur-[60px]" />

        {/* Floating Sparks / Particles (Static SVG implementation) */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 400">
          <circle cx="50" cy="80" r="2" fill="white" className="animate-pulse" />
          <circle cx="350" cy="120" r="3" fill="white" className="animate-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="280" cy="300" r="1.5" fill="white" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="100" cy="250" r="2" fill="#fbbf24" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
        </svg>

        {/* Header Nav */}
        <div className="relative z-20 flex items-center justify-between px-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-colors hover:bg-white/20 border border-white/10">
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <div className="relative">
              <ShoppingCart size={18} />
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-900">
                2
              </span>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 mt-6 px-6 text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300 backdrop-blur-md border border-amber-300/20">
            <Sparkles size={12} /> Big Billion B2B Sale
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-tight">
            Festive <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Blockbuster</span>
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            Stock up for the season. Up to 80% margins on top-selling categories. Ends in <strong className="text-white">12:45:00</strong>
          </p>
          
          {/* Hero Search (Optional, blends with theme) */}
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md border border-white/20">
            <Search size={18} className="text-slate-300" />
            <input 
              type="text" 
              placeholder="Search festive deals..." 
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ===== ADVANCED FILTER BAR (Sticky) ===== */}
      <div className="sticky top-0 z-40 bg-gray-50/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="flex items-center px-4 py-3 gap-3">
          <button className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-md">
            <Filter size={14} /> Filters
          </button>
          
          <div className="h-6 w-px bg-gray-300 shrink-0" />
          
          <div className="flex flex-1 items-center gap-2 overflow-x-auto no-scrollbar scroll-touch">
            {MOCK_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeFilter === filter
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200 border'
                    : 'bg-white text-gray-600 border-gray-200 border hover:bg-gray-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-600 shadow-sm">
            <ArrowDownUp size={14} />
          </button>
        </div>
      </div>

      {/* ===== FLASH DEALS (Custom Horizontal Section) ===== */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <Zap size={18} className="fill-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-none">Steal Deals</h2>
              <p className="text-[11px] text-gray-500 font-medium mt-1">Limited stock available</p>
            </div>
          </div>
          <button className="text-xs font-bold text-indigo-600 flex items-center">
            View All <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-touch pb-4">
          {FLASH_DEALS.map((deal) => {
            const discount = Math.round(((deal.mrp - deal.price) / deal.mrp) * 100);
            return (
              <div key={deal.id} className="relative w-[260px] shrink-0 rounded-2xl bg-white border border-red-100 shadow-lg overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
                  <div className="h-full bg-gradient-to-r from-red-500 to-amber-500" style={{ width: `${deal.progress}%` }} />
                </div>
                
                <div className="relative h-36 bg-gray-100 overflow-hidden">
                  <img src={deal.image} alt={deal.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-md flex items-center gap-1">
                    <Flame size={12} className="fill-white" /> {discount}% OFF
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-semibold px-2 py-1 rounded-md">
                      MOQ: {deal.moq}
                    </span>
                    <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-md">
                      {deal.margin} Margin
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{deal.brand}</p>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2 leading-tight">{deal.name}</h3>
                  
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-gray-400 line-through">MRP ₹{deal.mrp}</p>
                      <p className="text-lg font-black text-slate-900">₹{deal.price}<span className="text-[10px] text-gray-500 font-medium">/unit</span></p>
                    </div>
                    <button className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-slate-800 active:scale-95 transition-all">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== ALL PROMOTIONAL PRODUCTS (Grid) ===== */}
      <div className="mt-4 px-4">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          {activeFilter} <span className="text-gray-400 font-medium text-sm">({ALL_PRODUCTS.length})</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          {ALL_PRODUCTS.map((product) => {
            const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
            return (
              <div key={product.id} className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-[140px] bg-gray-50 p-2">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover rounded-xl" />
                  <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    {discount}% OFF
                  </div>
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider truncate">{product.brand}</p>
                  <h3 className="text-xs font-bold text-slate-800 leading-tight mt-1 line-clamp-2 min-h-[34px]">
                    {product.name}
                  </h3>
                  
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">MOQ: {product.moq}</span>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                      <Star size={10} className="fill-amber-500" /> {product.rating}
                    </span>
                  </div>

                  <div className="mt-auto pt-2 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 line-through">₹{product.mrp}</p>
                      <p className="text-sm font-black text-slate-900">₹{product.price}</p>
                    </div>
                    <button className="h-7 w-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors">
                      <ShoppingCart size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== BOTTOM PROMO STRIP ===== */}
      <div className="mx-4 mt-8 mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-lg relative">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/20 blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h4 className="font-black text-lg">Extra 5% OFF</h4>
            <p className="text-xs text-white/90 mt-0.5">On prepaid orders above ₹10,000</p>
          </div>
          <div className="rounded-lg border border-white/30 bg-black/10 px-3 py-1.5 text-xs font-bold backdrop-blur-sm border-dashed">
            FESTIVAL5
          </div>
        </div>
      </div>

    </div>
  );
}
