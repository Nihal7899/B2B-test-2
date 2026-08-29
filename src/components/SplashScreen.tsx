import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  // Keep the latest onFinish function without restarting the splash timer
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Show splash normally for 2.3 seconds
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 2300);

    // Total splash duration: 2.9 seconds
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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#021f1b] ${
        exiting ? 'splash-fade-out' : ''
      }`}
    >
      {/* Subtle background glow */}
      <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#38d8a3]/10 blur-[120px]" />

      {/* Logo */}
      <div className="splash-logo-in flex flex-col items-center">
        <div className="splash-float">
          <svg
            width="190"
            height="190"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="mintGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop stopColor="#7DE5C2" />
                <stop offset="1" stopColor="#36B98D" />
              </linearGradient>
            </defs>

            {/* White C */}
            <path
              d="M92 37C57 37 32 63 32 100C32 137 57 163 92 163H113V137H93C74 137 61 122 61 100C61 78 74 63 93 63H113V37H92Z"
              fill="#F8FAFC"
            />

            {/* Mint K */}
            <path
              d="M125 72L162 37H190L150 80L192 125H162L125 88V72Z"
              fill="url(#mintGradient)"
            />

            {/* Bottom part of K */}
            <path
              d="M125 98L157 135H188L125 77V98Z"
              fill="url(#mintGradient)"
            />

            {/* Minimal motion lines */}
            <rect
              x="24"
              y="153"
              width="28"
              height="8"
              rx="4"
              fill="#63D9B3"
            />
            <rect
              x="34"
              y="170"
              width="38"
              height="8"
              rx="4"
              fill="#63D9B3"
            />

            {/* Wheels */}
            <circle cx="86" cy="177" r="8" fill="#63D9B3" />
            <circle cx="128" cy="177" r="8" fill="#63D9B3" />
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="splash-word-in mt-4 text-5xl font-extrabold tracking-[-0.05em]">
          <span className="text-white">Caf</span>
          <span className="bg-gradient-to-r from-[#73E5C0] to-[#36B98D] bg-clip-text text-transparent">
            Kart
          </span>
        </h1>

        {/* Tagline */}
        <div className="splash-tag-in mt-5 flex items-center gap-3">
          <div className="h-px w-8 bg-[#49CFA5]/60" />

          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8EDCC5]">
            B2B · Simplified
          </span>

          <div className="h-px w-8 bg-[#49CFA5]/60" />
        </div>
      </div>

      {/* Bottom loading bar */}
      <div className="absolute bottom-16 h-[3px] w-32 overflow-hidden rounded-full bg-white/10">
        <div className="splash-bar h-full rounded-full bg-gradient-to-r from-[#38B98D] via-[#70E4BE] to-[#F8FAFC]" />
      </div>

      {/* Bottom text */}
      <p className="absolute bottom-7 text-[10px] font-medium tracking-wide text-[#74BBA7]">
        Wholesale made simple
      </p>
    </div>
  );
}