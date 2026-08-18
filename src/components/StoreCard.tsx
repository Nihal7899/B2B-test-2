// components/StoreCard.tsx
import { Store } from '@/types';
import { ChevronRight } from 'lucide-react';

interface StoreCardProps {
  store: Store;
  onClick: (store: Store) => void;
  onPrefetch?: (storeId: string) => void;
}

export function StoreCard({ store, onClick, onPrefetch }: StoreCardProps) {
  return (
    <button
      onClick={() => onClick(store)}
      onMouseEnter={() => onPrefetch?.(store.id)}
      className="relative shrink-0 w-44 rounded-2xl overflow-hidden border shadow-card tap-highlight active:scale-[0.98] transition-transform"
      style={{ borderColor: store.border_color }}
    >
      <div className="h-28 relative" style={{ backgroundColor: store.primary_color }}>
        <img src={store.image_url} alt={store.name} className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-2 left-2 text-white font-bold text-sm" style={{ color: store.text_color }}>
          {store.name}
        </div>
      </div>
      <div className="p-2 flex items-center justify-between text-xs bg-white">
        <span className="text-ink-600 truncate">{store.description}</span>
        <ChevronRight size={14} style={{ color: store.text_color }} />
      </div>
    </button>
  );
}

interface StoreCarouselProps {
  stores: Store[];
  onStoreClick: (store: Store) => void;
  onPrefetch?: (storeId: string) => void;
}

export function StoreCarousel({ stores, onStoreClick, onPrefetch }: StoreCarouselProps) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1">
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          onClick={onStoreClick}
          onPrefetch={onPrefetch}
        />
      ))}
    </div>
  );
}