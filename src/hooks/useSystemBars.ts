import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capawesome/capacitor-navigation-bar';
import { Capacitor } from '@capacitor/core';

export async function setFullScreenSystemBars(isDarkIcons: boolean = true) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Top Status Bar
    await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    await StatusBar.setStyle({
      style: isDarkIcons ? Style.Dark : Style.Light,
    }).catch(() => {});

    // 2. Bottom System Navigation Bar (Transparent)
    if (Capacitor.getPlatform() === 'android') {
      // Makes the navigation bar overlay the webview
      await NavigationBar.setTransparency({ isTransparent: true }).catch(() => {});
      // Sets the actual background color to transparent
      await NavigationBar.setColor({ color: '#00000000' }).catch(() => {});
    }
  } catch (err) {
    console.error('System bars update error:', err);
  }
}
