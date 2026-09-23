import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search,
  MapPin,
  X,
  Loader2,
  Check,
  AlertCircle,
  Crosshair,
  ChevronLeft,
  Navigation,
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';
import { checkPointInDeliveryRange } from '@/services/catalog';
import { getFastCurrentPosition } from '@/services/location';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface LocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirm: (location: {
    latitude: number;
    longitude: number;
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    place_id: string | null;
  }) => void;
  onCancel: () => void;
}

interface PlaceSuggestion {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

interface ResolvedAddress {
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  place_id: string | null;
  formatted_address: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

/** Dark, brand-aligned map theme (soft greens, muted roads, calm water). */
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#eef4ee' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3d5c48' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#c9d8cd' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7a9a86' }],
  },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e3efe5' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#d8e9da' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5b7d67' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#c1dec5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3f6b4a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d9e6db' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#5b7d67' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#cbe1d0' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#b4d2ba' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#dfece1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bcd9e8' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a7a92' }] },
];

/* -------------------------------------------------------------------------- */
/*  Haptics helper                                                            */
/* -------------------------------------------------------------------------- */

async function triggerHaptic(style: ImpactStyle = ImpactStyle.Medium) {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(style === ImpactStyle.Light ? 8 : 15);
    }
  } catch {
    /* silently ignore — haptics are best-effort */
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function LocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onCancel,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  /** Last coords we already resolved — used to skip redundant geocodes. */
  const lastResolvedRef = useRef<{ lat: number; lng: number } | null>(null);
  /** Monotonic token — drops stale async responses that land out of order. */
  const requestTokenRef = useRef(0);

  const [mapReady, setMapReady] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyError, setKeyError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [address, setAddress] = useState<ResolvedAddress | null>(null);
  const [lat, setLat] = useState(initialLat ?? DEFAULT_LAT);
  const [lng, setLng] = useState(initialLng ?? DEFAULT_LNG);

  const [isInDeliveryRange, setIsInDeliveryRange] = useState<boolean | null>(null);
  const [checkingRange, setCheckingRange] = useState(false);
  const [rangeCheckError, setRangeCheckError] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /*  Network actions (token-guarded against stale responses)               */
  /* ---------------------------------------------------------------------- */

  const reverseGeocode = useCallback(async (latVal: number, lngVal: number, token: number) => {
    setGeocoding(true);
    setLocationError(null);
    try {
      const { data, error } = await supabase.functions.invoke('maps', {
        body: { action: 'reverse_geocode', lat: latVal, lng: lngVal },
      });
      if (token !== requestTokenRef.current) return;
      if (error) throw error;
      if (data?.address) {
        const a = data.address;
        setAddress({
          line1: a.line1 || a.formatted_address || '',
          city: a.city || '',
          state: a.state || '',
          postal_code: a.postal_code || '',
          place_id: a.place_id ?? null,
          formatted_address: a.formatted_address ?? '',
        });
      } else {
        setAddress(null);
      }
    } catch (err) {
      if (token !== requestTokenRef.current) return;
      console.error('Reverse geocode failed', err);
      setLocationError('Could not fetch address for this location.');
      setAddress(null);
    } finally {
      if (token === requestTokenRef.current) setGeocoding(false);
    }
  }, []);

  const checkDeliveryRange = useCallback(async (latVal: number, lngVal: number, token: number) => {
    setCheckingRange(true);
    setRangeCheckError(null);
    try {
      const inRange = await checkPointInDeliveryRange(latVal, lngVal);
      if (token !== requestTokenRef.current) return;
      setIsInDeliveryRange(inRange);
    } catch (err) {
      if (token !== requestTokenRef.current) return;
      console.error('Range check failed', err);
      setRangeCheckError('Could not check delivery availability.');
      setIsInDeliveryRange(null);
    } finally {
      if (token === requestTokenRef.current) setCheckingRange(false);
    }
  }, []);

  /**
   * Single entry point for "resolve whatever is under the pin now".
   * No debounce — the map's `idle` event already fires once per gesture.
   */
  const settleLocation = useCallback(
    (latVal: number, lngVal: number) => {
      const token = ++requestTokenRef.current;
      setLat(latVal);
      setLng(lngVal);
      void reverseGeocode(latVal, lngVal, token);
      void checkDeliveryRange(latVal, lngVal, token);
    },
    [reverseGeocode, checkDeliveryRange]
  );

  /* ---------------------------------------------------------------------- */
  /*  Place search (autocomplete)                                           */
  /* ---------------------------------------------------------------------- */

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('maps', {
        body: { action: 'autocomplete', query: query.trim() },
      });
      if (error) throw error;
      if (data?.predictions && Array.isArray(data.predictions)) {
        setSuggestions(
          data.predictions.map((p: any) => ({
            description: p.description ?? '',
            place_id: p.place_id ?? '',
            main_text: p.structured_formatting?.main_text ?? p.description ?? '',
            secondary_text: p.structured_formatting?.secondary_text ?? '',
          }))
        );
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Place search failed', err);
      setSuggestions([]);
    }
    setSearching(false);
  }, []);

  const selectPlace = useCallback(
    async (placeId: string, description: string) => {
      setShowSuggestions(false);
      setSearchQuery(description);
      setSuggestions([]);
      setGeocoding(true);
      setLocationError(null);
      try {
        const { data, error } = await supabase.functions.invoke('maps', {
          body: { action: 'search', query: description },
        });
        if (error) throw error;
        if (data?.address) {
          const a = data.address;
          const latVal = a.latitude ?? lat;
          const lngVal = a.longitude ?? lng;
          setLat(latVal);
          setLng(lngVal);

          // Mark resolved BEFORE panTo so the upcoming `idle` skips re-geocoding.
          lastResolvedRef.current = { lat: latVal, lng: lngVal };
          mapInstanceRef.current?.panTo({ lat: latVal, lng: lngVal });

          setAddress({
            line1: a.line1 || a.formatted_address || '',
            city: a.city || '',
            state: a.state || '',
            postal_code: a.postal_code || '',
            place_id: a.place_id ?? null,
            formatted_address: a.formatted_address ?? '',
          });

          const token = ++requestTokenRef.current;
          void checkDeliveryRange(latVal, lngVal, token);
          void triggerHaptic(ImpactStyle.Medium); // pin lands on the searched spot
        } else {
          setLocationError('Could not find this place. Try a different search.');
        }
      } catch (err) {
        console.error('Place selection failed', err);
        setLocationError('Could not find this place. Try a different search.');
      }
      setGeocoding(false);
    },
    [lat, lng, checkDeliveryRange]
  );

  /* ---------------------------------------------------------------------- */
  /*  Use current location                                                  */
  /* ---------------------------------------------------------------------- */

  const useCurrentLocation = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await getFastCurrentPosition();
      setLat(coords.latitude);
      setLng(coords.longitude);

      // Center the map exactly on the device position so the fixed center pin
      // lands precisely on the user's actual location.
      lastResolvedRef.current = { lat: coords.latitude, lng: coords.longitude };
      mapInstanceRef.current?.panTo({ lat: coords.latitude, lng: coords.longitude });

      const token = ++requestTokenRef.current;
      void reverseGeocode(coords.latitude, coords.longitude, token);
      void checkDeliveryRange(coords.latitude, coords.longitude, token);
      void triggerHaptic(ImpactStyle.Medium);
    } catch (err: any) {
      setLocationError(err?.message || 'Could not retrieve your current location.');
    } finally {
      setLocating(false);
    }
  }, [reverseGeocode, checkDeliveryRange]);

  /* ---------------------------------------------------------------------- */
  /*  Load Maps API key                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('maps', {
          body: { action: 'get_api_key' },
        });
        if (cancelled) return;
        if (error) {
          setKeyError(true);
          return;
        }
        if (data?.api_key) {
          setApiKey(data.api_key as string);
        } else {
          setKeyError(true);
        }
      } catch {
        if (!cancelled) setKeyError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Map setup                                                             */
  /* ---------------------------------------------------------------------- */

  function setupMap() {
    if (!mapRef.current || typeof google === 'undefined' || !google.maps) return;

    const center = { lat, lng };
    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: 16,
      styles: MAP_STYLE,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: false, // custom zoom is cleaner; gesture handling still works
      gestureHandling: 'greedy',
      disableDefaultUI: true,
    });

    // Haptic the instant the user lifts their finger — the "pin drop" moment.
    mapInstanceRef.current.addListener('dragend', () => {
      void triggerHaptic(ImpactStyle.Medium);
    });

    // Tap-to-move: glide so the tapped point sits under the fixed pin.
    mapInstanceRef.current.addListener('click', (e: any) => {
      if (e.latLng) {
        void triggerHaptic(ImpactStyle.Light);
        mapInstanceRef.current?.panTo(e.latLng);
      }
    });

    // `idle` fires ONCE per gesture (drag end, inertia settled, panTo finished).
    // This is the ONLY place we geocode — no center_changed, no debounce.
    mapInstanceRef.current.addListener('idle', () => {
      const c = mapInstanceRef.current?.getCenter();
      if (!c) return;
      const lt = c.lat();
      const ln = c.lng();

      const last = lastResolvedRef.current;
      if (last && Math.abs(last.lat - lt) < 1e-5 && Math.abs(last.lng - ln) < 1e-5) {
        return; // same point (e.g. right after selectPlace / useCurrentLocation)
      }
      lastResolvedRef.current = { lat: lt, lng: ln };
      settleLocation(lt, ln);
    });

    setMapReady(true);
    // No explicit initial geocode — the first `idle` fires it for us.
  }

  useEffect(() => {
    if (!apiKey) return;

    if (typeof google !== 'undefined' && google.maps) {
      setupMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setupMap();
    script.onerror = () => setKeyError(true);
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  /* ---------------------------------------------------------------------- */
  /*  Debounced autocomplete                                                */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        void searchPlaces(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, searchPlaces]);

  /* ---------------------------------------------------------------------- */
  /*  Cleanup — invalidate any in-flight request on unmount                 */
  /* ---------------------------------------------------------------------- */

  useEffect(
    () => () => {
      requestTokenRef.current++;
    },
    []
  );

  /* ---------------------------------------------------------------------- */
  /*  Confirm — read live map center so mid-drag taps are never stale       */
  /* ---------------------------------------------------------------------- */

  const handleConfirm = () => {
    const c = mapInstanceRef.current?.getCenter();
    const finalLat = c ? c.lat() : lat;
    const finalLng = c ? c.lng() : lng;
    void triggerHaptic(ImpactStyle.Medium);
    onConfirm({
      latitude: finalLat,
      longitude: finalLng,
      line1: address?.line1 ?? '',
      city: address?.city ?? '',
      state: address?.state ?? '',
      postal_code: address?.postal_code ?? '',
      place_id: address?.place_id ?? null,
    });
  };

  const confirmDisabled =
    !mapReady || isInDeliveryRange === false || checkingRange;

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
      {/* ============================ HEADER ============================ */}
      <div className="shrink-0 bg-white safe-top">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={onCancel}
            aria-label="Back"
            className="h-10 w-10 flex items-center justify-center rounded-full bg-ink-50 text-ink-700 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-ink-900 leading-tight">
              Select delivery location
            </h2>
            <p className="text-[11px] text-ink-400 leading-tight mt-0.5">
              Move the map to pin your exact spot
            </p>
          </div>
        </div>
      </div>

      {/* ============================ SEARCH ============================ */}
      <div className="relative px-4 pb-3 shrink-0 bg-white">
        <div className="flex items-center gap-2.5 bg-ink-50 rounded-2xl h-12 px-3.5 border border-ink-100 focus-within:border-brand-500 focus-within:bg-white transition-colors">
          <Search size={18} className="text-ink-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="Search area, street, landmark…"
            className="flex-1 bg-transparent text-[14px] text-ink-800 placeholder:text-ink-400 outline-none"
          />
          {searching && <Loader2 size={16} className="animate-spin text-brand-600 shrink-0" />}
          {searchQuery && !searching && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
              aria-label="Clear search"
              className="h-5 w-5 flex items-center justify-center rounded-full bg-ink-200 text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-4 right-4 mt-1.5 bg-white border border-ink-100 rounded-2xl shadow-[0_12px_40px_-12px_rgba(20,83,45,0.25)] max-h-72 overflow-y-auto z-30">
            {suggestions.map((s) => (
              <button
                key={s.place_id || s.description}
                onClick={() => void selectPlace(s.place_id, s.description)}
                className="w-full text-left px-3.5 py-3 hover:bg-ink-50 active:bg-ink-100 border-b border-ink-50 last:border-0 flex items-start gap-3 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={15} className="text-brand-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-ink-800 truncate">
                    {s.main_text}
                  </p>
                  {s.secondary_text && (
                    <p className="text-[11.5px] text-ink-400 truncate mt-0.5">
                      {s.secondary_text}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============================= MAP ============================= */}
      <div className="relative flex-1 min-h-[280px] bg-ink-50">
        {!mapReady && !keyError && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-50 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-brand-600" />
              </div>
              <p className="text-[12px] font-medium text-ink-400">Loading map…</p>
            </div>
          </div>
        )}

        {keyError && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-50 px-6 z-10">
            <div className="flex flex-col items-center gap-3 text-center max-w-[300px]">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle size={26} />
              </div>
              <p className="text-[14px] font-bold text-ink-800">Map unavailable</p>
              <p className="text-[12px] text-ink-500 leading-relaxed">
                We couldn't load the map right now. You can still search for a place above.
              </p>
            </div>
          </div>
        )}

        <div ref={mapRef} className="absolute inset-0" />

        {/* -------- FIXED CENTER PIN (map moves underneath it) -------- */}
        {mapReady && (
          <>
            {/* Ground shadow at exact center */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[4]">
              <div className="h-2.5 w-6 rounded-full bg-black/25 blur-[3px]" />
            </div>

            {/* Teardrop pin — tip sits exactly at map center */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-[5]">
              <div className="animate-[pinBounce_0.4s_ease-out]">
                <svg
                  width="42"
                  height="54"
                  viewBox="0 0 42 54"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-[0_8px_12px_rgba(20,83,45,0.35)]"
                >
                  <path
                    d="M21 0C9.4 0 0 9.4 0 21c0 11.5 21 33 21 33s21-21.5 21-33C42 9.4 32.6 0 21 0z"
                    fill="#14532d"
                  />
                  <circle cx="21" cy="20" r="8" fill="#ffffff" />
                  <circle cx="21" cy="20" r="3.5" fill="#14532d" />
                </svg>
              </div>
            </div>

            {/* Delivery-range chip — floating top-center */}
            {(isInDeliveryRange !== null || checkingRange) && (
              <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-10">
                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-md backdrop-blur-md border text-[11.5px] font-semibold transition-colors ${
                    isInDeliveryRange === false
                      ? 'bg-red-50/95 border-red-200 text-red-700'
                      : isInDeliveryRange === true
                        ? 'bg-green-50/95 border-green-200 text-green-700'
                        : 'bg-white/95 border-ink-100 text-ink-600'
                  }`}
                >
                  {checkingRange ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Checking…</span>
                    </>
                  ) : isInDeliveryRange ? (
                    <>
                      <Check size={12} />
                      <span>In delivery area</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} />
                      <span>Outside delivery area</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Locate-me FAB */}
            <button
              onClick={() => void useCurrentLocation()}
              disabled={locating}
              className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-white shadow-[0_8px_24px_-6px_rgba(20,83,45,0.35)] border border-ink-100 flex items-center justify-center text-brand-600 active:scale-90 transition-transform z-10 disabled:opacity-70"
              aria-label="Use current location"
            >
              {locating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Crosshair size={20} />
              )}
            </button>

            {/* Fetching-address pill */}
            {geocoding && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md shadow-[0_8px_24px_-8px_rgba(20,83,45,0.35)] rounded-full px-4 py-2 flex items-center gap-2 z-10 border border-ink-100">
                <Loader2 size={13} className="animate-spin text-brand-600" />
                <span className="text-[11.5px] font-semibold text-ink-700">
                  Finding address…
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ====================== ERROR STRIP ====================== */}
      {locationError && (
        <div className="shrink-0 px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-start gap-2">
          <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-700 flex-1 leading-snug">{locationError}</p>
          <button
            onClick={() => setLocationError(null)}
            className="text-red-400 shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {rangeCheckError && (
        <div className="shrink-0 px-4 py-1.5 bg-red-50 border-t border-red-100">
          <p className="text-[11px] text-red-500">{rangeCheckError}</p>
        </div>
      )}

      {/* ====================== BOTTOM SHEET ====================== */}
      <div className="shrink-0 bg-white border-t border-ink-100 rounded-t-3xl -mt-4 relative z-20 shadow-[0_-8px_32px_-12px_rgba(20,83,45,0.15)] safe-bottom">
        {/* Drag handle (visual affordance only) */}
        <div className="flex justify-center pt-2.5">
          <div className="h-1 w-10 rounded-full bg-ink-200" />
        </div>

        <div className="px-5 pt-3 pb-4 space-y-3.5">
          {/* Address block */}
          {address ? (
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={17} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-400 mb-0.5">
                  Deliver to
                </p>
                <p className="text-[14px] font-bold text-ink-900 leading-snug line-clamp-1">
                  {address.line1 || 'Selected location'}
                </p>
                {(address.city || address.state || address.postal_code) && (
                  <p className="text-[12px] text-ink-500 mt-0.5 line-clamp-1">
                    {[address.city, address.state].filter(Boolean).join(', ')}
                    {address.postal_code ? ` - ${address.postal_code}` : ''}
                  </p>
                )}
                <p className="text-[10.5px] text-ink-400 mt-1 font-mono">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </p>
              </div>
            </div>
          ) : !geocoding && mapReady ? (
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-ink-50 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation size={16} className="text-ink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-ink-400 mb-0.5">
                  Deliver to
                </p>
                <p className="text-[14px] font-bold text-ink-500">No address resolved</p>
                <p className="text-[12px] text-ink-400 mt-0.5 leading-snug">
                  Drag the map so the pin sits on your location.
                </p>
                <p className="text-[10.5px] text-ink-400 mt-1 font-mono">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-ink-100 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 w-16 rounded bg-ink-100" />
                <div className="h-3.5 w-3/4 rounded bg-ink-100" />
                <div className="h-2.5 w-1/2 rounded bg-ink-100" />
              </div>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className="w-full h-[52px] rounded-2xl bg-gradient-to-b from-[#1a6b3a] to-[#14532d] text-white text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(20,83,45,0.5)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
          >
            {checkingRange ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Checking availability…
              </>
            ) : (
              <>
                <Check size={18} strokeWidth={3} />
                Confirm location
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pin bounce keyframe (Tailwind arbitrary animation) */}
      <style>{`
        @keyframes pinBounce {
          0%   { transform: translateY(-14px) scale(0.9); opacity: 0; }
          60%  { transform: translateY(2px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}