import { AppLoader } from '@/components/AppLoader';

export function HomeLoadingScreen() {
  return (
    <AppLoader
      fullScreen={true}
      subtext="Preparing your restaurant & retail catalog"
    />
  );
}
