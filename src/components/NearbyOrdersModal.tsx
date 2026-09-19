import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Loader2,
  MapPin,
  Navigation,
  Check,
  AlertTriangle,
  Package,
  Radar,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NearbyOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  address_id: string | null;
  latitude: number | null;
  longitude: number | null;
  recipient_name: string | null;
  line1: string | null;
  city: string | null;
  postal_code: string | null;
  distance_km: number;
}

interface NearbyOrdersModalProps {
  referenceOrderId: string;
  referenceOrderNumber: string;
  driverId: string;
  driverName: string;
  onClose: () => void;
  onAssigned: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  packed: 'bg-emerald-100 text-emerald-950 border-emerald-300',
  ready_for_pickup: 'bg-sky-50 text-sky-800 border-sky-200',
};

const canBeSelected = (status: string) => status === 'packed' || status === 'ready_for_pickup';

export function NearbyOrdersModal({
  referenceOrderId,
  referenceOrderNumber,
  driverId,
  driverName,
  onClose,
  onAssigned,
}: NearbyOrdersModalProps) {
  const [nearby, setNearby] = useState<NearbyOrder[]>([]);
  const [radiusKm, setRadiusKm] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([referenceOrderId]));

  // Load nearby orders using the configured radius
  const loadNearby = async (overrideRadius?: number) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('get_nearby_packed_orders', {
        p_reference_order_id: referenceOrderId,
        p_radius_km: overrideRadius ?? null,
      });

      if (err) throw err;

      const orders: NearbyOrder[] = (data as any)?.orders ?? [];
      const usedRadius = Number((data as any)?.radius_km ?? 2);

      setNearby(orders);
      setRadiusKm(usedRadius);
    } catch (e: any) {
      console.error('Failed to load nearby orders:', e);
      setError(e?.message || 'Could not load nearby orders.');
      setNearby([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceOrderId]);

  const toggleSelection = (id: string, status: string) => {
    if (!canBeSelected(status)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableCount = useMemo(
    () => nearby.filter((o) => canBeSelected(o.status)).length,
    [nearby]
  );

  const handleApplyRadius = () => {
    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 100) return;
    setSelectedIds(new Set([referenceOrderId]));
    void loadNearby(radiusKm);
  };

  const handleBatchAssign = async () => {
    const idsToAssign = Array.from(selectedIds);
    if (idsToAssign.length === 0) {
      setError('Select at least one order to assign.');
      return;
    }

    setAssigning(true);
    setError('');

    try {
      const { data, error: err } = await supabase.rpc('assign_driver_batch', {
        p_order_ids: idsToAssign,
        p_driver_id: driverId,
      });

      if (err) throw err;

      const totalAssigned = Number((data as any)?.total_assigned ?? 0);
      const totalSkipped = Number((data as any)?.total_skipped ?? 0);

      if (totalAssigned === 0) {
        setError(`No orders assigned. ${totalSkipped} skipped.`);
        setAssigning(false);
        return;
      }

      onAssigned();
      onClose();

      if (totalSkipped > 0) {
        console.warn('[NearbyOrdersModal] Some orders were skipped:', (data as any)?.skipped);
      }
    } catch (e: any) {
      console.error('Batch assign failed:', e);
      setError(e?.message || 'Batch assignment failed.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0a382c] text-[#59D9B6] flex items-center justify-center">
              <Radar size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Find nearby orders</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Around <span className="font-bold">{referenceOrderNumber}</span> · Assign multiple
                orders to <span className="font-bold text-emerald-800">{driverName}</span> in one go
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Radius controls */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Radius
          </span>
          <input
            type="number"
            min={0.5}
            max={100}
            step={0.5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-24 h-9 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-[#0a382c]"
          />
          <span className="text-xs font-bold text-slate-500">km</span>
          <button
            onClick={handleApplyRadius}
            disabled={loading}
            className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black disabled:opacity-50"
          >
            Apply
          </button>
          <span className="ml-auto text-[11px] font-bold text-slate-400">
            {selectableCount} order{selectableCount === 1 ? '' : 's'} in radius
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {/* Reference order card (always selected, not user-deselectable) */}
          <div className="rounded-2xl border-2 border-[#0a382c] bg-emerald-50/60 p-3 flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-[#0a382c] text-[#59D9B6] flex items-center justify-center shrink-0">
              <MapPin size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">{referenceOrderNumber}</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#0a382c] text-white">
                  Reference
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                This order will also be assigned to {driverName}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 size={26} className="animate-spin text-[#0a382c]" />
              <p className="text-xs font-bold text-slate-500">Searching nearby orders...</p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center gap-2 text-center">
              <AlertTriangle size={26} className="text-red-500" />
              <p className="text-xs font-bold text-red-700">{error}</p>
            </div>
          ) : nearby.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <Package size={30} className="text-slate-300" />
              <p className="text-xs font-bold text-slate-600">
                No orders within {radiusKm} km
              </p>
              <p className="text-[11px] text-slate-400">
                Try increasing the radius above.
              </p>
            </div>
          ) : (
            nearby.map((o) => {
              const selectable = canBeSelected(o.status);
              const selected = selectedIds.has(o.id);
              const statusClass = STATUS_STYLES[o.status] || 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={!selectable}
                  onClick={() => toggleSelection(o.id, o.status)}
                  className={`w-full text-left rounded-2xl border p-3 flex items-center gap-3 transition ${
                    !selectable
                      ? 'border-slate-200 bg-slate-50/60 opacity-70 cursor-not-allowed'
                      : selected
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-100'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div
                    className={`h-6 w-6 rounded-lg border flex items-center justify-center shrink-0 ${
                      !selectable
                        ? 'bg-slate-100 border-slate-200 text-slate-300'
                        : selected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selected && <Check size={13} strokeWidth={3} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{o.order_number}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusClass}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-black text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                        {o.distance_km} km
                      </span>
                      {!selectable && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Not ready
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-700 font-bold mt-1 truncate">
                      {o.recipient_name || 'Customer'} · ₹
                      {Number(o.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {[o.line1, o.city, o.postal_code].filter(Boolean).join(', ')}
                    </p>
                  </div>

                  {selectable && o.latitude && o.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0"
                      title="Open in Google Maps"
                    >
                      <Navigation size={13} />
                    </a>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={assigning}
            className="flex-1 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleBatchAssign()}
            disabled={assigning || loading || selectedIds.size === 0}
            className="flex-1 h-11 rounded-full bg-[#0a382c] hover:bg-[#082d23] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition disabled:opacity-50"
          >
            {assigning ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Assigning...
              </>
            ) : (
              <>
                <Check size={14} /> Assign {selectedIds.size} order{selectedIds.size === 1 ? '' : 's'} to {driverName}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}