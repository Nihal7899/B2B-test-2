import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Maps the short audience labels from the admin UI to the actual app_role
// enum values stored in the user_roles table.
const AUDIENCE_MAP: Record<string, string> = {
  admin: "admin",
  warehouse: "warehouse_manager",
  delivery: "delivery_partner",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseServiceKey) {
      console.error("[send-push] SUPABASE_SERVICE_ROLE_KEY is not set");
      return json({ error: "Service configuration missing" }, 500);
    }

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error("[send-push] OneSignal credentials missing");
      return json({ error: "Push service is unavailable" }, 503);
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller's identity using the anon client (respects RLS)
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      console.log("[send-push] Invalid user:", userError?.message);
      return json({ error: "Invalid token" }, 401);
    }

    // Check admin role using the service client (bypasses RLS)
    const { data: roleData, error: roleError } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== "admin") {
      console.log("[send-push] Forbidden: role =", roleData?.role);
      return json({ error: "Forbidden" }, 403);
    }

    const body = await req.json() as {
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
      audience?: "all" | "admin" | "warehouse" | "delivery";
    };

    const title = (body.title ?? "").trim();
    const messageBody = (body.body ?? "").trim();
    const data = body.data ?? {};
    const audience = body.audience ?? "all";

    if (!title || !messageBody) {
      return json({ error: "Title and body are required" }, 400);
    }

    // ── Fetch player IDs ───────────────────────────────────────────
    let playerIds: string[] = [];

    if (audience === "all") {
      const { data: subs, error: subError } = await supabaseService
        .from("user_push_subscriptions")
        .select("onesignal_player_id");
      if (subError) {
        console.error("[send-push] Query error:", subError);
        return json({ error: subError.message }, 500);
      }
      playerIds = (subs ?? [])
        .map((s) => s.onesignal_player_id)
        .filter((id): id is string => Boolean(id));
    } else {
      // Filter by role: fetch users with the requested role first, then
      // fetch their subscriptions. Two-step because user_roles and
      // user_push_subscriptions have no FK relationship exposed to PostgREST.
      const dbRole = AUDIENCE_MAP[audience] ?? audience;
      const { data: roleUsers, error: roleUsersError } = await supabaseService
        .from("user_roles")
        .select("user_id")
        .eq("role", dbRole);
      if (roleUsersError) {
        console.error("[send-push] Role query error:", roleUsersError);
        return json({ error: roleUsersError.message }, 500);
      }
      const userIds = (roleUsers ?? []).map((r) => r.user_id);
      if (userIds.length === 0) {
        return json({ message: "No subscribers found", sent: 0 }, 200);
      }

      const { data: subs, error: subError } = await supabaseService
        .from("user_push_subscriptions")
        .select("onesignal_player_id")
        .in("user_id", userIds);
      if (subError) {
        console.error("[send-push] Subscription query error:", subError);
        return json({ error: subError.message }, 500);
      }
      playerIds = (subs ?? [])
        .map((s) => s.onesignal_player_id)
        .filter((id): id is string => Boolean(id));
    }

    if (playerIds.length === 0) {
      return json({ message: "No subscribers found", sent: 0 }, 200);
    }

    // ── Send to OneSignal ──────────────────────────────────────────
    const onesignalPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: messageBody },
      data,
    };

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(onesignalPayload),
    });

    const result = await response.json();

    // ── Log the notification in the DB ─────────────────────────────
    await supabaseService.from("push_notifications").insert({
      title,
      body: messageBody,
      data,
      sent_by: user.id,
      audience_count: playerIds.length,
      status: response.ok ? "sent" : "failed",
    });

    return json(
      { ...result, sent: playerIds.length },
      response.ok ? 200 : 502
    );
  } catch (error) {
    console.error("[send-push] Unhandled exception:", error);
    return json({ error: "Could not send notification" }, 500);
  }
});
