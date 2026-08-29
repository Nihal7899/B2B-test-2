import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Keep splash visible for 2.4 seconds, then start fade out
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 2400);

    // Total duration: 2.9 seconds
    const doneTimer = window.setTimeout(() => {
      onFinishRef.current();
    }, 2900);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#011f1a] transition-opacity duration-500 ease-out ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle background ambient glow */}
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#5CE5B4]/10 blur-[140px]" />

      {/* Main Logo & Branding Container */}
      <div className="flex flex-col items-center justify-center px-4">
        {/* Exact Icon SVG */}
        <div className="relative flex items-center justify-center">
          <svg
            width="170"
            height="150"
            viewBox="0 0 240 210"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
          >
            {/* White "C" Body */}
            <path
              d="M 174 46 L 118 46 A 46 46 0 0 0 118 138 L 158 138"
              stroke="#FFFFFF"
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Mint "K" Chevron / Cart Back Angle */}
            <path
              d="M 216 64 L 166 114 L 214 162"
              stroke="#5CE5B4"
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Upper Speed Line */}
            <path
              d="M 80 142 H 104"
              stroke="#5CE5B4"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Lower Speed Line */}
            <path
              d="M 92 160 H 118"
              stroke="#5CE5B4"
              strokeWidth="8"
              strokeLinecap="round"
            />

            {/* Front Wheel */}
            <circle cx="140" cy="160" r="7.5" fill="#5CE5B4" />

            {/* Rear Wheel */}
            <circle cx="174" cy="160" r="7.5" fill="#5CE5B4" />
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="mt-3 flex items-center text-4xl sm:text-5xl font-black tracking-tight select-none font-sans">
          <span className="text-white">Caf</span>
          <span className="text-[#5CE5B4]">Kart</span>
        </h1>

        {/* Tagline */}
        <div className="mt-4 flex items-center gap-2.5">
          <div className="h-[1.5px] w-6 sm:w-8 bg-[#5CE5B4]/80 rounded-full" />
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.32em] text-[#E0F7EF] select-none">
            B 2 B . S I M P L I F I E D
          </span>
          <div className="h-[1.5px] w-6 sm:w-8 bg-[#5CE5B4]/80 rounded-full" />
        </div>
      </div>

      {/* Sleek bottom loading line */}
      <div className="absolute bottom-14 h-[3px] w-32 overflow-hidden rounded-full bg-white/10">
        <div className="splash-bar h-full rounded-full bg-gradient-to-r from-[#5CE5B4] via-[#9af0d4] to-white" />
      </div>

      {/* Footer Text */}
      <p className="absolute bottom-6 text-[10px] font-semibold tracking-wider text-[#5CE5B4]/70 uppercase">
        Wholesale made simple
      </p>
    </div>
  );
}
