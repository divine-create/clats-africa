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
    const { id, name, email, bank_details } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ ok: false, msg: "Partner ID and Email are required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." });
    }

    const { data: updatedPartner, error } = await sb
      .from("clats_partners")
      .update({
        name,
        email: email.toLowerCase().trim(),
        bank_details
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !updatedPartner) {
      throw error || new Error("Failed to update partner profile.");
    }
    
    // Fetch referrals to return with updated profile
    const { data: referrals } = await sb
      .from("clats_referrals")
      .select("*")
      .eq("referrer_email", updatedPartner.email);
      
    updatedPartner.referrals = referrals || [];

    return NextResponse.json({ ok: true, partner: updatedPartner });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
