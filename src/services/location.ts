import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

interface PositionResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Clean wrapper around navigator.geolocation to prevent browser hanging.
 */
function requestBrowserPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    let completed = false;

    // Timeout safety net
    const timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true;
        reject(new Error('TIMEOUT'));
      }
    }, (options.timeout || 10000) + 500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          resolve(pos);
        }
      },
      (err) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          reject(err);
        }
      },
      options
    );
  });
}

export async function getFastCurrentPosition(): Promise<PositionResult> {
  // ------------------------------------------------------------------
  // 1. NATIVE CAPACITOR APP (Android / iOS)
  // ------------------------------------------------------------------
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          throw new Error('Location permission denied in app settings.');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('denied')) {
        throw new Error('Location permission denied in app settings.');
      }
      console.warn('Native geolocation failed, attempting browser fallback...', err);
    }
  }

  // ------------------------------------------------------------------
  // 2. WEB BROWSER (Chrome, Firefox, Safari, Kiwi)
  // ------------------------------------------------------------------
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    // Check permission state in Chromium-based browsers
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'denied') {
          throw new Error('Location permission is blocked. Tap the tune/lock icon in your URL bar to allow access.');
        }
      } catch {
        // Permissions API not available; continue
      }
    }

    try {
      // 10-second window to let Android Chrome warm up Google Play Services GPS / Wi-Fi
      const pos = await requestBrowserPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000, // Accepts cached fix up to 10s old for instant load
      });

      // Filter out inaccurate ISP/City-wide approximations (> 10 km error radius)
      if (pos.coords.accuracy && pos.coords.accuracy > 10000) {
        throw new Error('Detected location is too inaccurate. Please select your address manually.');
      }

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
    } catch (err: any) {
      if (err.code === 1 || err.message === 'PERMISSION_DENIED') {
        throw new Error('Location permission denied. Please allow location access in your browser.');
      }
      if (err.message && err.message.includes('inaccurate')) {
        throw err;
      }
    }
  }

  // Pure failure: Never guesses via server IP
  throw new Error('Could not get an accurate GPS location. Please search your place or tap on the map.');
}
