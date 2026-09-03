import React, { useState, useEffect } from 'react';

interface AppLoaderProps {
  message?: string;
  subtext?: string;
  messages?: string[];
  fullScreen?: boolean;
  className?: string;
}

const DEFAULT_B2B_MESSAGES = [
  'Fetching wholesale catalog...',
  'Checking real-time mandi & bulk prices...',
  'Organizing fresh stock & essentials...',
  'Preparing rapid dispatch routes...',
];

export const AppLoader = React.memo(function AppLoader({
  message,
  subtext = 'Wholesale supplies for your business',
  messages = DEFAULT_B2B_MESSAGES,
  fullScreen = true,
  className = '',
}: AppLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (message) return; // Keep fixed message if one was explicitly passed
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1300);
    return () => clearInterval(interval);
  }, [message, messages]);

  const activeMessage = message || messages[msgIndex];

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen
          ? 'fixed inset-0 z-50 px-6 animate-fade-in'
          : 'w-full py-16 px-4'
      } ${className}`}
    >
      {/* Visual Container */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Ambient Subtle Green Glow */}
        <div className="absolute h-36 w-36 rounded-full bg-emerald-100/60 blur-2xl pointer-events-none" />

        {/* Floating Cargo Badges */}
        <div className="relative h-28 w-56 flex items-center justify-center">
          {/* Item 1: Wholesale Crate (Top Left) */}
          <div className="animate-float-slow absolute -top-1 left-4 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 shadow-sm">
            <svg className="h-4 w-4 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>

          {/* Item 2: Grain / Flour Sack (Top Center) */}
          <div className="animate-float-reverse absolute -top-4 left-24 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 shadow-sm">
            <svg className="h-4 w-4 text-emerald-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
              <path d="M10 6h4" />
              <path d="M8 12c2 1 6 1 8 0" />
              <path d="M9 16c1.5.8 4.5.8 6 0" />
            </svg>
          </div>

          {/* Item 3: Edible Oil Tin (Top Right) */}
          <div className="animate-float-fast absolute -top-1 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 border border-orange-200/80 shadow-sm">
            <svg className="h-4 w-4 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="6" width="14" height="15" rx="2" />
              <path d="M9 2h6v4H9z" />
              <path d="M9 11h6" />
              <circle cx="12" cy="16" r="1.5" />
            </svg>
          </div>

          {/* Animated Delivery Van */}
          <div className="animate-truck-bob absolute bottom-2 flex items-center justify-center">
            <svg
              className="h-16 w-36 drop-shadow-md"
              viewBox="0 0 160 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Van Body (Deep Forest Green) */}
              <path
                d="M10 12C10 7.58172 13.5817 4 18 4H102C104.209 4 106 5.79086 106 8V48H10V12Z"
                fill="#02402c"
              />
              {/* Van Cabin Front */}
              <path
                d="M106 18H126.8C130.34 18 133.568 20.0718 135.074 23.3138L145.45 45.6725C146.46 47.8504 144.87 50.3333 142.47 50.3333H106V18Z"
                fill="#03543a"
              />
              {/* Windshield */}
              <path
                d="M110 22H125.5C127.35 22 129.04 23.08 129.83 24.77L137.6 40H110V22Z"
                fill="#a7f3d0"
                opacity="0.85"
              />
              {/* Modern Emerald Side Accent Stripe */}
              <rect x="10" y="32" width="96" height="4" fill="#59D9B6" />
              {/* B2B Cargo Crate Grid Texture */}
              <path
                d="M26 12V32M44 12V32M62 12V32M80 12V32"
                stroke="#046244"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              {/* Headlight */}
              <rect x="142" y="42" width="4" height="4" rx="1" fill="#fef08a" />

              {/* Rear Wheel */}
              <g className="animate-spin-wheel origin-[36px_50px]">
                <circle cx="36" cy="50" r="11" fill="#1e293b" />
                <circle cx="36" cy="50" r="6" fill="#94a3b8" />
                <circle cx="36" cy="50" r="2.5" fill="#f8fafc" />
                <line x1="36" y1="44" x2="36" y2="56" stroke="#475569" strokeWidth="1.5" />
                <line x1="30" y1="50" x2="42" y2="50" stroke="#475569" strokeWidth="1.5" />
              </g>

              {/* Front Wheel */}
              <g className="animate-spin-wheel origin-[122px_50px]">
                <circle cx="122" cy="50" r="11" fill="#1e293b" />
                <circle cx="122" cy="50" r="6" fill="#94a3b8" />
                <circle cx="122" cy="50" r="2.5" fill="#f8fafc" />
                <line x1="122" y1="44" x2="122" y2="56" stroke="#475569" strokeWidth="1.5" />
                <line x1="116" y1="50" x2="128" y2="50" stroke="#475569" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
        </div>

        {/* Speed Track / Road */}
        <div className="relative mt-0.5 h-1 w-44 overflow-hidden rounded-full bg-slate-200">
          <div className="animate-road-move h-full w-full bg-[repeating-linear-gradient(90deg,#02402c_0px,#02402c_12px,transparent_12px,transparent_22px)]" />
        </div>
      </div>

      {/* Dynamic Status Display */}
      <div className="mt-6 flex flex-col items-center text-center max-w-xs">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#02402c] animate-pulse" />
          <p className="text-sm font-extrabold text-slate-900 tracking-tight transition-all duration-300">
            {activeMessage}
          </p>
        </div>
        <p className="mt-1 text-[11px] font-medium text-slate-400">
          {subtext}
        </p>
      </div>

      <style>{`
        @keyframes truckBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-truck-bob {
          animation: truckBob 0.6s ease-in-out infinite;
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.05); }
        }
        .animate-float-slow {
          animation: floatSlow 2.2s ease-in-out infinite;
        }
        @keyframes floatFast {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.04); }
        }
        .animate-float-fast {
          animation: floatFast 1.7s ease-in-out infinite 0.4s;
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(-4px) scale(1.02); }
          50% { transform: translateY(2px) scale(0.98); }
        }
        .animate-float-reverse {
          animation: floatReverse 2s ease-in-out infinite 0.2s;
        }
        @keyframes roadMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-22px); }
        }
        .animate-road-move {
          animation: roadMove 0.4s linear infinite;
        }
        @keyframes spinWheel {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-wheel {
          animation: spinWheel 0.5s linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
});
