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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#02201b] transition-opacity duration-500 ease-out ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#5ce5b4]/10 blur-[130px]" />

      {/* Main Logo Container */}
      <div className="flex flex-col items-center justify-center px-4 select-none">
        <div className="relative flex items-center justify-center">
          <svg
            width="170"
            height="150"
            viewBox="0 0 220 190"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* White "C" Frame */}
            <path
              d="M 136 50 L 88 50 A 38 38 0 0 0 88 126 L 122 126"
              stroke="#FFFFFF"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Mint "K" Chevron */}
            <path
              d="M 166 74 L 128 112 L 166 150"
              stroke="#5CE5B4"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Top Speed Line */}
            <path
              d="M 72 144 H 90"
              stroke="#5CE5B4"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Bottom Speed Line */}
            <path
              d="M 82 156 H 102"
              stroke="#5CE5B4"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Cart Wheels (aligned with bottom speed line) */}
            <circle cx="118" cy="156" r="7.5" fill="#5CE5B4" />
            <circle cx="146" cy="156" r="7.5" fill="#5CE5B4" />
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="mt-2 flex items-center text-4xl sm:text-5xl font-black tracking-tight font-sans">
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
