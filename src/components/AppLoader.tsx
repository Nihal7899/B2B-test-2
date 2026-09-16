import React, { useState, useEffect } from 'react';

interface AppLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  type?: 'home' | 'general';
  className?: string;
}

const HOME_MESSAGES = [
  'Dispatching wholesale catalog...',
  'Verifying mandi rates & cold-chain stock...',
  'Loading bulk crates & staples...',
  'Optimizing supply chain routes...',
  'Sourcing farm-fresh produce...',
  'Palletizing B2B inventory...',
  'Routing your express store delivery...',
  'Quality checking fresh harvests...',
  'Securing fleet for transit...',
  'Syncing warehouse logistics...',
  'Finalizing wholesale dispatch...',
];

const GROCERY_QUOTES = [
  "Freshness you can taste, quality you can trust...",
  "Good food brings people together...",
  "Eat fresh, live better...",
  "Your daily dose of farm-fresh goodness...",
  "Quality groceries, delivered with care...",
  "Healthy eating starts with healthy shopping...",
  "From farm to table, just for you...",
  "Bringing the best of nature to your kitchen...",
  "Nourishing your family with every delivery...",
  "Wholesome ingredients for delicious meals...",
  "Stocking up your pantry with happiness...",
  "Taste the difference of farm-fresh produce..."
];

