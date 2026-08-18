import { Store } from '@/types';
import { ChevronRight, Star } from 'lucide-react';

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
      className="relative shrink-0 w-52 rounded-2xl overflow-hidden border shadow-card tap-highlight active:scale-[0.98] transition-all hover:shadow-xl"
      style={{ borderColor: store.border_color || '#e5e7eb' }}
    >
      <div className="h-32 relative" style={{ backgroundColor: store.primary_color || '#10b981' }}>
        <img src={store.image_url} alt={store.name} className="h-full w-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 text-white">
          <p className="text-sm font-bold" style={{ color: store.text_color || '#ffffff' }}>
            {store.name}
          </p>
          <p className="text-[10px] opacity-80">{store.description}</p>
        </div>
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
          <Star size={10} className="fill-amber-400 text-amber-400" />
          <span>4.8</span>
        </div>
      </div>
      <div className="p-3 flex items-center justify-between bg-white">
        <div className="flex flex-col text-left">
          <span className="text-xs font-medium text-ink-700">Shop now</span>
          <span className="text-[10px] text-ink-400">{store.product_ids?.length || 0} products</span>
        </div>
        <ChevronRight size={16} style={{ color: store.text_color || '#10b981' }} />
      </div>
    </button>
  );
}

export function StoreCarousel({ stores, onStoreClick, onPrefetch }: { stores: Store[]; onStoreClick: (store: Store) => void; onPrefetch?: (storeId: string) => void }) {
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