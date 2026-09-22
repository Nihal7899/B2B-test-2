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
      // FIX: Added `!opacity-0` (important modifier) to override the `animate-fade-in` forwards property
      className={`transition-opacity duration-300 ease-out ${
        exiting ? '!opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    />
  );
}
