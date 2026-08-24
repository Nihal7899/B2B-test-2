import React from 'react';
import { PromoBanner } from '@/types';

interface PromoAdBannerProps {
  banner: PromoBanner;
}

export const PromoAdBanner = React.memo(function PromoAdBanner({
  banner,
}: PromoAdBannerProps) {
  const promoCode = (banner.actionConfig?.promoCode as string) || 'HYPER10';
  const discount = (banner.actionConfig?.discount as string) || '10% OFF';

  let bgStyle: React.CSSProperties = {};
  let bgClass = '';

  if (banner.bgType === 'image') {
    bgStyle = {
      backgroundImage: `url(${banner.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  } else if (banner.bgType === 'color') {
    bgStyle = {
      backgroundColor: banner.bgColor || '#16a34a',
    };
  } else if (banner.bgType === 'gradient') {
    bgClass = `bg-gradient-to-r ${banner.bgGradient || 'from-brand-600 to-brand-800'}`;
  }

  const overlayStyle: React.CSSProperties = {
    backgroundColor: banner.overlayColor || '#000000',
    opacity: (banner.overlayOpacity || 50) / 100,
  };

  return (
    <div className="mx-4 rounded-2xl overflow-hidden relative min-h-[100px] shadow-card transform-gpu">
      {banner.bgType === 'gradient' ? (
        <div className={`absolute inset-0 ${bgClass}`} />
      ) : (
        <div className="absolute inset-0" style={bgStyle} />
      )}

      {banner.overlayEnabled && (
        <div className="absolute inset-0" style={overlayStyle} />
      )}

      <div className="relative z-10 p-4 flex flex-col justify-center h-full text-white">
        {banner.badge && (
          <p className="text-[10px] font-bold tracking-wider uppercase text-yellow-300">
            {banner.badge}
          </p>
        )}
        <h3 className="text-lg font-extrabold leading-tight">{banner.headline}</h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-mono font-bold tracking-wider border border-white/30">
            {promoCode}
          </span>
          <span className="text-sm font-semibold">{discount}</span>
        </div>
        <p className="text-xs opacity-80 mt-1">{banner.subtext}</p>
      </div>
    </div>
  );
});
