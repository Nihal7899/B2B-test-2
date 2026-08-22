// screens/BannerScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ShoppingCart, Filter, Sparkles, Flame, ChevronRight, 
  Search, Star, Clock, Zap, Target, TrendingUp, ChevronDown, Package 
} from 'lucide-react';

// ==========================================
// 1. COMPLEX MOCK DATA
// ==========================================

const BENTO_ADS = [
  { id: 'b1', title: 'Corporate Gifting', sub: 'Up to 60% Margin', img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80', span: 'col-span-2 row-span-2', color: 'from-purple-900/80 to-slate-900/90' },
  { id: 'b2', title: 'Festive Decor', sub: 'Bulk Deals', img: 'https://images.unsplash.com/photo-1512413914421-482f6e9171e2?auto=format&fit=crop&w=400&q=80', span: 'col-span-1 row-span-1', color: 'from-orange-600/80 to-slate-900/90' },
  { id: 'b3', title: 'Packaging', sub: 'Min 500 units', img: 'https://images.unsplash.com/photo-1597484661643-2f5fef640df1?auto=format&fit=crop&w=400&q=80', span: 'col-span-1 row-span-1', color: 'from-emerald-600/80 to-slate-900/90' },
];

const FLASH_DEALS = [
  {
    id: 'f1', name: 'Premium Cashew & Almond Gift Box (1kg) - Velvet Finish', brand: 'ROYAL BITES', 
    images: ['https://images.unsplash.com/photo-1596422846543-7ce3cb0d2798?auto=format&fit=crop&w=400&q=80'],
    mrp: 1499, price: 650, moq: 50, margin: '56%', stock: 120, sold: 98, rating: 4.9, reviews: 142, tags: ['Trending', 'High Margin']
  },
  {
    id: 'f2', name: 'Handcrafted Terracotta Diyas (Set of 100)', brand: 'EARTHEN', 
    images: ['https://images.unsplash.com/photo-1603812859700-349f481c5a96?auto=format&fit=crop&w=400&q=80'],
    mrp: 800, price: 200, moq: 10, margin: '75%', stock: 500, sold: 410, rating: 4.6, reviews: 89, tags: ['Best Seller']
  },
];

const PRODUCT_GRID = [
  { id: 'p1', name: 'Copper Bottle & Glass Set', brand: 'AURA METALS', price: 550, mrp: 1299, moq: 20, margin: '57%', img: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=400&q=80' },
  { id: 'p2', name: 'Artisan Chocolate Hampers', brand: 'COCOA LUST', price: 320, mrp: 599, moq: 40, margin: '46%', img: 'https://images.unsplash.com/photo-1542226601-bc82e2764b81?auto=format&fit=crop&w=400&q=80' },
  { id: 'p3', name: 'Aromatic Candle Set (Pack of 3)', brand: 'LUMINA', price: 180, mrp: 450, moq: 100, margin: '60%', img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&q=80' },
  { id: 'p4', name: 'Gold-Plated Serving Bowl', brand: 'LUXE HOME', price: 890, mrp: 2199, moq: 15, margin: '59%', img: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=400&q=80' },
];

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export function BannerScreen() {
  const [activeTab, setActiveTab] = useState('All');
  
  // Fake countdown logic for visual effect
  const [timeLeft, setTimeLeft] = useState({ h: 12, m: 45, s: 30 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else { s = 59; if (m > 0) m--; else { m = 59; h--; } }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white font-sans overflow-x-hidden selection:bg-fuchsia-500/30 pb-24">
      {/* --- INLINE ANIMATIONS --- */}
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 15s linear infinite; white-space: nowrap; }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }
        .animate-pulse-glow { animation: pulse-glow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>

      {/* --- HERO / HEADER --- */}
      <div className="relative pt-4 pb-8 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-[#0a0a0e] to-orange-900/20 z-0" />
        <div className="absolute top-0 left-1/4 h-96 w-96 bg-fuchsia-600/30 rounded-full blur-[100px] animate-pulse-glow z-0" />
        <div className="absolute bottom-0 right-0 h-80 w-80 bg-orange-600/20 rounded-full blur-[80px] animate-pulse-glow z-0" style={{ animationDelay: '2s' }} />

        {/* Top Nav */}
        <div className="relative z-20 flex items-center justify-between px-4">
          <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Search size={18} />
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md relative">
              <ShoppingCart size={18} />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-[10px] font-bold rounded-full flex items-center justify-center border border-[#0a0a0e]">3</span>
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 px-6 mt-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-fuchsia-500/20 border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-orange-400 mb-4 animate-float">
            <Sparkles size={12} className="fill-orange-400" /> Mega Festival Unlock
          </div>
          <h1 className="text-5xl font-black leading-[1.1] tracking-tighter">
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-orange-500 to-amber-400">ULTIMATE</span><br/> B2B SALE.
          </h1>
          
          {/* Live Timer */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400 flex items-center gap-1"><Clock size={14}/> Ends in</span>
            <div className="flex gap-1.5 text-lg font-black">
              <div className="w-10 h-10 flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                <span>{String(timeLeft.h).padStart(2, '0')}</span>
              </div>
              <span className="text-orange-500 mt-1">:</span>
              <div className="w-10 h-10 flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                <span>{String(timeLeft.m).padStart(2, '0')}</span>
              </div>
              <span className="text-orange-500 mt-1">:</span>
              <div className="w-10 h-10 flex flex-col items-center justify-center bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                <span className="text-orange-400">{String(timeLeft.s).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RUNNING MARQUEE --- */}
      <div className="relative flex overflow-hidden bg-gradient-to-r from-fuchsia-600 to-orange-600 py-2.5 shadow-[0_0_20px_rgba(249,115,22,0.3)] z-30 transform -rotate-1 border-y border-white/20 scale-105">
        <div className="animate-marquee flex gap-6 text-[11px] font-black uppercase tracking-widest text-white">
          {[...Array(6)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-2"><Zap size={14} className="fill-white"/> FLAT 50% MARGINS</span>
              <span className="flex items-center gap-2">★ FREE SHIPPING OVER ₹10K</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* --- BENTO AD GRID --- */}
      <div className="px-4 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Target size={18} className="text-fuchsia-500" /> Curated Zones
          </h2>
        </div>
        <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[220px]">
          {BENTO_ADS.map((ad) => (
            <div key={ad.id} className={`relative rounded-2xl overflow-hidden group cursor-pointer ${ad.span}`}>
              <img src={ad.img} alt={ad.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className={`absolute inset-0 bg-gradient-to-t ${ad.color} transition-opacity duration-300 group-hover:opacity-90`} />
              <div className="absolute inset-0 p-3 flex flex-col justify-end">
                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">{ad.sub}</p>
                <h3 className="text-sm font-black leading-tight text-white">{ad.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- ADVANCED FLASH DEALS (Horizontal Scroll) --- */}
      <div className="mt-10">
        <div className="px-4 flex items-center justify-between mb-4">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Flame size={20} className="fill-orange-500 text-orange-500 animate-pulse" /> Flash Deals
          </h2>
          <button className="text-[11px] font-bold text-gray-400 flex items-center hover:text-white transition-colors">
            View All <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto px-4 pb-6 no-scrollbar snap-x">
          {FLASH_DEALS.map((deal) => {
            const progress = (deal.sold / deal.stock) * 100;
            return (
              <div key={deal.id} className="w-[300px] shrink-0 snap-center rounded-3xl bg-[#13131a] border border-white/5 shadow-2xl overflow-hidden group">
                <div className="relative h-44 overflow-hidden">
                  <img src={deal.images[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={deal.name}/>
                  {/* Glass overlays */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {deal.tags.map(tag => (
                      <span key={tag} className="bg-black/60 backdrop-blur-md text-[9px] font-bold px-2 py-1 rounded-md border border-white/10 shadow-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[11px] font-black px-2 py-1 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                    {deal.margin} Margin
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{deal.brand}</p>
                  <h3 className="text-sm font-bold mt-1 line-clamp-2 leading-snug">{deal.name}</h3>
                  
                  {/* Custom Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5">
                      <span>{deal.sold} Claimed</span>
                      <span>Only {deal.stock - deal.sold} Left</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-fuchsia-500 to-orange-500 rounded-full relative" style={{ width: `${progress}%` }}>
                        <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-gray-500 line-through mb-0.5">MRP ₹{deal.mrp}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">₹{deal.price}</span>
                        <span className="text-[10px] font-medium text-gray-400">/unit</span>
                      </div>
                      <p className="text-[10px] text-orange-400 font-bold mt-0.5"><Package size={10} className="inline mr-1"/>MOQ: {deal.moq}</p>
                    </div>
                    <button className="h-11 px-5 rounded-2xl bg-white text-black font-black text-xs hover:bg-gray-200 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- STICKY GLASS FILTER --- */}
      <div className="sticky top-0 z-40 bg-[#0a0a0e]/80 backdrop-blur-xl border-y border-white/5 py-3 mt-4">
        <div className="flex items-center gap-2 overflow-x-auto px-4 no-scrollbar">
          <button className="shrink-0 flex items-center gap-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold">
            <Filter size={14} /> Filter
          </button>
          <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
          {['All', 'High Margin', 'Trending', 'New Arrivals', 'Clearance'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab 
                ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- ALL PRODUCTS (Masonry-style Grid) --- */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-2 gap-3">
          {PRODUCT_GRID.map(product => (
            <div key={product.id} className="bg-[#13131a] rounded-2xl border border-white/5 overflow-hidden group">
              <div className="relative h-36 bg-[#1a1a24]">
                <img src={product.img} alt={product.name} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-2 left-2 bg-[#0a0a0e]/80 backdrop-blur-md border border-white/10 text-[9px] font-bold px-1.5 py-0.5 rounded text-white">
                  {product.margin} Margin
                </div>
              </div>
              <div className="p-3 flex flex-col h-[130px]">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{product.brand}</p>
                <h3 className="text-xs font-bold mt-1 line-clamp-2 leading-tight text-gray-200">{product.name}</h3>
                <div className="mt-auto pt-2 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 line-through">₹{product.mrp}</p>
                    <p className="text-sm font-black text-white">₹{product.price}</p>
                  </div>
                  <button className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors">
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-6 py-4 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
          Load More Products <ChevronDown size={16} />
        </button>
      </div>

    </div>
  );
}
