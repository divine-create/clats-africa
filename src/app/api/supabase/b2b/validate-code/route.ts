import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function POST(req: Request) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." });

  try {
    const { code } = await req.json();
    if (!code) throw new Error("License code is required.");

    const { data, error } = await sb
      .from("b2b_license_keys")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !data) throw new Error("Invalid or unrecognized access code.");

    // Validate uses
    if (data.current_uses >= data.max_uses) {
      throw new Error("This access code has reached its maximum number of uses.");
    }

    // Validate expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error("This access code has expired.");
    }

    // 1. Increment uses on key
    const { error: updateErr } = await sb
      .from("b2b_license_keys")
      .update({ current_uses: data.current_uses + 1 })
      .eq("id", data.id);
      
    if (updateErr) throw new Error(updateErr.message);

    // 2. Create/upsert parent row in clats_parents table
    const parentEmail = `b2b_${code.trim().toLowerCase()}@clats.local`;
    const { error: parentErr } = await sb
      .from("clats_parents")
      .upsert({
        email: parentEmail,
        name: "Sponsor Parent",
        password: "b2b-bypass-placeholder-password",
        b2b_org_id: data.org_id
      });
      
    if (parentErr) {
      console.warn("Failed to create parent in clats_parents. Make sure to run: ALTER TABLE clats_parents ADD COLUMN b2b_org_id uuid;", parentErr);
    }

    return NextResponse.json({ ok: true, org_id: data.org_id, code_id: data.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 400 });
  }
}
