// src/components/ui/UploadProgress.tsx
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UploadProgressProps {
  progress: number;
  statusText: string;
  isComplete?: boolean;
}

export function UploadProgress({
  progress,
  statusText,
  isComplete = false,
}: UploadProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 50);
    return () => clearTimeout(timer);
  }, [progress]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayProgress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-ink-100">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                className="text-ink-100"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="80"
                cy="80"
              />
              <circle
                className="transition-all duration-300 ease-out"
                strokeWidth="6"
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="80"
                cy="80"
                stroke="url(#progressGradient)"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex items-center justify-center flex-col">
              {isComplete ? (
                <div className="bg-emerald-100 rounded-full p-3">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
              ) : (
                <span className="text-3xl font-bold text-ink-900">
                  {Math.round(displayProgress)}%
                </span>
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-ink-800">
              {isComplete ? 'Upload complete!' : statusText}
            </p>
            {!isComplete && (
              <p className="text-xs text-ink-500 mt-1">
                Please wait while we process your image
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}