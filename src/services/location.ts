import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/lib/supabase';

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

      // Native Fused Location Provider (Google Play Services / CoreLocation)
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
      console.warn('Native geolocation failed, falling back...', err);
    }
  }

  // 2. Web Browser Layer (Progressive Fallback)
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    // Attempt 2A: High-Accuracy GPS (5 second hard limit)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000,
        });
      });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    } catch (err: any) {
      // If user explicitly clicked "Block", stop immediately
      if (err.code === 1) {
        throw new Error('Location permission denied in browser.');
      }

      // Attempt 2B: Low-Accuracy Fast Network/Wi-Fi Positioning
      try {
        const fallbackPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000,
          });
        });
        return {
          latitude: fallbackPos.coords.latitude,
          longitude: fallbackPos.coords.longitude,
        };
      } catch (fallbackErr) {
        console.warn('Browser network positioning failed. Trying cloud fallback...', fallbackErr);
      }
    }
  }

  // 3. Cloud Fallback: Google Geolocation API via Supabase Edge Function
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
    console.error('Cloud geolocation fallback error:', cloudErr);
  }

  throw new Error('Could not detect location automatically. Please search or pick on map.');
}
