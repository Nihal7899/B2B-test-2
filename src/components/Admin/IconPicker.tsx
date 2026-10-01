import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { ICON_KEYS, ICON_REGISTRY, resolveIcon } from '@/services/siteContent';

interface IconPickerProps {
  value: string;
  onChange: (key: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const Active = resolveIcon(value);

  return (
    <div>
      {label && <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#02402c] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#02402c]/5 flex items-center justify-center">
            <Active className="w-4 h-4 text-[#02402c]" />
          </div>
          <span className="text-xs font-semibold text-slate-700">{value || 'Select icon'}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Choose an icon</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={14} className="text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-6 gap-2">
              {ICON_KEYS.map((key) => {
                const Icon = ICON_REGISTRY[key];
                const isActive = key === value;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { onChange(key); setOpen(false); }}
                    title={key}
                    className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? 'border-[#02402c] bg-[#02402c]/5'
                        : 'border-slate-100 hover:border-[#89c74e] hover:bg-emerald-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#02402c]' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}