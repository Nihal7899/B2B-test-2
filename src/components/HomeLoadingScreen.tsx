import { useEffect } from 'react';
import { AppLoader } from '@/components/AppLoader';

interface HomeLoadingScreenProps {
  isReady?: boolean;
  onFinish?: () => void;
}

export function HomeLoadingScreen({ isReady = false, onFinish }: HomeLoadingScreenProps) {
  
  // 1. Immediately fire onFinish without any timers
  useEffect(() => {
    if (isReady && onFinish) {
      onFinish();
    }
  }, [isReady, onFinish]);

  // 2. Instantly drop the heavy SVG loader from the DOM.
  // No fading, no pointer-events-none. This guarantees the GPU 
  // only renders the HomeScreen when you start scrolling.
  if (isReady) return null;

  return (
    <AppLoader
      fullScreen={true}
      size="lg"
      showStatus={true}
      type="home"
      className="opacity-100"
    />
  );
}
