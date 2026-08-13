import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;
    const signature = headers.get("x-bachs-signature");
    
    if (!signature) {
      return NextResponse.json({ ok: false, error: "Missing signature" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    
    // Fetch Bachs API keys
    const { data: gateways } = await supabase
      .from('clats_payment_gateways')
      .select('*')
      .eq('gateway_name', 'bachs')
      .single();

    if (!gateways || !gateways.secret_key) {
      return NextResponse.json({ ok: false, error: "Gateway not configured" }, { status: 400 });
    }

    // Verify Bachs Webhook Signature
    const hash = crypto.createHmac('sha512', gateways.secret_key).update(rawBody).digest('hex');
    if (hash !== signature) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Handle successful payment
    if (event.event === "charge.success") {
      const metadata = event.data.metadata;
      
      if (metadata && metadata.childId) {
        // Upgrade the child's account in the database
        await supabase
          .from('children')
          .update({
            is_premium: true,
            premium_plan: metadata.planName || 'Monthly',
            premium_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          })
          .eq('id', metadata.childId);
          
        // Log transaction
        await supabase
          .from('transactions')
          .insert({
            reference: event.data.reference,
            amount: event.data.amount / 100,
            currency: event.data.currency,
            status: "success",
            gateway: "bachs",
            child_id: metadata.childId
          });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Bachs webhook error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
