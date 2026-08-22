// screens/BannerScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ShoppingCart, Filter, Sparkles, Flame, ChevronRight, 
  Search, Star, Clock, Zap, TrendingUp, ChevronDown, Package, ShieldCheck, Plus, Tag
} from 'lucide-react';

// ==========================================
// 1. COMPLEX MOCK DATA
// ==========================================

const BENTO_ADS = [
  { 
    id: 'b1', title: 'Mega Combo Offers', sub: 'Buy 2 Get 15% Off', 
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80', 
    span: 'col-span-2 row-span-2', bg: 'bg-emerald-50' 
  },
  { 
    id: 'b2', title: 'Top Selling', sub: 'Verified Brands', 
    img: 'https://images.unsplash.com/photo-1542226601-bc82e2764b81?auto=format&fit=crop&w=400&q=80', 
    span: 'col-span-1 row-span-1', bg: 'bg-blue-50' 
  },
  { 
    id: 'b3', title: 'Clearance', sub: 'Up to 80% Margin', 
    img: 'https://images.unsplash.com/photo-1597484661643-2f5fef640df1?auto=format&fit=crop&w=400&q=80', 
    span: 'col-span-1 row-span-1', bg: 'bg-rose-50' 
  },
];

const COMBO_DEALS = [
  {
    id: 'c1',
    name: 'Festive Gifting Combo',
    items: ['Premium Almonds (1kg)', 'Roasted Cashews (1kg)'],
    images: [
      'https://images.unsplash.com/photo-1596422846543-7ce3cb0d2798?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1599598425947-3300262b7e19?auto=format&fit=crop&w=200&q=80'
    ],
    mrp: 2400, price: 1350, moq: 10, margin: '43%', tag: 'Bestseller Combo'
  },
  {
    id: 'c2',
    name: 'Home Decor Setup',
    items: ['Terracotta Diyas (100)', 'Fairy Lights (50m)'],
    images: [
      'https://images.unsplash.com/photo-1603812859700-349f481c5a96?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1512413914421-482f6e9171e2?auto=format&fit=crop&w=200&q=80'
    ],
    mrp: 1500, price: 650, moq: 20, margin: '56%', tag: 'Trending Combo'
  }
];

const FLASH_DEALS = [
  {
    id: 'f1', name: 'Artisan Chocolate Hampers - Gold Edition', brand: 'ROYAL BITES', 
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80',
    mrp: 1499, price: 650, moq: 50, margin: '56%', stock: 120, sold: 98, rating: 4.9
  },
  {
    id: 'f2', name: 'Copper Bottle & Glass Premium Set', brand: 'AURA METALS', 
    image: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=400&q=80',
    mrp: 1299, price: 550, moq: 20, margin: '57%', stock: 200, sold: 185, rating: 4.8
  },
];

