import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

export async function GET(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." });

  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json({ ok: false, msg: "org_id is required." }, { status: 400 });
    }

    // 1. Fetch organization details with its license keys
    const { data: org, error: orgErr } = await sb
      .from("b2b_organizations")
      .select(`
        *,
        b2b_license_keys (
          code,
          max_uses,
          current_uses
        )
      `)
      .eq("id", orgId)
      .maybeSingle();

    if (orgErr) throw new Error(orgErr.message);
    if (!org) return NextResponse.json({ ok: false, msg: "Organization not found." }, { status: 404 });

    // 2. Fetch all parents registered under this organization
    const { data: parents, error: parErr } = await sb
      .from("clats_parents")
      .select("email, name")
      .eq("b2b_org_id", orgId);

    if (parErr) throw new Error(parErr.message);

    const parentEmails = (parents || []).map(p => p.email.toLowerCase().trim());

    let students: any[] = [];
    if (parentEmails.length > 0) {
      // 3. Fetch children belonging to these parent emails
      const { data: kids, error: kidsErr } = await sb
        .from("clats_children")
        .select("*")
        .in("parent_email", parentEmails);

      if (kidsErr) throw new Error(kidsErr.message);

      students = (kids || []).map(k => {
        const completedCount = k.completed_lessons ? Object.keys(k.completed_lessons).length : 0;
        let status = "Active";
        if (completedCount >= 10) status = "Excelling";
        else if (completedCount < 2) status = "Needs Support";

        return {
          id: k.id,
          name: k.name,
          xp: k.xp || 0,
          lessonsDone: completedCount,
          status,
          parentEmail: k.parent_email
        };
      });
    }

    return NextResponse.json({
      ok: true,
      org,
      students
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
