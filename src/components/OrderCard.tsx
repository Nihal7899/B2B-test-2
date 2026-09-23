import { ChevronRight, PackageCheck } from 'lucide-react';
import type { Order } from '@/types';
import { StatusBadge } from './OfferBadge';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  className?: string;
}

export function OrderCard({ order, onClick, className = '' }: OrderCardProps) {
  return (
    <div
      className={`rounded-3xl border border-emerald-900/10 bg-white p-4 shadow-[0_6px_24px_-10px_rgba(6,78,59,0.28)] ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white shadow-sm shadow-emerald-900/25">
            <PackageCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-950">{order.orderNo}</p>
            <p className="mt-0.5 text-[11px] font-medium text-emerald-900/45">
              {order.date} · {order.itemCount} items
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-emerald-900/[0.08] pt-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-900/40">
            Order total
          </p>
          <p className="mt-0.5 text-base font-extrabold text-emerald-950">
            ₹{order.total.toLocaleString('en-IN')}
          </p>
        </div>

        <button
          onClick={onClick}
          className="group flex items-center gap-1 rounded-full bg-emerald-900/[0.07] px-3 py-1.5 text-[11px] font-bold text-emerald-900 transition-all duration-200 hover:bg-emerald-900 hover:text-white active:scale-95"
        >
          View Details
          <ChevronRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}