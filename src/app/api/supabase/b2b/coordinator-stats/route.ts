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

    // 2. Fetch all children belonging to this organization directly via org_id
    const { data: kids, error: kidsErr } = await sb
      .from("clats_children")
      .select("*")
      .eq("org_id", orgId);

    if (kidsErr) throw new Error(kidsErr.message);

    const students = (kids || []).map(k => {
      const completedCount = k.completed_lessons ? Object.keys(k.completed_lessons).length : 0;
      let status = "Active";
      if (completedCount >= 10) status = "Excelling";
      else if (completedCount < 2) status = "Needs Support";

      return {
        id: k.id,
        student_id: k.student_id,
        name: k.name,
        pin: k.pin,
        age_group: k.age_group,
        avatar: k.avatar,
        xp: k.xp || 0,
        lessonsDone: completedCount,
        status,
        parentEmail: k.parent_email
      };
    });

    return NextResponse.json({
      ok: true,
      org,
      students
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
