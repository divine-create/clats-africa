import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

/**
 * POST /api/supabase/b2b/coordinator-login
 * Authenticates a coordinator using email and password.
 * Confirms they are registered with a b2b_org_id.
 */
export async function POST(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, msg: "Email and password are required." }, { status: 400 });
    }

    // Lookup coordinator profile in clats_parents
    const { data: parent, error: pErr } = await sb
      .from("clats_parents")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (pErr) throw new Error(pErr.message);
    if (!parent) {
      return NextResponse.json({ ok: false, msg: "Invalid email or password." }, { status: 400 });
    }

    // Verify they are a B2B coordinator
    if (!parent.b2b_org_id) {
      return NextResponse.json({ ok: false, msg: "This account is not registered as a school coordinator." }, { status: 403 });
    }

    // Verify password
    if (parent.password !== password) {
      return NextResponse.json({ ok: false, msg: "Invalid email or password." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      org_id: parent.b2b_org_id,
      parent: {
        email: parent.email,
        name: parent.name,
        isB2B: true
      }
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