// Reusable Cityscape Component with fully integrated Sidewalk & Road
const CityscapeBackground = () => (
  <svg viewBox="0 0 1200 650" className="h-full w-auto shrink-0">
    <defs>
      <g id="map-pin">
        <path d="M15,0 C6.7,0 0,6.7 0,15 C0,26.2 15,42 15,42 C15,42 30,26.2 30,15 C30,6.7 23.3,0 15,0 Z" fill="#65B874" />
        <circle cx="15" cy="14" r="6" fill="#DFF0E2" />
      </g>
      <rect id="win-sm" width="12" height="15" fill="#E8F4EA" />
      <rect id="win-md" width="18" height="22" fill="#E8F4EA" />
      <rect id="win-wide" width="60" height="15" fill="#E8F4EA" />
      <rect id="win-wide-dark" width="60" height="15" fill="#9CD4A8" />
      
      {/* Reusable Fire Hydrant */}
      <g id="fire-hydrant">
        <rect x="-6" y="0" width="12" height="25" fill="#E53935" rx="3" />
        <path d="M-8,3 Q0,-4 8,3 Z" fill="#D32F2F" />
        <rect x="-8" y="5" width="16" height="4" fill="#B71C1C" rx="1" />
        <rect x="-10" y="21" width="20" height="4" fill="#B71C1C" rx="1" />
        <circle cx="0" cy="11" r="5" fill="#D32F2F" />
        <circle cx="0" cy="11" r="2.5" fill="#FFCDD2" />
        <circle cx="-7" cy="11" r="2.5" fill="#C62828" />
        <circle cx="7" cy="11" r="2.5" fill="#C62828" />
      </g>
    </defs>

    {/* BACKGROUND SKY/CLOUDS LAYER */}
    <g fill="#E4F2E7">
      <path d="M290,130 a20,20 0 0,1 40,-10 a25,25 0 0,1 45,5 a18,18 0 0,1 15,20 h-100 z" />
      <path d="M850,140 a15,15 0 0,1 30,-5 a20,20 0 0,1 40,5 a15,15 0 0,1 10,15 h-80 z" />
      <rect x="80" y="280" width="40" height="150" rx="3" />
      <rect x="140" y="230" width="80" height="200" rx="4" />
      <rect x="250" y="250" width="40" height="180" rx="2" />
      <rect x="680" y="200" width="60" height="230" rx="3" />
      <rect x="830" y="210" width="50" height="220" rx="3" />
      <rect x="920" y="250" width="40" height="180" rx="2" />
      <rect x="1000" y="270" width="60" height="160" rx="3" />
      <rect x="1100" y="290" width="50" height="140" rx="3" />
      <ellipse cx="270" cy="185" rx="15" ry="4" />
      <ellipse cx="290" cy="195" rx="10" ry="3" />
      <ellipse cx="730" cy="150" rx="12" ry="3" />
      <ellipse cx="760" cy="150" rx="8" ry="2" />
      <ellipse cx="1060" cy="190" rx="18" ry="4" />
      <ellipse cx="1090" cy="185" rx="10" ry="2" />
    </g>

    {/* MIDGROUND BUILDINGS LAYER */}
    <g fill="#C0E2C6">
      <polygon points="410,430 410,170 510,130 510,430" />
      <g fill="#A3D7AB">
        <polygon points="430,205 450,197 450,217 430,225" />
        <polygon points="465,191 485,183 485,203 465,211" />
        <polygon points="430,245 450,237 450,257 430,265" />
        <polygon points="465,231 485,223 485,243 465,251" />
        <polygon points="430,285 450,277 450,297 430,305" />
        <polygon points="465,271 485,263 485,283 465,291" />
        <polygon points="430,325 450,317 450,337 430,345" />
        <polygon points="465,311 485,303 485,323 465,331" />
        <polygon points="430,365 450,357 450,377 430,385" />
        <polygon points="465,351 485,343 485,363 465,371" />
      </g>
      <rect x="830" y="250" width="100" height="180" />
      <g fill="#A3D7AB">
        <use href="#win-md" x="845" y="270" /> <use href="#win-md" x="870" y="270" /> <use href="#win-md" x="895" y="270" />
        <use href="#win-md" x="845" y="305" /> <use href="#win-md" x="870" y="305" /> <use href="#win-md" x="895" y="305" />
        <use href="#win-md" x="845" y="340" /> <use href="#win-md" x="870" y="340" /> <use href="#win-md" x="895" y="340" />
        <use href="#win-md" x="845" y="375" /> <use href="#win-md" x="870" y="375" /> <use href="#win-md" x="895" y="375" />
      </g>
      <rect x="220" y="270" width="60" height="160" />
      <g fill="#A3D7AB">
        <use href="#win-sm" x="230" y="290" /> <use href="#win-sm" x="252" y="290" />
        <use href="#win-sm" x="230" y="320" /> <use href="#win-sm" x="252" y="320" />
        <use href="#win-sm" x="230" y="350" /> <use href="#win-sm" x="252" y="350" />
      </g>
      <rect x="710" y="170" width="40" height="260" />
      <g fill="#A3D7AB">
        <use href="#win-sm" x="724" y="200" />
        <use href="#win-sm" x="724" y="230" />
        <use href="#win-sm" x="724" y="260" />
        <use href="#win-sm" x="724" y="290" />
      </g>
    </g>

    {/* FOREGROUND BUILDINGS */}
    <g transform="translate(280, 230)">
      <rect width="110" height="200" fill="#98D2A4" />
      <rect x="80" y="-20" width="2" height="20" fill="#70B87C" />
      <rect x="15" y="20" width="80" height="20" fill="#C4E6C9" />
      <rect x="15" y="55" width="80" height="20" fill="#C4E6C9" />
      <rect x="15" y="90" width="80" height="20" fill="#C4E6C9" />
      <rect x="15" y="125" width="80" height="20" fill="#C4E6C9" />
      <rect x="15" y="160" width="80" height="20" fill="#C4E6C9" />
    </g>

    <g transform="translate(390, 290)">
      <rect width="90" height="140" fill="#98D2A4" />
      <use href="#win-md" x="15" y="20" /> <use href="#win-md" x="55" y="20" />
      <use href="#win-md" x="15" y="55" /> <use href="#win-md" x="55" y="55" />
      <rect x="10" y="90" width="70" height="5" fill="#75C282" />
      <rect x="15" y="95" width="25" height="45" fill="#C4E6C9" />
      <rect x="50" y="95" width="25" height="45" fill="#C4E6C9" />
    </g>

    <g transform="translate(510, 110)">
      <rect x="75" y="0" width="20" height="50" fill="#98D2A4" />
      <rect x="30" y="50" width="110" height="60" fill="#98D2A4" />
      <use href="#win-md" x="50" y="70" />
      <use href="#win-md" x="95" y="70" />
      <rect x="0" y="110" width="170" height="220" fill="#98D2A4" />
      <use href="#win-md" x="25" y="130" /> <use href="#win-md" x="60" y="130" /> <use href="#win-md" x="95" y="130" /> <use href="#win-md" x="130" y="130" />
      <use href="#win-md" x="25" y="170" /> <use href="#win-md" x="60" y="170" /> <use href="#win-md" x="95" y="170" /> <use href="#win-md" x="130" y="170" />
      <use href="#win-md" x="25" y="210" /> <use href="#win-md" x="60" y="210" /> <use href="#win-md" x="95" y="210" /> <use href="#win-md" x="130" y="210" />
      <use href="#win-md" x="25" y="250" /> <use href="#win-md" x="60" y="250" /> <use href="#win-md" x="95" y="250" /> <use href="#win-md" x="130" y="250" />
      <rect x="30" y="295" width="110" height="15" fill="#75C282" />
      <rect x="50" y="310" width="30" height="40" fill="#C4E6C9" />
      <rect x="85" y="310" width="30" height="40" fill="#C4E6C9" />
    </g>

    <g transform="translate(710, 230)">
      <rect x="40" y="0" width="45" height="20" fill="#98D2A4" />
      <rect x="0" y="20" width="105" height="180" fill="#98D2A4" />
      <use href="#win-md" x="25" y="40" /> <use href="#win-md" x="65" y="40" />
      <use href="#win-md" x="25" y="80" /> <use href="#win-md" x="65" y="80" />
      <use href="#win-md" x="25" y="120" /> <use href="#win-md" x="65" y="120" />
      <use href="#win-md" x="25" y="160" /> <use href="#win-md" x="65" y="160" />
    </g>

    {/* FOREGROUND SHOPS */}
    <g transform="translate(80, 310)">
      <use href="#map-pin" x="100" y="-40" />
      <rect x="15" y="40" width="140" height="80" fill="#F4FAF5" />
      <rect x="30" y="55" width="60" height="40" fill="#A8D6B1" />
      <rect x="110" y="55" width="30" height="40" fill="#A8D6B1" />
      <circle cx="45" cy="85" r="5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="55" cy="85" r="5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="65" cy="85" r="5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="75" cy="85" r="5" fill="#FFFFFF" opacity="0.6" />
      <rect x="115" y="80" width="20" height="10" fill="#FFFFFF" opacity="0.6" />
      <path d="M5,40 L15,10 L155,10 L165,40 Z" fill="#75C282" />
      <polygon points="20,10 35,10 32,40 11,40" fill="#F4FAF5" />
      <polygon points="50,10 65,10 68,40 44,40" fill="#F4FAF5" />
      <polygon points="80,10 95,10 104,40 80,40" fill="#F4FAF5" />
      <polygon points="110,10 125,10 140,40 116,40" fill="#F4FAF5" />
      <polygon points="140,10 155,10 165,40 152,40" fill="#F4FAF5" />
      <circle cx="11" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="23" cy="40" r="6" fill="#75C282" />
      <circle cx="35" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="47" cy="40" r="6" fill="#75C282" />
      <circle cx="59" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="71" cy="40" r="6" fill="#75C282" />
      <circle cx="83" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="95" cy="40" r="6" fill="#75C282" />
      <circle cx="107" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="119" cy="40" r="6" fill="#75C282" />
      <circle cx="131" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="143" cy="40" r="6" fill="#75C282" />
      <circle cx="155" cy="40" r="6" fill="#F4FAF5" />
    </g>

    <g transform="translate(950, 315)">
      <use href="#map-pin" x="35" y="-60" />
      <rect x="25" y="40" width="115" height="75" fill="#F4FAF5" />
      <rect x="35" y="55" width="30" height="40" fill="#A8D6B1" />
      <rect x="75" y="55" width="55" height="40" fill="#A8D6B1" />
      <circle cx="85" cy="85" r="4" fill="#FFFFFF" opacity="0.6" />
      <circle cx="95" cy="85" r="4" fill="#FFFFFF" opacity="0.6" />
      <circle cx="105" cy="85" r="4" fill="#FFFFFF" opacity="0.6" />
      <circle cx="115" cy="85" r="4" fill="#FFFFFF" opacity="0.6" />
      <path d="M15,40 L25,10 L135,10 L145,40 Z" fill="#75C282" />
      <polygon points="30,10 45,10 42,40 21,40" fill="#F4FAF5" />
      <polygon points="60,10 75,10 78,40 54,40" fill="#F4FAF5" />
      <polygon points="90,10 105,10 114,40 90,40" fill="#F4FAF5" />
      <polygon points="120,10 135,10 145,40 126,40" fill="#F4FAF5" />
      <circle cx="21" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="33" cy="40" r="6" fill="#75C282" />
      <circle cx="45" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="57" cy="40" r="6" fill="#75C282" />
      <circle cx="69" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="81" cy="40" r="6" fill="#75C282" />
      <circle cx="93" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="105" cy="40" r="6" fill="#75C282" />
      <circle cx="117" cy="40" r="6" fill="#F4FAF5" />
      <circle cx="129" cy="40" r="6" fill="#75C282" />
      <circle cx="141" cy="40" r="6" fill="#F4FAF5" />
    </g>

    {/* BACKGROUND GRASS/TREES (Behind Sidewalk) */}
    <g>
      <g fill="#70B87C">
        <rect x="80" y="400" width="4" height="30" />
        <rect x="280" y="400" width="4" height="30" />
        <rect x="360" y="380" width="5" height="50" />
        <rect x="510" y="400" width="4" height="30" />
        <rect x="698" y="380" width="4" height="50" />
        <rect x="855" y="380" width="5" height="50" />
        <rect x="1133" y="390" width="4" height="40" />
      </g>
      <circle cx="120" cy="410" r="25" fill="#A8D6B1" />
      <circle cx="300" cy="410" r="20" fill="#A8D6B1" />
      <circle cx="490" cy="415" r="15" fill="#A8D6B1" />
      <circle cx="650" cy="410" r="30" fill="#A8D6B1" />
      <circle cx="940" cy="405" r="25" fill="#A8D6B1" />
      <ellipse cx="82" cy="380" rx="20" ry="30" fill="#98D2A4" />
      <ellipse cx="362" cy="360" rx="25" ry="35" fill="#98D2A4" />
      <ellipse cx="700" cy="360" rx="22" ry="35" fill="#98D2A4" />
      <ellipse cx="857" cy="355" rx="30" ry="40" fill="#98D2A4" />
      <ellipse cx="1135" cy="375" rx="22" ry="30" fill="#98D2A4" />
      <rect x="81" y="360" width="2" height="25" fill="#75C282" />
      <rect x="361" y="340" width="3" height="30" fill="#75C282" />
      <rect x="699" y="340" width="2" height="30" fill="#75C282" />
      <rect x="856" y="330" width="3" height="35" fill="#75C282" />
      <rect x="1134" y="355" width="2" height="25" fill="#75C282" />
    </g>

    {/* ============================================== */}
    {/* NEW SECTION: SIDEWALK, BUSHES, HYDRANTS & ROAD */}
    {/* ============================================== */}
    
    {/* Grass padding base */}
    <rect x="0" y="420" width="1200" height="20" fill="#E4F2E7" />
    
    {/* Raised Sidewalk */}
    <rect x="0" y="430" width="1200" height="25" fill="#D6EED9" />
    <rect x="0" y="455" width="1200" height="6" fill="#A3D7AB" />
    
    {/* Sidewalk Tiles / Cracks */}
    <path d="M50,430 v25 M150,430 v25 M250,430 v25 M350,430 v25 M450,430 v25 M550,430 v25 M650,430 v25 M750,430 v25 M850,430 v25 M950,430 v25 M1050,430 v25 M1150,430 v25" stroke="#C0E2C6" strokeWidth="2" />

    {/* Fire Hydrants on the sidewalk */}
    <use href="#fire-hydrant" x="250" y="430" />
    <use href="#fire-hydrant" x="850" y="430" />

    {/* Overlapping Sidewalk Bushes (creates beautiful depth) */}
    <g>
      <circle cx="60" cy="425" r="15" fill="#98D2A4" />
      <circle cx="100" cy="428" r="18" fill="#75C282" />
      <ellipse cx="280" cy="425" rx="15" ry="20" fill="#98D2A4" />
      <circle cx="330" cy="428" r="14" fill="#75C282" />
      <circle cx="380" cy="425" r="14" fill="#98D2A4" />
      <circle cx="420" cy="432" r="18" fill="#75C282" />
      <circle cx="510" cy="425" r="16" fill="#98D2A4" />
      <circle cx="670" cy="428" r="18" fill="#75C282" />
      <circle cx="710" cy="425" r="20" fill="#98D2A4" />
      <circle cx="770" cy="420" r="30" fill="#98D2A4" />
      <circle cx="810" cy="428" r="15" fill="#75C282" />
      <circle cx="890" cy="425" r="18" fill="#98D2A4" />
      <circle cx="970" cy="430" r="16" fill="#75C282" />
      <circle cx="1110" cy="425" r="14" fill="#98D2A4" />
      <circle cx="1150" cy="430" r="20" fill="#75C282" />
    </g>

    {/* The Seamless Pale Green Road */}
    <rect x="0" y="461" width="1200" height="189" fill="#E4F2E7" />
    
    {/* Road Lane Dividers (Dashed lines) */}
    <line x1="0" y1="550" x2="1200" y2="550" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="6" strokeDasharray="50 40" />
    {/* Bottom Road Edge Fade */}
    <rect x="0" y="620" width="1200" height="30" fill="#C0E2C6" opacity="0.3" />
  </svg>
);

