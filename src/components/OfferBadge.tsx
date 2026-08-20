// components/OfferBadge.tsx
interface OfferBadgeProps {
  discountPercent: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string; // optional theme color (hex)
}

export function OfferBadge({ discountPercent, size = 'sm', color = '#10b981' }: OfferBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2 py-1 text-[10px]',
    lg: 'px-2.5 py-1 text-xs',
  };

  if (discountPercent <= 0) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${sizeClasses[size]}`}
      style={{
        backgroundColor: color,
        color: '#ffffff',
      }}
    >
      {discountPercent}% OFF
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    Delivered: 'bg-emerald-50 text-emerald-700',
    Processing: 'bg-amber-50 text-amber-700',
    'Out for Delivery': 'bg-sky-50 text-sky-700',
    Cancelled: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] ?? 'bg-ink-100 text-ink-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${styles[status]?.replace('text-', 'bg-').split(' ')[1] ?? 'bg-ink-400'}`} />
      {status}
    </span>
  );
}