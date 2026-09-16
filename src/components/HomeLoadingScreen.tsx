import { useState, useEffect, useRef } from 'react';
import { AppLoader } from '@/components/AppLoader';

interface HomeLoadingScreenProps {
  isReady?: boolean;
  onFinish?: () => void;
}

export function HomeLoadingScreen({ isReady = false, onFinish }: HomeLoadingScreenProps) {
  const [exiting, setExiting] = useState(false);
  const onFinishRef = useRef(onFinish);

  // Keep ref up to date to avoid dependency issues inside setTimeout
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // Wait until the app signals it's ready, and ensure we only trigger this once
    if (!isReady || exiting) return;

    setExiting(true);
    
    // Give the CSS transition time to complete before unmounting (300ms)
    const doneTimer = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, 300);

    return () => clearTimeout(doneTimer);
  }, [isReady, exiting]);

  return (
    <AppLoader
      fullScreen={true}
      size="lg"
      showStatus={true}
      type="home"
      // Merge the fade-out classes cleanly with the AppLoader's root div
      className={`transition-opacity duration-300 ease-out ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    />
  );
}
