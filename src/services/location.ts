import { Geolocation, type Position } from '@capacitor/geolocation';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface LocationOptions {
  /** Maximum wait time before giving up. Default is 30,000ms (30 seconds). */
  timeoutMs?: number;
  /** Desired accuracy in meters to instantly accept without waiting for refinement. */
  desiredAccuracy?: number;
}

/**
 * Retrieves the device's location with a 30-second safety ceiling.
 * Resolves immediately as soon as the first valid position is received.
 */
export async function getFastCurrentPosition(
  options: LocationOptions = {}
): Promise<LocationCoords> {
  const { timeoutMs = 30000, desiredAccuracy = 100 } = options;

  // 1. Verify permissions
  let permStatus = await Geolocation.checkPermissions();
  if (permStatus.location !== 'granted' && permStatus.coarseLocation !== 'granted') {
    permStatus = await Geolocation.requestPermissions();
    if (permStatus.location !== 'granted' && permStatus.coarseLocation !== 'granted') {
      throw new Error('Location permission denied. Please grant permission in settings.');
    }
  }

  // 2. Quick check for recent OS-cached position (within last 5 mins)
  try {
    const cached = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      maximumAge: 300000,
      timeout: 1500,
    });

    if (cached?.coords?.latitude && cached?.coords?.longitude) {
      // If cached location is accurate enough, return it immediately
      if (!cached.coords.accuracy || cached.coords.accuracy <= desiredAccuracy) {
        return {
          latitude: cached.coords.latitude,
          longitude: cached.coords.longitude,
          accuracy: cached.coords.accuracy,
        };
      }
    }
  } catch {
    // No recent cache available; proceed directly to active streaming
  }

  // 3. Active Stream with 30s timeout
  return new Promise<LocationCoords>(async (resolve, reject) => {
    let watchId: string | null = null;
    let isSettled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = async () => {
      isSettled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (watchId !== null) {
        try {
          await Geolocation.clearWatch({ id: watchId });
        } catch {
          /* ignore watch cleanup errors */
        }
      }
    };

    // 30-second maximum timeout ceiling
    fallbackTimer = setTimeout(async () => {
      if (isSettled) return;
      await cleanup();
      reject(new Error('Location request timed out (30s). Please ensure GPS/Location services are enabled.'));
    }, timeoutMs);

    try {
      watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: timeoutMs,
        },
        async (position: Position | null, err) => {
          if (isSettled) return;

          if (position?.coords) {
            await cleanup();
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
            return;
          }

          if (err) {
            await cleanup();
            reject(new Error(err.message || 'Unable to retrieve location. Please check GPS settings.'));
          }
        }
      );
    } catch (err: any) {
      if (!isSettled) {
        await cleanup();
        reject(new Error(err?.message || 'Failed to start GPS service.'));
      }
    }
  });
}
