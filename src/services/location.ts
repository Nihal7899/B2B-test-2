import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

interface PositionResult {
  latitude: number;
  longitude: number;
}

export async function getFastCurrentPosition(): Promise<PositionResult> {
  // 1. Native Capacitor Layer (iOS & Android)
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          throw new Error('Location permission denied.');
        }
      }

      // Native Fused Location Provider (Accurate to 5-15m)
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Always request fresh coordinates
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('denied')) {
        throw new Error('Location permission denied in app settings.');
      }
      console.warn('Native geolocation failed, falling back to browser API...', err);
    }
  }

  // 2. Web Browser Layer
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    // Attempt A: High-Accuracy GPS / Wi-Fi Triangulation (8s timeout)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0, // Do not use stale cache
        });
      });

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    } catch (err: any) {
      if (err.code === 1) {
        throw new Error('Location permission denied. Please enable location access in browser settings.');
      }

      // Attempt B: Standard Network Triangulation (Fast fallback)
      try {
        const fallbackPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 6000,
            maximumAge: 0,
          });
        });

        return {
          latitude: fallbackPos.coords.latitude,
          longitude: fallbackPos.coords.longitude,
        };
      } catch (fallbackErr) {
        console.warn('Network location failed:', fallbackErr);
      }
    }
  }

  throw new Error('Could not detect exact location. Please search for your address or tap on the map.');
}
