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
  'Routing your express store delivery...',
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

// 1. BACKGROUND SVG (Sky, Buildings, Road Surface)
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

    {/* MIDGROUND LAYER */}
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

    {/* CENTRAL CK LOGISTICS WAREHOUSE */}
    <g transform="translate(460, 210)">
      <rect x="-10" y="0" width="280" height="220" fill="#98D2A4" />
      <polygon points="-20,0 280,0 270,18 -10,18" fill="#75C282" />
      
      <g fill="#C4E6C9">
        <rect x="25" y="110" width="60" height="110" />
        <rect x="100" y="110" width="60" height="110" />
        <rect x="175" y="110" width="60" height="110" />
      </g>
      <g fill="#A3D7AB">
        <rect x="25" y="125" width="60" height="4" /> <rect x="25" y="145" width="60" height="4" /> <rect x="25" y="165" width="60" height="4" /> <rect x="25" y="185" width="60" height="4" />
        <rect x="100" y="125" width="60" height="4" /> <rect x="100" y="145" width="60" height="4" /> <rect x="100" y="165" width="60" height="4" /> <rect x="100" y="185" width="60" height="4" />
        <rect x="175" y="125" width="60" height="4" /> <rect x="175" y="145" width="60" height="4" /> <rect x="175" y="165" width="60" height="4" /> <rect x="175" y="185" width="60" height="4" />
      </g>
      
      <rect x="80" y="35" width="100" height="48" rx="8" fill="#E4F2E7" />
      <path d="M120,44 C108,44 104,50 104,59 C104,68 108,74 120,74" stroke="#258E3C" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
      <path d="M142,44 L127,59 L142,74" stroke="#258E3C" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="146" cy="71" r="3.5" fill="#258E3C" />
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

    {/* FOLIAGE & TREES (Background Layer) */}
    <g>
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

    {/* SEAMLESS ROAD LAYER */}
    <rect x="0" y="420" width="1200" height="230" fill="#E4F2E7" />
    <line x1="0" y1="500" x2="1200" y2="500" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="7" strokeDasharray="60 60" strokeLinecap="round" />
  </svg>
);

// 2. FOREGROUND SVG
const CityscapeForeground = () => (
  <svg viewBox="0 0 1200 650" className="h-full w-auto shrink-0 drop-shadow-sm">
    <defs>
      <g id="fire-hydrant">
        <rect x="-8" y="0" width="16" height="32" fill="#E53935" rx="4" />
        <path d="M-10,4 Q0,-6 10,4 Z" fill="#D32F2F" />
        <rect x="-10" y="6" width="20" height="5" fill="#B71C1C" rx="1.5" />
        <rect x="-12" y="26" width="24" height="6" fill="#B71C1C" rx="2" />
        <circle cx="0" cy="15" r="7" fill="#D32F2F" />
        <circle cx="0" cy="15" r="3.5" fill="#FFCDD2" />
        <circle cx="-9" cy="15" r="3.5" fill="#C62828" />
        <circle cx="9" cy="15" r="3.5" fill="#C62828" />
      </g>
    </defs>

    {/* Raised Foreground Sidewalk */}
    <rect x="0" y="555" width="1200" height="95" fill="#D6EED9" />
    <rect x="0" y="555" width="1200" height="9" fill="#A3D7AB" />
    <path d="M60,564 v95 M260,564 v95 M460,564 v95 M660,564 v95 M860,564 v95 M1060,564 v95" stroke="#C0E2C6" strokeWidth="2.5" />

    {/* Overlapping Lush Foreground Bushes */}
    <g>
       <circle cx="50" cy="565" r="30" fill="#75C282" />
       <circle cx="110" cy="575" r="35" fill="#98D2A4" />
       <circle cx="280" cy="560" r="25" fill="#75C282" />
       <circle cx="350" cy="570" r="38" fill="#98D2A4" />
       <circle cx="410" cy="565" r="28" fill="#75C282" />
       <circle cx="530" cy="570" r="25" fill="#98D2A4" />
       <circle cx="590" cy="555" r="35" fill="#75C282" />
       <circle cx="720" cy="570" r="30" fill="#98D2A4" />
       <circle cx="890" cy="565" r="25" fill="#75C282" />
       <circle cx="960" cy="575" r="40" fill="#98D2A4" />
       <circle cx="1120" cy="560" r="30" fill="#75C282" />
       <circle cx="1180" cy="570" r="35" fill="#98D2A4" />
    </g>

    {/* Fire Hydrants */}
    <use href="#fire-hydrant" x="190" y="525" />
    <use href="#fire-hydrant" x="790" y="525" />
  </svg>
);

