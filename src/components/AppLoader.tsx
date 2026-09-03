import React from 'react';

interface AppLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AppLoader = React.memo(function AppLoader({
  fullScreen = true,
  size = 'md',
  className = '',
}: AppLoaderProps) {
  const scaleClass =
    size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-110' : 'scale-95 sm:scale-100';

  return (
    <div
      className={`flex items-center justify-center bg-white select-none ${
        fullScreen
          ? 'fixed inset-0 z-50 animate-fade-in'
          : 'w-full py-10'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center ${scaleClass}`}>
        {/* Soft Radial Ambient Glow */}
        <div className="absolute h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />

        {/* Orbit Glow Ring */}
        <div className="absolute h-44 w-44 rounded-full border border-emerald-100/80 animate-ping-slow pointer-events-none" />

        {/* ----------------- ANIMATED PRODUCER ITEMS ----------------- */}

        {/* 1. HEIRLOOM TOMATO (Left arc into crate) */}
        <div className="absolute -top-6 left-6 z-20 animate-produce-drop-1 pointer-events-none">
          <svg viewBox="0 0 40 40" className="h-9 w-9 drop-shadow-md" fill="none">
            <defs>
              <radialGradient id="tomatoGlow" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ff5a5f" />
                <stop offset="70%" stopColor="#d90429" />
                <stop offset="100%" stopColor="#7a0016" />
              </radialGradient>
            </defs>
            {/* Tomato Body */}
            <circle cx="20" cy="22" r="14" fill="url(#tomatoGlow)" />
            {/* Gloss Reflection */}
            <path
              d="M13 15C15 13 18 13 20 14"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            {/* Stem & Calyx */}
            <path
              d="M20 9V5M16 8L20 9L24 8M18 11L20 9L22 11"
              stroke="#2d6a4f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 2. GOLDEN BANANA (Top arc flip) */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 animate-produce-drop-2 pointer-events-none">
          <svg viewBox="0 0 40 40" className="h-10 w-10 drop-shadow-md" fill="none">
            <defs>
              <linearGradient id="bananaGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff3b0" />
                <stop offset="40%" stopColor="#ffd166" />
                <stop offset="100%" stopColor="#f77f00" />
              </linearGradient>
            </defs>
            <path
              d="M8 26C13 31 25 31 32 19C34 15 34 10 33 6C32 6 30 9 27 12C20 19 13 22 8 26Z"
              fill="url(#bananaGlow)"
            />
            <path
              d="M10 24C16 26 25 24 30 14"
              stroke="#d48b00"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.5"
            />
            {/* Stalk */}
            <path d="M33 6L36 4" stroke="#588157" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* 3. HASS AVOCADO (Right arc dive) */}
        <div className="absolute -top-6 right-6 z-20 animate-produce-drop-3 pointer-events-none">
          <svg viewBox="0 0 40 40" className="h-9 w-9 drop-shadow-md" fill="none">
            <path
              d="M20 7C14 7 10 14 10 23C10 30 14 35 20 35C26 35 30 30 30 23C30 14 26 7 20 7Z"
              fill="#2b3a1a"
            />
            <path
              d="M20 9C15 9 12 15 12 23C12 29 15 33 20 33C25 33 28 29 28 23C28 15 25 9 20 9Z"
              fill="#c7d97b"
            />
            {/* Seed */}
            <circle cx="20" cy="24" r="6" fill="#79441f" />
            <circle cx="18.5" cy="22.5" r="1.5" fill="#ffffff" opacity="0.4" />
          </svg>
        </div>

        {/* 4. FARM MILK FLASK (Rear pop) */}
        <div className="absolute -top-4 left-1/3 z-10 animate-produce-drop-4 pointer-events-none">
          <svg viewBox="0 0 32 32" className="h-8 w-8 drop-shadow-xs" fill="none">
            <rect x="11" y="4" width="10" height="3" rx="1.5" fill="#0284c7" />
            <path
              d="M13 7V10L10 14V26C10 27.5 11.2 28.5 12.5 28.5H19.5C20.8 28.5 22 27.5 22 26V14L19 10V7H13Z"
              fill="#e0f2fe"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            <rect x="12" y="15" width="8" height="11" rx="1" fill="#ffffff" />
            <circle cx="16" cy="20" r="2" fill="#0ea5e9" opacity="0.8" />
          </svg>
        </div>

        {/* Sparkle Glints */}
        <div className="absolute -top-8 right-2 animate-sparkle-1 pointer-events-none">
          <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>
        <div className="absolute top-2 -left-6 animate-sparkle-2 pointer-events-none">
          <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* ----------------- CENTRAL MODERN CRATE ----------------- */}
        <div className="relative z-10 flex flex-col items-center justify-center animate-crate-jiggle mt-6">
          <svg
            className="h-24 w-32 drop-shadow-2xl"
            viewBox="0 0 128 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Interior Depth Shadow */}
            <ellipse cx="64" cy="38" rx="46" ry="16" fill="#011f15" />

            {/* Peeking Fresh Produce Top Leaves */}
            <path
              d="M52 32C46 22 34 26 34 26C34 26 38 36 48 34Z"
              fill="#10b981"
              className="animate-leaf-sway-1"
            />
            <path
              d="M76 32C82 22 94 26 94 26C94 26 90 36 80 34Z"
              fill="#34d399"
              className="animate-leaf-sway-2"
            />

            {/* Back Wall of Crate */}
            <rect x="18" y="24" width="92" height="18" rx="4" fill="#02402c" />

            {/* Crate Main Front Body */}
            <path
              d="M14 36H114L104 84C103.5 86.5 101.5 88 99 88H29C26.5 88 24.5 86.5 24 84L14 36Z"
              fill="url(#crateBodyGrad)"
            />

            {/* Modern Top Rim */}
            <rect x="10" y="32" width="108" height="10" rx="5" fill="#046243" />
            <rect x="12" y="33" width="104" height="2" rx="1" fill="#59D9B6" opacity="0.6" />

            {/* Slat Lines & Grip Slots */}
            <rect x="24" y="52" width="80" height="2" rx="1" fill="#012b1e" opacity="0.4" />
            <rect x="28" y="68" width="72" height="2" rx="1" fill="#012b1e" opacity="0.4" />

            {/* Center Handle Cutout */}
            <rect x="48" y="44" width="32" height="9" rx="4.5" fill="#011f15" />
            <rect x="50" y="45" width="28" height="2" rx="1" fill="#02402c" />

            {/* Glowing Brand Accent Leaf Badge */}
            <g transform="translate(56, 62)">
              <circle cx="8" cy="8" r="8" fill="#ffffff" fillOpacity="0.08" />
              <path
                d="M8 14C8 14 8 4 14 4C14 9 10 14 8 14Z"
                fill="#59D9B6"
              />
              <path
                d="M8 14C8 14 8 6 3 6C3 10 6 14 8 14Z"
                fill="#9af0d4"
              />
            </g>

            <defs>
              <linearGradient id="crateBodyGrad" x1="64" y1="36" x2="64" y2="88" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#03543a" />
                <stop offset="100%" stopColor="#012b1e" />
              </linearGradient>
            </defs>
          </svg>

          {/* Dynamic Ground Shadow */}
          <div className="h-2 w-24 rounded-full bg-slate-400/40 blur-xs animate-shadow-squash -mt-2" />
        </div>
      </div>

      {/* Smooth GPU Keyframe Animations */}
      <style>{`
        @keyframes crateJiggle {
          0%, 100% { transform: translateY(0) scale(1, 1); }
          30% { transform: translateY(2px) scale(1.03, 0.97); }
          60% { transform: translateY(-3px) scale(0.98, 1.02); }
        }
        .animate-crate-jiggle {
          animation: crateJiggle 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes shadowSquash {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          30% { transform: scale(1.15, 0.9); opacity: 0.7; }
          60% { transform: scale(0.85, 1); opacity: 0.3; }
        }
        .animate-shadow-squash {
          animation: shadowSquash 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes produceDrop1 {
          0% { transform: translate3d(0, -22px, 0) scale(0.6) rotate(-20deg); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translate3d(12px, 18px, 0) scale(1) rotate(5deg); }
          75% { transform: translate3d(14px, 24px, 0) scale(0.85) rotate(10deg); opacity: 0.9; }
          100% { transform: translate3d(16px, 32px, 0) scale(0.4) rotate(15deg); opacity: 0; }
        }
        .animate-produce-drop-1 {
          animation: produceDrop1 2.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }

        @keyframes produceDrop2 {
          0% { transform: translate3d(0, -26px, 0) scale(0.6) rotate(30deg); opacity: 0; }
          25% { opacity: 1; }
          55% { transform: translate3d(0, 18px, 0) scale(1) rotate(-10deg); }
          75% { transform: translate3d(0, 26px, 0) scale(0.85) rotate(-5deg); opacity: 0.9; }
          100% { transform: translate3d(0, 34px, 0) scale(0.4) rotate(0deg); opacity: 0; }
        }
        .animate-produce-drop-2 {
          animation: produceDrop2 2.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite 0.55s;
        }

        @keyframes produceDrop3 {
          0% { transform: translate3d(0, -22px, 0) scale(0.6) rotate(20deg); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translate3d(-12px, 18px, 0) scale(1) rotate(-5deg); }
          75% { transform: translate3d(-14px, 24px, 0) scale(0.85) rotate(-10deg); opacity: 0.9; }
          100% { transform: translate3d(-16px, 32px, 0) scale(0.4) rotate(-15deg); opacity: 0; }
        }
        .animate-produce-drop-3 {
          animation: produceDrop3 2.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite 1.1s;
        }

        @keyframes produceDrop4 {
          0% { transform: translate3d(0, -20px, 0) scale(0.6) rotate(-10deg); opacity: 0; }
          25% { opacity: 1; }
          55% { transform: translate3d(6px, 16px, 0) scale(0.9) rotate(5deg); }
          75% { transform: translate3d(8px, 22px, 0) scale(0.8) rotate(0deg); opacity: 0.9; }
          100% { transform: translate3d(10px, 30px, 0) scale(0.4) rotate(0deg); opacity: 0; }
        }
        .animate-produce-drop-4 {
          animation: produceDrop4 2.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite 1.65s;
        }

        @keyframes leafSway1 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }
        .animate-leaf-sway-1 {
          animation: leafSway1 2s ease-in-out infinite;
        }

        @keyframes leafSway2 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
        .animate-leaf-sway-2 {
          animation: leafSway2 2.2s ease-in-out infinite 0.3s;
        }

        @keyframes sparkle1 {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(90deg); opacity: 1; }
        }
        .animate-sparkle-1 {
          animation: sparkle1 1.6s ease-in-out infinite 0.2s;
        }

        @keyframes sparkle2 {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(-90deg); opacity: 1; }
        }
        .animate-sparkle-2 {
          animation: sparkle2 1.8s ease-in-out infinite 0.8s;
        }

        @keyframes pingSlow {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.1; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        .animate-ping-slow {
          animation: pingSlow 3s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
});
