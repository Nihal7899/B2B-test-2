// src/components/ui/UploadProgress.tsx
import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number; // 0-100
  statusText: string;
}

export function UploadProgress({ progress, statusText }: UploadProgressProps) {
  return (
    <div className="fixed inset-0 z-[500] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 size={24} className="animate-spin text-brand-600" />
          <span className="text-sm font-medium text-ink-800">{statusText}</span>
        </div>
        <div className="h-2.5 w-full bg-ink-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <p className="text-xs text-ink-500 mt-2 text-right">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}