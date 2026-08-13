import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." });
    }

    const { data: partners, error: partnersError } = await sb
      .from("clats_partners")
      .select("*")
      .order("created_at", { ascending: false });

    if (partnersError) {
      throw partnersError;
    }

    const { data: payouts, error: payoutsError } = await sb
      .from("clats_commissions_ledger")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (payoutsError) {
      throw payoutsError;
    }

    return NextResponse.json({ ok: true, partners, payouts });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
