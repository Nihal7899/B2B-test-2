// components/StoreCard.tsx
import { Store } from '@/types';
import {
  ChevronRight,
  Clock3,
  Leaf,
  ShieldCheck,
  Star,
  Store as StoreIcon,
  Truck,
  Sparkles,
} from 'lucide-react';

interface StoreCardProps {
  store: Store;
  onClick: (store: Store) => void;
  onMouseEnter?: () => void;
}

export function StoreCard({
  store,
  onClick,
  onMouseEnter,
}: StoreCardProps) {
  const config = store.config || {};

  const tintColor = store.primary_color || '#10b981';
  const badgeColor = config.badgeColor || '#fbbf24';

  // Static for now — make these dynamic later
  const rating = '4.8';
  const orders = '120+ Orders';
  const storeBadge = config.badgeText || 'STORE';

  const features = [
    {
      icon: ShieldCheck,
      title: 'Hygienic',
      subtitle: 'Packing',
    },
    {
      icon: Leaf,
      title: 'Fresh &',
      subtitle: 'Quality',
    },
    {
      icon: Clock3,
      title: 'On Time',
      subtitle: 'Delivery',
    },
  ];

  return (
    <button
      onClick={() => onClick(store)}
      onMouseEnter={onMouseEnter}
      className="group relative h-[320px] w-[250px] shrink-0 overflow-hidden rounded-[26px] bg-white text-left shadow-[0_10px_30px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.18)] active:scale-[0.985]"
    >
      {/* =========================================================
          IMAGE SECTION
      ========================================================= */}

      <div className="absolute inset-x-0 top-0 h-[180px] overflow-hidden">
        <img
          src={store.banner_image_url || store.image_url}
          alt={store.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Image shade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />

        {/* Subtle brand tint */}
        <div
          className="absolute inset-0 mix-blend-multiply opacity-20"
          style={{ backgroundColor: tintColor }}
        />

        {/* =====================================================
            RATING BADGE
        ===================================================== */}

        <div className="absolute left-3 top-3 rounded-2xl border border-white/30 bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-1">
            <Star
              size={13}
              fill="#fbbf24"
              strokeWidth={0}
              className="text-amber-400"
            />

            <span className="text-[13px] font-extrabold text-slate-900">
              {rating}
            </span>
          </div>

          <p className="mt-0.5 text-[9px] font-medium text-slate-500">
            {orders}
          </p>
        </div>

        {/* =====================================================
            STORE ICON
        ===================================================== */}

        <div
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full shadow-lg ring-4 ring-white/20"
          style={{ backgroundColor: tintColor }}
        >
          <StoreIcon
            size={19}
            strokeWidth={2.2}
            className="text-white"
          />
        </div>
      </div>

      {/* =========================================================
          CURVED WHITE CONTENT PANEL
      ========================================================= */}

      <div className="absolute inset-x-0 bottom-0 h-[170px] bg-white">
        {/* Organic curved top */}
        <div
          className="absolute -top-[36px] left-0 h-[65px] w-full"
          style={{
            background: `linear-gradient(135deg, ${tintColor} 0%, ${tintColor} 55%, rgba(255,255,255,0) 56%)`,
            clipPath: 'ellipse(78% 75% at 18% 100%)',
          }}
        />

        {/* Main white curved area */}
        <div
          className="absolute -top-[28px] left-0 h-[48px] w-full bg-white"
          style={{
            clipPath: 'ellipse(75% 70% at 20% 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 h-full px-4 pb-3 pt-1.5">
          {/* Store badge */}
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[8px] font-extrabold tracking-wide shadow-sm"
            style={{
              backgroundColor: badgeColor,
              color: tintColor,
            }}
          >
            {storeBadge}
          </span>

          {/* Store name */}
          <h4 className="mt-1 line-clamp-1 text-[19px] font-black leading-tight tracking-[-0.3px] text-slate-900">
            {store.name}
          </h4>

          {/* Description */}
          <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-slate-500">
            {store.description || 'Everything you need, all in one place'}
          </p>

          {/* =====================================================
              FEATURES
          ===================================================== */}

          <div className="mt-2.5 flex items-center justify-between rounded-2xl bg-slate-50 px-2 py-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="flex min-w-0 flex-1 items-center gap-1.5"
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${tintColor}16`,
                    }}
                  >
                    <Icon
                      size={11}
                      strokeWidth={2.3}
                      style={{ color: tintColor }}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[7px] font-bold leading-tight text-slate-800">
                      {feature.title}
                    </p>

                    <p className="truncate text-[7px] leading-tight text-slate-500">
                      {feature.subtitle}
                    </p>
                  </div>

                  {index < features.length - 1 && (
                    <div className="ml-auto h-5 w-px bg-slate-200" />
                  )}
                </div>
              );
            })}
          </div>

          {/* =====================================================
              SHOP NOW BUTTON
          ===================================================== */}

          <div
            className="mt-2.5 flex h-9 items-center justify-between rounded-xl px-3.5 text-white shadow-md transition-all duration-300 group-hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${tintColor}, ${tintColor}dd)`,
            }}
          >
            <span className="text-[11px] font-extrabold">
              Shop now
            </span>

            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
              <ChevronRight
                size={14}
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          PREMIUM FLOATING BADGE
      ========================================================= */}

      <div
        className="absolute right-3 top-[138px] z-20 flex h-[54px] w-[54px] flex-col items-center justify-center rounded-full border-[3px] border-white bg-white shadow-xl"
        style={{
          boxShadow: `0 6px 20px ${tintColor}35`,
        }}
      >
        <Sparkles
          size={11}
          style={{ color: tintColor }}
          strokeWidth={2.5}
        />

        <span
          className="mt-0.5 text-[8px] font-black leading-none"
          style={{ color: tintColor }}
        >
          PREMIUM
        </span>

        <span
          className="text-[7px] font-bold leading-none"
          style={{ color: tintColor }}
        >
          QUALITY
        </span>
      </div>
    </button>
  );
}

export function StoreCarousel({
  stores,
  onStoreClick,
  onPrefetch,
}: {
  stores: Store[];
  onStoreClick: (store: Store) => void;
  onPrefetch?: (storeId: string) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-3 no-scrollbar scroll-touch">
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