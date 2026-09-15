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

  // Dynamic percentage for progress line based on current message step
  const progressPercent = (msgIndex / (HOME_MESSAGES.length - 1)) * 100;

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen ? 'fixed inset-0 z-50 animate-fade-in px-6' : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center ${scaleClass}`}>
        {/* Main Stage Viewport */}
        <div className="relative w-92 h-80 flex items-center justify-center overflow-hidden rounded-xl">
          {/* ========================================================= */}
          {/* NEW FULL-SCENE SVG TRUCK & GROCERIES                      */}
          {/* ========================================================= */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
            <defs>
              {/* Gradients for Realism */}
              <linearGradient id="truckBoxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4CAF50" />
                <stop offset="15%" stopColor="#38B554" />
                <stop offset="85%" stopColor="#2E9E48" />
                <stop offset="100%" stopColor="#1B632B" />
              </linearGradient>

              <linearGradient id="cabinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1B5E20" />
                <stop offset="20%" stopColor="#125E34" />
                <stop offset="90%" stopColor="#0E4A28" />
                <stop offset="100%" stopColor="#072B16" />
              </linearGradient>

              <linearGradient id="windowReflect" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0F2F1" />
                <stop offset="30%" stopColor="#B2DFDB" />
                <stop offset="35%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#80CBC4" />
                <stop offset="100%" stopColor="#4DB6AC" />
              </linearGradient>

              <radialGradient id="tireGrad" cx="50%" cy="50%" r="50%">
                <stop offset="70%" stopColor="#1A1C1E" />
                <stop offset="95%" stopColor="#2B2E33" />
                <stop offset="100%" stopColor="#111111" />
              </radialGradient>

              <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#D9DFE3" />
                <stop offset="60%" stopColor="#9E9E9E" />
                <stop offset="100%" stopColor="#616161" />
              </linearGradient>

              <radialGradient id="dropShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(238,243,239,1)" />
                <stop offset="100%" stopColor="rgba(238,243,239,0)" />
              </radialGradient>

              <radialGradient id="tomatoGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FF8A80" />
                <stop offset="40%" stopColor="#E53935" />
                <stop offset="80%" stopColor="#C62828" />
                <stop offset="100%" stopColor="#8E0000" />
              </radialGradient>

              <radialGradient id="pepperGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FF5252" />
                <stop offset="50%" stopColor="#D32F2F" />
                <stop offset="100%" stopColor="#B71C1C" />
              </radialGradient>

              <linearGradient id="baguetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFCC80" />
                <stop offset="40%" stopColor="#E68A00" />
                <stop offset="80%" stopColor="#B35900" />
                <stop offset="100%" stopColor="#663300" />
              </linearGradient>

              <linearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4A373" />
                <stop offset="50%" stopColor="#FAEDCD" />
                <stop offset="100%" stopColor="#CCD5AE" />
              </linearGradient>
              
              <linearGradient id="milkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="80%" stopColor="#F0F8FF" />
                <stop offset="100%" stopColor="#D0E4F5" />
              </linearGradient>

              <radialGradient id="lettuceGrad1" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#81C784" />
                <stop offset="70%" stopColor="#4CAF50" />
                <stop offset="100%" stopColor="#2E7D32" />
              </radialGradient>
              
              <radialGradient id="lettuceGrad2" cx="30%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#AED581" />
                <stop offset="80%" stopColor="#689F38" />
                <stop offset="100%" stopColor="#33691E" />
              </radialGradient>
            </defs>

            {/* Solid White Sky */}
            <rect width="100%" height="100%" fill="#FFFFFF" />

            {/* Light Green Shadow Background Buildings */}
            <g fill="#EEF5F0">
              {/* Clouds */}
              <rect x="250" y="190" width="50" height="15" rx="7.5" />
              <rect x="520" y="210" width="45" height="12" rx="6" />

              {/* Location Pins */}
              <g transform="translate(240, 150) scale(0.6)">
                <path d="M 0 0 C 10 -10 15 -18 15 -25 A 15 15 0 1 0 -15 -25 C -15 -18 -10 -10 0 0 Z" />
                <circle cx="0" cy="-25" r="5" fill="#FFFFFF"/>
              </g>
              <g transform="translate(560, 180) scale(0.6)">
                <path d="M 0 0 C 10 -10 15 -18 15 -25 A 15 15 0 1 0 -15 -25 C -15 -18 -10 -10 0 0 Z" />
                <circle cx="0" cy="-25" r="5" fill="#FFFFFF"/>
              </g>

              {/* Darker Shadow Layer (Background) */}
              <g fill="#E5EDE7">
                <rect x="180" y="300" width="40" height="170" rx="2" />
                <rect x="280" y="240" width="40" height="230" rx="2" />
                <rect x="415" y="270" width="45" height="200" rx="2" />
                <rect x="535" y="315" width="45" height="155" rx="2" />
              </g>

              {/* Lighter Layer (Foreground) */}
              {/* Left Storefront */}
              <rect x="135" y="330" width="50" height="140" rx="2" />
              <polygon points="130,330 190,330 185,345 135,345" fill="#E5EDE7" />
              <rect x="145" y="360" width="12" height="15" rx="1" fill="#FFFFFF" />
              <rect x="165" y="360" width="12" height="15" rx="1" fill="#FFFFFF" />

              {/* Tall Narrow Building */}
              <rect x="225" y="270" width="40" height="200" rx="2" />
              
              {/* Medium Building */}
              <rect x="265" y="310" width="35" height="160" rx="2" />

              {/* Tall Center Building */}
              <rect x="315" y="200" width="55" height="270" rx="2" />
              <rect x="340" y="170" width="5" height="30" /> {/* Antenna */}
              <rect x="325" y="185" width="35" height="15" rx="2" /> {/* Top tier */}
              <rect x="325" y="220" width="10" height="12" rx="1" fill="#FFFFFF" />
              <rect x="350" y="220" width="10" height="12" rx="1" fill="#FFFFFF" />
              <rect x="325" y="240" width="10" height="12" rx="1" fill="#FFFFFF" />
              <rect x="350" y="240" width="10" height="12" rx="1" fill="#FFFFFF" />

              {/* Right Mid Building */}
              <rect x="380" y="250" width="60" height="220" rx="2" />

              {/* Right Side Lower Building */}
              <rect x="475" y="310" width="50" height="160" rx="2" />

              {/* Right Storefront */}
              <rect x="515" y="350" width="50" height="120" rx="2" />
              <polygon points="510,350 570,350 565,365 515,365" fill="#E5EDE7" />
              <rect x="525" y="380" width="30" height="25" rx="1" fill="#FFFFFF" />

              {/* Far Right Edge */}
              <rect x="575" y="380" width="45" height="90" rx="2" />
            </g>

            {/* Speed Lines */}
            <g stroke="#38B554" strokeLinecap="round" strokeWidth="3" opacity="0.6">
              <line x1="130" y1="410" x2="210" y2="410" />
              <line x1="160" y1="435" x2="210" y2="435" />
              <line x1="110" y1="460" x2="210" y2="460" />
              <line x1="180" y1="485" x2="210" y2="485" />
            </g>

            {/* Ground Shadow */}
            <ellipse cx="420" cy="535" rx="220" ry="8" fill="url(#dropShadow)" />

            {/* ================= GROCERIES (Behind Box) ================= */}
            {/* Lettuce */}
            <circle cx="280" cy="350" r="35" fill="url(#lettuceGrad1)" />
            <circle cx="315" cy="330" r="40" fill="url(#lettuceGrad2)" />
            <circle cx="355" cy="350" r="35" fill="url(#lettuceGrad1)" />

            {/* Paper Bag */}
            <path d="M 400 400 L 450 400 L 465 300 L 415 315 Z" fill="#D4A373" />
            <path d="M 410 295 L 460 280 L 465 300 L 415 315 Z" fill="#BC8A5F" />
            <ellipse cx="430" cy="350" rx="12" ry="12" fill="#E76F51" transform="rotate(-15 430 350)" />
            <ellipse cx="430" cy="350" rx="5" ry="5" fill="#F4A261" transform="rotate(-15 430 350)" />

            {/* Milk Bottle */}
            <g transform="translate(385, 360) rotate(12)">
              {/* Liquid/Bottle */}
              <rect x="-18" y="-60" width="36" height="100" rx="6" fill="url(#milkGrad)" />
              {/* Label */}
              <rect x="-18" y="-20" width="36" height="35" fill="#2196F3" />
              <circle cx="0" cy="-2" r="8" fill="#FFFFFF" />
              <circle cx="0" cy="-2" r="4" fill="#2196F3" />
              {/* Neck */}
              <rect x="-10" y="-75" width="20" height="20" fill="#E3F2FD" />
              {/* Cap */}
              <rect x="-12" y="-80" width="24" height="10" rx="3" fill="#0D47A1" />
              {/* Glass Reflection */}
              <path d="M -12 -50 L -12 30" stroke="#FFFFFF" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
            </g>

            {/* Baguette */}
            <g transform="translate(350, 345) rotate(25)">
              <ellipse cx="0" cy="0" rx="20" ry="70" fill="url(#baguetteGrad)" />
              {/* Score Marks */}
              <path d="M -10 -40 Q 0 -35 12 -25" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
              <path d="M -12 -10 Q 0 -5 12 5" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
              <path d="M -12 20 Q 0 25 12 35" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
              {/* Highlight */}
              <ellipse cx="-8" cy="0" rx="4" ry="55" fill="#FFFFFF" opacity="0.3" />
            </g>

            {/* Red Peppers */}
            <g>
              <ellipse cx="315" cy="375" rx="20" ry="28" fill="url(#pepperGrad)" />
              <ellipse cx="295" cy="385" rx="18" ry="25" fill="url(#pepperGrad)" />
              <ellipse cx="335" cy="385" rx="18" ry="25" fill="url(#pepperGrad)" />
              {/* Stems */}
              <path d="M 315 348 Q 320 335 330 340" fill="none" stroke="#1B5E20" strokeWidth="5" strokeLinecap="round" />
              {/* Highlights */}
              <ellipse cx="308" cy="360" rx="4" ry="10" fill="#FFFFFF" opacity="0.5" transform="rotate(-15 308 360)" />
              <ellipse cx="328" cy="368" rx="3" ry="8" fill="#FFFFFF" opacity="0.5" transform="rotate(-15 328 368)" />
            </g>

            {/* Tomato */}
            <g>
              <circle cx="365" cy="390" r="24" fill="url(#tomatoGrad)" />
              {/* Leaves */}
              <path d="M 365 366 L 358 373 M 365 366 L 372 373 M 365 366 L 365 375 M 365 366 L 360 361" stroke="#1B5E20" strokeWidth="3" strokeLinecap="round" />
              {/* Highlight */}
              <ellipse cx="355" cy="378" rx="6" ry="4" fill="#FFFFFF" opacity="0.5" transform="rotate(-30 355 378)" />
            </g>

            {/* Bananas */}
            <g>
              <path d="M 235 340 C 240 390 270 405 295 395 C 290 365 260 350 235 340 Z" fill="#FBC02D" />
              <path d="M 245 330 C 255 380 285 395 310 385 C 305 355 275 340 245 330 Z" fill="#FFF176" />
              <path d="M 235 340 C 240 390 270 405 295 395" fill="none" stroke="#F57F17" strokeWidth="2" />
              {/* Stem */}
              <path d="M 235 340 L 225 330 L 240 325 Z" fill="#8BC34A" />
            </g>

            {/* ================= TRUCK BODY ================= */}
            {/* Main Green Box */}
            <rect x="230" y="380" width="250" height="145" rx="6" fill="url(#truckBoxGrad)" />
            
            {/* Box Top Edge Highlight */}
            <rect x="230" y="380" width="250" height="4" rx="2" fill="#FFFFFF" opacity="0.4" />
            
            {/* Box Bottom Edge Shadow */}
            <rect x="230" y="515" width="250" height="10" rx="3" fill="#000000" opacity="0.3" />
            
            {/* Panel Seams on Box */}
            <line x1="313" y1="385" x2="313" y2="510" stroke="#1B632B" strokeWidth="2" />
            <line x1="315" y1="385" x2="315" y2="510" stroke="#66BB6A" strokeWidth="1" />
            <line x1="396" y1="385" x2="396" y2="510" stroke="#1B632B" strokeWidth="2" />
            <line x1="398" y1="385" x2="398" y2="510" stroke="#66BB6A" strokeWidth="1" />

            {/* Truck Cabin Base */}
            <path d="M 478 400 L 530 400 Q 545 400 555 415 L 590 470 Q 595 480 610 480 L 620 480 Q 625 480 625 485 L 625 520 Q 625 525 620 525 L 478 525 Z" fill="url(#cabinGrad)" />
            
            {/* Cabin Bottom Shadow */}
            <rect x="478" y="515" width="147" height="10" fill="#000000" opacity="0.4" />

            {/* Door Outline / Seam */}
            <path d="M 478 400 L 530 400 Q 545 400 555 415 L 590 470 L 590 525" fill="none" stroke="#072B16" strokeWidth="3" />
            <path d="M 478 400 L 530 400 Q 545 400 555 415 L 590 470 L 590 525" fill="none" stroke="#2E7D32" strokeWidth="1" transform="translate(1, 0)" />

            {/* Window */}
            <path d="M 488 410 L 525 410 Q 532 410 538 420 L 568 465 L 488 465 Z" fill="url(#windowReflect)" stroke="#1B5E20" strokeWidth="3" strokeLinejoin="round" />
            
            {/* Window Glass Highlight/Glare */}
            <path d="M 495 415 L 515 415 L 525 460 L 505 460 Z" fill="#FFFFFF" opacity="0.3" />

            {/* Door Handle */}
            <rect x="495" y="475" width="22" height="6" rx="3" fill="#111111" />
            <rect x="495" y="475" width="22" height="3" rx="1.5" fill="#424242" />

            {/* Front Bumper (Width Reduced) */}
            <rect x="616" y="505" width="12" height="18" rx="4" fill="#212121" />
            <rect x="616" y="505" width="12" height="5" rx="2" fill="#424242" />

            {/* Headlight */}
            <rect x="618" y="482" width="10" height="16" rx="3" fill="#FFF59D" />
            <rect x="620" y="484" width="6" height="12" rx="2" fill="#FFFFFF" />
            {/* Headlight Glow */}
            <circle cx="625" cy="490" r="15" fill="#FFF59D" opacity="0.4" />

            {/* Rear Bumper/Light */}
            <rect x="226" y="500" width="8" height="15" rx="2" fill="#212121" />
            <rect x="226" y="490" width="6" height="12" rx="2" fill="#D32F2F" />
            
            {/* ================= WHEELS ================= */}
            {/* Rear Wheel Well */}
            <path d="M 255 525 A 38 38 0 0 1 335 525 Z" fill="#0A0A0A" />
            <path d="M 260 525 A 33 33 0 0 1 330 525 Z" fill="#1A1C1E" />
            
            {/* Front Wheel Well */}
            <path d="M 505 525 A 38 38 0 0 1 585 525 Z" fill="#0A0A0A" />
            <path d="M 510 525 A 33 33 0 0 1 580 525 Z" fill="#1A1C1E" />

            {/* Rear Wheel */}
            <g transform="translate(295, 525)">
              {/* Tire */}
              <circle cx="0" cy="0" r="30" fill="url(#tireGrad)" />
              {/* Tire Tread Depth/Shadow */}
              <circle cx="0" cy="0" r="23" fill="#000000" />
              {/* Rim */}
              <circle cx="0" cy="0" r="18" fill="url(#rimGrad)" />
              {/* Inner Rim Depth */}
              <circle cx="0" cy="0" r="12" fill="#424242" />
              {/* Hubcap */}
              <circle cx="0" cy="0" r="8" fill="#E0E0E0" />
              {/* Lug Nuts */}
              <circle cx="0" cy="-4" r="1.5" fill="#212121" />
              <circle cx="3.8" cy="-1.2" r="1.5" fill="#212121" />
              <circle cx="2.4" cy="3.2" r="1.5" fill="#212121" />
              <circle cx="-2.4" cy="3.2" r="1.5" fill="#212121" />
              <circle cx="-3.8" cy="-1.2" r="1.5" fill="#212121" />
            </g>

            {/* Front Wheel */}
            <g transform="translate(545, 525)">
              {/* Tire */}
              <circle cx="0" cy="0" r="30" fill="url(#tireGrad)" />
              {/* Tire Tread Depth/Shadow */}
              <circle cx="0" cy="0" r="23" fill="#000000" />
              {/* Rim */}
              <circle cx="0" cy="0" r="18" fill="url(#rimGrad)" />
              {/* Inner Rim Depth */}
              <circle cx="0" cy="0" r="12" fill="#424242" />
              {/* Hubcap */}
              <circle cx="0" cy="0" r="8" fill="#E0E0E0" />
              {/* Lug Nuts */}
              <circle cx="0" cy="-4" r="1.5" fill="#212121" />
              <circle cx="3.8" cy="-1.2" r="1.5" fill="#212121" />
              <circle cx="2.4" cy="3.2" r="1.5" fill="#212121" />
              <circle cx="-2.4" cy="3.2" r="1.5" fill="#212121" />
              <circle cx="-3.8" cy="-1.2" r="1.5" fill="#212121" />
            </g>
          </svg>
        </div>

        {/* ========================================================= */}
        {/* 5. DYNAMIC 5-STEP STEPPER & ROTATING WHOLESALE STATUS     */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-1 flex flex-col items-center justify-center animate-fade-in">
            {/* Dynamic 5-Step Stepper Line */}
            <div className="relative flex items-center justify-between w-52 mb-3">
              {/* Base Inactive Grey Track */}
              <div className="absolute top-1/2 left-0 right-0 h-[2.5px] -translate-y-1/2 bg-[#cbd5e1] z-0" />

              {/* Dynamic Animated Green Progress Fill */}
              <div
                className="absolute top-1/2 left-0 h-[2.5px] -translate-y-1/2 bg-[#22c55e] z-0 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Dynamic Animated Progress Nodes */}
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
