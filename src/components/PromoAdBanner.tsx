import React, { useMemo } from 'react';
import type { PromoBanner } from '@/types';

interface PromoAdBannerProps {
  banner: PromoBanner;
  onAction?: (banner: PromoBanner) => void;
  className?: string;
}

export const PromoAdBanner = React.memo(function PromoAdBanner({
  banner,
  onAction,
  className = 'mx-4',
}: PromoAdBannerProps) {
  const promoCode = (banner.actionConfig?.promoCode as string) || '';
  const discount = (banner.actionConfig?.discount as string) || '';

  const titleColor = (banner.actionConfig?.titleColor as string) || '#ffffff';
  const descColor = (banner.actionConfig?.descColor as string) || '#ffffff';
  const badgeBg = (banner.actionConfig?.badgeBg as string) || '';
  const badgeColor = (banner.actionConfig?.badgeColor as string) || '#facc15';
  const promoCodeBg = (banner.actionConfig?.promoCodeBg as string) || '';
  const promoCodeColor = (banner.actionConfig?.promoCodeColor as string) || '#ffffff';
  const discountColor = (banner.actionConfig?.discountColor as string) || '#ffffff';

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
      className={`rounded-2xl overflow-hidden relative min-h-[110px] shadow-sm p-4 flex flex-col justify-center cursor-pointer ${tailwindBgClass} ${className}`}
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

      <div className="relative z-10 space-y-1">
        {banner.badge && (
          <div>
            <span
              className="text-[10px] font-black tracking-wider uppercase inline-block px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: badgeBg || 'rgba(0, 0, 0, 0.3)',
                color: badgeColor,
              }}
            >
              {banner.badge}
            </span>
          </div>
        )}
        <h3
          className="text-base sm:text-lg font-black leading-tight whitespace-pre-line break-words drop-shadow-xs"
          style={{ color: titleColor }}
        >
          {banner.headline}
        </h3>

        {(promoCode || discount) && (
          <div className="flex items-center gap-2.5 pt-1">
            {promoCode && (
              <span
                className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold tracking-wider border border-white/20 bg-black/25 shadow-xs"
                style={{
                  backgroundColor: promoCodeBg || 'rgba(0, 0, 0, 0.25)',
                  color: promoCodeColor,
                }}
              >
                {promoCode}
              </span>
            )}
            {discount && (
              <span className="text-xs font-bold" style={{ color: discountColor }}>
                {discount}
              </span>
            )}
          </div>
        )}

        {banner.subtext && (
          <p className="text-xs opacity-90 pt-0.5 whitespace-pre-line break-words" style={{ color: descColor }}>
            {banner.subtext}
          </p>
        )}
      </div>
    </div>
  );
});