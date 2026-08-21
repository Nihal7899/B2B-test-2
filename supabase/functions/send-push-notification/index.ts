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

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      console.log("[send-push] Invalid user:", userError?.message);
      return json({ error: "Invalid token" }, 401);
    }

    const { data: roleData, error: roleError } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== "admin") {
      console.log("[send-push] Forbidden: role =", roleData?.role);
      return json({ error: "Forbidden" }, 403);
    }

    // ── Parse Full Payload from Frontend ──
    const body = await req.json() as {
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
      audience?: "all" | "admin" | "warehouse" | "delivery";
      image?: string;
      deepLink?: string;
      buttons?: { id: string; text: string }[];
      badgeCount?: number;
      scheduledAt?: string;
      largeIcon?: string;
      iosCategory?: string;
      channelId?: string;
      accentColor?: string;
      smallIcon?: string;
    };

    const title = (body.title ?? "").trim();
    const messageBody = (body.body ?? "").trim();
    const data = body.data ?? {};
    const audience = body.audience ?? "all";
    const smallIcon = body.smallIcon?.trim() || "ic_stat_stackknit";

    if (!title || !messageBody) {
      return json({ error: "Title and body are required" }, 400);
    }

    // ── Fetch player IDs ──
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

    // ── Build OneSignal payload ──
    const onesignalPayload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: messageBody },
      data,
    };

    onesignalPayload.small_icon = smallIcon;

    if (body.largeIcon) {
      onesignalPayload.large_icon = body.largeIcon;
    }

    if (body.channelId) {
      onesignalPayload.android_channel_id = body.channelId;
    }

    // ── FIX: ARGB Hex Parsing without Hash ──
    if (body.accentColor) {
      // Strip any '#' and ensure it is uppercase
      let cleanColor = body.accentColor.replace(/^#/, "").toUpperCase();
      
      // If the frontend sends a 6-character RGB (e.g., 007AFF), 
      // prepend 'FF' to make it a fully opaque ARGB value (e.g., FF007AFF)
      if (cleanColor.length === 6) {
        cleanColor = "FF" + cleanColor;
      }
      
      onesignalPayload.android_accent_color = cleanColor;
    }

    if (body.image) {
      onesignalPayload.big_picture = body.image;
      onesignalPayload.ios_attachments = { image1: body.image };
    }

    if (body.deepLink) {
      onesignalPayload.app_url = body.deepLink;
    }

    if (body.buttons && body.buttons.length > 0) {
      onesignalPayload.buttons = body.buttons;
    }

    if (body.badgeCount !== undefined) {
      onesignalPayload.ios_badgeType = "SetTo";
      onesignalPayload.ios_badgeCount = body.badgeCount;
    }

    if (body.scheduledAt) {
      onesignalPayload.send_after = body.scheduledAt;
    }

    if (body.iosCategory) {
      onesignalPayload.ios_category = body.iosCategory;
    }

    // ── Log the payload to the edge function logs ──
    console.log("[send-push] Final OneSignal payload:", JSON.stringify(onesignalPayload, null, 2));

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(onesignalPayload),
    });

    const result = await response.json();
    console.log("[send-push] OneSignal response:", JSON.stringify(result, null, 2));

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
