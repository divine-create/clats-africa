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
    const { name, email, password, type = "affiliate", commission_rate = 0.1 } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, msg: "Name, email, and password are required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." });
    }

    // Check if partner already exists
    const { data: existing } = await sb.from("clats_partners").select("id").eq("email", email.toLowerCase().trim()).maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: false, msg: "A partner with this email already exists." }, { status: 400 });
    }

    // Generate unique partner code
    const prefix = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
    const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const partner_code = `${prefix}-${uniqueId}`;

    // For real auth, we should create a Supabase Auth user. 
    // For now, we will store the password in the clats_partners table since there's no RLS enforcing it yet.
    const { data: newPartner, error } = await sb.from("clats_partners").insert([
      {
        name,
        email: email.toLowerCase().trim(),
        password, // Store directly for now, or you can integrate with supabase auth
        type,
        partner_code,
        commission_rate,
        total_earnings: 0,
        available_balance: 0,
        status: "pending_approval",
        bank_details: {}
      }
    ]).select().single();

    if (error || !newPartner) {
      throw error || new Error("Failed to create partner account.");
    }

    return NextResponse.json({ ok: true, partner: newPartner });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
