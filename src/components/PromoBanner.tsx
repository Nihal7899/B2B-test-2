import React from 'react';
import type { PromoBanner, BannerSize } from '@/types';
import { PromoActionBanner } from '@/components/PromoActionBanner';

interface PromoBannerCardProps {
  banner: PromoBanner;
  size?: BannerSize;
  onAction?: (banner: PromoBanner) => void;
  className?: string;
}

export const PromoBannerCard = React.memo(function PromoBannerCard({
  banner,
  size,
  onAction,
  className = '',
}: PromoBannerCardProps) {
  return (
    <PromoActionBanner
      banner={banner}
      sizeOverride={size}
      onAction={onAction}
      className={className}
    />
  );
});

export const PromoCarousel = React.memo(function PromoCarousel({
  banners,
  onAction,
}: {
  banners: PromoBanner[];
  onAction?: (banner: PromoBanner) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch px-4 pb-1 transform-gpu">
      {banners.map((banner) => (
        <div key={banner.id} className="shrink-0 w-[85%] max-w-[340px]">
          <PromoBannerCard banner={banner} onAction={onAction} />
        </div>
      ))}
    </div>
  );
});
