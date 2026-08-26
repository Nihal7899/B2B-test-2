// src/components/PromoBanner.tsx
import React, { useMemo } from 'react';
import type { PromoBanner, BannerSize } from '@/types';

interface PromoBannerCardProps {
  banner: PromoBanner;
  size?: BannerSize;
  onAction?: (banner: PromoBanner) => void;
  className?: string;
}

export const PromoBannerCard = React.memo(function PromoBannerCard({
  banner,
  size: sizeProp,
  onAction,
  className = '',
}: PromoBannerCardProps) {
  const size = sizeProp || banner.size || 'medium';
  const hasImage = Boolean(banner.image && banner.image.trim().length > 0 && banner.bgType !== 'image');

  const { computedBgStyle, tailwindBgClass } = useMemo(() => {
    let computedBgStyle: React.CSSProperties = {};
    let tailwindBgClass = '';

    if (banner.bgType === 'image') {
      computedBgStyle = {
        backgroundImage: `url(${banner.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    } else if (banner.bgType === 'color') {
      computedBgStyle = { backgroundColor: banner.bgColor || '#16a34a' };
    } else if (banner.bgType === 'gradient') {
      if (banner.gradientFrom && banner.gradientTo) {
        const direction = banner.gradientDirection || 'to right';
        computedBgStyle = {
          background: `linear-gradient(${direction}, ${banner.gradientFrom}, ${banner.gradientTo})`,
        };
      } else if (banner.bgGradient?.includes('linear-gradient') || banner.bgGradient?.includes('#')) {
        computedBgStyle = { background: banner.bgGradient };
      } else {
        tailwindBgClass = `bg-gradient-to-r ${banner.bgGradient || 'from-brand-600 to-brand-800'}`;
      }
    } else {
      tailwindBgClass = banner.bgClass || 'bg-gradient-to-r from-brand-600 to-brand-800';
    }

    return { computedBgStyle, tailwindBgClass };
  }, [banner]);

  const overlayStyle: React.CSSProperties = {
    backgroundColor: banner.overlayColor || '#000000',
    opacity: (banner.overlayOpacity ?? 40) / 100,
  };

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          container: 'h-[110px] min-h-[110px] p-3',
          badge: 'text-[8px] px-1.5 py-0.5 mb-1',
          headline: 'text-sm font-extrabold line-clamp-1',
          subtext: 'text-[10px] line-clamp-1 mt-0.5',
          cta: 'text-[10px] px-2.5 py-1 mt-1.5',
          imageWidth: 'w-[32%]',
          textWidth: hasImage ? 'w-[68%]' : 'w-full',
        };
      case 'large':
        return {
          container: 'h-[210px] min-h-[210px] p-5',
          badge: 'text-[10px] px-2.5 py-0.5 mb-2',
          headline: 'text-xl sm:text-2xl font-black line-clamp-2',
          subtext: 'text-xs sm:text-sm mt-1 line-clamp-2',
          cta: 'text-xs font-bold px-4 py-2 mt-3 shadow-md',
          imageWidth: 'w-[42%]',
          textWidth: hasImage ? 'w-[58%]' : 'w-full',
        };
      case 'medium':
      default:
        return {
          container: 'h-[165px] min-h-[165px] p-4',
          badge: 'text-[9px] px-2 py-0.5 mb-1.5',
          headline: 'text-[17px] font-extrabold leading-tight line-clamp-2',
          subtext: 'text-[11px] opacity-90 mt-1 leading-snug line-clamp-2',
          cta: 'text-xs font-bold px-3.5 py-1.5 mt-2 shadow-sm',
          imageWidth: 'w-[40%]',
          textWidth: hasImage ? 'w-[60%]' : 'w-full',
        };
    }
  }, [size, hasImage]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl flex text-white shadow-soft transform-gpu ${sizeClasses.container} ${tailwindBgClass} ${className}`}
      style={computedBgStyle}
    >
      {banner.overlayEnabled && (
        <div className="absolute inset-0 z-10 pointer-events-none" style={overlayStyle} />
      )}

      {/* Dynamic text container expanding to 100% width when no image */}
      <div className={`relative z-20 flex flex-col justify-between overflow-hidden ${sizeClasses.textWidth}`}>
        <div className="flex-1 overflow-hidden">
          {banner.badge && (
            <span className={`inline-block font-bold tracking-wider uppercase bg-white/20 rounded-full ${sizeClasses.badge}`}>
              {banner.badge}
            </span>
          )}
          <h3 className={`tracking-tight text-white ${sizeClasses.headline}`}>
            {banner.headline}
          </h3>
          {banner.subtext && (
            <p className={`text-white/90 ${sizeClasses.subtext}`}>
              {banner.subtext}
            </p>
          )}
        </div>

        {banner.showCta !== false && banner.cta && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(banner);
            }}
            className={`flex-shrink-0 self-start bg-white text-ink-900 rounded-lg tap-highlight active:scale-95 transition-transform ${sizeClasses.cta}`}
          >
            {banner.cta}
          </button>
        )}
      </div>

      {hasImage && (
        <div className={`relative z-10 shrink-0 h-full ${sizeClasses.imageWidth}`}>
          <img
            src={banner.image}
            alt={banner.headline}
            decoding="async"
            className="h-full w-full object-cover rounded-r-xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
});

export const PromoCarousel = React.memo(function PromoCarousel({
  banners,
  size,
  onAction,
}: {
  banners: PromoBanner[];
  size?: BannerSize;
  onAction?: (banner: PromoBanner) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1 transform-gpu">
      {banners.map((banner) => (
        <div key={banner.id} className="shrink-0 w-[85%] max-w-[340px]">
          <PromoBannerCard banner={banner} size={size} onAction={onAction} />
        </div>
      ))}
    </div>
  );
});
