import React, { useState, useEffect } from 'react';

interface AppLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

const HOME_MESSAGES = [
  'Dispatching wholesale catalog...',
  'Verifying mandi rates & cold-chain stock...',
  'Loading bulk crates & staples...',
  'Routing your express store delivery...',
  'Finalizing wholesale dispatch...',
];

export const AppLoader = React.memo(function AppLoader({
  fullScreen = true,
  size = 'md',
  showStatus = false,
  className = '',
}: AppLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!showStatus) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % HOME_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [showStatus]);

  const scaleClass =
    size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-105' : 'scale-95 sm:scale-100';

  const progressPercent = (msgIndex / (HOME_MESSAGES.length - 1)) * 100;

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen ? 'fixed inset-0 z-50 animate-fade-in px-6' : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center ${scaleClass}`}>
        <div className="relative w-92 h-80 flex items-center justify-center overflow-hidden">
          
          {/* ========================================================= */}
          {/* 1. SEAMLESS MOVING CLOUDS                                 */}
          {/* ========================================================= */}
          <div className="absolute top-1 left-0 w-full h-16 overflow-hidden pointer-events-none z-0">
            <div className="flex w-[840px] animate-clouds-scroll opacity-75">
              <svg viewBox="0 0 420 50" className="w-[420px] h-[50px] shrink-0" fill="none">
                <path d="M40 28C40 22 45 18 51 18C53 18 55 18.8 56.5 20C58.5 15.5 63 13 68 13C75 13 81 18.5 81 25.5C83 25.5 85 27.5 85 29.5C85 32 83 34 80.5 34H44C41.8 34 40 31.5 40 28Z" fill="#e2efe6" />
                <path d="M190 22C190 16.5 194.5 12 200 12C201.8 12 203.5 12.6 205 13.8C207 9.8 211 7.5 215.5 7.5C222 7.5 227 12.5 227 19C229 19 231 21 231 23C231 25.5 229 27.5 226.5 27.5H194C191.8 27.5 190 25 190 22Z" fill="#d9ebdf" />
                <path d="M330 25C330 20 334 16 339 16C340.5 16 342 16.5 343.5 17.5C345 14 349 12 353 12C359 12 364 16.5 364 22.5C365.5 22.5 367 24 367 26C367 28.5 365 30.5 363 30.5H334C331.8 30.5 330 28.2 330 25Z" fill="#e2efe6" />
              </svg>
              <svg viewBox="0 0 420 50" className="w-[420px] h-[50px] shrink-0" fill="none">
                <path d="M40 28C40 22 45 18 51 18C53 18 55 18.8 56.5 20C58.5 15.5 63 13 68 13C75 13 81 18.5 81 25.5C83 25.5 85 27.5 85 29.5C85 32 83 34 80.5 34H44C41.8 34 40 31.5 40 28Z" fill="#e2efe6" />
                <path d="M190 22C190 16.5 194.5 12 200 12C201.8 12 203.5 12.6 205 13.8C207 9.8 211 7.5 215.5 7.5C222 7.5 227 12.5 227 19C229 19 231 21 231 23C231 25.5 229 27.5 226.5 27.5H194C191.8 27.5 190 25 190 22Z" fill="#d9ebdf" />
                <path d="M330 25C330 20 334 16 339 16C340.5 16 342 16.5 343.5 17.5C345 14 349 12 353 12C359 12 364 16.5 364 22.5C365.5 22.5 367 24 367 26C367 28.5 365 30.5 363 30.5H334C331.8 30.5 330 28.2 330 25Z" fill="#e2efe6" />
              </svg>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. CITY SKYLINE                                           */}
          {/* ========================================================= */}
          <div className="absolute top-6 left-0 w-full h-52 overflow-hidden pointer-events-none z-0">
            <div className="flex w-[840px] animate-skyline-scroll opacity-85">
              <svg viewBox="0 0 420 190" className="w-[420px] h-[190px] shrink-0" fill="none">
                <rect x="0" y="52" width="60" height="138" rx="3" fill="#d9ebdf" />
                <rect x="6" y="58" width="48" height="6" rx="1" fill="#c3decc" />
                <line x1="12" y1="74" x2="48" y2="74" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="82" x2="48" y2="82" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="90" x2="48" y2="90" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="98" x2="48" y2="98" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <rect x="15" y="116" width="30" height="40" rx="1.5" fill="#cbe3d3" />
                <line x1="15" y1="126" x2="45" y2="126" stroke="#d9ebdf" strokeWidth="1.5" />
                <line x1="15" y1="136" x2="45" y2="136" stroke="#d9ebdf" strokeWidth="1.5" />
                <rect x="68" y="22" width="56" height="168" rx="2" fill="#e2efe6" />
                <rect x="74" y="26" width="44" height="4" fill="#cbe3d3" />
                <line x1="78" y1="10" x2="78" y2="22" stroke="#b1d3bc" strokeWidth="2" strokeLinecap="round" />
                <line x1="114" y1="10" x2="114" y2="22" stroke="#b1d3bc" strokeWidth="2" strokeLinecap="round" />
                <rect x="76" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="76" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="76" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="132" y="68" width="66" height="122" rx="3" fill="#d9ebdf" />
                <path d="M129 78H201L197 90H133L129 78Z" fill="#c3decc" />
                <path d="M134 90C134 92.5 136.5 94 139 94C141.5 94 144 92.5 144 90H134Z" fill="#b1d3bc" />
                <path d="M144 90C144 92.5 146.5 94 149 94C151.5 94 154 92.5 154 90H144Z" fill="#b1d3bc" />
                <path d="M154 90C154 92.5 156.5 94 159 94C161.5 94 164 92.5 164 90H154Z" fill="#b1d3bc" />
                <path d="M164 90C164 92.5 166.5 94 169 94C171.5 94 174 92.5 174 90H164Z" fill="#b1d3bc" />
                <path d="M174 90C174 92.5 176.5 94 179 94C181.5 94 184 92.5 184 90H174Z" fill="#b1d3bc" />
                <path d="M184 90C184 92.5 186.5 94 189 94C191.5 94 194 92.5 194 90H184Z" fill="#b1d3bc" />
                <path d="M143 118V106C143 103 145 101 148 101C151 101 153 103 153 106V118H143Z" fill="#f0f7f2" />
                <path d="M160 118V106C160 103 162 101 165 101C168 101 170 103 170 106V118H160Z" fill="#f0f7f2" />
                <path d="M177 118V106C177 103 179 101 182 101C185 101 187 103 187 106V118H177Z" fill="#f0f7f2" />
                <rect x="206" y="50" width="68" height="140" fill="#cbe3d3" />
                <rect x="216" y="24" width="48" height="26" fill="#d9ebdf" />
                <rect x="228" y="8" width="24" height="16" fill="#e2efe6" />
                <line x1="240" y1="-4" x2="240" y2="8" stroke="#b1d3bc" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="224" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="224" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="224" cy="94" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="94" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="94" r="2.2" fill="#f0f7f2" />
                <rect x="282" y="55" width="28" height="135" fill="#e2efe6" />
                <ellipse cx="296" cy="55" rx="14" ry="7" fill="#d9ebdf" />
                <rect x="314" y="45" width="30" height="145" fill="#d9ebdf" />
                <ellipse cx="329" cy="45" rx="15" ry="8" fill="#cbe3d3" />
                <rect x="296" y="68" width="33" height="4" fill="#b1d3bc" />
                <rect x="352" y="40" width="60" height="150" rx="2" fill="#cbe3d3" />
                <rect x="360" y="45" width="44" height="4" fill="#b1d3bc" />
                <rect x="362" y="56" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="56" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="362" y="80" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="80" width="10" height="16" rx="1" fill="#f0f7f2" />
              </svg>
              {/* SVG Duplicate for seamless scroll */}
              <svg viewBox="0 0 420 190" className="w-[420px] h-[190px] shrink-0" fill="none">
                <rect x="0" y="52" width="60" height="138" rx="3" fill="#d9ebdf" />
                <rect x="6" y="58" width="48" height="6" rx="1" fill="#c3decc" />
                <line x1="12" y1="74" x2="48" y2="74" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="82" x2="48" y2="82" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="90" x2="48" y2="90" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="98" x2="48" y2="98" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <rect x="15" y="116" width="30" height="40" rx="1.5" fill="#cbe3d3" />
                <line x1="15" y1="126" x2="45" y2="126" stroke="#d9ebdf" strokeWidth="1.5" />
                <line x1="15" y1="136" x2="45" y2="136" stroke="#d9ebdf" strokeWidth="1.5" />
                <rect x="68" y="22" width="56" height="168" rx="2" fill="#e2efe6" />
                <rect x="74" y="26" width="44" height="4" fill="#cbe3d3" />
                <line x1="78" y1="10" x2="78" y2="22" stroke="#b1d3bc" strokeWidth="2" strokeLinecap="round" />
                <line x1="114" y1="10" x2="114" y2="22" stroke="#b1d3bc" strokeWidth="2" strokeLinecap="round" />
                <rect x="76" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="76" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="76" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="132" y="68" width="66" height="122" rx="3" fill="#d9ebdf" />
                <path d="M129 78H201L197 90H133L129 78Z" fill="#c3decc" />
                <path d="M134 90C134 92.5 136.5 94 139 94C141.5 94 144 92.5 144 90H134Z" fill="#b1d3bc" />
                <path d="M144 90C144 92.5 146.5 94 149 94C151.5 94 154 92.5 154 90H144Z" fill="#b1d3bc" />
                <path d="M154 90C154 92.5 156.5 94 159 94C161.5 94 164 92.5 164 90H154Z" fill="#b1d3bc" />
                <path d="M164 90C164 92.5 166.5 94 169 94C171.5 94 174 92.5 174 90H164Z" fill="#b1d3bc" />
                <path d="M174 90C174 92.5 176.5 94 179 94C181.5 94 184 92.5 184 90H174Z" fill="#b1d3bc" />
                <path d="M184 90C184 92.5 186.5 94 189 94C191.5 94 194 92.5 194 90H184Z" fill="#b1d3bc" />
                <path d="M143 118V106C143 103 145 101 148 101C151 101 153 103 153 106V118H143Z" fill="#f0f7f2" />
                <path d="M160 118V106C160 103 162 101 165 101C168 101 170 103 170 106V118H160Z" fill="#f0f7f2" />
                <path d="M177 118V106C177 103 179 101 182 101C185 101 187 103 187 106V118H177Z" fill="#f0f7f2" />
                <rect x="206" y="50" width="68" height="140" fill="#cbe3d3" />
                <rect x="216" y="24" width="48" height="26" fill="#d9ebdf" />
                <rect x="228" y="8" width="24" height="16" fill="#e2efe6" />
                <line x1="240" y1="-4" x2="240" y2="8" stroke="#b1d3bc" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="224" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="224" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="224" cy="94" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="94" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="94" r="2.2" fill="#f0f7f2" />
                <rect x="282" y="55" width="28" height="135" fill="#e2efe6" />
                <ellipse cx="296" cy="55" rx="14" ry="7" fill="#d9ebdf" />
                <rect x="314" y="45" width="30" height="145" fill="#d9ebdf" />
                <ellipse cx="329" cy="45" rx="15" ry="8" fill="#cbe3d3" />
                <rect x="296" y="68" width="33" height="4" fill="#b1d3bc" />
                <rect x="352" y="40" width="60" height="150" rx="2" fill="#cbe3d3" />
                <rect x="360" y="45" width="44" height="4" fill="#b1d3bc" />
                <rect x="362" y="56" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="56" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="362" y="80" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="80" width="10" height="16" fill="#f0f7f2" />
              </svg>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. CUSTOM GREEN DELIVERY TRUCK (SVG)                      */}
          {/* ========================================================= */}
          <svg
            viewBox="0 0 360 250"
            className="w-full h-full z-10 pointer-events-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="groundShadowMain" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#475569" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Trailing Green Speed Streaks */}
            <g className="animate-speed-lines">
              <line x1="28" y1="115" x2="65" y2="115" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
              <line x1="10" y1="128" x2="70" y2="128" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
              <line x1="35" y1="140" x2="68" y2="140" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
              <line x1="45" y1="152" x2="72" y2="152" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* Static Ground Shadow (Wheels and shadow don't bounce) */}
            <ellipse cx="165" cy="188" rx="100" ry="5.5" fill="url(#groundShadowMain)" />

            {/* ----------------------------------------------------- */}
            {/* BOUNCING TRUCK CHASSIS & GROCERIES                    */}
            {/* ----------------------------------------------------- */}
            <g className="animate-truck-body">
              
              {/* GROCERIES (Positioned perfectly on the roof) */}
              <g className="animate-produce-jiggle">
                {/* Baguette */}
                <g transform="translate(162, 50) rotate(18)">
                  <rect x="0" y="0" width="18" height="45" rx="9" fill="#d97706" />
                  <line x1="3" y1="12" x2="13" y2="16" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" />
                  <line x1="3" y1="22" x2="13" y2="26" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" />
                  <line x1="3" y1="32" x2="13" y2="36" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* Milk Bottle */}
                <g transform="translate(182, 55) rotate(8)">
                  <rect x="0" y="8" width="20" height="35" rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                  <rect x="0" y="18" width="20" height="15" fill="#0284c7" />
                  <circle cx="10" cy="25" r="4.5" fill="#ffffff" />
                  <rect x="5" y="2" width="10" height="6" rx="1.5" fill="#38bdf8" />
                </g>

                {/* Juice Carton / Extras */}
                <g transform="translate(202, 60) rotate(14)">
                  <rect x="0" y="6" width="22" height="32" rx="3" fill="#ea580c" />
                  <circle cx="11" cy="22" r="5" fill="#ffedd5" />
                  <polygon points="0,6 11,0 22,6" fill="#c2410c" />
                </g>

                {/* Bushy Green Kale & Broccoli */}
                <ellipse cx="140" cy="72" rx="20" ry="22" fill="#15803d" />
                <ellipse cx="115" cy="78" rx="18" ry="20" fill="#16a34a" />
                <circle cx="125" cy="65" r="12" fill="#22c55e" />
                <ellipse cx="160" cy="80" rx="15" ry="18" fill="#166534" />

                {/* Bananas */}
                <g transform="translate(110, 65) rotate(-14)">
                  <path d="M10 35C20 40 40 38 50 22C52 16 52 10 50 5C48 5 45 10 40 15C30 28 18 32 10 35Z" fill="#eab308" />
                  <path d="M4 32C14 36 32 34 40 20C42 15 42 8 40 4C38 4 35 8 30 12C22 22 10 26 4 32Z" fill="#fde047" />
                  <circle cx="4" cy="32" r="2.5" fill="#451a03" />
                  <circle cx="10" cy="36" r="2.5" fill="#451a03" />
                </g>

                {/* Red Tomatoes & Capsicum */}
                <g transform="translate(130, 75)">
                  <circle cx="10" cy="10" r="11" fill="#ef4444" />
                  <path d="M10 4L7 1M10 4L13 1M10 4V0" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
                </g>
                <g transform="translate(160, 68)">
                  <path d="M6 10C3 15 3 25 9 29C13 32 21 32 25 29C31 25 31 15 28 10C25 6 21 6 17 9C13 6 9 6 6 10Z" fill="#16a34a" />
                  <path d="M17 9V2" stroke="#14532d" strokeWidth="3" strokeLinecap="round" />
                </g>
              </g>

              {/* TRUCK BODY BOX */}
              <rect x="70" y="85" width="135" height="78" rx="4" fill="#22c55e" />
              
              {/* Curved Dark Green Overlay on Box */}
              <path d="M70 120 Q 150 160 205 130 V163 H70 Z" fill="#16a34a" opacity="0.8" />

              {/* CK LOGO */}
              <g transform="translate(115, 110)">
                <path d="M22 25 C10 25 5 18 5 10 C5 3 12 -2 20 0" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <line x1="22" y1="-2" x2="35" y2="12" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="24" y1="12" x2="38" y2="25" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
                
                {/* Dash under logo */}
                <line x1="-2" y1="28" x2="10" y2="28" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <circle cx="16" cy="28" r="2.5" fill="#ffffff" />
                <circle cx="23" cy="28" r="2.5" fill="#ffffff" />
              </g>

              {/* CABIN */}
              <path d="M205 85 H235 C248 85 255 100 258 115 L266 142 H276 C280 142 284 146 284 150 V163 H205 Z" fill="#22c55e" />
              
              {/* Window */}
              <path d="M210 92 H235 C242 92 248 102 250 112 L254 130 H210 V92 Z" fill="#7dd3fc" opacity="0.9" />
              <path d="M225 92 L245 130" stroke="#bae6fd" strokeWidth="2" opacity="0.5" />
              
              {/* Mirror */}
              <rect x="207" y="118" width="6" height="15" rx="2" fill="#1e293b" />
              
              {/* Door Handle */}
              <line x1="212" y1="138" x2="220" y2="138" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />

              {/* Headlight & Indicator */}
              <path d="M266 142 H275 C278 142 280 145 280 148 V153 H263 Z" fill="#fef08a" />
              <rect x="278" y="155" width="6" height="4" fill="#f59e0b" />

              {/* UNDERBELLY / CHASSIS (With wheel arch cutouts) */}
              <path
                d="M65 160 
                   H80 C82 160 84 156 84 153 C84 138 92 130 105 130 
                   C118 130 126 138 126 153 C126 156 128 160 130 160
                   H210 C212 160 214 156 214 153 C214 138 222 130 235 130 
                   C248 130 256 138 256 153 C256 156 258 160 260 160 
                   H284 V170 C284 172 282 174 280 174 H65 V160 Z"
                fill="#1e293b"
              />
              
              {/* Back Bumper Extension */}
              <rect x="65" y="152" width="6" height="18" rx="1.5" fill="#0f172a" />
            </g>

            {/* ----------------------------------------------------- */}
            {/* INDEPENDENT SPINNING WHEELS (Planted on ground)           */}
            {/* ----------------------------------------------------- */}
            
            {/* Rear Wheel (Pivot at cx=105, cy=158) */}
            <g className="wheel-rear" style={{ transformOrigin: '105px 158px' }}>
              <circle cx="105" cy="158" r="16" fill="#1e293b" />
              <circle cx="105" cy="158" r="13" fill="#334155" />
              <circle cx="105" cy="158" r="8" fill="#e2e8f0" />
              <circle cx="105" cy="158" r="3" fill="#22c55e" />
              
              {/* Spokes */}
              <line x1="105" y1="150" x2="105" y2="166" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="97" y1="158" x2="113" y2="158" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="99" y1="152" x2="111" y2="164" stroke="#1e293b" strokeWidth="2" />
              <line x1="99" y1="164" x2="111" y2="152" stroke="#1e293b" strokeWidth="2" />
            </g>

            {/* Front Wheel (Pivot at cx=235, cy=158) */}
            <g className="wheel-front" style={{ transformOrigin: '235px 158px' }}>
              <circle cx="235" cy="158" r="16" fill="#1e293b" />
              <circle cx="235" cy="158" r="13" fill="#334155" />
              <circle cx="235" cy="158" r="8" fill="#e2e8f0" />
              <circle cx="235" cy="158" r="3" fill="#22c55e" />
              
              {/* Spokes */}
              <line x1="235" y1="150" x2="235" y2="166" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="227" y1="158" x2="243" y2="158" stroke="#1e293b" strokeWidth="2.5" />
              <line x1="229" y1="152" x2="241" y2="164" stroke="#1e293b" strokeWidth="2" />
              <line x1="229" y1="164" x2="241" y2="152" stroke="#1e293b" strokeWidth="2" />
            </g>

          </svg>
        </div>

        {/* ========================================================= */}
        {/* 4. DYNAMIC 5-STEP STEPPER & ROTATING WHOLESALE STATUS     */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-1 flex flex-col items-center justify-center animate-fade-in">
            {/* Dynamic 5-Step Stepper Line */}
            <div className="relative flex items-center justify-between w-52 mb-3">
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
                      <div className="flex items-center justify-center h-4.5 w-4.5 rounded-full border-2 border-[#22c55e] bg-white transition-all duration-300 scale-110 shadow-xs">
                        <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
                      </div>
                    ) : isCompleted ? (
                      <div className="h-3 w-3 rounded-full bg-[#22c55e] transition-all duration-300" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-[#cbd5e1] transition-all duration-300" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Rotating Message Box */}
            <div className="h-6 flex items-center justify-center">
              <p
                key={msgIndex}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-tight animate-text-fade"
              >
                {HOME_MESSAGES[msgIndex]}
                <span className="text-emerald-500 text-sm">🍃</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* GPU Keyframe Animations */}
      <style>{`
        /* Continuous pan for distinct tall buildings */
        @keyframes skylineInfiniteScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-420px, 0, 0); }
        }
        .animate-skyline-scroll {
          animation: skylineInfiniteScroll 5.6s linear infinite;
        }

        /* Parallax cloud drift */
        @keyframes cloudsDrift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-420px, 0, 0); }
        }
        .animate-clouds-scroll {
          animation: cloudsDrift 10s linear infinite;
        }

        /* Independent spinning wheels */
        @keyframes spinWheelAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wheel-rear, .wheel-front {
          animation: spinWheelAnim 0.42s linear infinite;
        }

        /* Truck body suspension bounce (excluding wheels!) */
        @keyframes truckBodyBounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-1.4px); }
          65% { transform: translateY(0.4px); }
        }
        .animate-truck-body {
          animation: truckBodyBounce 0.65s ease-in-out infinite;
        }

        /* Speed wind streaks */
        @keyframes speedLines {
          0%, 100% { opacity: 0.85; transform: translateX(0); }
          50% { opacity: 0.35; transform: translateX(-4px); }
        }
        .animate-speed-lines {
          animation: speedLines 0.5s ease-in-out infinite;
        }

        /* Message switch fade transition */
        @keyframes textFade {
          0% { opacity: 0; transform: translateY(3px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-3px); }
        }
        .animate-text-fade {
          animation: textFade 1.8s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
});
