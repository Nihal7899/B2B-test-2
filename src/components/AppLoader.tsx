import React from 'react';

interface AppLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export const AppLoader = React.memo(function AppLoader({
  fullScreen = true,
  size = 'md',
  showStatus = false,
  className = '',
}: AppLoaderProps) {
  const scaleClass =
    size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-105' : 'scale-95 sm:scale-100';

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen ? 'fixed inset-0 z-50 animate-fade-in px-6' : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center ${scaleClass}`}>
        {/* Main Stage Viewport */}
        <div className="relative w-88 h-72 flex items-center justify-center overflow-hidden">
          {/* ========================================================= */}
          {/* 1. SEAMLESS MOVING CLOUDS (TOP DRIFT LAYER)               */}
          {/* ========================================================= */}
          <div className="absolute top-2 left-0 w-full h-16 overflow-hidden pointer-events-none z-0">
            <div className="flex w-[760px] animate-clouds-scroll opacity-70">
              <svg viewBox="0 0 380 50" className="w-[380px] h-[50px] shrink-0" fill="none">
                <path d="M40 28C40 22 45 18 51 18C53 18 55 18.8 56.5 20C58.5 15.5 63 13 68 13C75 13 81 18.5 81 25.5C83 25.5 85 27.5 85 29.5C85 32 83 34 80.5 34H44C41.8 34 40 31.5 40 28Z" fill="#e2efe6" />
                <path d="M190 22C190 16.5 194.5 12 200 12C201.8 12 203.5 12.6 205 13.8C207 9.8 211 7.5 215.5 7.5C222 7.5 227 12.5 227 19C229 19 231 21 231 23C231 25.5 229 27.5 226.5 27.5H194C191.8 27.5 190 25 190 22Z" fill="#d9ebdF" />
                <path d="M310 26C310 21 314 17 319 17C320.5 17 322 17.5 323.5 18.5C325 15 329 13 333 13C339 13 344 17.5 344 23.5C345.5 23.5 347 25 347 27C347 29.5 345 31.5 343 31.5H314C311.8 31.5 310 29.2 310 26Z" fill="#e2efe6" />
              </svg>
              <svg viewBox="0 0 380 50" className="w-[380px] h-[50px] shrink-0" fill="none">
                <path d="M40 28C40 22 45 18 51 18C53 18 55 18.8 56.5 20C58.5 15.5 63 13 68 13C75 13 81 18.5 81 25.5C83 25.5 85 27.5 85 29.5C85 32 83 34 80.5 34H44C41.8 34 40 31.5 40 28Z" fill="#e2efe6" />
                <path d="M190 22C190 16.5 194.5 12 200 12C201.8 12 203.5 12.6 205 13.8C207 9.8 211 7.5 215.5 7.5C222 7.5 227 12.5 227 19C229 19 231 21 231 23C231 25.5 229 27.5 226.5 27.5H194C191.8 27.5 190 25 190 22Z" fill="#d9ebdF" />
                <path d="M310 26C310 21 314 17 319 17C320.5 17 322 17.5 323.5 18.5C325 15 329 13 333 13C339 13 344 17.5 344 23.5C345.5 23.5 347 25 347 27C347 29.5 345 31.5 343 31.5H314C311.8 31.5 310 29.2 310 26Z" fill="#e2efe6" />
              </svg>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. CONTINUOUS ZERO-GAP TALL SKYLINE (PANS INFINITELY)     */}
          {/* ========================================================= */}
          <div className="absolute top-8 left-0 w-full h-44 overflow-hidden pointer-events-none z-0">
            <div className="flex w-[760px] animate-skyline-scroll opacity-85">
              {/* Segment 1: Exactly 380px wide with contiguous buildings */}
              <svg viewBox="0 0 380 160" className="w-[380px] h-[160px] shrink-0" fill="none">
                {/* Building 1: x=0 to 42 (H: 118) */}
                <rect x="0" y="42" width="42" height="118" fill="#d9ebdF" />
                <circle cx="12" cy="56" r="2" fill="#f0f7f2" />
                <circle cx="21" cy="56" r="2" fill="#f0f7f2" />
                <circle cx="30" cy="56" r="2" fill="#f0f7f2" />
                <circle cx="12" cy="70" r="2" fill="#f0f7f2" />
                <circle cx="21" cy="70" r="2" fill="#f0f7f2" />
                <circle cx="30" cy="70" r="2" fill="#f0f7f2" />

                {/* Building 2: x=42 to 86 (H: 140) */}
                <rect x="42" y="20" width="44" height="140" fill="#e2efe6" />
                <rect x="52" y="32" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="66" y="32" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="52" y="55" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="66" y="55" width="10" height="15" rx="1" fill="#f0f7f2" />

                {/* Building 3: x=86 to 134 (Storefront with Awning) */}
                <rect x="86" y="56" width="48" height="104" fill="#d9ebdF" />
                <path d="M84 64H136L133 74H87L84 64Z" fill="#c3decc" />
                <path d="M89 74C89 76 91 77.5 93 77.5C95 77.5 97 76 97 74H89Z" fill="#b1d3bc" />
                <path d="M97 74C97 76 99 77.5 101 77.5C103 77.5 105 76 105 74H97Z" fill="#b1d3bc" />
                <path d="M105 74C105 76 107 77.5 109 77.5C111 77.5 113 76 113 74H105Z" fill="#b1d3bc" />
                <path d="M113 74C113 76 115 77.5 117 77.5C119 77.5 121 76 121 74H113Z" fill="#b1d3bc" />
                <path d="M121 74C121 76 123 77.5 125 77.5C127 77.5 129 76 129 74H121Z" fill="#b1d3bc" />
                <rect x="94" y="85" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="112" y="85" width="10" height="16" rx="1" fill="#f0f7f2" />

                {/* Building 4: x=134 to 190 (Tall Skyscraper with Spire, H: 154) */}
                <path d="M134 46L152 24V160H134V46Z" fill="#cbe3d3" />
                <rect x="152" y="14" width="38" height="146" fill="#d9ebdF" />
                <rect x="164" y="2" width="14" height="12" fill="#d9ebdF" />
                <line x1="171" y1="-8" x2="171" y2="2" stroke="#b1d3bc" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="163" cy="26" r="2" fill="#f0f7f2" />
                <circle cx="171" cy="26" r="2" fill="#f0f7f2" />
                <circle cx="179" cy="26" r="2" fill="#f0f7f2" />
                <circle cx="163" cy="40" r="2" fill="#f0f7f2" />
                <circle cx="171" cy="40" r="2" fill="#f0f7f2" />
                <circle cx="179" cy="40" r="2" fill="#f0f7f2" />
                <circle cx="163" cy="54" r="2" fill="#f0f7f2" />
                <circle cx="171" cy="54" r="2" fill="#f0f7f2" />
                <circle cx="179" cy="54" r="2" fill="#f0f7f2" />

                {/* Map Pin on Skyscraper */}
                <g transform="translate(142, 36) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#a4cfb1" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>

                {/* Building 5: x=190 to 234 (Modern Glass Center, H: 132) */}
                <rect x="190" y="28" width="44" height="132" fill="#e2efe6" />
                <rect x="198" y="40" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="210" y="40" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="222" y="40" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="198" y="60" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="210" y="60" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="222" y="60" width="8" height="14" rx="1" fill="#f0f7f2" />

                {/* Building 6: x=234 to 286 (Produce Market with Awning) */}
                <rect x="234" y="52" width="52" height="108" fill="#d9ebdF" />
                <path d="M232 62H288L285 72H235L232 62Z" fill="#c3decc" />
                <path d="M237 72C237 74 239 75.5 241 75.5C243 75.5 245 74 245 72H237Z" fill="#b1d3bc" />
                <path d="M245 72C245 74 247 75.5 249 75.5C251 75.5 253 74 253 72H245Z" fill="#b1d3bc" />
                <path d="M253 72C253 74 255 75.5 257 75.5C259 75.5 261 74 261 72H253Z" fill="#b1d3bc" />
                <path d="M261 72C261 74 263 75.5 265 75.5C267 75.5 269 74 269 72H261Z" fill="#b1d3bc" />
                <path d="M269 72C269 74 271 75.5 273 75.5C275 75.5 277 74 277 72H269Z" fill="#b1d3bc" />
                <rect x="244" y="82" width="12" height="16" rx="1" fill="#f0f7f2" />
                <rect x="264" y="82" width="12" height="16" rx="1" fill="#f0f7f2" />

                {/* Right Map Pin */}
                <g transform="translate(274, 40) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#a4cfb1" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>

                {/* Building 7: x=286 to 334 (Commercial Office, H: 136) */}
                <rect x="286" y="24" width="48" height="136" fill="#cbe3d3" />
                <circle cx="298" cy="38" r="2" fill="#f0f7f2" />
                <circle cx="310" cy="38" r="2" fill="#f0f7f2" />
                <circle cx="322" cy="38" r="2" fill="#f0f7f2" />
                <circle cx="298" cy="52" r="2" fill="#f0f7f2" />
                <circle cx="310" cy="52" r="2" fill="#f0f7f2" />
                <circle cx="322" cy="52" r="2" fill="#f0f7f2" />

                {/* Building 8: x=334 to 380 (Contiguous connection back to 0) */}
                <rect x="334" y="44" width="46" height="116" fill="#d9ebdF" />
                <rect x="344" y="56" width="10" height="14" rx="1" fill="#f0f7f2" />
                <rect x="360" y="56" width="10" height="14" rx="1" fill="#f0f7f2" />
              </svg>

              {/* Segment 2: Exact Duplicate for Perfectly Continuous Pan */}
              <svg viewBox="0 0 380 160" className="w-[380px] h-[160px] shrink-0" fill="none">
                <rect x="0" y="42" width="42" height="118" fill="#d9ebdF" />
                <circle cx="12" cy="56" r="2" fill="#f0f7f2" />
                <circle cx="21" cy="56" r="2" fill="#f0f7f2" />
                <circle cx="30" cy="56" r="2" fill="#f0f7f2" />
                <circle cx="12" cy="70" r="2" fill="#f0f7f2" />
                <circle cx="21" cy="70" r="2" fill="#f0f7f2" />
                <circle cx="30" cy="70" r="2" fill="#f0f7f2" />

                <rect x="42" y="20" width="44" height="140" fill="#e2efe6" />
                <rect x="52" y="32" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="66" y="32" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="52" y="55" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="66" y="55" width="10" height="15" rx="1" fill="#f0f7f2" />

                <rect x="86" y="56" width="48" height="104" fill="#d9ebdF" />
                <path d="M84 64H136L133 74H87L84 64Z" fill="#c3decc" />
                <path d="M89 74C89 76 91 77.5 93 77.5C95 77.5 97 76 97 74H89Z" fill="#b1d3bc" />
                <path d="M97 74C97 76 99 77.5 101 77.5C103 77.5 105 76 105 74H97Z" fill="#b1d3bc" />
                <path d="M105 74C105 76 107 77.5 109 77.5C111 77.5 113 76 113 74H105Z" fill="#b1d3bc" />
                <path d="M113 74C113 76 115 77.5 117 77.5C119 77.5 121 76 121 74H113Z" fill="#b1d3bc" />
                <path d="M121 74C121 76 123 77.5 125 77.5C127 77.5 129 76 129 74H121Z" fill="#b1d3bc" />
                <rect x="94" y="85" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="112" y="85" width="10" height="16" rx="1" fill="#f0f7f2" />

                <path d="M134 46L152 24V160H134V46Z" fill="#cbe3d3" />
                <rect x="152" y="14" width="38" height="146" fill="#d9ebdF" />
                <rect x="164" y="2" width="14" height="12" fill="#d9ebdF" />
                <line x1="171" y1="-8" x2="171" y2="2" stroke="#b1d3bc" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="163" cy="26" r="2" fill="#f0f7f2" />
                <circle cx="171" cy="26" r="2" fill="#f0f7f2" />
                <circle cx="179" cy="26" r="2" fill="#f0f7f2" />
                <circle cx="163" cy="40" r="2" fill="#f0f7f2" />
                <circle cx="171" cy="40" r="2" fill="#f0f7f2" />
                <circle cx="179" cy="40" r="2" fill="#f0f7f2" />
                <circle cx="163" cy="54" r="2" fill="#f0f7f2" />
                <circle cx="171" cy="54" r="2" fill="#f0f7f2" />
                <circle cx="179" cy="54" r="2" fill="#f0f7f2" />

                <g transform="translate(142, 36) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#a4cfb1" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>

                <rect x="190" y="28" width="44" height="132" fill="#e2efe6" />
                <rect x="198" y="40" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="210" y="40" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="222" y="40" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="198" y="60" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="210" y="60" width="8" height="14" rx="1" fill="#f0f7f2" />
                <rect x="222" y="60" width="8" height="14" rx="1" fill="#f0f7f2" />

                <rect x="234" y="52" width="52" height="108" fill="#d9ebdF" />
                <path d="M232 62H288L285 72H235L232 62Z" fill="#c3decc" />
                <path d="M237 72C237 74 239 75.5 241 75.5C243 75.5 245 74 245 72H237Z" fill="#b1d3bc" />
                <path d="M245 72C245 74 247 75.5 249 75.5C251 75.5 253 74 253 72H245Z" fill="#b1d3bc" />
                <path d="M253 72C253 74 255 75.5 257 75.5C259 75.5 261 74 261 72H253Z" fill="#b1d3bc" />
                <path d="M261 72C261 74 263 75.5 265 75.5C267 75.5 269 74 269 72H261Z" fill="#b1d3bc" />
                <path d="M269 72C269 74 271 75.5 273 75.5C275 75.5 277 74 277 72H269Z" fill="#b1d3bc" />
                <rect x="244" y="82" width="12" height="16" rx="1" fill="#f0f7f2" />
                <rect x="264" y="82" width="12" height="16" rx="1" fill="#f0f7f2" />

                <g transform="translate(274, 40) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#a4cfb1" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>

                <rect x="286" y="24" width="48" height="136" fill="#cbe3d3" />
                <circle cx="298" cy="38" r="2" fill="#f0f7f2" />
                <circle cx="310" cy="38" r="2" fill="#f0f7f2" />
                <circle cx="322" cy="38" r="2" fill="#f0f7f2" />
                <circle cx="298" cy="52" r="2" fill="#f0f7f2" />
                <circle cx="310" cy="52" r="2" fill="#f0f7f2" />
                <circle cx="322" cy="52" r="2" fill="#f0f7f2" />

                <rect x="334" y="44" width="46" height="116" fill="#d9ebdF" />
                <rect x="344" y="56" width="10" height="14" rx="1" fill="#f0f7f2" />
                <rect x="360" y="56" width="10" height="14" rx="1" fill="#f0f7f2" />
              </svg>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. TRUCK & HIGHLY DETAILED GROCERY LOAD                   */}
          {/* ========================================================= */}
          <svg
            viewBox="0 0 360 230"
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

            {/* Trailing Green Wind Streaks */}
            <g className="animate-speed-lines">
              <line x1="42" y1="124" x2="80" y2="124" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="28" y1="132" x2="80" y2="132" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="38" y1="140" x2="80" y2="140" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="50" y1="148" x2="80" y2="148" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
            </g>

            {/* Soft Elliptical Ground Shadow under wheels */}
            <ellipse cx="180" cy="186" rx="106" ry="5.5" fill="url(#groundShadowMain)" />

            {/* TRUCK BODY & HEAVY GROCERY STACK */}
            <g className="animate-truck-body">
              {/* =================================================== */}
              {/* CLEAN, POLISHED, HIGH-DETAIL LOADED PRODUCE STACK   */}
              {/* =================================================== */}
              <g className="animate-produce-jiggle">
                {/* 1. LAYER 1 (BACK): ARTISAN BREAD / BAGUETTE */}
                <g transform="translate(138, 76) rotate(18)">
                  <rect x="0" y="0" width="12" height="34" rx="6" fill="#d97706" />
                  <line x1="2" y1="8" x2="9" y2="11" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="2" y1="16" x2="9" y2="19" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="2" y1="24" x2="9" y2="27" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
                </g>

                {/* 2. LAYER 1 (BACK): FRESH DAIRY MILK BOTTLE */}
                <g transform="translate(154, 78) rotate(8)">
                  <rect x="0" y="6" width="16" height="26" rx="3.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <rect x="0" y="14" width="16" height="11" fill="#0284c7" />
                  <circle cx="8" cy="19.5" r="3.2" fill="#ffffff" />
                  <rect x="4" y="1.5" width="8" height="4.5" rx="1" fill="#38bdf8" />
                </g>

                {/* 3. LAYER 1 (BACK): ORANGE JUICE CARTON */}
                <g transform="translate(172, 82) rotate(14)">
                  <rect x="0" y="5" width="17" height="24" rx="2" fill="#ea580c" />
                  <circle cx="8.5" cy="16" r="3.8" fill="#ffedd5" />
                  <polygon points="0,5 8.5,0 17,5" fill="#c2410c" />
                  <circle cx="8.5" cy="16" r="1.8" fill="#ea580c" />
                </g>

                {/* 4. BUSHY FRESH KALE / CABBAGE */}
                <ellipse cx="118" cy="92" rx="14" ry="15" fill="#15803d" />
                <ellipse cx="118" cy="92" rx="11" ry="12" fill="#16a34a" />
                <circle cx="116" cy="89" r="7" fill="#22c55e" />
                <path d="M112 85C115 90 120 92 124 90" stroke="#86efac" strokeWidth="1.2" strokeLinecap="round" />

                {/* 5. VIBRANT CURVED BANANA BUNCH */}
                <g transform="translate(80, 88) rotate(-14)">
                  {/* Outer Banana */}
                  <path d="M8 29C16 32 30 30 38 18C40 13 40 8 38 4C37 4 34 8 30 12C22 21 14 24 8 29Z" fill="#eab308" />
                  {/* Middle Banana */}
                  <path d="M2 26C10 29 23 27 30 16C32 12 32 7 30 3C29 3 27 7 23 10C16 18 8 21 2 26Z" fill="#fde047" />
                  {/* Stem & Dark Tip */}
                  <path d="M30 16L34 13" stroke="#65a30d" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="2.5" cy="26.5" r="1.8" fill="#451a03" />
                  <circle cx="8.5" cy="29.5" r="1.8" fill="#451a03" />
                </g>

                {/* 6. SHINY RED APPLE WITH STEM & LEAF */}
                <g transform="translate(104, 94)">
                  <path d="M12 4C8 1 2 3 1 9C0 16 5 23 12 24C19 23 24 16 23 9C22 3 16 1 12 4Z" fill="#dc2626" />
                  {/* Specular White Shine */}
                  <path d="M6 8C4 11 4 16 7 19" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                  {/* Apple Stem & Leaf */}
                  <path d="M12 4C12 1 14 -1 16 -2" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M13 1C17 0 19 2 18 5C15 5 13 3 13 1Z" fill="#22c55e" />
                </g>

                {/* 7. GLOSSY GREEN CAPSICUM (BELL PEPPER) */}
                <g transform="translate(122, 92)">
                  <path d="M4 8C2 12 2 20 6 23C9 25 15 25 18 23C22 20 22 12 20 8C18 5 15 5 12 7C9 5 6 5 4 8Z" fill="#16a34a" />
                  {/* Lobes Shading */}
                  <path d="M8 8C7 13 7 19 9 23" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M16 8C17 13 17 19 15 23" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" />
                  {/* Stout Stalk */}
                  <path d="M12 7V2" stroke="#14532d" strokeWidth="2.2" strokeLinecap="round" />
                  {/* Capsicum Crown Leaf */}
                  <circle cx="12" cy="6" r="2.5" fill="#15803d" />
                </g>

                {/* 8. PLUMP RED TOMATOES (FOREGROUND) */}
                <g transform="translate(142, 99)">
                  <circle cx="8" cy="8" r="7.5" fill="#ef4444" />
                  {/* Star Calyx */}
                  <path d="M8 3L6 1M8 3L10 1M8 3L5 4M8 3L11 4M8 3V0.5" stroke="#166534" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="6" cy="6" r="1.5" fill="#fca5a5" opacity="0.7" />
                </g>
                <g transform="translate(133, 102)">
                  <circle cx="6" cy="6" r="6" fill="#dc2626" />
                  <path d="M6 2L4 0.5M6 2L8 0.5M6 2V0" stroke="#166534" strokeWidth="1.2" strokeLinecap="round" />
                </g>
              </g>

              {/* ----------------- EXTENDED VIBRANT GREEN CARGO CONTAINER ----------------- */}
              <rect x="82" y="106" width="130" height="66" rx="5" fill="#22c55e" />
              <rect x="82" y="166" width="130" height="6" fill="#16a34a" />

              {/* CAFKART LOGO: SHIFTED FORWARD TO x=156 (ZERO CLIPPING FROM TYRE WELL) */}
              <g transform="translate(156, 119) scale(0.024)">
                <path
                  d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z"
                  fill="#FFFFFF"
                  fillRule="evenodd"
                />
                <path
                  d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z"
                  fill="#FFFFFF"
                  fillRule="evenodd"
                />
              </g>

              {/* ----------------- DRIVER CABIN ----------------- */}
              <path
                d="M212 110H240C245 110 249 113.5 251.5 118L265 141C267 144.5 265.5 149 261 149H212V110Z"
                fill="#02402c"
              />

              {/* Windshield & Window Divider */}
              <path
                d="M218 114H238C240.5 114 243 115.8 244 118.5L253 134H218V114Z"
                fill="#a7f3d0"
                opacity="0.9"
              />
              <line x1="235" y1="114" x2="235" y2="134" stroke="#02402c" strokeWidth="2.5" />

              {/* Front Bumper & Turn Indicator */}
              <path d="M261 149H274C277 149 279 151.5 279 154.5V159H256L261 149Z" fill="#0f172a" />
              <rect x="272" y="151" width="5" height="5" rx="1" fill="#f59e0b" />

              {/* Chassis Cutouts */}
              <path
                d="M80 166H94C96 166 98 163.5 98 161C98 148 108 138 121 138C134 138 144 148 144 161C144 163.5 146 166 148 166H222C224 166 226 163.5 226 161C226 148 236 138 249 138C262 138 272 148 272 161C272 163.5 274 166 276 166H284V172H80V166Z"
                fill="#0f172a"
              />
            </g>

            {/* ========================================================= */}
            {/* 4. VISIBLY SPINNING ALLOY WHEELS (EXPLICIT ROTATION AXIS) */}
            {/* ========================================================= */}
            {/* Rear Wheel (Pivot at cx=121, cy=168) */}
            <g className="wheel-rear" style={{ transformOrigin: '121px 168px' }}>
              <circle cx="121" cy="168" r="17" fill="#1e293b" />
              <circle cx="121" cy="168" r="10.5" fill="#e2e8f0" />
              <line x1="121" y1="158" x2="121" y2="178" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="111" y1="168" x2="131" y2="168" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="114" y1="161" x2="128" y2="175" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <line x1="114" y1="175" x2="128" y2="161" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <circle cx="121" cy="168" r="4.5" fill="#0f172a" />
            </g>

            {/* Front Wheel (Pivot at cx=249, cy=168) */}
            <g className="wheel-front" style={{ transformOrigin: '249px 168px' }}>
              <circle cx="249" cy="168" r="17" fill="#1e293b" />
              <circle cx="249" cy="168" r="10.5" fill="#e2e8f0" />
              <line x1="249" y1="158" x2="249" y2="178" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="239" y1="168" x2="259" y2="168" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="242" y1="161" x2="256" y2="175" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <line x1="242" y1="175" x2="256" y2="161" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <circle cx="249" cy="168" r="4.5" fill="#0f172a" />
            </g>
          </svg>
        </div>

        {/* ========================================================= */}
        {/* 5. 5-STEP STEPPER & TAGLINE (HOME SCREEN ONLY)            */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-2 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative flex items-center justify-between w-48 mb-3">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-[#cbd5e1] z-0" />
              <div className="absolute top-1/2 left-0 w-1/2 h-[2px] -translate-y-1/2 bg-[#22c55e] z-0" />

              <div className="relative z-10 h-3 w-3 rounded-full bg-[#22c55e]" />
              <div className="relative z-10 h-3 w-3 rounded-full bg-[#22c55e]" />
              <div className="relative z-10 flex items-center justify-center h-4 w-4 rounded-full border-2 border-[#22c55e] bg-white">
                <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
              </div>
              <div className="relative z-10 h-3 w-3 rounded-full bg-[#cbd5e1]" />
              <div className="relative z-10 h-3 w-3 rounded-full bg-[#cbd5e1]" />
            </div>

            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-tight">
              Delivering Quality, Every Time
              <span className="text-emerald-500 text-sm">🍃</span>
            </p>
          </div>
        )}
      </div>

      {/* GPU Keyframe Animations */}
      <style>{`
        /* Continuous zero-gap city skyline pan */
        @keyframes skylineInfiniteScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-380px, 0, 0); }
        }
        .animate-skyline-scroll {
          animation: skylineInfiniteScroll 5.2s linear infinite;
        }

        /* Parallax cloud drift */
        @keyframes cloudsDrift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-380px, 0, 0); }
        }
        .animate-clouds-scroll {
          animation: cloudsDrift 9s linear infinite;
        }

        /* Visible 360-degree alloy wheel spin */
        @keyframes spinWheelAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wheel-rear {
          animation: spinWheelAnim 0.42s linear infinite;
        }
        .wheel-front {
          animation: spinWheelAnim 0.42s linear infinite;
        }

        /* Light suspension bounce */
        @keyframes truckBodyBounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-1.4px); }
          65% { transform: translateY(0.4px); }
        }
        .animate-truck-body {
          animation: truckBodyBounce 0.65s ease-in-out infinite;
        }

        /* Produce stack bounce */
        @keyframes produceJiggle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-1.2px) rotate(-0.5deg); }
        }
        .animate-produce-jiggle {
          animation: produceJiggle 0.65s ease-in-out infinite 0.08s;
        }

        /* Speed lines */
        @keyframes speedLines {
          0%, 100% { opacity: 0.85; transform: translateX(0); }
          50% { opacity: 0.35; transform: translateX(-4px); }
        }
        .animate-speed-lines {
          animation: speedLines 0.5s ease-in-out infinite;
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