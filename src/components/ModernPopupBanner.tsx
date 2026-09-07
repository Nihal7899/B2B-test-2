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

      {/* Content Wrapper - Reduced padding (px-5, pb-5, pt-6) to maximize image space */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pb-5 pt-5 items-center text-center h-full">
        
        {/* Shorter Spacer for the Close (X) button */}
        <div className="h-4 w-full shrink-0" />

        {/* 1. Top Section: Text Content (min-w-0 is required for truncate to work properly) */}
        <div className="flex flex-col items-center shrink-0 w-full min-w-0 px-1">
          {banner.badge && (
            <span
              className="inline-block text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-1.5 shadow-sm shrink-0"
              style={{
                backgroundColor: badgeBg || 'rgba(255, 255, 255, 0.2)',
                color: badgeColor,
              }}
            >
              {banner.badge}
            </span>
          )}

          {/* Headline - Truncates to 1 line if image is present */}
          <h3
            className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight w-full shrink-0 ${
              showHeroImage ? 'truncate mb-1' : 'whitespace-pre-line mb-2.5'
            }`}
            style={{ color: titleColor }}
          >
            {banner.headline}
          </h3>

          {/* Subtext - Truncates to 1 line if image is present */}
          {banner.subtext && (
            <p
              className={`text-sm sm:text-base leading-relaxed opacity-90 w-full shrink-0 ${
                showHeroImage ? 'truncate' : 'whitespace-pre-line max-w-[95%]'
              }`}
              style={{ color: descColor }}
            >
              {banner.subtext}
            </p>
          )}
        </div>

        {/* 2. Middle Section: Full-Width Flexible Image Container */}
        {showHeroImage ? (
          <div className="flex-1 w-full flex items-center justify-center min-h-0 my-3 overflow-hidden">
            {/* Removed aspect-square and fixed heights. Let it expand completely to w-full */}
            <div className="w-full h-full flex items-center justify-center bg-transparent">
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
          <div className="flex-1 min-h-[16px]" />
        )}

        {/* 3. Bottom Section: CTA Button */}
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
