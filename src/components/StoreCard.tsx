// components/StoreCard.tsx
import { Store } from '@/types';
import { ChevronRight } from 'lucide-react';

interface StoreCardProps {
  store: Store;
  onClick: (store: Store) => void;
  onMouseEnter?: () => void;
}

export function StoreCard({ store, onClick, onMouseEnter }: StoreCardProps) {
  const config = store.config || {};
  const tintColor = store.primary_color || '#10b981';
  const tintOpacity = config.tintOpacity ?? 50;
  const textColor = store.text_color || '#ffffff';
  const badgeText = config.badgeText || 'STORE';
  const badgeColor = config.badgeColor || '#fbbf24';

  return (
    <button
      onClick={() => onClick(store)}
      onMouseEnter={onMouseEnter}
      className="relative h-44 w-60 shrink-0 overflow-hidden rounded-3xl text-left shadow-lg transition hover:shadow-xl active:scale-[0.98]"
      style={{
        backgroundColor: tintColor,
        opacity: tintOpacity / 100,
      }}
    >
      <img
        src={store.banner_image_url || store.image_url}
        alt={store.name}
        className="absolute inset-0 h-full w-full object-cover opacity-50"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
        <span
          className="mb-1 w-fit rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider"
          style={{ backgroundColor: badgeColor, color: tintColor }}
        >
          {badgeText}
        </span>
        <h4 className="text-lg font-extrabold leading-tight" style={{ color: textColor }}>
          {store.name}
        </h4>
        <p className="text-[11px] text-white/80">{store.description}</p>
        <span className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold" style={{ color: badgeColor }}>
          Shop now <ChevronRight size={12} />
        </span>
      </div>
    </button>
  );
}

export function StoreCarousel({ stores, onStoreClick, onPrefetch }: { 
  stores: Store[]; 
  onStoreClick: (store: Store) => void;
  onPrefetch?: (storeId: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1">
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          onClick={onStoreClick}
          onMouseEnter={() => onPrefetch?.(store.id)}
        />
      ))}
    </div>
  );
}