export const AppLoader = React.memo(function AppLoader({
  fullScreen = true,
  size = 'md',
  showStatus = false,
  type = 'home',
  className = '',
}: AppLoaderProps) {
  
  // Conditionally use either normal loading steps or grocery quotes
  const messagesList = type === 'home' ? HOME_MESSAGES : GROCERY_QUOTES;
  
  // Start from random quote if general type
  const [msgIndex, setMsgIndex] = useState(() => 
    type === 'home' ? 0 : Math.floor(Math.random() * messagesList.length)
  );

  useEffect(() => {
    if (!showStatus) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messagesList.length);
    }, type === 'home' ? 1800 : 3500); // Slower interval for quotes
    return () => clearInterval(interval);
  }, [showStatus, messagesList.length, type]);

  const scaleClass =
    size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-105' : 'scale-95 sm:scale-100';

  const progressPercent = (msgIndex / (HOME_MESSAGES.length - 1)) * 100;

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none overflow-hidden ${
        fullScreen ? 'fixed inset-0 z-50 animate-fade-in' : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center w-full ${scaleClass}`}>
        
        {/* Main Stage Viewport - Edge-to-edge full width */}
        <div className="relative w-full h-[550px] sm:h-[600px] flex items-center justify-center overflow-hidden bg-white">
          
          {/* ========================================================= */}
          {/* LAYER 1: BACKGROUND (Scrolls at 12s)                        */}
          {/* 4 SVGs moving exactly 25% creates an unbreakable loop       */}
          {/* ========================================================= */}
          <div className="absolute inset-0 flex items-center justify-start overflow-hidden pointer-events-none z-0">
            <div className="flex h-full w-max animate-bg-scroll opacity-90">
              <CityscapeBackground />
              <CityscapeBackground />
              <CityscapeBackground />
              <CityscapeBackground />
            </div>
          </div>

          {/* ========================================================= */}
          {/* LAYER 2: TRUCK, GROCERIES & FALLING LEAVES                  */}
          {/* ========================================================= */}
          <div className="absolute z-10 w-[280px] sm:w-[340px] pointer-events-none bottom-[20%] sm:bottom-[22%]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 360 250"
              className="w-full h-auto drop-shadow-xl"
              fill="none"
            >
              <defs>
                <radialGradient id="groundShadowMain" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#475569" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#475569" stopOpacity="0" />
                </radialGradient>
                {/* Leaf Shape Template */}
                <path id="leaf-shape" d="M0,0 C-8,-12 -20,-15 -25,0 C-20,15 -8,12 0,0 Z" />
              </defs>

              {/* Trailing Green Speed Streaks */}
              <g className="animate-speed-lines">
                <line x1="42" y1="138" x2="80" y2="138" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="28" y1="146" x2="80" y2="146" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="38" y1="154" x2="80" y2="154" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="50" y1="162" x2="80" y2="162" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              </g>

              {/* Ground Shadow */}
              <ellipse cx="180" cy="200" rx="106" ry="5.5" fill="url(#groundShadowMain)" />

              {/* Magical Falling Leaves blowing backward out of cargo */}
              <g id="falling-leaves" className="animate-produce-jiggle">
                <use href="#leaf-shape" fill="#4CAF50" className="animate-leaf-1" />
                <use href="#leaf-shape" fill="#8BC34A" className="animate-leaf-2" />
                <use href="#leaf-shape" fill="#FFB300" className="animate-leaf-3" />
                <use href="#leaf-shape" fill="#388E3C" className="animate-leaf-4" />
                <use href="#leaf-shape" fill="#F57F17" className="animate-leaf-5" />
                <use href="#leaf-shape" fill="#689F38" className="animate-leaf-6" />
              </g>

              <g className="animate-truck-body">
                {/* FRESH BOUNTIFUL PRODUCE OVERFLOWING */}
                <g className="animate-produce-jiggle">
                  {/* Baguette */}
                  <g transform="translate(138, 90) rotate(18)">
                    <rect x="0" y="0" width="12" height="34" rx="6" fill="#d97706" />
                    <line x1="2" y1="8" x2="9" y2="11" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="2" y1="16" x2="9" y2="19" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
                    <line x1="2" y1="24" x2="9" y2="27" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
                  </g>
                  {/* Milk Bottle */}
                  <g transform="translate(154, 92) rotate(8)">
                    <rect x="0" y="6" width="16" height="26" rx="3.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x="0" y="14" width="16" height="11" fill="#0284c7" />
                    <circle cx="8" cy="19.5" r="3.2" fill="#ffffff" />
                    <rect x="4" y="1.5" width="8" height="4.5" rx="1" fill="#38bdf8" />
                  </g>
                  {/* Juice Carton */}
                  <g transform="translate(172, 96) rotate(14)">
                    <rect x="0" y="5" width="17" height="24" rx="2" fill="#ea580c" />
                    <circle cx="8.5" cy="16" r="3.8" fill="#ffedd5" />
                    <polygon points="0,5 8.5,0 17,5" fill="#c2410c" />
                    <circle cx="8.5" cy="16" r="1.8" fill="#ea580c" />
                  </g>
                  {/* Bushy Green Kale */}
                  <ellipse cx="118" cy="106" rx="14" ry="15" fill="#15803d" />
                  <ellipse cx="118" cy="106" rx="11" ry="12" fill="#16a34a" />
                  <circle cx="116" cy="103" r="7" fill="#22c55e" />
                  <path d="M112 99C115 104 120 106 124 104" stroke="#86efac" strokeWidth="1.2" strokeLinecap="round" />
                  {/* Banana Bunch */}
                  <g transform="translate(80, 102) rotate(-14)">
                    <path d="M8 29C16 32 30 30 38 18C40 13 40 8 38 4C37 4 34 8 30 12C22 21 14 24 8 29Z" fill="#eab308" />
                    <path d="M2 26C10 29 23 27 30 16C32 12 32 7 30 3C29 3 27 7 23 10C16 18 8 21 2 26Z" fill="#fde047" />
                    <path d="M30 16L34 13" stroke="#65a30d" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="2.5" cy="26.5" r="1.8" fill="#451a03" />
                    <circle cx="8.5" cy="29.5" r="1.8" fill="#451a03" />
                  </g>
                  {/* Shiny Red Apple */}
                  <g transform="translate(104, 108)">
                    <path d="M12 4C8 1 2 3 1 9C0 16 5 23 12 24C19 23 24 16 23 9C22 3 16 1 12 4Z" fill="#dc2626" />
                    <path d="M6 8C4 11 4 16 7 19" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                    <path d="M12 4C12 1 14 -1 16 -2" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M13 1C17 0 19 2 18 5C15 5 13 3 13 1Z" fill="#22c55e" />
                  </g>
                  {/* Glossy Green Capsicum */}
                  <g transform="translate(122, 106)">
                    <path d="M4 8C2 12 2 20 6 23C9 25 15 25 18 23C22 20 22 12 20 8C18 5 15 5 12 7C9 5 6 5 4 8Z" fill="#16a34a" />
                    <path d="M8 8C7 13 7 19 9 23" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M16 8C17 13 17 19 15 23" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M12 7V2" stroke="#14532d" strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx="12" cy="6" r="2.5" fill="#15803d" />
                  </g>
                  {/* Plump Tomatoes */}
                  <g transform="translate(142, 113)">
                    <circle cx="8" cy="8" r="7.5" fill="#ef4444" />
                    <path d="M8 3L6 1M8 3L10 1M8 3L5 4M8 3L11 4M8 3V0.5" stroke="#166534" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="6" cy="6" r="1.5" fill="#fca5a5" opacity="0.7" />
                  </g>
                  <g transform="translate(133, 116)">
                    <circle cx="6" cy="6" r="6" fill="#dc2626" />
                    <path d="M6 2L4 0.5M6 2L8 0.5M6 2V0" stroke="#166534" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                </g>

                {/* ----------------- EXTENDED CARGO CONTAINER ----------------- */}
                <rect x="82" y="120" width="130" height="66" rx="5" fill="#22c55e" />
                <rect x="82" y="180" width="130" height="6" fill="#16a34a" />

                {/* CAFKART LOGO WITH DOT (Fixed Version) */}
                <g id="truck-logo" transform="translate(147, 150)">
                  <path d="M-6,-10 C-16,-10 -20,-5 -20,2 C-20,9 -16,14 -6,14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  <path d="M8,-10 L-4,2 L8,14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="10" cy="12" r="2.5" fill="#FFFFFF" />
                  <line x1="-28" y1="6" x2="-24" y2="6" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="-32" y1="-2" x2="-26" y2="-2" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                </g>

                {/* ----------------- DRIVER CABIN ----------------- */}
                <path d="M212 124H240C245 124 249 127.5 251.5 132L265 155C267 158.5 265.5 163 261 163H212V124Z" fill="#02402c" />
                <path d="M218 128H238C240.5 128 243 129.8 244 132.5L253 148H218V128Z" fill="#a7f3d0" opacity="0.9" />
                <line x1="235" y1="128" x2="235" y2="148" stroke="#02402c" strokeWidth="2.5" />
                <path d="M261 163H274C277 163 279 165.5 279 168.5V173H256L261 163Z" fill="#0f172a" />
                <rect x="272" y="165" width="5" height="5" rx="1" fill="#f59e0b" />
                <path d="M80 180H94C96 180 98 177.5 98 175C98 162 108 152 121 152C134 152 144 162 144 175C144 177.5 146 180 148 180H222C224 180 226 177.5 226 175C226 162 236 152 249 152C262 152 272 162 272 175C272 177.5 274 180 276 180H284V186H80V180Z" fill="#0f172a" />
              </g>

              {/* ========================================================= */}
              {/* 4. VISIBLY SPINNING ALLOY WHEELS                          */}
              {/* ========================================================= */}
              <g className="wheel-rear" style={{ transformOrigin: '121px 182px' }}>
                <circle cx="121" cy="182" r="17" fill="#1e293b" />
                <circle cx="121" cy="182" r="10.5" fill="#e2e8f0" />
                <line x1="121" y1="172" x2="121" y2="192" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="111" y1="182" x2="131" y2="182" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="114" y1="175" x2="128" y2="189" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <line x1="114" y1="189" x2="128" y2="175" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <circle cx="121" cy="182" r="4.5" fill="#0f172a" />
              </g>

              <g className="wheel-front" style={{ transformOrigin: '249px 182px' }}>
                <circle cx="249" cy="182" r="17" fill="#1e293b" />
                <circle cx="249" cy="182" r="10.5" fill="#e2e8f0" />
                <line x1="249" y1="172" x2="249" y2="192" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="239" y1="182" x2="259" y2="182" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="242" y1="175" x2="256" y2="189" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <line x1="242" y1="189" x2="256" y2="175" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                <circle cx="249" cy="182" r="4.5" fill="#0f172a" />
              </g>
            </svg>
          </div>

          {/* ========================================================= */}
          {/* LAYER 3: FOREGROUND (Scrolls super fast at 6s for depth)  */}
          {/* ========================================================= */}
          <div className="absolute inset-0 flex items-center justify-start overflow-hidden pointer-events-none z-20">
            <div className="flex h-full w-max animate-fg-scroll">
              <CityscapeForeground />
              <CityscapeForeground />
              <CityscapeForeground />
              <CityscapeForeground />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CONDITIONAL BOTTOM UI: TIMELINE STEPPER OR QUOTES         */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-8 sm:mt-12 w-full max-w-lg px-6 flex flex-col items-center justify-center animate-fade-in z-30">
            
            {/* If Type = HOME, Show Chronological Loading Stepper */}
            {type === 'home' && (
              <>
                <div className="relative flex items-center justify-between w-64 mb-5">
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
                          <div className="flex items-center justify-center h-4 w-4 rounded-full border-2 border-[#22c55e] bg-white transition-all duration-300 scale-110 shadow-xs">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                          </div>
                        ) : isCompleted ? (
                          <div className="h-2.5 w-2.5 rounded-full bg-[#22c55e] transition-all duration-300" />
                        ) : (
                          <div className="h-2.5 w-2.5 rounded-full bg-[#cbd5e1] transition-all duration-300" />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="h-6 flex items-center justify-center">
                  <p key={msgIndex} className="flex items-center gap-1.5 text-sm font-bold text-slate-800 tracking-tight animate-text-fade">
                    {HOME_MESSAGES[msgIndex]}
                    <span className="text-emerald-500 text-sm">🍃</span>
                  </p>
                </div>
              </>
            )}
            
            {/* If Type = GENERAL, Show Beautiful Grocery Quotes */}
            {type === 'general' && (
              <div className="relative w-full p-5 sm:p-6 rounded-[28px] bg-emerald-50/70 border border-emerald-100 shadow-sm text-center">
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl text-emerald-300/80 font-serif leading-none select-none">
                  “
                </span>
                <div className="h-10 sm:h-12 flex items-center justify-center pt-2">
                  <p key={msgIndex} className="text-base sm:text-lg font-medium italic text-emerald-900 tracking-tight leading-snug animate-quote-fade">
                    {GROCERY_QUOTES[msgIndex]}
                  </p>
                </div>
                <div className="mt-4 flex justify-center gap-1.5">
                  {GROCERY_QUOTES.slice(0, 5).map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${ (msgIndex % 5) === i ? 'w-4 bg-emerald-500' : 'w-1.5 bg-emerald-200/80'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        /* Perfectly translates 25% of the 4-SVG block for infinite seamless loop */
        @keyframes bgScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-25%, 0, 0); } 
        }
        .animate-bg-scroll {
          animation: bgScroll 12s linear infinite;
        }

        /* Foreground scrolls relative to background, creating immense depth */
        @keyframes fgScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-25%, 0, 0); } 
        }
        .animate-fg-scroll {
          animation: fgScroll 6s linear infinite;
        }

        @keyframes spinWheelAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wheel-rear { animation: spinWheelAnim 0.35s linear infinite; }
        .wheel-front { animation: spinWheelAnim 0.35s linear infinite; }

        @keyframes truckBodyBounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-1.4px); }
          65% { transform: translateY(0.4px); }
        }
        .animate-truck-body { animation: truckBodyBounce 0.65s ease-in-out infinite; }

        @keyframes produceJiggle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-1.2px) rotate(-0.5deg); }
        }
        .animate-produce-jiggle { animation: produceJiggle 0.65s ease-in-out infinite 0.08s; }

        /* Magical Falling Leaves CSS Keyframes - Extremely Visual & Dynamic */
        @keyframes leafFly1 {
          0% { transform: translate(90px, 120px) rotate(0deg) scale(0.7); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate(-10px, 190px) rotate(-360deg) scale(0.4); opacity: 0; }
        }
        @keyframes leafFly2 {
          0% { transform: translate(100px, 110px) rotate(45deg) scale(0.6); opacity: 0; }
          15% { opacity: 0.9; }
          100% { transform: translate(-30px, 210px) rotate(-270deg) scale(0.3); opacity: 0; }
        }
        @keyframes leafFly3 {
          0% { transform: translate(85px, 130px) rotate(-20deg) scale(0.8); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate(0px, 170px) rotate(-300deg) scale(0.5); opacity: 0; }
        }
        @keyframes leafFly4 {
          0% { transform: translate(105px, 125px) rotate(90deg) scale(0.7); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translate(-40px, 200px) rotate(-180deg) scale(0.4); opacity: 0; }
        }
        @keyframes leafFly5 {
          0% { transform: translate(95px, 115px) rotate(15deg) scale(0.9); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate(-20px, 230px) rotate(-400deg) scale(0.5); opacity: 0; }
        }
        @keyframes leafFly6 {
          0% { transform: translate(110px, 100px) rotate(-45deg) scale(0.7); opacity: 0; }
          15% { opacity: 0.9; }
          100% { transform: translate(-50px, 160px) rotate(-200deg) scale(0.3); opacity: 0; }
        }

        .animate-leaf-1 { animation: leafFly1 2s linear infinite; }
        .animate-leaf-2 { animation: leafFly2 2.5s linear infinite 0.5s; opacity: 0; }
        .animate-leaf-3 { animation: leafFly3 2.2s linear infinite 1.2s; opacity: 0; }
        .animate-leaf-4 { animation: leafFly4 1.8s linear infinite 1.7s; opacity: 0; }
        .animate-leaf-5 { animation: leafFly5 2.8s linear infinite 0.8s; opacity: 0; }
        .animate-leaf-6 { animation: leafFly6 2.3s linear infinite 1.5s; opacity: 0; }

        @keyframes speedLines {
          0%, 100% { opacity: 0.85; transform: translateX(0); }
          50% { opacity: 0.35; transform: translateX(-4px); }
        }
        .animate-speed-lines { animation: speedLines 0.5s ease-in-out infinite; }

        @keyframes textFade {
          0% { opacity: 0; transform: translateY(3px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-3px); }
        }
        .animate-text-fade { animation: textFade 1.8s ease-in-out infinite; }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 0.15s ease-out forwards; }
      `}</style>
    </div>
  );
});