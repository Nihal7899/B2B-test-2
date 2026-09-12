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
  const { timeoutMs = 30000 } = options;

  // 1. Verify permissions (Native only to prevent web crash)
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

  // 2. Location Refinement Polling
  return new Promise<LocationCoords>(async (resolve, reject) => {
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
          accuracy: bestPosition.coords.accuracy, // Lower number = better accuracy
        });
      } else {
        reject(new Error('Location request timed out. Please step outside for a clearer signal.'));
      }
    };

    // Give the device a maximum of 12 seconds to collect and refine coordinates
    fallbackTimer = setTimeout(() => {
      cleanupAndResolve();
    }, 12000); 

    try {
      watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 0, 
        },
        (position: Position | null, err: any) => {
          if (err || !position?.coords) return;

          // Compare the new accuracy against the best one we have seen so far
          // The accuracy value is in meters. (e.g., 10 is much better than 100)
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }

          // If we achieve a highly accurate indoor/outdoor lock (20 meters or tighter), 
          // stop polling immediately to save time and battery.
          if (bestPosition.coords.accuracy <= 20) {
            cleanupAndResolve();
          }
        }
      );
    } catch (err: any) {
      if (!isSettled) {
        reject(new Error(err?.message || 'Failed to start GPS service.'));
      }
    }
  });
}
