import React, { useMemo } from 'react';
import type { PromoBanner } from '@/types';

interface PromoAdBannerProps {
  banner: PromoBanner;
  onAction?: (banner: PromoBanner) => void;
}

export const PromoAdBanner = React.memo(function PromoAdBanner({
  banner,
  onAction,
}: PromoAdBannerProps) {
  const promoCode = (banner.actionConfig?.promoCode as string) || '';
  const discount = (banner.actionConfig?.discount as string) || '';

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

  return (
    <div
      onClick={() => onAction?.(banner)}
      className={`mx-4 rounded-2xl overflow-hidden relative min-h-[100px] shadow-card transform-gpu p-4 flex flex-col justify-center text-white cursor-pointer ${tailwindBgClass}`}
      style={computedBgStyle}
    >
      {banner.overlayEnabled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: banner.overlayColor || '#000000',
            opacity: (banner.overlayOpacity ?? 40) / 100,
          }}
        />
      )}

      <div className="relative z-10">
        {banner.badge && (
          <p className="text-[10px] font-black tracking-wider uppercase text-yellow-300">
            {banner.badge}
          </p>
        )}
        <h3 className="text-base sm:text-lg font-black leading-tight mt-0.5 whitespace-normal break-words">
          {banner.headline}
        </h3>

        {(promoCode || discount) && (
          <div className="flex items-center gap-2.5 mt-2">
            {promoCode && (
              <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold tracking-wider border border-white/30 backdrop-blur-sm">
                {promoCode}
              </span>
            )}
            {discount && <span className="text-xs font-bold">{discount}</span>}
          </div>
        )}

        {banner.subtext && (
          <p className="text-xs opacity-90 mt-1 whitespace-normal break-words">
            {banner.subtext}
          </p>
        )}
      </div>
    </div>
  );
});