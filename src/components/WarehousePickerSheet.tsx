import { useState } from 'react';
import { X, Loader2, Check, Warehouse } from 'lucide-react';

export interface WarehouseOption {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface WarehousePickerSheetProps {
  warehouses: WarehouseOption[];
  selectedId: string | null;
  onSelect: (id: string) => Promise<void>;
  onClose: () => void;
}

export function WarehousePickerSheet({
  warehouses,
  selectedId,
  onSelect,
  onClose,
}: WarehousePickerSheetProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSelect = async (id: string) => {
    if (saving) return;
    setSaving(id);
    setError('');
    try {
      await onSelect(id);
      onClose();
    } catch (err: any) {
      console.error('Failed to update warehouse:', err);
      setError(err?.message || 'Could not save warehouse selection.');
      setSaving(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-5 space-y-3 max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0a382c] text-[#59D9B6] flex items-center justify-center shrink-0">
              <Warehouse size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Select warehouse</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Distances on your orders will be measured from here.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {error && <p className="text-xs text-red-500 px-1">{error}</p>}

        <div className="space-y-2 pt-1">
          {warehouses.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No warehouses configured yet.
            </p>
          ) : (
            warehouses.map((w) => {
              const selected = w.id === selectedId;
              const isSaving = saving === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  disabled={!!saving}
                  onClick={() => void handleSelect(w.id)}
                  className={`w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition ${
                    selected
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}
                  >
                    {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{w.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {w.lat.toFixed(4)}, {w.lng.toFixed(4)}
                    </p>
                  </div>
                  {isSaving && <Loader2 size={15} className="animate-spin text-emerald-700 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}