import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export async function setFullScreenSystemBars(isDarkIcons: boolean = true) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Top Status Bar: Transparent overlay with dynamic icon contrast
    await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    await StatusBar.setStyle({
      style: isDarkIcons ? Style.Dark : Style.Light,
    }).catch(() => {});
  } catch (err) {
    console.error('Status bar update error:', err);
  }
}
