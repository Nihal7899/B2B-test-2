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
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 2400);

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
      {/* Background ambient glow */}
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#5ce5b4]/10 blur-[130px]" />

      {/* Main Logo & Text Container */}
      <div className="flex flex-col items-center justify-center px-4 select-none">
        <div className="relative flex items-center justify-center">
          <svg
            width="180"
            height="160"
            viewBox="0 0 210 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* White "C" Body */}
            <path
              d="M 130 46 L 82 46 A 36 36 0 0 0 82 118 L 120 118"
              stroke="#FFFFFF"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Mint "K" Chevron (snapped flush against the C with zero gap) */}
            <path
              d="M 164 56 L 122 108 L 164 146"
              stroke="#5CE5B4"
              strokeWidth="20"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Upper Speed Line (shifted back under the C's curve) */}
            <path
              d="M 38 134 H 66"
              stroke="#5CE5B4"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Lower Speed Line (shifted back to the left of the wheels) */}
            <path
              d="M 54 150 H 82"
              stroke="#5CE5B4"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Cart Wheels (aligned directly under the C base) */}
            <circle cx="106" cy="150" r="7" fill="#5CE5B4" />
            <circle cx="134" cy="150" r="7" fill="#5CE5B4" />
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="mt-3 flex items-center text-4xl sm:text-5xl font-black tracking-tight font-sans">
          <span className="text-white">Caf</span>
          <span className="text-[#5CE5B4]">Kart</span>
        </h1>

        {/* Tagline */}
        <div className="mt-3.5 flex items-center gap-2.5">
          <div className="h-[1.5px] w-6 sm:w-8 bg-[#5CE5B4]/80 rounded-full" />
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.32em] text-[#D3F6EB]">
            B 2 B . S I M P L I F I E D
          </span>
          <div className="h-[1.5px] w-6 sm:w-8 bg-[#5CE5B4]/80 rounded-full" />
        </div>
      </div>

      {/* Bottom Loading Progress Bar */}
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
