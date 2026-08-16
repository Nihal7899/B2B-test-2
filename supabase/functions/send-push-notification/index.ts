import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!;
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify JWT and admin role
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // use service role for admin queries
  );

  // Extract user from JWT
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if user is admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!roleData || roleData.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  const { title, body, data = {}, audience = 'all' } = await req.json();

  // Build query to fetch player IDs
  let query = supabase
    .from('user_push_subscriptions')
    .select('onesignal_player_id, user_id');

  if (audience !== 'all') {
    // Filter by role via user_roles table
    query = query
      .eq('user_roles.role', audience)
      .innerJoin('user_roles', 'user_push_subscriptions.user_id', 'user_roles.user_id');
  }

  const { data: subscriptions, error: subError } = await query;
  if (subError) {
    return new Response(JSON.stringify({ error: subError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const playerIds = subscriptions?.map(s => s.onesignal_player_id).filter(Boolean) || [];
  if (playerIds.length === 0) {
    return new Response(JSON.stringify({ message: 'No subscribers found' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Send to OneSignal
  const onesignalPayload = {
    app_id: ONESIGNAL_APP_ID,
    include_player_ids: playerIds,
    headings: { en: title },
    contents: { en: body },
    data: data,
  };

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(onesignalPayload),
  });

  const result = await response.json();

  // Log notification in DB
  await supabase.from('push_notifications').insert({
    title,
    body,
    data,
    sent_by: user.id,
    audience_count: playerIds.length,
    status: response.ok ? 'sent' : 'failed',
  });

  return new Response(JSON.stringify(result), {
    status: response.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});