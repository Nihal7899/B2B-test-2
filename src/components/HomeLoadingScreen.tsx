import { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

const LOADING_STEPS = [
  'Verifying business profile...',
  'Fetching bulk catalog & live rates...',
  'Preparing your personalized deals...',
  'Optimizing store for zero-lag browsing...',
];

export function HomeLoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#023323] px-6 select-none animate-fadeIn">
      {/* Ambient background glow */}
      <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#59D9B6]/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#59D9B6]/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center max-w-xs w-full text-center">
        {/* Pulsing Brand Icon */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute h-20 w-20 rounded-full bg-[#59D9B6]/20 animate-ping opacity-75" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#02402c] to-[#046143] border border-[#59D9B6]/30 shadow-2xl shadow-[#59D9B6]/20">
            <ShoppingBag size={34} className="text-[#59D9B6]" strokeWidth={2.2} />
            <div className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#59D9B6] text-[#023323] shadow-md">
              <Sparkles size={13} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Brand Header */}
        <h2 className="flex items-center text-3xl font-black tracking-tight font-sans">
          <span className="text-white">Caf</span>
          <span className="text-[#59D9B6]">Kart</span>
        </h2>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#D3F6EB]/70">
          Wholesale • HoReCa
        </span>

        {/* Dynamic Progress Bar */}
        <div className="mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-white/10 p-[1px]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#59D9B6] via-[#a2f7dc] to-[#59D9B6] animate-indeterminateProgressBar" />
        </div>

        {/* Cycling Step Status */}
        <p className="mt-4 h-5 text-xs font-semibold tracking-wide text-[#59D9B6]/90 transition-all duration-300">
          {LOADING_STEPS[stepIndex]}
        </p>
      </div>

      {/* Footer Tagline */}
      <div className="absolute bottom-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D3F6EB]/40">
        Setting up your catalog
      </div>

      <style>{`
        @keyframes indeterminateProgressBar {
          0% {
            transform: translateX(-100%);
            width: 50%;
          }
          50% {
            transform: translateX(50%);
            width: 75%;
          }
          100% {
            transform: translateX(200%);
            width: 50%;
          }
        }
        .animate-indeterminateProgressBar {
          animation: indeterminateProgressBar 1.4s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
