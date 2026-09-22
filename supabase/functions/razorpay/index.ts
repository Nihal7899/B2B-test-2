
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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

const encoder = new TextEncoder();

async function hmacSha256(secret: string, value: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    console.log("[razorpay] OPTIONS request received");
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("[razorpay] Missing Authorization header");
      return json({ error: "Authentication required" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseServiceKey) {
      console.error("[razorpay] SUPABASE_SERVICE_ROLE_KEY is not set");
      return json({ error: "Service configuration missing" }, 500);
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user identity using the anon client (respects RLS)
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      console.log("[razorpay] Invalid user:", userError?.message);
      return json({ error: "Authentication required" }, 401);
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      console.error("[razorpay] Razorpay credentials missing");
      return json({ error: "Payment service is unavailable" }, 503);
    }

    const body = await req.json() as {
      action?: string;
      order_id?: string;
      amount?: number;
      payment_id?: string;
      signature?: string;
    };

    console.log(`[razorpay] action=${body.action}, order_id=${body.order_id}, user=${user.id}`);

    // Helper to verify order ownership (uses anon client with RLS)
    const verifyOrderOwnership = async (orderId: string) => {
      const { data: order, error } = await supabaseAnon
        .from("orders")
        .select("id, total, status")
        .eq("id", orderId)
        .maybeSingle();
      if (error || !order) {
        console.log(`[razorpay] Order ${orderId} not found or not owned by user`);
        return null;
      }
      return order;
    };

    // --- CREATE ORDER (Razorpay) ---
    if (body.action === "create_order") {
      console.log("[razorpay] create_order called");
      if (!body.order_id || typeof body.amount !== "number" || body.amount <= 0) {
        return json({ error: "Invalid payment request" }, 400);
      }

      const order = await verifyOrderOwnership(body.order_id);
      if (!order) return json({ error: "Invalid order" }, 400);
      if (Math.round(Number(order.total) * 100) !== Math.round(body.amount * 100)) {
        return json({ error: "Invalid amount" }, 400);
      }

      // Create Razorpay order
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(body.amount * 100),
          currency: "INR",
          receipt: body.order_id,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("[razorpay] Razorpay API error:", errText);
        return json({ error: "Could not start payment" }, 502);
      }
      const razorOrder = await response.json() as { id?: string };
      if (!razorOrder.id) {
        console.error("[razorpay] Razorpay order missing id");
        return json({ error: "Could not start payment" }, 502);
      }

      // Update updated_at to prevent cleanup (service role)
      await supabaseService
        .from("orders")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", body.order_id);

      // Upsert payment record (service role)
      await supabaseService
        .from("payments")
        .upsert(
          {
            order_id: body.order_id,
            user_id: user.id,
            provider: "razorpay",
            provider_order_id: razorOrder.id,
            amount: body.amount,
            status: "pending",
          },
          { onConflict: "order_id" }
        );

      console.log(`[razorpay] Razorpay order created: ${razorOrder.id}`);
      return json({ razorpay_order_id: razorOrder.id, key_id: keyId });
    }

    // --- COD PAYMENT CREATION ---
    if (body.action === "create_cod_payment") {
      console.log("[razorpay] create_cod_payment called");
      if (!body.order_id || typeof body.amount !== "number" || body.amount <= 0) {
        return json({ error: "Invalid request" }, 400);
      }

      const order = await verifyOrderOwnership(body.order_id);
      if (!order) {
        console.log(`[razorpay] Order ${body.order_id} not found or unauthorized`);
        return json({ error: "Order not found" }, 404);
      }

      // Insert payment record using service role
      const { error: insertError } = await supabaseService
        .from("payments")
        .insert({
          order_id: body.order_id,
          user_id: user.id,
          provider: "cod",
          amount: body.amount,
          status: "pending",
        });

      if (insertError) {
        console.error("[razorpay] COD payment insert error:", insertError);
        return json({ error: "Could not record payment" }, 500);
      }

      console.log(`[razorpay] COD payment recorded for order ${body.order_id}`);
      return json({ success: true });
    }

    // --- KEEP ALIVE ---
    if (body.action === "keep_alive") {
      if (!body.order_id) return json({ error: "Order ID required" }, 400);
      const order = await verifyOrderOwnership(body.order_id);
      if (!order) return json({ error: "Order not found" }, 404);

      await supabaseService
        .from("orders")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", body.order_id);

      return json({ ok: true });
    }

    // --- VERIFY PAYMENT ---
    if (body.action === "verify_payment") {
      console.log("[razorpay] verify_payment called");
      if (!body.order_id || !body.payment_id || !body.signature) {
        return json({ error: "Invalid payment verification" }, 400);
      }

      // Check payment record – use anon to respect user ownership
      const { data: payment, error: payCheckErr } = await supabaseAnon
        .from("payments")
        .select("provider_order_id")
        .eq("order_id", body.order_id)
        .maybeSingle();
      if (payCheckErr || !payment?.provider_order_id) {
        console.log(`[razorpay] Payment not found for order ${body.order_id}`);
        return json({ error: "Payment not found" }, 404);
      }

      // Verify signature
      const expected = await hmacSha256(
        keySecret,
        `${payment.provider_order_id}|${body.payment_id}`
      );
      if (expected !== body.signature) {
        console.log(`[razorpay] Signature mismatch for order ${body.order_id}`);
        return json({ error: "Payment verification failed" }, 400);
      }

      // Re-activate order if it was cancelled by cleanup (service role)
      const { data: order } = await supabaseService
        .from("orders")
        .select("status")
        .eq("id", body.order_id)
        .maybeSingle();
      if (order?.status === "cancelled") {
        await supabaseService
          .from("orders")
          .update({ status: "pending" })
          .eq("id", body.order_id);
        console.log(`[razorpay] Re-activated cancelled order ${body.order_id}`);
      }

      // Update payment to 'paid' (service role)
      const { error: payErr } = await supabaseService
        .from("payments")
        .update({ provider_payment_id: body.payment_id, status: "paid" })
        .eq("order_id", body.order_id);
      if (payErr) {
        console.error("[razorpay] Error updating payment:", payErr);
        return json({ error: "Could not save payment" }, 500);
      }

      // Order remains 'pending' – warehouse must confirm
      const { error: orderErr } = await supabaseService
        .from("orders")
        .update({ status: "pending" })
        .eq("id", body.order_id);
      if (orderErr) {
        console.error("[razorpay] Error updating order status:", orderErr);
        return json({ error: "Could not update order" }, 500);
      }

      console.log(`[razorpay] Payment verified for order ${body.order_id}`);
      return json({ verified: true });
    }

    // --- CANCEL ORDER ---
    if (body.action === "cancel_order") {
      console.log("[razorpay] cancel_order called");
      if (!body.order_id) return json({ error: "Order ID required" }, 400);

      const order = await verifyOrderOwnership(body.order_id);
      if (!order) return json({ error: "Order not found" }, 404);

      if (order.status === "pending") {
        await supabaseService
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", body.order_id);
        await supabaseService
          .from("payments")
          .update({ status: "cancelled" })
          .eq("order_id", body.order_id);
        console.log(`[razorpay] Order ${body.order_id} cancelled`);
      } else {
        console.log(`[razorpay] Order ${body.order_id} not pending, cannot cancel`);
      }

      return json({ cancelled: true });
    }

    console.log(`[razorpay] Unknown action: ${body.action}`);
    return json({ error: "Invalid payment action" }, 400);
  } catch (error) {
    console.error("[razorpay] Unhandled exception:", error);
    return json({ error: "Could not complete payment request" }, 500);
  }
});