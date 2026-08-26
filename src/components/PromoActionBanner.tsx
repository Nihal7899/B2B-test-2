import React, { useMemo } from 'react';
import type { PromoBanner, BannerSize } from '@/types';

interface PromoActionBannerProps {
  banner: PromoBanner;
  sizeOverride?: BannerSize;
  onAction?: (banner: PromoBanner) => void;
  className?: string;
}

export const PromoActionBanner = React.memo(function PromoActionBanner({
  banner,
  sizeOverride,
  onAction,
  className = '',
}: PromoActionBannerProps) {
  const size = sizeOverride || banner.size || 'medium';
  const hasSideImage = Boolean(banner.image && banner.image.trim() !== '' && banner.bgType !== 'image');

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
      computedBgStyle = { backgroundColor: banner.bgColor || '#10b981' };
    } else if (banner.bgType === 'gradient') {
      if (banner.gradientFrom && banner.gradientTo) {
        const direction = banner.gradientDirection || 'to right';
        computedBgStyle = {
          background: `linear-gradient(${direction}, ${banner.gradientFrom}, ${banner.gradientTo})`,
        };
      } else if (banner.bgGradient?.includes('linear-gradient') || banner.bgGradient?.includes('#')) {
        computedBgStyle = { background: banner.bgGradient };
      } else {
        tailwindBgClass = `bg-gradient-to-r ${banner.bgGradient || 'from-emerald-700 to-teal-900'}`;
      }
    }

    return { computedBgStyle, tailwindBgClass };
  }, [banner]);

  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          container: 'min-h-[92px] h-[96px] p-3',
          badge: 'text-[7px] px-1.5 py-0.5 mb-1',
          headline: 'text-xs sm:text-sm font-extrabold line-clamp-1',
          subtext: 'text-[10px] line-clamp-1 opacity-85 mt-0.5',
          cta: 'text-[9px] px-2.5 py-1 rounded-md mt-1',
          imageWidth: 'w-[30%] sm:w-[28%]',
          contentWidth: hasSideImage ? 'w-[70%] sm:w-[72%]' : 'w-full',
        };
      case 'large':
        return {
          container: 'min-h-[200px] h-[220px] p-5 sm:p-6',
          badge: 'text-[10px] px-3 py-1 mb-2',
          headline: 'text-xl sm:text-2xl font-black line-clamp-2',
          subtext: 'text-xs sm:text-sm leading-relaxed opacity-90 mt-1 line-clamp-2',
          cta: 'text-xs sm:text-sm font-black px-5 py-2.5 rounded-xl mt-3 shadow-md',
          imageWidth: 'w-[42%] sm:w-[40%]',
          contentWidth: hasSideImage ? 'w-[58%] sm:w-[60%]' : 'w-full',
        };
      case 'medium':
      default:
        return {
          container: 'min-h-[142px] h-[152px] p-4',
          badge: 'text-[8px] px-2 py-0.5 mb-1.5',
          headline: 'text-base sm:text-lg font-black line-clamp-2',
          subtext: 'text-[11px] sm:text-xs leading-snug opacity-90 mt-1 line-clamp-2',
          cta: 'text-[11px] font-bold px-3.5 py-1.5 rounded-lg mt-2 shadow-sm',
          imageWidth: 'w-[38%] sm:w-[35%]',
          contentWidth: hasSideImage ? 'w-[62%] sm:w-[65%]' : 'w-full',
        };
    }
  }, [size, hasSideImage]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl flex items-stretch text-white shadow-card transform-gpu transition-all ${sizeConfig.container} ${tailwindBgClass} ${className}`}
      style={computedBgStyle}
    >
      {banner.overlayEnabled && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundColor: banner.overlayColor || '#000000',
            opacity: (banner.overlayOpacity ?? 40) / 100,
          }}
        />
      )}

      <div className={`relative z-20 flex flex-col justify-between ${sizeConfig.contentWidth}`}>
        <div>
          {banner.badge && banner.badge.trim() !== '' && (
            <span className={`inline-block font-black uppercase tracking-wider bg-white/20 backdrop-blur-md rounded-full ${sizeConfig.badge}`}>
              {banner.badge}
            </span>
          )}
          <h3 className={`leading-tight tracking-tight text-white drop-shadow-sm whitespace-normal ${sizeConfig.headline}`}>
            {banner.headline}
          </h3>
          {banner.subtext && (
            <p className={`whitespace-normal ${sizeConfig.subtext}`}>
              {banner.subtext}
            </p>
          )}
        </div>

        {banner.showCta !== false && banner.cta && (
          <div className="flex">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.(banner);
              }}
              className={`bg-white text-slate-900 active:scale-95 transition-transform font-extrabold ${sizeConfig.cta}`}
            >
              {banner.cta}
            </button>
          </div>
        )}
      </div>

      {hasSideImage && (
        <div className={`relative ${sizeConfig.imageWidth} shrink-0 overflow-hidden z-10 flex items-center justify-center`}>
          <img
            src={banner.image}
            alt={banner.headline}
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/25 to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  );
});