export const AppLoader = React.memo(function AppLoader({
  fullScreen = true,
  size = 'md',
  showStatus = false,
  type = 'home',
  className = '',
}: AppLoaderProps) {
  const messagesList = type === 'home' ? HOME_MESSAGES : GROCERY_QUOTES;
  
  const [msgIndex, setMsgIndex] = useState(() => 
    type === 'home' ? 0 : Math.floor(Math.random() * messagesList.length)
  );

  useEffect(() => {
    if (!showStatus) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messagesList.length);
    }, type === 'home' ? 1800 : 3500);
    return () => clearInterval(interval);
  }, [showStatus, messagesList.length, type]);

  const scaleClass =
    size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-105' : 'scale-95 sm:scale-100';

  const progressPercent = (msgIndex / (HOME_MESSAGES.length - 1)) * 100;

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen ? 'fixed inset-0 z-50 animate-fade-in' : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center w-full ${scaleClass}`}>
        
        {/* Main Stage Viewport - Expanded height prevents building cutoffs */}
        <div className="relative w-full max-w-[900px] h-[550px] sm:h-[600px] flex items-center justify-center overflow-hidden">
          
          {/* ========================================================= */}
          {/* 1. SEAMLESS CITY & ROAD BACKGROUND                          */}
          {/* ========================================================= */}
          {/* Placed at the absolute bounds so the 100% height matches our container exactly */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0">
            {/* The flex container auto-sizes to wrap 2 SVGs precisely, making percentage transforms flawless */}
            <div className="flex h-full w-max animate-city-scroll opacity-90">
              <CityscapeBackground />
              <CityscapeBackground />
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. TRUCK & OVERFLOWING GROCERIES                          */}
          {/* ========================================================= */}
          {/* 
            Since the SVG height is identically matched to the container, 
            bottom-[14%] perfectly drops the truck tires onto the road dash line on ALL screen sizes! 
          */}
          <div className="absolute z-10 w-[280px] sm:w-[340px] pointer-events-none bottom-[14%] sm:bottom-[15%]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="-50 -350 1500 1100"
              className="w-full h-auto drop-shadow-xl"
              fill="none"
            >
              <defs>
                <linearGradient id="greenBody" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#55D16D"/>
                  <stop offset=".42" stopColor="#39BA53"/>
                  <stop offset="1" stopColor="#258E3C"/>
                </linearGradient>
                <linearGradient id="greenCab" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#097C44"/>
                  <stop offset=".55" stopColor="#04572F"/>
                  <stop offset="1" stopColor="#023D20"/>
                </linearGradient>
                <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EAFBFF"/><stop offset=".27" stopColor="#A8DBE9"/><stop offset=".72" stopColor="#4A89AC"/><stop offset="1" stopColor="#214C69"/></linearGradient>
                <linearGradient id="glassDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D7F7FF"/><stop offset=".45" stopColor="#79B8D3"/><stop offset="1" stopColor="#244A67"/></linearGradient>
                <linearGradient id="metal" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stopColor="#F7FAFD"/><stop offset=".35" stopColor="#B9C5D1"/><stop offset=".65" stopColor="#788697"/><stop offset="1" stopColor="#3D4856"/></linearGradient>
                <linearGradient id="tire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#273548"/><stop offset=".5" stopColor="#121C29"/><stop offset="1" stopColor="#070C13"/></linearGradient>
                <linearGradient id="bumper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#324255"/><stop offset="1" stopColor="#172333"/></linearGradient>
                <linearGradient id="lamp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF"/><stop offset=".58" stopColor="#FFF5BC"/><stop offset="1" stopColor="#F5CF63"/></linearGradient>
                <filter id="softShadow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="13"/></filter>
                <radialGradient id="tomatoGrad" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="#FF8A80" /><stop offset="40%" stopColor="#E53935" /><stop offset="80%" stopColor="#C62828" /><stop offset="100%" stopColor="#8E0000" /></radialGradient>
                <radialGradient id="pepperGrad" cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#FF5252" /><stop offset="50%" stopColor="#D32F2F" /><stop offset="100%" stopColor="#B71C1C" /></radialGradient>
                <linearGradient id="baguetteGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFCC80" /><stop offset="40%" stopColor="#E68A00" /><stop offset="80%" stopColor="#B35900" /><stop offset="100%" stopColor="#663300" /></linearGradient>
                <linearGradient id="milkGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="80%" stopColor="#F0F8FF" /><stop offset="100%" stopColor="#D0E4F5" /></linearGradient>
                <radialGradient id="lettuceGrad1" cx="40%" cy="40%" r="60%"><stop offset="0%" stopColor="#81C784" /><stop offset="70%" stopColor="#4CAF50" /><stop offset="100%" stopColor="#2E7D32" /></radialGradient>
                <radialGradient id="lettuceGrad2" cx="30%" cy="30%" r="60%"><stop offset="0%" stopColor="#AED581" /><stop offset="80%" stopColor="#689F38" /><stop offset="100%" stopColor="#33691E" /></radialGradient>
              </defs>

              <g id="speed-lines" className="animate-speed-lines" fill="none" strokeLinecap="round">
                <path d="M80 300H240" stroke="#1AAF69" strokeWidth="14"/>
                <path d="M45 347H265" stroke="#48D18A" strokeWidth="10"/>
                <path d="M105 390H235" stroke="#0B7C4B" strokeWidth="9"/>
                <path d="M145 430H220" stroke="#68E5A2" strokeWidth="7"/>
              </g>
              <g id="ground-shadow" opacity=".16" filter="url(#softShadow)">
                <ellipse cx="730" cy="636" rx="530" ry="24" fill="#0B3021"/>
              </g>

              <g className="animate-truck-body">
                <g transform="translate(-360, -920) scale(2.66)">
                  <g className="animate-produce-jiggle">
                    <circle cx="280" cy="350" r="35" fill="url(#lettuceGrad1)" />
                    <circle cx="315" cy="330" r="40" fill="url(#lettuceGrad2)" />
                    <circle cx="355" cy="350" r="35" fill="url(#lettuceGrad1)" />
                    <path d="M 400 400 L 450 400 L 465 300 L 415 315 Z" fill="#D4A373" />
                    <path d="M 410 295 L 460 280 L 465 300 L 415 315 Z" fill="#BC8A5F" />
                    <ellipse cx="430" cy="350" rx="12" ry="12" fill="#E76F51" transform="rotate(-15 430 350)" />
                    <ellipse cx="430" cy="350" rx="5" ry="5" fill="#F4A261" transform="rotate(-15 430 350)" />
                    <g transform="translate(385, 360) rotate(12)">
                      <rect x="-18" y="-60" width="36" height="100" rx="6" fill="url(#milkGrad)" />
                      <rect x="-18" y="-20" width="36" height="35" fill="#2196F3" />
                      <circle cx="0" cy="-2" r="8" fill="#FFFFFF" />
                      <circle cx="0" cy="-2" r="4" fill="#2196F3" />
                      <rect x="-10" y="-75" width="20" height="20" fill="#E3F2FD" />
                      <rect x="-12" y="-80" width="24" height="10" rx="3" fill="#0D47A1" />
                      <path d="M -12 -50 L -12 30" stroke="#FFFFFF" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                    </g>
                    <g transform="translate(350, 345) rotate(25)">
                      <ellipse cx="0" cy="0" rx="20" ry="70" fill="url(#baguetteGrad)" />
                      <path d="M -10 -40 Q 0 -35 12 -25" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
                      <path d="M -12 -10 Q 0 -5 12 5" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
                      <path d="M -12 20 Q 0 25 12 35" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
                      <ellipse cx="-8" cy="0" rx="4" ry="55" fill="#FFFFFF" opacity="0.3" />
                    </g>
                    <g>
                      <ellipse cx="315" cy="375" rx="20" ry="28" fill="url(#pepperGrad)" />
                      <ellipse cx="295" cy="385" rx="18" ry="25" fill="url(#pepperGrad)" />
                      <ellipse cx="335" cy="385" rx="18" ry="25" fill="url(#pepperGrad)" />
                      <path d="M 315 348 Q 320 335 330 340" fill="none" stroke="#1B5E20" strokeWidth="5" strokeLinecap="round" />
                      <ellipse cx="308" cy="360" rx="4" ry="10" fill="#FFFFFF" opacity="0.5" transform="rotate(-15 308 360)" />
                      <ellipse cx="328" cy="368" rx="3" ry="8" fill="#FFFFFF" opacity="0.5" transform="rotate(-15 328 368)" />
                    </g>
                    <g>
                      <circle cx="365" cy="390" r="24" fill="url(#tomatoGrad)" />
                      <path d="M 365 366 L 358 373 M 365 366 L 372 373 M 365 366 L 365 375 M 365 366 L 360 361" stroke="#1B5E20" strokeWidth="3" strokeLinecap="round" />
                      <ellipse cx="355" cy="378" rx="6" ry="4" fill="#FFFFFF" opacity="0.5" transform="rotate(-30 355 378)" />
                    </g>
                    <g>
                      <path d="M 235 340 C 240 390 270 405 295 395 C 290 365 260 350 235 340 Z" fill="#FBC02D" />
                      <path d="M 245 330 C 255 380 285 395 310 385 C 305 355 275 340 245 330 Z" fill="#FFF176" />
                      <path d="M 235 340 C 240 390 270 405 295 395" fill="none" stroke="#F57F17" strokeWidth="2" />
                      <path d="M 235 340 L 225 330 L 240 325 Z" fill="#8BC34A" />
                    </g>
                  </g>
                </g>
                <g id="cargo-container">
                  <path d="M252 94Q252 72 274 72H850Q872 72 872 95V517Q872 538 850 538H272Q248 538 248 515V118Q248 94 252 94Z" fill="url(#greenBody)" stroke="#064F34" strokeWidth="8"/>
                  <path d="M269 99H850" stroke="#B7F4D2" strokeWidth="6" strokeLinecap="round" opacity=".58"/>
                  <path d="M270 122V485" stroke="#D6F8E5" strokeWidth="3" opacity=".12"/>
                  <path d="M250 447C415 415 604 385 752 419C809 432 843 407 871 367V516H250Z" fill="#0B7648" opacity=".28"/>
                  <path d="M267 148H516" stroke="#E4FFF0" strokeWidth="5" strokeLinecap="round" opacity=".1"/>
                  <path d="M272 500Q440 464 622 482Q754 495 855 455" fill="none" stroke="#6CE6A6" strokeWidth="5" opacity=".32"/>
                  <path d="M838 108V505" stroke="#064F34" strokeWidth="5" opacity=".34"/>
                </g>
                <g transform="translate(440, 195) scale(0.18)">
                  <path d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z" fill="#FFFFFF" fillRule="evenodd" />
                  <path d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z" fill="#FFFFFF" fillRule="evenodd" />
                </g>
                <g id="chassis">
                  <path d="M238 514H919Q942 514 960 533L978 559H220L229 534Q232 514 238 514Z" fill="#142233" stroke="#0B1725" strokeWidth="6"/>
                  <path d="M236 531H947" stroke="#5C6C7E" strokeWidth="7" opacity=".6"/>
                </g>
                <g id="driver-cabin">
                  <path d="M850 164Q850 134 880 134H1000Q1066 134 1100 187L1198 345Q1208 361 1208 382V511Q1208 538 1181 538H850Z" fill="url(#greenCab)" stroke="#064F34" strokeWidth="8"/>
                  <path d="M880 154H992Q1034 154 1059 193L1099 258H878Z" fill="url(#glass)" stroke="#172C3E" strokeWidth="9"/>
                  <path d="M890 165H977Q1009 165 1028 193L1052 228" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" opacity=".28"/>
                  <path d="M1110 218L1175 323Q1181 333 1183 347H1107Z" fill="url(#glassDark)" stroke="#172C3E" strokeWidth="9"/>
                  <path d="M1099 258V373" stroke="#0E5B3E" strokeWidth="11"/>
                  <path d="M862 392Q995 375 1172 406" fill="none" stroke="#8FEABA" strokeWidth="5" opacity=".28"/>
                  <path d="M866 264V501Q866 518 883 522H1060V263" fill="none" stroke="#075B3C" strokeWidth="5" opacity=".48"/>
                  <path d="M895 320H959" stroke="#102232" strokeWidth="12" strokeLinecap="round"/>
                  <path d="M900 320H950" stroke="#88D8B0" strokeWidth="3" strokeLinecap="round" opacity=".35"/>
                  <g id="mirror">
                    <rect x="1054" y="267" width="30" height="69" rx="12" fill="#182637"/>
                    <rect x="1078" y="276" width="45" height="24" rx="10" fill="#182637"/>
                    <rect x="1085" y="281" width="31" height="14" rx="7" fill="#5A6D82"/>
                    <path d="M1086 285H1110" stroke="#CBE9F2" strokeWidth="2" opacity=".4"/>
                  </g>
                  <path d="M1125 424H1174" stroke="#0A5238" strokeWidth="9" strokeLinecap="round"/>
                  <path d="M1134 440H1160" stroke="#9FF0BE" strokeWidth="3" opacity=".32" strokeLinecap="round"/>
                  <g id="headlights">
                    <path d="M1158 353Q1158 340 1170 343L1192 349Q1202 351 1203 362V399Q1203 410 1191 410L1169 405Q1158 402 1158 390Z" fill="url(#lamp)" stroke="#253547" strokeWidth="7"/>
                    <path d="M1167 355L1192 362V393L1167 387Z" fill="#FFF9CF" opacity=".8"/>
                    <rect x="1167" y="421" width="32" height="19" rx="6" fill="#FFAD28" stroke="#A35A12" strokeWidth="4"/>
                  </g>
                  <path d="M1128 475Q1165 462 1202 475V518H1128Z" fill="#132231"/>
                  <path d="M1141 490H1192" stroke="#526275" strokeWidth="5" strokeLinecap="round" opacity=".65"/>
                  <path d="M1141 502H1179" stroke="#526275" strokeWidth="5" strokeLinecap="round" opacity=".4"/>
                </g>
                <g id="wheel-arches" fill="#172535">
                  <path d="M277 545Q277 431 385 431Q493 431 493 545H459Q453 470 385 470Q317 470 311 545Z"/>
                  <path d="M913 545Q913 431 1021 431Q1129 431 1129 545H1095Q1089 470 1021 470Q953 470 947 545Z"/>
                </g>
                <g id="bumpers">
                  <path d="M1124 510H1220V550H1115Q1104 550 1104 537V525Q1104 510 1124 510Z" fill="url(#bumper)" stroke="#0C1826" strokeWidth="5"/>
                  <path d="M1131 527H1204" stroke="#6C7C8D" strokeWidth="6" strokeLinecap="round" opacity=".65"/>
                  <path d="M193 510H286V548H187Q176 548 176 536V524Q176 510 193 510Z" fill="url(#bumper)" stroke="#0C1826" strokeWidth="5"/>
                </g>
                <g id="ui-highlights" fill="none" strokeLinecap="round">
                  <path d="M277 147H836" stroke="#D7FFE7" strokeWidth="3" opacity=".22"/>
                  <path d="M861 147H996" stroke="#D7FFE7" strokeWidth="3" opacity=".18"/>
                </g>
              </g>
              <g id="rear-wheel" className="wheel-rear" style={{ transformOrigin: '385px 541px' }}>
                <circle cx="385" cy="541" r="95" fill="#0D1520" stroke="#293A4E" strokeWidth="13"/>
                <circle cx="385" cy="541" r="72" fill="url(#tire)" stroke="#3A4B5E" strokeWidth="7"/>
                <circle cx="385" cy="541" r="50" fill="url(#metal)" stroke="#6E7C8C" strokeWidth="4"/>
                <g fill="#2C3B4C">
                  <path d="M376 494L385 541L394 494Q385 489 376 494Z"/>
                  <path d="M428 515L385 541L426 548Q432 530 428 515Z"/>
                  <path d="M418 580L385 541L378 586Q399 590 418 580Z"/>
                  <path d="M342 578L385 541L344 534Q338 557 342 578Z"/>
                  <path d="M343 504L385 541L392 496Q367 495 343 504Z"/>
                </g>
                <circle cx="385" cy="541" r="19" fill="#18B66A" stroke="#E4EBF1" strokeWidth="5"/>
                <circle cx="385" cy="541" r="7" fill="#075B3A"/>
              </g>
              <g id="front-wheel" className="wheel-front" style={{ transformOrigin: '1021px 541px' }}>
                <circle cx="1021" cy="541" r="95" fill="#0D1520" stroke="#293A4E" strokeWidth="13"/>
                <circle cx="1021" cy="541" r="72" fill="url(#tire)" stroke="#3A4B5E" strokeWidth="7"/>
                <circle cx="1021" cy="541" r="50" fill="url(#metal)" stroke="#6E7C8C" strokeWidth="4"/>
                <g fill="#2C3B4C">
                  <path d="M1012 494L1021 541L1030 494Q1021 489 1012 494Z"/>
                  <path d="M1064 515L1021 541L1062 548Q1068 530 1064 515Z"/>
                  <path d="M1054 580L1021 541L1014 586Q1035 590 1054 580Z"/>
                  <path d="M978 578L1021 541L980 534Q974 557 978 578Z"/>
                  <path d="M979 504L1021 541L1028 496Q1003 495 979 504Z"/>
                </g>
                <circle cx="1021" cy="541" r="19" fill="#18B66A" stroke="#E4EBF1" strokeWidth="5"/>
                <circle cx="1021" cy="541" r="7" fill="#075B3A"/>
              </g>
            </svg>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. BEAUTIFUL QUOTES UI                                    */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-8 sm:mt-12 w-full max-w-lg px-6 flex flex-col items-center justify-center animate-fade-in z-20">
            {type === 'home' && (
              <div className="relative flex items-center justify-between w-64 mb-6">
                <div className="absolute top-1/2 left-0 right-0 h-[2.5px] -translate-y-1/2 bg-[#cbd5e1] z-0" />
                <div
                  className="absolute top-1/2 left-0 h-[2.5px] -translate-y-1/2 bg-[#22c55e] z-0 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
                {HOME_MESSAGES.map((_, idx) => {
                  const isCompleted = idx < msgIndex;
                  const isActive = idx === msgIndex;
                  return (
                    <div key={idx} className="relative z-10 flex items-center justify-center w-5 h-5">
                      {isActive ? (
                        <div className="flex items-center justify-center h-5 w-5 rounded-full border-2 border-[#22c55e] bg-white transition-all duration-300 scale-110 shadow-xs">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#22c55e] animate-pulse" />
                        </div>
                      ) : isCompleted ? (
                        <div className="h-3.5 w-3.5 rounded-full bg-[#22c55e] transition-all duration-300" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full bg-[#cbd5e1] transition-all duration-300" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Redesigned Decorative Quote Block */}
            <div className="relative w-full p-5 sm:p-6 rounded-[28px] bg-emerald-50/70 border border-emerald-100 shadow-sm text-center">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl text-emerald-300/80 font-serif leading-none select-none">
                “
              </span>
              
              <div className="h-10 sm:h-12 flex items-center justify-center pt-2">
                <p
                  key={msgIndex}
                  className="text-base sm:text-lg font-medium italic text-emerald-900 tracking-tight leading-snug animate-quote-fade"
                >
                  {messagesList[msgIndex]}
                </p>
              </div>
              
              {/* Animated Progress Dots for Quotes */}
              <div className="mt-4 flex justify-center gap-1.5">
                {messagesList.slice(0, 5).map((_, i) => {
                  // Simplify the dots logic just for aesthetics so it loops smoothly
                  const isActive = (msgIndex % 5) === i;
                  return (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${
                        isActive ? 'w-4 bg-emerald-500' : 'w-1.5 bg-emerald-200/80'
                      }`} 
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* Perfectly translates exactly ONE SVGs width so it loops seamlessly */
        @keyframes cityInfiniteScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); } 
        }
        .animate-city-scroll {
          animation: cityInfiniteScroll 20s linear infinite;
        }

        @keyframes spinWheelAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wheel-rear { animation: spinWheelAnim 0.35s linear infinite; }
        .wheel-front { animation: spinWheelAnim 0.35s linear infinite; }

        @keyframes truckBodyBounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
          65% { transform: translateY(2px); }
        }
        .animate-truck-body { animation: truckBodyBounce 0.65s ease-in-out infinite; }

        @keyframes produceJiggle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(-1.5deg); }
        }
        .animate-produce-jiggle { animation: produceJiggle 0.65s ease-in-out infinite 0.1s; }

        @keyframes speedLines {
          0%, 100% { opacity: 0.85; transform: translateX(0); }
          50% { opacity: 0.15; transform: translateX(-32px); }
        }
        .animate-speed-lines { animation: speedLines 0.4s ease-in-out infinite; }

        /* Smoother fade transition for the beautiful quotes */
        @keyframes quoteFade {
          0% { opacity: 0; transform: translateY(6px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        .animate-quote-fade { 
          animation: quoteFade ${type === 'home' ? '1.8s' : '3.5s'} ease-in-out infinite; 
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
});