import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET all payment gateways
export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json({ ok: false, msg: "Supabase not configured." });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { data, error } = await sb.from("clats_payment_gateways").select("*").order("gateway_name", { ascending: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, gateways: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}

// PUT to update a payment gateway
export async function PUT(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json({ ok: false, msg: "Supabase not configured." });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const { gateway_name, ...updates } = body;
    
    if (!gateway_name) throw new Error("gateway_name is required");

    const { data, error } = await sb
      .from("clats_payment_gateways")
      .upsert({ gateway_name, ...updates }, { onConflict: 'gateway_name' })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, gateway: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
