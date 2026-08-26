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
  const showImage = Boolean(banner.image && banner.image.trim() !== '' && banner.bgType !== 'image');

  // Compute CSS Background dynamically
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

  // Dimensions & typography presets based on selected size
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
        // Previous existing middle & bottom action banner size (150px)
        return {
          container: 'h-[150px] min-h-[150px]',
          padding: 'px-4 py-3',
          badge: 'text-[9px] px-2 py-0.5 mb-1.5',
          headline: 'text-[16px] sm:text-[17px] font-extrabold leading-tight line-clamp-2',
          subtext: 'text-[11px] opacity-80 mt-0.5 line-clamp-2',
          cta: 'text-xs font-bold px-3.5 py-1.5 mt-2 shadow-sm',
          imageWidth: 'w-2/5 sm:w-[38%]',
        };
      case 'large':
        // Large hero banner format (220px)
        return {
          container: 'h-[220px] min-h-[220px]',
          padding: 'p-5 sm:p-6',
          badge: 'text-[10px] px-3 py-1 mb-2',
          headline: 'text-xl sm:text-2xl font-black leading-snug line-clamp-2',
          subtext: 'text-xs sm:text-sm opacity-90 mt-1 leading-relaxed line-clamp-2',
          cta: 'text-xs sm:text-sm font-bold px-4 py-2 mt-3 shadow-md',
          imageWidth: 'w-[45%]',
        };
      case 'medium':
      default:
        // Previous existing carousel banner size (180px)
        return {
          container: 'h-[180px] min-h-[180px]',
          padding: 'p-4',
          badge: 'text-[9px] px-2 py-0.5 mb-2',
          headline: 'text-[17px] font-extrabold leading-tight tracking-tight line-clamp-2',
          subtext: 'text-[11px] opacity-90 mt-1 leading-snug line-clamp-2',
          cta: 'text-xs font-bold px-3.5 py-1.5 mt-2 shadow-sm',
          imageWidth: 'w-[42%]',
        };
    }
  }, [size]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl flex text-white shadow-soft transform-gpu ${sizeConfig.container} ${tailwindBgClass} ${className}`}
    >
      {/* Background layer */}
      <div className="absolute inset-0 z-0" style={computedBgStyle} />

      {/* Text Content (Takes 100% full width when no image is present) */}
      <div
        className={`relative z-30 flex-1 h-full flex flex-col justify-between min-w-0 overflow-hidden ${sizeConfig.padding}`}
      >
        <div className="flex-1 overflow-hidden">
          {banner.badge && (
            <span
              className={`inline-block font-bold tracking-wider uppercase bg-white/20 rounded-full ${sizeConfig.badge}`}
            >
              {banner.badge}
            </span>
          )}
          <h3 className={`whitespace-pre-line ${sizeConfig.headline}`}>{banner.headline}</h3>
          {banner.subtext && <p className={`whitespace-pre-line ${sizeConfig.subtext}`}>{banner.subtext}</p>}
        </div>

        {banner.showCta !== false && banner.cta && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.(banner);
            }}
            className={`flex-shrink-0 self-start bg-white text-ink-900 font-bold rounded-lg tap-highlight active:scale-95 transition-transform ${sizeConfig.cta}`}
          >
            {banner.cta}
          </button>
        )}
      </div>

      {/* Side Image Container */}
      {showImage && (
        <div className={`relative z-10 shrink-0 h-full ${sizeConfig.imageWidth}`}>
          <img
            src={banner.image}
            alt={banner.headline}
            decoding="async"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Tint Overlay */}
      {banner.overlayEnabled && (
        <div className="absolute inset-0 z-20 pointer-events-none" style={overlayStyle} />
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
