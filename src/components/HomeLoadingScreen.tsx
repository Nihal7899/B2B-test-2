import { useState, useEffect, useRef } from 'react';
import { AppLoader } from '@/components/AppLoader';

interface HomeLoadingScreenProps {
  isReady?: boolean;
  onFinish?: () => void;
}

export function HomeLoadingScreen({ isReady = false, onFinish }: HomeLoadingScreenProps) {
  const [exiting, setExiting] = useState(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (!isReady) return;

    setExiting(true);

    const doneTimer = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, 300);

    return () => clearTimeout(doneTimer);
  }, [isReady]); // <-- FIX: Removed 'exiting' from the dependency array so it doesn't cancel the timeout

  return (
    <AppLoader
      fullScreen={true}
      size="lg"
      showStatus={true}
      type="home"
      // FIX: `!opacity-0` overrides AppLoader's forwards-filled `animate-fade-in`.
      // FIX: `home-loader-exiting` freezes every infinite animation inside AppLoader
      // (city scroll, wheels, truck bounce, produce jiggle, speed lines) the instant
      // we start fading out — see the matching rule in index.css. Without this, WebKit
      // has to composite a still-animating subtree while it's also being unmounted,
      // which is what leaves the frozen ghost layer during scroll.
      className={`transition-opacity duration-300 ease-out ${
        exiting ? '!opacity-0 pointer-events-none home-loader-exiting' : 'opacity-100'
      }`}
    />
  );
}