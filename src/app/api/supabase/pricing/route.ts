import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json({ ok: false, msg: "Supabase not configured." });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { data, error } = await sb.from("clats_pricing_plans").select("*").order("price", { ascending: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, plans: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json({ ok: false, msg: "Supabase not configured." });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const { plan_name, ...updates } = body;
    
    if (!plan_name) throw new Error("plan_name is required");

    const { data, error } = await sb
      .from("clats_pricing_plans")
      .upsert({ plan_name, ...updates }, { onConflict: 'plan_name' })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, plan: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
