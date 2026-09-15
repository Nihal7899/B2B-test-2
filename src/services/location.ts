import { Geolocation, type Position } from '@capacitor/geolocation';
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
  // Enforce 30-second timeout strictly as requested
  const { timeoutMs = 30000 } = options; 

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
      console.warn('Native permission check bypassed:', err);
    }
  }

  return new Promise<LocationCoords>((resolve, reject) => {
    let watchId: string | null = null;
    let bestPosition: Position | null = null;
    let isSettled = false;
    let fallbackTimer: ReturnType<typeof setTimeout>;

    const cleanupAndResolve = async () => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(fallbackTimer);
      
      if (watchId !== null) {
        try {
          await Geolocation.clearWatch({ id: watchId });
        } catch { /* ignore */ }
      }

      if (bestPosition) {
        resolve({
          latitude: bestPosition.coords.latitude,
          longitude: bestPosition.coords.longitude,
          accuracy: bestPosition.coords.accuracy,
        });
      } else {
        reject(new Error('Location request timed out (30s). Please step outside for a clearer signal.'));
      }
    };

    // 30-second absolute timeout ceiling
    fallbackTimer = setTimeout(() => {
      cleanupAndResolve();
    }, timeoutMs); 

    Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0, 
      },
      (position: Position | null, err: any) => {
        if (isSettled) return;
        if (err || !position?.coords) return;

        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        // Early exit if we get an excellent reading (< 20 meters)
        if (bestPosition.coords.accuracy <= 20) {
          cleanupAndResolve();
        }
      }
    ).then(id => {
      watchId = id;
      // Just in case it settled before the promise resolved
      if (isSettled) Geolocation.clearWatch({ id: watchId }).catch(() => {});
    }).catch(() => {
      // Ignore initial setup errors and let the 30s timer handle the timeout rejection
    });
  });
}
