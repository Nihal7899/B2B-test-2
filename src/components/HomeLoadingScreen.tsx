import { AppLoader } from '@/components/AppLoader';

export function HomeLoadingScreen() {
  return (
    <AppLoader
      fullScreen={true}
      size="lg"
      showStatus={true}
      subtext="Setting up live catalog & mandi rates"
    />
  );
}
