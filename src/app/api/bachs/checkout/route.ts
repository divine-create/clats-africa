import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, amount, currency, planName, childId } = body;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    
    // Fetch Bachs API keys from our database
    const { data: gateways } = await supabase
      .from('clats_payment_gateways')
      .select('*')
      .eq('gateway_name', 'bachs')
      .single();

    if (!gateways || !gateways.is_active || !gateways.secret_key) {
      return NextResponse.json({ ok: false, error: "Bachs payment gateway is not configured or inactive." }, { status: 400 });
    }

    // Since Bachs.io handles both NGN and USD, we send the currency payload
    // to their API. This assumes standard Bachs API integration:
    
    const bachsPayload = {
      pricing: {
        amount: amount.toString(),
        currency: currency || "NGN"
      },
      customer: {
        email: email || "parent@clats.org",
        name: "CLATS Parent"
      },
      reference: `clats_${childId}_${Date.now()}`,
      callback_url: `https://app.clats.org/parent/dashboard`,
      success_url: `https://app.clats.org/parent/dashboard?payment=success`,
      cancel_url: `https://app.clats.org/parent/dashboard?payment=cancel`,
      metadata: {
        childId,
        planName
      }
    };

    // If @bachs/node is installed, we would use:
    // const bachs = new Bachs(gateways.secret_key);
    // const response = await bachs.transaction.initialize(bachsPayload);

    // Using fetch directly as a fallback to their REST API
    const response = await fetch("https://api.bachs.io/v1/checkout-sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${gateways.secret_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bachsPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      // In development, we can simulate a successful link generation
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          ok: true, 
          checkoutUrl: `/payment/mock?ref=${bachsPayload.reference}&amount=${amount}&currency=${currency}`
        });
      }
      return NextResponse.json({ ok: false, error: `Failed to initialize Bachs transaction: ${errorText}` }, { status: 400 });
    }

    const responseData = await response.json();

    return NextResponse.json({
      ok: true,
      checkoutUrl: responseData.url || (responseData.data && responseData.data.authorization_url) || responseData.checkoutUrl
    });

  } catch (error: any) {
    console.error("Bachs checkout error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
