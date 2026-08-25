import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

interface PositionResult {
  latitude: number;
  longitude: number;
}

export async function getFastCurrentPosition(): Promise<PositionResult> {
  // 1. Native Capacitor App Layer
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          throw new Error('Location permission denied.');
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
      };
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('denied')) {
        throw new Error('Location permission denied in app settings.');
      }
    }
  }

  // 2. Android Chrome / Mobile Browser Layer
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      throw new Error(
        'Location requires HTTPS. If testing on mobile via local network IP, enable HTTPS or Chrome insecure origin flags.'
      );
    }

    // Step A: Fast fix (uses Wi-Fi / Google Play Services network location)
    try {
      const quickPos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 60000, // Accepts cached location up to 1 min old
        });
      });

      return {
        latitude: quickPos.coords.latitude,
        longitude: quickPos.coords.longitude,
      };
    } catch (firstErr: any) {
      if (firstErr.code === 1) {
        throw new Error('Location permission denied. Tap the lock icon in Chrome to allow location.');
      }

      // Step B: Hardware GPS attempt if network position failed
      try {
        const accuratePos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 0,
          });
        });

        return {
          latitude: accuratePos.coords.latitude,
          longitude: accuratePos.coords.longitude,
        };
      } catch (secondErr: any) {
        if (secondErr.code === 1) {
          throw new Error('Location permission denied.');
        }
        if (secondErr.code === 2) {
          throw new Error('GPS signal unavailable. Enable Google Location Accuracy in Android settings.');
        }
      }
    }
  }

  throw new Error('Location request timed out. Please tap on the map or search your address.');
}
