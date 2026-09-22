// src/components/ui/Toast.tsx
import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const bgColors = {
  success: 'bg-emerald-50 border-emerald-500 text-emerald-800',
  error: 'bg-red-50 border-red-500 text-red-800',
  warning: 'bg-amber-50 border-amber-500 text-amber-800',
  info: 'bg-blue-50 border-blue-500 text-blue-800',
};

export function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = icons[type];

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-l-4 shadow-xl backdrop-blur-md ${bgColors[type]}`}>
      <Icon size={20} className="flex-shrink-0" />
      <span className="text-xs sm:text-sm font-bold flex-1">{message}</span>
      <button onClick={onClose} className="text-ink-400 hover:text-ink-600 active:scale-90 transition">
        <X size={18} />
      </button>
    </div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto pt-[env(safe-area-inset-top,0px)] z-[500] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2 w-full">
        {children}
      </div>
    </div>
  );
}
