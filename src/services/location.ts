import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface LocationOptions {
  timeoutMs?: number;
}

export async function getFastCurrentPosition(
  options: LocationOptions = {}
): Promise<LocationCoords> {
  const { timeoutMs = 30000 } = options;

  // 1. Verify permissions only on native platforms (Fixes the "not implemented in web" crash)
  if (Capacitor.isNativePlatform()) {
    try {
      let permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted' && permStatus.coarseLocation !== 'granted') {
        permStatus = await Geolocation.requestPermissions();
        if (permStatus.location !== 'granted' && permStatus.coarseLocation !== 'granted') {
          throw new Error('Location permission denied. Please grant permission in settings.');
        }
      }
    } catch (err) {
      console.warn('Native permission check bypassed or failed:', err);
    }
  }

  // 2. Strict High-Accuracy (Hardware GPS) Request
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true, // Forces true GPS satellite lock
      timeout: timeoutMs,       // 30-second ceiling
      maximumAge: 0             // Rejects old cached locations, forcing a fresh pull
    });
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (err: any) {
    // If it fails here, the 30 seconds have passed without the GPS hardware finding satellites
    throw new Error('Location request timed out. Please ensure you are outdoors or have a clear view of the sky for a GPS lock.');
  }
}
