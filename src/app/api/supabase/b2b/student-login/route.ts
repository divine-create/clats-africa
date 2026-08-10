import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

/**
 * POST /api/supabase/b2b/student-login
 * Authenticates a student using: schoolCode + studentId (4-digit) + pin
 * Scoped so two schools can both have student "0042" with pin "1234" without collision.
 */
export async function POST(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { schoolCode, studentId, pin } = await req.json();

    if (!schoolCode || !studentId || !pin) {
      return NextResponse.json({ ok: false, msg: "School code, student ID, and PIN are required." }, { status: 400 });
    }

    // 1. Resolve school code → org_id via b2b_license_keys
    const { data: keyRow, error: keyErr } = await sb
      .from("b2b_license_keys")
      .select("org_id, expires_at, max_uses, current_uses")
      .eq("code", schoolCode.trim().toUpperCase())
      .maybeSingle();

    if (keyErr) throw new Error(keyErr.message);
    if (!keyRow) return NextResponse.json({ ok: false, msg: "Invalid school code. Please check with your coordinator." }, { status: 404 });

    if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, msg: "This school code has expired." }, { status: 403 });
    }

    const orgId = keyRow.org_id;

    // 2. Find the student scoped to the org + student_id + pin
    const { data: student, error: stuErr } = await sb
      .from("clats_children")
      .select("*")
      .eq("org_id", orgId)
      .eq("student_id", studentId.toString().padStart(4, "0"))
      .eq("pin", pin.trim())
      .maybeSingle();

    if (stuErr) throw new Error(stuErr.message);
    if (!student) {
      return NextResponse.json({ ok: false, msg: "Student not found. Check your ID and PIN." }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      student: {
        id: student.id,
        name: student.name,
        studentId: student.student_id,
        ageGroup: student.age_group,
        avatar: student.avatar,
        xp: student.xp || 0,
        completedLessons: student.completed_lessons || {},
        interests: student.interests || [],
        companion: student.companion || "kobe",
        parentEmail: student.parent_email,
        orgId: student.org_id,
      }
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