const PRODUCT_GRID = [
  { id: 'p1', name: 'Aromatic Candle Set (Pack of 3)', brand: 'LUMINA', price: 180, mrp: 450, moq: 100, margin: '60%', rating: 4.5, img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=400&q=80' },
  { id: 'p2', name: 'Gold-Plated Serving Bowl', brand: 'LUXE HOME', price: 890, mrp: 2199, moq: 15, margin: '59%', rating: 4.7, img: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=400&q=80' },
  { id: 'p3', name: 'Eco-Friendly Jute Tote Bags', brand: 'GREEN EARTH', price: 85, mrp: 199, moq: 150, margin: '57%', rating: 4.2, img: 'https://images.unsplash.com/photo-1597484661643-2f5fef640df1?auto=format&fit=crop&w=400&q=80' },
  { id: 'p4', name: 'Premium Ceramic Mug Set', brand: 'CLAY & CO', price: 220, mrp: 599, moq: 40, margin: '63%', rating: 4.6, img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=400&q=80' },
];

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export function BannerScreen() {
  const [activeTab, setActiveTab] = useState('All Deals');
  
  // Fake countdown logic
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-brand-500/30 pb-24">
      
      {/* --- INLINE ANIMATIONS --- */}
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; white-space: nowrap; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .mesh-bg {
          background-color: #f8fafc;
          background-image: 
            radial-gradient(at 0% 0%, hsla(253,16%,7deg,0) 0, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(225,39%,30%,0.05) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(339,49%,30%,0.05) 0, transparent 50%);
        }
      `}</style>

      {/* --- HERO / HEADER --- */}
      <div className="relative pt-4 pb-8 overflow-hidden mesh-bg bg-white">
        {/* Soft Ambient Blurs */}
        <div className="absolute top-[-20%] left-[-10%] h-64 w-64 rounded-full bg-blue-400/20 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] h-64 w-64 rounded-full bg-rose-400/20 blur-[80px] pointer-events-none" />

        {/* Top Nav */}
        <div className="relative z-20 flex items-center justify-between px-4">
          <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex gap-2">
            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-700">
              <Search size={18} />
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 relative">
              <ShoppingCart size={18} />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">3</span>
            </button>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 px-4 mt-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-brand-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-brand-600 mb-4 animate-float">
            <Sparkles size={12} className="text-brand-500" /> B2B Exclusive Sale
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.15] tracking-tight text-slate-900">
            Unbeatable <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Wholesale Deals</span>
          </h1>
          
          <p className="mt-3 text-sm text-slate-500 font-medium max-w-[280px]">
            Maximize your margins. Top verified brands at factory prices.
          </p>

          {/* Clean Glass Countdown */}
          <div className="mt-6 inline-flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-50 text-slate-400">
              <Clock size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ends In</span>
              <div className="flex gap-1 text-sm font-black text-slate-800">
                <span>{String(timeLeft.h).padStart(2, '0')}h</span>
                <span className="text-slate-300">:</span>
                <span>{String(timeLeft.m).padStart(2, '0')}m</span>
                <span className="text-slate-300">:</span>
                <span className="text-brand-600">{String(timeLeft.s).padStart(2, '0')}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RUNNING MARQUEE --- */}
      <div className="relative flex overflow-hidden bg-brand-600 py-2.5 z-30 transform -rotate-1 scale-105 shadow-md border-y border-brand-500">
        <div className="animate-marquee flex gap-8 text-[11px] font-black uppercase tracking-widest text-white">
          {[...Array(6)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-2"><Zap size={14} className="fill-brand-300 text-brand-300"/> FLAT 60% MARGINS</span>
              <span className="flex items-center gap-2"><ShieldCheck size={14} /> VERIFIED SELLERS</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* --- BENTO AD GRID (Campaigns) --- */}
      <div className="px-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">Featured Campaigns</h2>
        </div>
        <div className="grid grid-cols-3 grid-rows-2 gap-2.5 h-[240px]">
          {BENTO_ADS.map((ad) => (
            <div key={ad.id} className={`relative rounded-3xl overflow-hidden group cursor-pointer border border-slate-100 shadow-sm ${ad.bg} ${ad.span}`}>
              <img src={ad.img} alt={ad.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {/* Gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <div className="absolute inset-0 p-3.5 flex flex-col justify-end">
                <span className="inline-block px-2 py-1 mb-1.5 rounded bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider self-start border border-white/20">
                  {ad.sub}
                </span>
                <h3 className="text-sm md:text-base font-black leading-tight text-white">{ad.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- COMBO OFFERS (Complex Card UI) --- */}
      <div className="mt-8 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Tag size={18} className="text-brand-600" /> Combo Deals
          </h2>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-4">
          {COMBO_DEALS.map((combo) => (
            <div key={combo.id} className="w-[300px] shrink-0 snap-center rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md">
                  {combo.tag}
                </span>
                <span className="text-[10px] font-bold text-slate-500">MOQ: {combo.moq}</span>
              </div>
              
              {/* Visual Combo representation */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <img src={combo.images[0]} className="w-full h-full object-cover" alt="item 1"/>
                </div>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Plus size={14} />
                </div>
                <div className="flex-1 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <img src={combo.images[1]} className="w-full h-full object-cover" alt="item 2"/>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{combo.name}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{combo.items.join(' + ')}</p>
              
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 line-through mb-0.5">₹{combo.mrp}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-brand-700">₹{combo.price}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-600 mb-1">{combo.margin} Margin</p>
                  <button className="h-8 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors">
                    Add Combo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- TOP SELLING (Flash Deals with Progress) --- */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-rose-500" /> Top Selling
          </h2>
          <button className="text-[11px] font-bold text-brand-600 flex items-center">
            View All <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-2">
          {FLASH_DEALS.map((deal) => {
            const progress = (deal.sold / deal.stock) * 100;
            const discount = Math.round(((deal.mrp - deal.price) / deal.mrp) * 100);
            return (
              <div key={deal.id} className="w-[260px] shrink-0 snap-center rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden group p-2">
                <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-50">
                  <img src={deal.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={deal.name}/>
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase px-2 py-1 rounded-lg shadow-sm">
                    {discount}% OFF
                  </div>
                  <div className="absolute bottom-2 left-2 bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-1 rounded-lg">
                    {deal.margin} Margin
                  </div>
                </div>
                
                <div className="p-2 pt-3">
                  <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest">{deal.brand}</p>
                  <h3 className="text-xs font-bold mt-1 line-clamp-2 leading-snug text-slate-900 min-h-[34px]">{deal.name}</h3>
                  
                  {/* Custom Progress Bar (Light Theme) */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1.5">
                      <span>{deal.sold} Sold</span>
                      <span className="text-rose-500">Only {deal.stock - deal.sold} Left</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-900">₹{deal.price}</span>
                        <span className="text-[10px] font-medium text-slate-400">/unit</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5"><Package size={10} className="inline mr-1"/>MOQ: {deal.moq}</p>
                    </div>
                    <button className="h-9 w-9 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition-colors">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- STICKY GLASS FILTER --- */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-y border-slate-200 py-3 mt-6 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto px-4 no-scrollbar">
          <button className="shrink-0 flex items-center gap-1.5 bg-slate-900 text-white rounded-xl px-3 py-2 text-xs font-bold shadow-md">
            <Filter size={14} /> Filter
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1 shrink-0" />
          {['All Deals', 'High Margin', 'Electronics', 'Packaging', 'Gifting'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === tab 
                ? 'bg-brand-50 border-brand-200 text-brand-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- ALL PRODUCTS (High-Density Grid) --- */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-2 gap-3">
          {PRODUCT_GRID.map(product => {
            const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group flex flex-col">
                <div className="relative h-[140px] bg-slate-50 p-1.5">
                  <img src={product.img} alt={product.name} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-white text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-slate-100">
                    {discount}% OFF
                  </div>
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <p className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">{product.brand}</p>
                  <h3 className="text-xs font-bold mt-1 line-clamp-2 leading-tight text-slate-800 min-h-[32px]">{product.name}</h3>
                  
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">MOQ: {product.moq}</span>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                      <Star size={10} className="fill-amber-500" /> {product.rating}
                    </span>
                  </div>

                  <div className="mt-auto pt-3 flex items-end justify-between border-t border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 line-through">₹{product.mrp}</p>
                      <p className="text-sm font-black text-slate-900">₹{product.price}</p>
                    </div>
                    <button className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors">
                      <ShoppingCart size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <button className="w-full mt-6 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm text-sm font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-[0.98]">
          Load More Products <ChevronDown size={16} />
        </button>
      </div>

    </div>
  );
}
