import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, msg: "Email and password are required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." });
    }

    // Verify credentials
    const { data: partner, error } = await sb
      .from("clats_partners")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error || !partner || partner.password !== password) {
      return NextResponse.json({ ok: false, msg: "Incorrect email or password." }, { status: 401 });
    }

    // Fetch partner's referrals
    const { data: referrals } = await sb
      .from("clats_referrals")
      .select("*")
      .eq("referrer_email", email.toLowerCase().trim());
      
    partner.referrals = referrals || [];

    // Optional: Fetch payouts from ledger
    
    return NextResponse.json({ ok: true, partner });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
