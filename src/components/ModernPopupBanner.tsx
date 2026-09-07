import React, { useMemo } from 'react';
import type { PromoBanner } from '@/types';

interface ModernPopupBannerProps {
  banner: PromoBanner;
  onAction?: (banner: PromoBanner) => void;
  className?: string;
}

export const ModernPopupBanner = React.memo(function ModernPopupBanner({
  banner,
  onAction,
  className = '',
}: ModernPopupBannerProps) {
  const titleColor = (banner.actionConfig?.titleColor as string) || '#ffffff';
  const descColor = (banner.actionConfig?.descColor as string) || '#ffffff';
  const badgeBg = (banner.actionConfig?.badgeBg as string) || '';
  const badgeColor = (banner.actionConfig?.badgeColor as string) || '#ffffff';
  const ctaBg = (banner.actionConfig?.ctaBg as string) || '#ffffff';
  const ctaColor = (banner.actionConfig?.ctaColor as string) || '#0f172a';

  // If there is an image, but it's NOT a full background image, show it as a centered hero graphic
  const showHeroImage = Boolean(banner.image && banner.image.trim() !== '' && banner.bgType !== 'image');

  const { computedBgStyle, tailwindBgClass } = useMemo(() => {
    let style: React.CSSProperties = {};
    let classes = '';

    if (banner.bgType === 'image') {
      style = {
        backgroundImage: `url(${banner.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    } else if (banner.bgType === 'color') {
      style = { backgroundColor: banner.bgColor || '#16a34a' };
    } else if (banner.bgType === 'gradient') {
      if (banner.gradientFrom && banner.gradientTo) {
        style = {
          background: `linear-gradient(${banner.gradientDirection || 'to bottom'}, ${banner.gradientFrom}, ${banner.gradientTo})`,
        };
      } else {
        classes = `bg-gradient-to-b ${banner.bgGradient || 'from-brand-600 to-brand-800'}`;
      }
    }
    return { computedBgStyle: style, tailwindBgClass: classes };
  }, [banner]);

  if (!banner) return null;

  return (
    <div
      className={`relative w-full h-full flex flex-col overflow-hidden ${tailwindBgClass} ${className}`}
      style={computedBgStyle}
    >
      {/* Dark/Tint Overlay */}
      {banner.overlayEnabled && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundColor: banner.overlayColor || '#000000',
            opacity: (banner.overlayOpacity ?? 40) / 100,
          }}
        />
      )}

      {/* Content Wrapper - Using full height and preventing scrolling */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pb-6 pt-10 items-center text-center h-full">
        
        {/* 1. Top Section: Text Content (Will not shrink) */}
        <div className="flex flex-col items-center shrink-0 w-full">
          {banner.badge && (
            <span
              className="inline-block text-[11px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-3 shadow-sm"
              style={{
                backgroundColor: badgeBg || 'rgba(255, 255, 255, 0.2)',
                color: badgeColor,
              }}
            >
              {banner.badge}
            </span>
          )}

          <h3
            className="text-2xl sm:text-3xl font-black leading-tight mb-2.5 whitespace-pre-line tracking-tight w-full"
            style={{ color: titleColor }}
          >
            {banner.headline}
          </h3>

          {banner.subtext && (
            <p
              className="text-sm sm:text-base leading-relaxed opacity-90 whitespace-pre-line max-w-[95%]"
              style={{ color: descColor }}
            >
              {banner.subtext}
            </p>
          )}
        </div>

        {/* 2. Middle Section: Flexible Square Image Container (No Background, No Border) */}
        {showHeroImage ? (
          <div className="flex-1 w-full flex items-center justify-center min-h-0 my-5 overflow-hidden">
            <div className="h-full max-h-[140px] sm:max-h-[180px] aspect-square flex items-center justify-center bg-transparent">
              <img
                src={banner.image}
                alt={banner.headline}
                className="w-full h-full object-contain drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        ) : (
          /* Empty flexible spacer if no image exists */
          <div className="flex-1 min-h-[20px]" />
        )}

        {/* 3. Bottom Section: CTA Button (Will not shrink) */}
        {banner.showCta !== false && banner.cta && (
          <div className="w-full shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.(banner);
              }}
              className="w-full py-3.5 rounded-2xl font-black text-[15px] shadow-xl active:scale-[0.98] transition-transform tap-highlight"
              style={{
                backgroundColor: ctaBg,
                color: ctaColor,
              }}
            >
              {banner.cta}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
