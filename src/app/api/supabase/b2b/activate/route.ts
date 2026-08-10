import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

/**
 * POST /api/supabase/b2b/activate
 * Coordinates activation/onboarding of a school coordinator account.
 * 1. Checks if activation license code is valid and unused (unlinked).
 * 2. Creates the b2b_organization with school name/region.
 * 3. Links the license code to the new organization.
 * 4. Registers the coordinator email, name, and password in clats_parents table.
 */
export async function POST(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { code, email, name, password, schoolName, region } = await req.json();

    if (!code || !email || !name || !password || !schoolName) {
      return NextResponse.json({ ok: false, msg: "Please fill in all required fields." }, { status: 400 });
    }

    // 1. Find the license key
    const { data: license, error: licErr } = await sb
      .from("b2b_license_keys")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (licErr) throw new Error(licErr.message);
    if (!license) {
      return NextResponse.json({ ok: false, msg: "Invalid license code. Please contact CLATS admin." }, { status: 404 });
    }

    // Check if it's already activated (i.e. linked to an org)
    if (license.org_id) {
      return NextResponse.json({ ok: false, msg: "This license code has already been activated by a school." }, { status: 400 });
    }

    // Check if the coordinator email already exists
    const { data: existingParent } = await sb
      .from("clats_parents")
      .select("email")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingParent) {
      return NextResponse.json({ ok: false, msg: "An account with this email already exists." }, { status: 400 });
    }

    // 2. Create the B2B Organization
    const orgId = `org-${Date.now()}`;
    const { data: org, error: orgErr } = await sb
      .from("b2b_organizations")
      .insert({
        id: orgId,
        name: schoolName.trim(),
        region: (region || "Global").trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgErr) throw new Error(orgErr.message);

    // 3. Link license key to the new organization
    const { error: linkErr } = await sb
      .from("b2b_license_keys")
      .update({ org_id: orgId })
      .eq("id", license.id);

    if (linkErr) throw new Error(linkErr.message);

    // 4. Create the coordinator parent profile in clats_parents table
    const { data: parent, error: parentErr } = await sb
      .from("clats_parents")
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: password, // For B2B simplicity/bypass
        b2b_org_id: orgId
      })
      .select()
      .single();

    if (parentErr) throw new Error(parentErr.message);

    return NextResponse.json({
      ok: true,
      msg: "School activated successfully! You can now log in.",
      org_id: orgId
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
