import React, { useMemo, useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import type { PromoBanner } from '@/types';

interface ModernPopupBannerProps {
  banner: PromoBanner;
  onAction?: (banner: PromoBanner) => void;
  onDismiss?: () => void;
  className?: string;
}

export const ModernPopupBanner = React.memo(function ModernPopupBanner({
  banner,
  onAction,
  onDismiss,
  className = '',
}: ModernPopupBannerProps) {
  const titleColor = (banner.actionConfig?.titleColor as string) || '#ffffff';
  const descColor = (banner.actionConfig?.descColor as string) || '#ffffff';
  const badgeBg = (banner.actionConfig?.badgeBg as string) || '';
  const badgeColor = (banner.actionConfig?.badgeColor as string) || '#ffffff';
  const ctaBg = (banner.actionConfig?.ctaBg as string) || '#ffffff';
  const ctaColor = (banner.actionConfig?.ctaColor as string) || '#0f172a';

  // Feature toggles stored in actionConfig
  const isTimerEnabled = Boolean(banner.actionConfig?.enableTimer);
  const isAnimationEnabled = banner.actionConfig?.enableAnimation !== false;

  const showHeroImage = Boolean(banner.image && banner.image.trim() !== '' && banner.bgType !== 'image');

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);

  useEffect(() => {
    if (!isTimerEnabled) return;

    // Checks scheduled end_at or timerEndDate
    const endTarget =
      (banner.actionConfig?.timerEndDate as string) ||
      (banner as any).end_at ||
      (banner as any).endAt;

    if (!endTarget) return;

    const calculateTime = () => {
      const difference = new Date(endTarget).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }
      const h = Math.floor(difference / (1000 * 60 * 60));
      const m = Math.floor((difference / (1000 * 60)) % 60);
      const s = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [isTimerEnabled, banner.actionConfig?.timerEndDate, (banner as any).end_at]);

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
      {/* GPU-optimized animations with smooth, non-clipping skew */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -6px, 0); }
        }
        @keyframes shimmerGlow {
          0% { transform: translateX(-150%) skewX(-14deg); }
          30%, 100% { transform: translateX(250%) skewX(-14deg); }
        }
        .anim-float {
          animation: floatSlow 3.2s ease-in-out infinite;
          will-change: transform;
        }
        .anim-shimmer {
          animation: shimmerGlow 4.5s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      {/* Tint Overlay */}
      {banner.overlayEnabled && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundColor: banner.overlayColor || '#000000',
            opacity: (banner.overlayOpacity ?? 40) / 100,
          }}
        />
      )}

      {/* Content Layout */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pb-4 pt-3 items-center text-center h-full">
        {/* Spacer for the Close (X) button (increased slightly to prevent timer overlap) */}
        <div className="h-7 w-full shrink-0" />

        {/* 1. Header block: Badge, Title, Description & Countdown */}
        <div className={`flex flex-col shrink-0 w-full min-w-0 px-1 ${isTimerEnabled && timeLeft ? 'items-start text-left' : 'items-center text-center'}`}>
          
          {/* Top Row: Badge & Timer (Side by Side) or just Centered Badge */}
          {isTimerEnabled && timeLeft ? (
            <div className="flex items-center justify-between w-full mb-2.5">
              {banner.badge ? (
                <span
                  className={`inline-block text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm shrink-0 ${
                    isAnimationEnabled ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: badgeBg || 'rgba(255, 255, 255, 0.2)',
                    color: badgeColor,
                  }}
                >
                  {banner.badge}
                </span>
              ) : (
                <div /> // Pushes timer to the right if no badge is present
              )}

              {/* Timer on the Top Right */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-xs text-white border border-white/15 shadow-xs shrink-0">
                <Clock size={12} className="text-amber-300" />
                <span className="text-[11px] font-mono font-bold tracking-tight">
                  Ends in {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
                </span>
              </div>
            </div>
          ) : (
            banner.badge && (
              <span
                className={`inline-block text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-1.5 shadow-sm shrink-0 ${
                  isAnimationEnabled ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: badgeBg || 'rgba(255, 255, 255, 0.2)',
                  color: badgeColor,
                }}
              >
                {banner.badge}
              </span>
            )
          )}

          <h3
            className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight w-full shrink-0 ${
              showHeroImage ? 'truncate mb-1' : 'whitespace-pre-line mb-1.5'
            }`}
            style={{ color: titleColor }}
          >
            {banner.headline}
          </h3>

          {banner.subtext && (
            <p
              className={`text-xs sm:text-sm opacity-90 w-full shrink-0 ${
                showHeroImage ? 'truncate' : 'whitespace-pre-line max-w-[95%]'
              }`}
              style={{ color: descColor }}
            >
              {banner.subtext}
            </p>
          )}
        </div>

        {/* 2. Middle Section: Image (Full width fit, gentle float) */}
        {showHeroImage ? (
          <div className="flex-1 w-full flex items-center justify-center min-h-0 my-2 overflow-hidden">
            <div className={`w-full h-full flex items-center justify-center bg-transparent ${isAnimationEnabled ? 'anim-float' : ''}`}>
              <img
                src={banner.image}
                alt={banner.headline}
                className="w-full h-full object-contain drop-shadow-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-[14px]" />
        )}

        {/* 3. Bottom Section: Action CTA with Shimmer & Dismiss link */}
        <div className="w-full shrink-0 space-y-1.5 mt-2">
          {banner.showCta !== false && banner.cta && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.(banner);
              }}
              className="relative overflow-hidden w-full py-3.5 rounded-2xl font-black text-[15px] shadow-xl active:scale-[0.98] transition-transform tap-highlight"
              style={{
                backgroundColor: ctaBg,
                color: ctaColor,
              }}
            >
              {/* Perfectly aligned shimmer sweep */}
              {isAnimationEnabled && (
                <div className="absolute -inset-y-3 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none anim-shimmer" />
              )}
              <span className="relative z-10">{banner.cta}</span>
            </button>
          )}

          {/* Secondary thumb-friendly close */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
            className="text-[11px] font-semibold opacity-60 hover:opacity-100 transition-opacity tracking-tight block mx-auto py-1"
            style={{ color: descColor }}
          >
            No thanks, maybe later
          </button>
        </div>
      </div>
    </div>
  );
});
