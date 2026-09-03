import React, { useState, useEffect } from 'react';

interface AppLoaderProps {
  message?: string;
  subtext?: string;
  messages?: string[];
  fullScreen?: boolean;
  className?: string;
}

const DEFAULT_GROCERY_MESSAGES = [
  'Picking freshest farm produce...',
  'Inspecting quality & mandi rates...',
  'Packing your bulk crates...',
  'Preparing rapid cold-chain dispatch...',
];

export const AppLoader = React.memo(function AppLoader({
  message,
  subtext = 'Direct from farms & verified wholesale brands',
  messages = DEFAULT_GROCERY_MESSAGES,
  fullScreen = true,
  className = '',
}: AppLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [message, messages]);

  const activeMessage = message || messages[msgIndex];

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen
          ? 'fixed inset-0 z-50 px-6 animate-fade-in'
          : 'w-full py-12 px-4'
      } ${className}`}
    >
      {/* Visual Centerpiece */}
      <div className="relative flex flex-col items-center justify-center w-72 h-72">
        {/* Soft Ambient Radial Glow */}
        <div className="absolute h-56 w-56 rounded-full bg-emerald-100/70 blur-3xl pointer-events-none" />

        {/* Orbit Path Guide Ring */}
        <div className="absolute h-52 w-52 rounded-full border border-dashed border-emerald-200/80 animate-spin-slow pointer-events-none" />

        {/* ------------------- FLOATING GROCERY ICONS ------------------- */}

        {/* 1. CRISP RED APPLE (Top Left) */}
        <div className="animate-item-bounce-1 absolute top-3 left-6 z-20">
          <div className="relative h-12 w-12 rounded-2xl bg-rose-50/90 p-2 shadow-md border border-rose-100 backdrop-blur-xs flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="h-8 w-8 drop-shadow-xs" fill="none">
              <defs>
                <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4d6d" />
                  <stop offset="100%" stopColor="#c9184a" />
                </linearGradient>
              </defs>
              {/* Apple Body */}
              <path
                d="M24 13C20 8 10 9 8 18C6 27 12 40 22 41C23.5 41.2 24.5 41.2 26 41C36 40 42 27 40 18C38 9 28 8 24 13Z"
                fill="url(#appleGrad)"
              />
              {/* Gloss Highlight */}
              <path
                d="M13 18C12 22 14 28 16 30"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.4"
              />
              {/* Stem */}
              <path
                d="M24 13C24 9 26 6 28 5"
                stroke="#6c584c"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Green Leaf */}
              <path
                d="M25 9C29 8 33 10 33 10C33 10 32 14 27 13C25 12.5 25 9 25 9Z"
                fill="#52b788"
              />
            </svg>
          </div>
        </div>

        {/* 2. RIPE GOLDEN BANANA (Top Right) */}
        <div className="animate-item-bounce-2 absolute top-4 right-6 z-20">
          <div className="relative h-12 w-12 rounded-2xl bg-amber-50/90 p-2 shadow-md border border-amber-100 backdrop-blur-xs flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="h-8 w-8 drop-shadow-xs" fill="none">
              <defs>
                <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffe66d" />
                  <stop offset="100%" stopColor="#f4b41a" />
                </linearGradient>
              </defs>
              {/* Banana Body */}
              <path
                d="M10 34C15 38 29 38 38 24C41 19 41 12 40 8C39 8 36 12 33 15C25 24 16 28 10 34Z"
                fill="url(#bananaGrad)"
              />
              {/* Inner Curve Ridge */}
              <path
                d="M11 32C19 34 30 30 36 18"
                stroke="#e09f3e"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* Green Top Stem */}
              <path
                d="M39 9L43 6"
                stroke="#70a040"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Dark Tip */}
              <circle cx="9.5" cy="34.5" r="1.5" fill="#582f0e" />
            </svg>
          </div>
        </div>

        {/* 3. FARM FRESH CARROT (Left Center) */}
        <div className="animate-item-bounce-3 absolute top-28 -left-1 z-20">
          <div className="relative h-12 w-12 rounded-2xl bg-orange-50/90 p-2 shadow-md border border-orange-100 backdrop-blur-xs flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="h-8 w-8 drop-shadow-xs" fill="none">
              <defs>
                <linearGradient id="carrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff9f1c" />
                  <stop offset="100%" stopColor="#e85d04" />
                </linearGradient>
              </defs>
              {/* Carrot Foliage */}
              <path
                d="M34 14L41 7M36 11L43 11M38 16L44 14"
                stroke="#2d6a4f"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Carrot Root Body */}
              <path
                d="M34 12C36 14 36 18 32 21L12 39C10 41 8 40 7 38C7 37 9 34 11 32L27 14C30 11 33 11 34 12Z"
                fill="url(#carrotGrad)"
              />
              {/* Texture Ribs */}
              <path
                d="M24 19L27 22M19 25L22 28M15 31L17 33"
                stroke="#dc2f02"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </div>
        </div>

        {/* 4. FRESH AVOCADO (Right Center) */}
        <div className="animate-item-bounce-4 absolute top-28 -right-1 z-20">
          <div className="relative h-12 w-12 rounded-2xl bg-emerald-50/90 p-2 shadow-md border border-emerald-100 backdrop-blur-xs flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="h-8 w-8 drop-shadow-xs" fill="none">
              {/* Outer Skin */}
              <path
                d="M24 6C16 6 11 16 11 26C11 35 16 42 24 42C32 42 37 35 37 26C37 16 32 6 24 6Z"
                fill="#283618"
              />
              {/* Flesh */}
              <path
                d="M24 9C18 9 14 17 14 26C14 33 18 39 24 39C30 39 34 33 34 26C34 17 30 9 24 9Z"
                fill="#c3d977"
              />
              {/* Inner Pit Rim */}
              <circle cx="24" cy="28" r="8" fill="#bc6c25" />
              {/* Pit Shading */}
              <circle cx="24" cy="28" r="6.5" fill="#603808" />
              <circle cx="22" cy="26" r="1.8" fill="white" opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* 5. FRESH DAIRY MILK BOTTLE (Bottom Right) */}
        <div className="animate-item-bounce-2 absolute bottom-5 right-8 z-20">
          <div className="relative h-11 w-11 rounded-2xl bg-sky-50/90 p-2 shadow-md border border-sky-100 backdrop-blur-xs flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="h-7 w-7 drop-shadow-xs" fill="none">
              {/* Glass Bottle Body */}
              <path
                d="M19 12V8H29V12L32 17V38C32 40.2 30.2 42 28 42H20C17.8 42 16 40.2 16 38V17L19 12Z"
                fill="#e0f2fe"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              {/* Milk Liquid */}
              <path
                d="M17 23C17 23 20 22 24 22C28 22 31 23 31 23V38C31 39.5 29.8 41 28 41H20C18.2 41 17 39.5 17 38V23Z"
                fill="white"
              />
              {/* Cap */}
              <rect x="18" y="5" width="12" height="4" rx="2" fill="#0284c7" />
              {/* Fresh Drop Badge */}
              <circle cx="24" cy="31" r="3.5" fill="#38bdf8" />
              <path d="M24 29L26 32H22L24 29Z" fill="white" />
            </svg>
          </div>
        </div>

        {/* ------------------- CENTRAL MODERN TOTE BAG ------------------- */}
        <div className="relative z-10 flex flex-col items-center justify-center animate-bag-pulse">
          {/* Peeking Fresh Produce Leaves Inside Bag */}
          <div className="relative -mb-3 flex items-center justify-center gap-1">
            <div className="h-4 w-4 rounded-full bg-emerald-500 border border-emerald-600 animate-leaf-left transform -rotate-12" />
            <div className="h-5 w-3 rounded-full bg-amber-400 border border-amber-500 animate-pulse" />
            <div className="h-4 w-4 rounded-full bg-lime-400 border border-lime-500 animate-leaf-right transform rotate-12" />
          </div>

          {/* Bag Graphic */}
          <svg
            className="h-28 w-28 drop-shadow-xl"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bag Handle */}
            <path
              d="M36 40V24C36 16.268 42.268 10 50 10C57.732 10 64 16.268 64 24V40"
              stroke="#012b1e"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Bag Body (CafKart Deep Brand Emerald) */}
            <rect
              x="16"
              y="34"
              width="68"
              height="58"
              rx="14"
              fill="#02402c"
            />
            {/* Fabric Fold Gradient Overlay */}
            <path
              d="M20 34H80C82 34 84 36 84 38L80 84C80 88 76 92 72 92H28C24 92 20 88 20 84L16 38C16 36 18 34 20 34Z"
              fill="url(#bagGradient)"
              opacity="0.95"
            />
            <defs>
              <linearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#03543a" />
                <stop offset="100%" stopColor="#01291c" />
              </linearGradient>
            </defs>

            {/* Glowing Accent Brand Emblem: Sprout / Leaf */}
            <circle cx="50" cy="62" r="14" fill="#ffffff" fillOpacity="0.1" />
            <path
              d="M50 72C50 72 50 56 62 56C62 64 54 72 50 72Z"
              fill="#59D9B6"
            />
            <path
              d="M50 72C50 72 50 60 41 60C41 66 47 72 50 72Z"
              fill="#9af0d4"
            />
            <line x1="50" y1="56" x2="50" y2="73" stroke="#02402c" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Dynamic Ground Shadow */}
          <div className="h-2.5 w-24 rounded-full bg-slate-300/60 blur-xs animate-shadow-scale -mt-1" />
        </div>
      </div>

      {/* Modern Status Badge & Dynamic Text */}
      <div className="mt-4 flex flex-col items-center text-center max-w-xs">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <p className="text-xs font-black text-emerald-950 tracking-tight transition-all duration-300">
            {activeMessage}
          </p>
        </div>

        <p className="mt-2 text-[11px] font-medium text-slate-400">
          {subtext}
        </p>

        {/* Triple Micro-Pulse Dots */}
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[#02402c] animate-pulse" />
          <div className="h-1.5 w-1.5 rounded-full bg-[#59D9B6] animate-pulse [animation-delay:200ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse [animation-delay:400ms]" />
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes bagPulse {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.02); }
        }
        .animate-bag-pulse {
          animation: bagPulse 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes shadowScale {
          0%, 100% { transform: scaleX(1); opacity: 0.6; }
          50% { transform: scaleX(0.85); opacity: 0.3; }
        }
        .animate-shadow-scale {
          animation: shadowScale 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes itemBounce1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-6deg); }
        }
        .animate-item-bounce-1 {
          animation: itemBounce1 2.4s ease-in-out infinite;
        }

        @keyframes itemBounce2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(8deg); }
        }
        .animate-item-bounce-2 {
          animation: itemBounce2 2s ease-in-out infinite 0.3s;
        }

        @keyframes itemBounce3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-11px) rotate(-8deg); }
        }
        .animate-item-bounce-3 {
          animation: itemBounce3 2.6s ease-in-out infinite 0.6s;
        }

        @keyframes itemBounce4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-9px) rotate(6deg); }
        }
        .animate-item-bounce-4 {
          animation: itemBounce4 2.1s ease-in-out infinite 0.15s;
        }

        @keyframes spinSlow {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 18s linear infinite;
        }

        @keyframes leafLeft {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(-20deg) translateY(-2px); }
        }
        .animate-leaf-left {
          animation: leafLeft 2s ease-in-out infinite;
        }

        @keyframes leafRight {
          0%, 100% { transform: rotate(12deg); }
          50% { transform: rotate(22deg) translateY(-2px); }
        }
        .animate-leaf-right {
          animation: leafRight 2.2s ease-in-out infinite 0.2s;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
});
