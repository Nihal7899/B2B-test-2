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
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      return json({ error: "Authentication required" }, 401);
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      return json({ error: "Payment service is unavailable" }, 503);
    }

    const body = await req.json() as {
      action?: string;
      order_id?: string;
      razorpay_order_id?: string;
      amount?: number;
      purpose?: "order_payment" | "wallet_topup";
      payment_id?: string;
      signature?: string;
    };

    console.log(`[razorpay] action=${body.action}, order_id=${body.order_id}, purpose=${body.purpose}, user=${user.id}`);

    const verifyOrderOwnership = async (orderId: string) => {
      const { data: order, error } = await supabaseAnon
        .from("orders")
        .select("id, total, status")
        .eq("id", orderId)
        .maybeSingle();
      if (error || !order) return null;
      return order;
    };

    // --- 1. CREATE ORDER (Handles Full Orders, Split Payments, and Wallet Top-ups) ---
    if (body.action === "create_order") {
      if (typeof body.amount !== "number" || body.amount <= 0) {
        return json({ error: "Invalid payment amount" }, 400);
      }

      const isWalletTopup = body.purpose === "wallet_topup" || !body.order_id;
      let receiptId = `topup_${user.id.slice(0, 6)}_${Date.now()}`;

      if (!isWalletTopup) {
        const order = await verifyOrderOwnership(body.order_id!);
        if (!order) return json({ error: "Invalid order" }, 400);

        if (Math.round(body.amount * 100) > Math.round(Number(order.total) * 100)) {
          return json({ error: "Invalid split amount" }, 400);
        }
        receiptId = `ord_${body.order_id}`;

        await supabaseService
          .from("orders")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", body.order_id!);
      }

      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(body.amount * 100),
          currency: "INR",
          receipt: receiptId,
          notes: {
            user_id: user.id,
            order_id: body.order_id || "WALLET_TOPUP",
            purpose: isWalletTopup ? "wallet_topup" : "order_payment",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[razorpay] Razorpay API error:", errText);
        return json({ error: "Could not start payment" }, 502);
      }

      const razorOrder = await response.json() as { id?: string };
      if (!razorOrder.id) {
        return json({ error: "Could not start payment" }, 502);
      }

      if (isWalletTopup) {
        await supabaseService.from("payments").insert({
          order_id: null,
          user_id: user.id,
          provider: "razorpay",
          provider_order_id: razorOrder.id,
          amount: body.amount,
          status: "pending",
        });
      } else {
        await supabaseService.from("payments").insert({
          order_id: body.order_id,
          user_id: user.id,
          provider: "razorpay",
          provider_order_id: razorOrder.id,
          amount: body.amount,
          status: "pending",
        });
      }

      return json({ razorpay_order_id: razorOrder.id, key_id: keyId, amount: body.amount });
    }

    // --- 2. CREATE COD PAYMENT (Supports Split Balances on COD) ---
    if (body.action === "create_cod_payment") {
      if (!body.order_id || typeof body.amount !== "number" || body.amount <= 0) {
        return json({ error: "Invalid request" }, 400);
      }

      const order = await verifyOrderOwnership(body.order_id);
      if (!order) return json({ error: "Order not found" }, 404);

      const { error: insertError } = await supabaseService.from("payments").insert({
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

      return json({ success: true });
    }

    // --- 3. KEEP ALIVE ---
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

    // --- 4. VERIFY PAYMENT (Signature Verification, Wallet Credit, Order Update) ---
    if (body.action === "verify_payment") {
      if (!body.payment_id || !body.signature) {
        return json({ error: "Invalid payment verification details" }, 400);
      }

      let query = supabaseService.from("payments").select("*").eq("user_id", user.id);
      if (body.order_id) {
        query = query.eq("order_id", body.order_id).eq("provider", "razorpay");
      } else if (body.razorpay_order_id) {
        query = query.eq("provider_order_id", body.razorpay_order_id);
      } else {
        return json({ error: "Identifier required for verification" }, 400);
      }

      const { data: payment, error: payCheckErr } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (payCheckErr || !payment?.provider_order_id) {
        return json({ error: "Payment record not found" }, 404);
      }

      const expected = await hmacSha256(
        keySecret,
        `${payment.provider_order_id}|${body.payment_id}`
      );

      if (expected !== body.signature) {
        console.error(`[razorpay] Signature mismatch for payment ${body.payment_id}`);
        return json({ error: "Payment verification failed" }, 400);
      }

      await supabaseService
        .from("payments")
        .update({ provider_payment_id: body.payment_id, status: "paid" })
        .eq("id", payment.id);

      // Handle Wallet Top-Up Fulfillment
      if (!payment.order_id) {
        const { data: userWallet } = await supabaseService
          .from("wallets")
          .select("id, balance")
          .eq("user_id", user.id)
          .maybeSingle();

        const currentBalance = Number(userWallet?.balance) || 0;
        const newBalance = currentBalance + Number(payment.amount);

        let walletId = userWallet?.id;
        if (!walletId) {
          const { data: createdWallet } = await supabaseService
            .from("wallets")
            .insert({ user_id: user.id, balance: newBalance })
            .select("id")
            .single();
          walletId = createdWallet?.id;
        } else {
          await supabaseService
            .from("wallets")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("id", walletId);
        }

        await supabaseService.from("wallet_transactions").insert({
          wallet_id: walletId,
          user_id: user.id,
          amount: payment.amount,
          type: "credit",
          purpose: "topup",
          reference_id: body.payment_id,
          description: `Recharge via Razorpay (${body.payment_id})`,
          balance_after: newBalance,
        });

        return json({ verified: true, wallet_recharged: true, new_balance: newBalance });
      }

      // Handle E-commerce Order Fulfillment
      const { data: order } = await supabaseService
        .from("orders")
        .select("status")
        .eq("id", payment.order_id)
        .maybeSingle();

      if (order?.status === "cancelled") {
        await supabaseService
          .from("orders")
          .update({ status: "pending" })
          .eq("id", payment.order_id);
      }

      return json({ verified: true, order_id: payment.order_id });
    }

    // --- 5. CANCEL ORDER (Handles Automatic Wallet Refund) ---
    if (body.action === "cancel_order") {
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

        await supabaseService.rpc("refund_wallet_payment", {
          p_order_id: body.order_id,
          p_reason: "Checkout aborted / Payment cancelled",
        });
      }

      return json({ cancelled: true });
    }

    return json({ error: "Invalid payment action" }, 400);
  } catch (error) {
    console.error("[razorpay] Unhandled exception:", error);
    return json({ error: "Could not complete payment request" }, 500);
  }
});
