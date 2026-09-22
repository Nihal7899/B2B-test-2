import { Geolocation, type Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

interface LocationOptions {
  timeoutMs?: number;
}

// In-memory hot cache updated continuously by the background Zomato-style watch stream
let hotCoords: LocationCoords | null = null;
let activeWatchId: string | null = null;

export function getLatestCachedCoords(): LocationCoords | null {
  return hotCoords;
}

/**
 * Starts the continuous foreground GPS stream (Zomato style).
 * Keeps the GPS hardware hot and keeps coordinates fresh in real time.
 */
export async function startContinuousLocationWatch(): Promise<void> {
  if (activeWatchId) return; // Stream already active

  try {
    if (Capacitor.isNativePlatform()) {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        return; // Don't trigger unexpected native dialog until user prompts
      }
    }

    activeWatchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      },
      (position: Position | null, err: any) => {
        if (err || !position?.coords) return;

        hotCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
      }
    );
  } catch (error) {
    console.warn('Could not start continuous GPS stream:', error);
  }
}

/**
 * Stops the continuous GPS stream to free up hardware resources when not needed.
 */
export async function stopContinuousLocationWatch(): Promise<void> {
  if (activeWatchId) {
    try {
      await Geolocation.clearWatch({ id: activeWatchId });
    } catch {
      /* ignore */
    }
    activeWatchId = null;
  }
}

/**
 * Retrieves the device location.
 * Resolves instantly if the continuous stream already has fresh coordinates.
 */
export async function getFastCurrentPosition(
  options: LocationOptions = {}
): Promise<LocationCoords> {
  const { timeoutMs = 30000 } = options;

  // 1. Instant check: If continuous watch has hot coordinates (< 2 minutes old), return immediately!
  if (hotCoords && Date.now() - (hotCoords.timestamp || 0) < 120000) {
    return hotCoords;
  }

  // 2. Check native permissions
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

  // 3. Fallback request with strict 30s timeout ceiling
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
        } catch {
          /* ignore */
        }
      }

      if (bestPosition) {
        const result: LocationCoords = {
          latitude: bestPosition.coords.latitude,
          longitude: bestPosition.coords.longitude,
          accuracy: bestPosition.coords.accuracy,
          timestamp: Date.now(),
        };
        hotCoords = result; // Update cache
        resolve(result);
      } else {
        reject(new Error('Location request timed out (30s). Please ensure GPS is enabled.'));
      }
    };

    fallbackTimer = setTimeout(() => {
      cleanupAndResolve();
    }, timeoutMs);

    try {
      watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 60000,
        },
        (position: Position | null, err: any) => {
          if (isSettled) return;
          if (err || !position?.coords) return;

          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }

          if (bestPosition.coords.accuracy <= 25) {
            cleanupAndResolve();
          }
        }
      );
    } catch (err: any) {
      if (!isSettled) {
        clearTimeout(fallbackTimer);
        reject(new Error(err?.message || 'Failed to start GPS service.'));
      }
    }
  });
}
