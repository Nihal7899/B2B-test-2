import React from 'react';
import { useCachedImage } from '@/lib/imageCache';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

// 1x1 transparent gif to prevent the browser from requesting an empty/broken src while waiting for cache
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

export const CachedImage = React.memo(function CachedImage({ src, alt, className, style, ...props }: CachedImageProps) {
  const cachedSrc = useCachedImage(src);

  // STRICT RULE: If the cache is still reading from IndexedDB, do NOT render the raw URL.
  // Rendering the raw URL even for 1ms triggers a network request.
  const displaySrc = cachedSrc || TRANSPARENT_PIXEL;

  return (
    <img 
      src={displaySrc} 
      alt={alt || ''} 
      className={className} 
      style={{
        ...style,
        opacity: cachedSrc ? (style?.opacity ?? 1) : 0,
        transition: 'opacity 0.2s ease-in-out'
      }}
      {...props} 
    />
  );
});
