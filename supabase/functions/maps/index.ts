import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, lat, lng, query } = await req.json();

    // 1. Return API Key for Maps JS SDK
    if (action === 'get_api_key') {
      return new Response(JSON.stringify({ api_key: apiKey }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Google Cloud Geolocation (IP Fallback)
    if (action === 'geolocate') {
      const response = await fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ considerIp: true }),
        }
      );
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    // 3. Reverse Geocode
    if (action === 'reverse_geocode') {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const comps = result.address_components;

        let line1 = '';
        let city = '';
        let state = '';
        let postal_code = '';

        const getComp = (type: string) => comps.find((c: any) => c.types.includes(type))?.long_name || '';

        const premise = getComp('premise') || getComp('subpremise');
        const route = getComp('route');
        const sublocality = getComp('sublocality_level_1') || getComp('sublocality');
        
        line1 = [premise, route, sublocality].filter(Boolean).join(', ') || result.formatted_address;
        city = getComp('locality') || getComp('administrative_area_level_2');
        state = getComp('administrative_area_level_1');
        postal_code = getComp('postal_code');

        return new Response(
          JSON.stringify({
            address: {
              line1,
              city,
              state,
              postal_code,
              place_id: result.place_id,
              formatted_address: result.formatted_address,
              latitude: lat,
              longitude: lng,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ address: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Places Autocomplete
    if (action === 'autocomplete') {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${apiKey}`
      );
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Geocode Search Query
    if (action === 'search') {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          query
        )}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const comps = result.address_components;
        const getComp = (type: string) => comps.find((c: any) => c.types.includes(type))?.long_name || '';

        return new Response(
          JSON.stringify({
            address: {
              line1: result.formatted_address,
              city: getComp('locality') || getComp('administrative_area_level_2'),
              state: getComp('administrative_area_level_1'),
              postal_code: getComp('postal_code'),
              place_id: result.place_id,
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
              formatted_address: result.formatted_address,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ address: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
