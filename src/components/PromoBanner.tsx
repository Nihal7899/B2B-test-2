// components/PromoBanner.tsx
import type { PromoBanner } from '@/types';

interface PromoBannerCardProps {
  banner: PromoBanner;
  onAction?: (banner: PromoBanner) => void;
}

export function PromoBannerCard({ banner, onAction }: PromoBannerCardProps) {
  let bgStyle: React.CSSProperties = {};
  let bgClass = '';

  if (banner.bgType === 'image') {
    bgStyle = {
      backgroundImage: `url(${banner.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  } else if (banner.bgType === 'color') {
    bgStyle = { backgroundColor: banner.bgColor || '#16a34a' };
  } else if (banner.bgType === 'gradient') {
    bgClass = `bg-gradient-to-r ${banner.bgGradient || 'from-brand-600 to-brand-800'}`;
  }

  const overlayStyle: React.CSSProperties = {
    backgroundColor: banner.overlayColor || '#000000',
    opacity: (banner.overlayOpacity || 50) / 100,
  };

  const showImage = banner.bgType !== 'image' && banner.image;

  return (
    <div className="relative overflow-hidden rounded-2xl min-h-[124px] flex text-white shadow-soft">
      {/* Background layer */}
      {banner.bgType === 'gradient' ? (
        <div className={`absolute inset-0 ${bgClass}`} />
      ) : (
        <div className="absolute inset-0" style={bgStyle} />
      )}

      {/* Right-side image (absolute, stays on the right) */}
      {showImage && (
        <div className="absolute right-0 top-0 h-full w-[42%]">
          <img
            src={banner.image}
            alt={banner.headline}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/400x400/EEE/999?text=Banner';
            }}
          />
        </div>
      )}

      {/* Tint overlay – covers background + image */}
      {banner.overlayEnabled && (
        <div className="absolute inset-0 z-10" style={overlayStyle} />
      )}

      {/* Text content – on top of everything */}
      <div className="relative z-20 flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          {banner.badge && (
            <span className="inline-block text-[9px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 mb-2">
              {banner.badge}
            </span>
          )}
          <h3 className="text-[17px] font-extrabold leading-tight tracking-tight">
            {banner.headline}
          </h3>
          <p className="text-[11px] opacity-90 mt-1 leading-snug line-clamp-2">
            {banner.subtext}
          </p>
        </div>
        {banner.showCta !== false && (
          <button
            onClick={() => onAction?.(banner)}
            className="mt-2.5 self-start bg-white text-ink-900 text-xs font-bold rounded-lg px-3.5 py-1.5 tap-highlight active:scale-95 transition-transform shadow-sm"
          >
            {banner.cta}
          </button>
        )}
      </div>
    </div>
  );
}

interface PromoCarouselProps {
  banners: PromoBanner[];
  onAction?: (banner: PromoBanner) => void;
}

export function PromoCarousel({ banners, onAction }: PromoCarouselProps) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1">
      {banners.map((banner) => (
        <div key={banner.id} className="scroll-snap-item shrink-0 w-[85%] max-w-[340px]">
          <PromoBannerCard banner={banner} onAction={onAction} />
        </div>
      ))}
    </div>
  );
}