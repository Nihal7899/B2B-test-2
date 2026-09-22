import { useEffect } from 'react';

interface HomeLoadingScreenProps {
  isReady?: boolean;
  onFinish?: () => void;
}

export function HomeLoadingScreen({ isReady = false, onFinish }: HomeLoadingScreenProps) {
  
  // TEMPORARY BYPASS: Instantly fire onFinish regardless of isReady
  useEffect(() => {
    if (onFinish) {
      onFinish();
    }
  }, [onFinish]);

  // Render absolutely nothing to ensure no SVG/DOM elements are left behind
  return null;
}
