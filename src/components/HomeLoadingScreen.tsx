import { useState, useEffect } from 'react';

const STATUS_MESSAGES = [
  'Fetching data...',
  'Loading catalog & live rates...',
  'Preparing your personalized deals...',
  'Setting up your store...',
];

export function HomeLoadingScreen() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6 select-none animate-fadeIn">
      {/* Big Circular Green Spinner */}
      <div className="relative flex items-center justify-center">
        <svg
          className="h-20 w-20 animate-spin"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Track */}
          <circle
            cx="32"
            cy="32"
            r="26"
            stroke="#e2e8f0"
            strokeWidth="5"
            className="opacity-75"
          />
          {/* Active Green Arc */}
          <circle
            cx="32"
            cy="32"
            r="26"
            stroke="#02402c"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="163"
            strokeDashoffset="115"
          />
        </svg>
      </div>

      {/* Dynamic Status Display */}
      <div className="mt-6 flex flex-col items-center text-center">
        <p className="text-base font-bold text-slate-800 tracking-tight transition-all duration-300">
          {STATUS_MESSAGES[statusIndex]}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-400">
          Please wait a moment
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
