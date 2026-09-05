import React, { useState, useEffect, useMemo } from 'react';
import type { PromoBanner, BannerSize } from '@/types';

interface TopPromoSliderProps {
  banners: PromoBanner[];
  sizeOverride?: BannerSize;
  intervalMs?: number;
  onAction?: (banner: PromoBanner) => void;
  className?: string;
}

export const TopPromoSlider = React.memo(function TopPromoSlider({
  banners,
  sizeOverride,
  intervalMs = 4500,
  onAction,
  className = 'mx-4',
}: TopPromoSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Preload all slider images into browser cache on mount
  useEffect(() => {
    if (!banners || banners.length === 0) return;

    banners.forEach((b) => {
      if (b.image && b.image.trim() !== '') {
        const img = new Image();
        img.src = b.image;
      }
    });
  }, [banners]);

  // 2. Auto-scroll interval timer
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [banners, intervalMs]);

  if (!banners || banners.length === 0) return null;

  const activeBanner = banners[currentIndex] || banners[0];
  const size = sizeOverride || activeBanner.size || 'medium';

  // Exact 1:1 Dimensions matching PromoBannerCard
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'small':
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
      className={`relative overflow-hidden rounded-2xl shadow-soft transform-gpu select-none ${sizeConfig.container} ${className}`}
    >
      {/* Stack all slides simultaneously in DOM for smooth zero-lag crossfading */}
      {banners.map((banner, index) => {
        const isActive = index === currentIndex;
        const showImage = Boolean(banner.image && banner.image.trim() !== '' && banner.bgType !== 'image');

        const titleColor = (banner.actionConfig?.titleColor as string) || '#ffffff';
        const descColor = (banner.actionConfig?.descColor as string) || '#ffffff';
        const badgeBg = (banner.actionConfig?.badgeBg as string) || '';
        const badgeColor = (banner.actionConfig?.badgeColor as string) || '#ffffff';
        const ctaBg = (banner.actionConfig?.ctaBg as string) || '#ffffff';
        const ctaColor = (banner.actionConfig?.ctaColor as string) || '#0f172a';

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

        const overlayStyle: React.CSSProperties = {
          backgroundColor: banner.overlayColor || '#000000',
          opacity: (banner.overlayOpacity ?? 40) / 100,
        };

        return (
          <div
            key={banner.id || index}
            onClick={() => isActive && onAction?.(banner)}
            className={`absolute inset-0 flex transition-opacity duration-700 ease-in-out transform-gpu will-change-[opacity] cursor-pointer ${
              isActive
                ? 'opacity-100 z-20 pointer-events-auto'
                : 'opacity-0 z-10 pointer-events-none'
            } ${tailwindBgClass}`}
          >
            {/* Background layer */}
            <div className="absolute inset-0 z-0" style={computedBgStyle} />

            {/* Text & Content */}
            <div className={`relative z-30 flex-1 h-full flex flex-col justify-between min-w-0 overflow-hidden ${sizeConfig.padding}`}>
              <div className="flex-1 overflow-hidden">
                {banner.badge && (
                  <span
                    className={`inline-block font-bold tracking-wider uppercase rounded-full backdrop-blur-xs ${sizeConfig.badge}`}
                    style={{
                      backgroundColor: badgeBg || 'rgba(255, 255, 255, 0.2)',
                      color: badgeColor,
                    }}
                  >
                    {banner.badge}
                  </span>
                )}
                <h3 className={`whitespace-pre-line ${sizeConfig.headline}`} style={{ color: titleColor }}>
                  {banner.headline}
                </h3>
                {banner.subtext && (
                  <p className={`whitespace-pre-line ${sizeConfig.subtext}`} style={{ color: descColor }}>
                    {banner.subtext}
                  </p>
                )}
              </div>

              {banner.showCta !== false && banner.cta && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) onAction?.(banner);
                  }}
                  className={`flex-shrink-0 self-start font-bold rounded-xl tap-highlight active:scale-95 transition-transform ${sizeConfig.cta}`}
                  style={{
                    backgroundColor: ctaBg,
                    color: ctaColor,
                  }}
                >
                  {banner.cta}
                </button>
              )}
            </div>

            {/* Side Image */}
            {showImage && (
              <div className={`relative z-10 shrink-0 h-full ${sizeConfig.imageWidth}`}>
                <img
                  src={banner.image}
                  alt={banner.headline}
                  loading="eager"
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
      })}

      {/* Pagination indicators for multi-ad sliders */}
      {banners.length > 1 && (
        <div className="absolute bottom-2.5 right-3 z-40 flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full backdrop-blur-xs pointer-events-none">
          {banners.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});
