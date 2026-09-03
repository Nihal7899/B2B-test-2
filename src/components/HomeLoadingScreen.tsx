import { AppLoader } from '@/components/AppLoader';

export function HomeLoadingScreen() {
  return (
    <AppLoader
      fullScreen={true}
      size="md"
      showStatus={true}
      subtext="Setting up live catalog & mandi rates"
    />
  );
}
