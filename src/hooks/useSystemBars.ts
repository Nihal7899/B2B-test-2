import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capawesome/capacitor-navigation-bar';
import { Capacitor } from '@capacitor/core';

export async function setFullScreenSystemBars(isDarkIcons: boolean = true) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    await StatusBar.setStyle({
      style: isDarkIcons ? Style.Dark : Style.Light,
    }).catch(() => {});

    if (Capacitor.getPlatform() === 'android') {
      await NavigationBar.setTransparency({ isTransparent: true }).catch(() => {});
      await NavigationBar.setColor({ color: '#00000000' }).catch(() => {});
    }
  } catch (err) {
    console.error('System bars update error:', err);
  }
}
