import React, { useState, useEffect } from 'react';
import { getCachedImage, memoryImageCache } from '@/lib/imageCache';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export const CachedImage = React.memo(function CachedImage({ src, alt, className, ...props }: CachedImageProps) {
  // Use memory cache instantly if available, otherwise fallback to original src while loading
  const [currentSrc, setCurrentSrc] = useState<string>(() => memoryImageCache.get(src) || src);

  useEffect(() => {
    let isMounted = true;
    
    if (src && !memoryImageCache.has(src)) {
      getCachedImage(src).then((cachedUrl) => {
        if (isMounted && cachedUrl !== src) {
          setCurrentSrc(cachedUrl);
        }
      });
    }

    return () => { isMounted = false; };
  }, [src]);

  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      className={className} 
      {...props} 
    />
  );
});
