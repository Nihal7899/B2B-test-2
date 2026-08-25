import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/lib/supabase';

interface PositionResult {
  latitude: number;
  longitude: number;
}

/**
 * Uses watchPosition instead of getCurrentPosition to prevent Chrome on Android from hanging.
 */
function getBrowserPositionWatch(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    let watchId: number | null = null;
    let settled = false;

    // Hard fallback timer in case browser fails to trigger internal timeout
    const hardTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        reject(new Error('TIMEOUT'));
      }
    }, (options.timeout || 7000) + 500);

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!settled && position?.coords) {
            settled = true;
            clearTimeout(hardTimer);
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            resolve(position);
          }
        },
        (error) => {
          if (!settled) {
            settled = true;
            clearTimeout(hardTimer);
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            reject(error);
          }
        },
        options
      );
    } catch (err) {
      clearTimeout(hardTimer);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      reject(err);
    }
  });
}

export async function getFastCurrentPosition(): Promise<PositionResult> {
  // ----------------------------------------------------
  // 1. CAPACITOR NATIVE APP (Android / iOS)
  // ----------------------------------------------------
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
        timeout: 8000,
        maximumAge: 10000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('denied')) {
        throw new Error('Location permission denied in app settings.');
      }
      console.warn('Native geolocation failed, falling back to browser...', err);
    }
  }

  // ----------------------------------------------------
  // 2. MOBILE & DESKTOP BROWSERS (Chrome, Firefox, Safari)
  // ----------------------------------------------------
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    // Check permission state in Chromium-based browsers
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'denied') {
          throw new Error('Location blocked. Tap the tune/lock icon in your URL bar and allow location.');
        }
      } catch {
        // Permissions query not supported or failed; proceed to normal flow
      }
    }

    // Step 2A: Fast Network & Wi-Fi Triangulation (Resolves in <1s on Chrome)
    try {
      const quickPos = await getBrowserPositionWatch({
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 60000, // Accepts cached fix from up to 60s ago
      });

      return {
        latitude: quickPos.coords.latitude,
        longitude: quickPos.coords.longitude,
      };
    } catch (firstErr: any) {
      if (firstErr.code === 1 || firstErr.message === 'PERMISSION_DENIED') {
        throw new Error('Location permission denied. Please allow location access in your browser.');
      }

      // Step 2B: High-Accuracy GPS Attempt via active Watch
      try {
        const precisePos = await getBrowserPositionWatch({
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0,
        });

        return {
          latitude: precisePos.coords.latitude,
          longitude: precisePos.coords.longitude,
        };
      } catch (secondErr: any) {
        if (secondErr.code === 1 || secondErr.message === 'PERMISSION_DENIED') {
          throw new Error('Location permission denied.');
        }
        console.warn('Browser GPS watch failed, checking cloud fallback...', secondErr);
      }
    }
  }

  // ----------------------------------------------------
  // 3. CLOUD FALLBACK (Google Geolocation API)
  // ----------------------------------------------------
  try {
    const { data, error } = await supabase.functions.invoke('maps', {
      body: { action: 'geolocate' },
    });

    if (!error && data?.location?.lat && data?.location?.lng) {
      return {
        latitude: data.location.lat,
        longitude: data.location.lng,
      };
    }
  } catch (cloudErr) {
    console.error('Cloud geolocation fallback failed:', cloudErr);
  }

  throw new Error('Could not detect location. Please search for your area or tap on the map.');
}
