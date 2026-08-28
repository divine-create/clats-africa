import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSB = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

/**
 * DELETE /api/supabase/b2b/manage-student
 * Deletes a student profile.
 */
export async function DELETE(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { childId } = await req.json();

    if (!childId) {
      return NextResponse.json({ ok: false, msg: "childId is required." }, { status: 400 });
    }

    const { error } = await sb
      .from("clats_children")
      .delete()
      .eq("id", childId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, msg: "Student profile removed successfully." });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/supabase/b2b/manage-student
 * Updates a student profile fields (e.g. Reset PIN, Edit name/avatar/ageGroup).
 */
export async function PATCH(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { childId, name, pin, ageGroup, avatar } = await req.json();

    if (!childId) {
      return NextResponse.json({ ok: false, msg: "childId is required." }, { status: 400 });
    }

    // Build update object dynamically
    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (pin !== undefined) {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ ok: false, msg: "PIN must be exactly 4 digits." }, { status: 400 });
      }
      updatePayload.pin = pin;
    }
    if (ageGroup !== undefined) updatePayload.age_group = ageGroup;
    if (avatar !== undefined) updatePayload.avatar = avatar;

    const { data: updatedChild, error } = await sb
      .from("clats_children")
      .update(updatePayload)
      .eq("id", childId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, student: updatedChild });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
/**
 * POST /api/supabase/b2b/manage-student
 * Syncs a B2B student's learning progress (XP, completed lessons, stars, etc.)
 */
export async function POST(req: NextRequest) {
  const sb = getSB();
  if (!sb) return NextResponse.json({ ok: false, msg: "Supabase not configured." }, { status: 503 });

  try {
    const { 
      action, studentId, xp, completed, completed_lessons, stars, 
      quiz_results, streak_count, best_streak, last_active_at, badges,
      name, pin, ageGroup, avatar 
    } = await req.json();

    if (!studentId) {
      return NextResponse.json({ ok: false, msg: "studentId is required." }, { status: 400 });
    }

    const updatePayload: any = {};

    if (action === "update_progress") {
      if (xp !== undefined) updatePayload.xp = xp;
      
      // The frontend object uses `.completed`, but the DB column is `completed_lessons`.
      if (completed !== undefined) {
        updatePayload.completed_lessons = completed;
      } else if (completed_lessons !== undefined) {
        updatePayload.completed_lessons = completed_lessons;
      }
      
      if (stars !== undefined) updatePayload.stars = stars;
      if (quiz_results !== undefined) updatePayload.quiz_results = quiz_results;
      if (streak_count !== undefined) updatePayload.streak_count = streak_count;
      if (best_streak !== undefined) updatePayload.best_streak = best_streak;
      if (last_active_at !== undefined) updatePayload.last_active_at = last_active_at;
      if (badges !== undefined) updatePayload.badges = badges;
    } else {
      // General profile update
      if (name !== undefined) updatePayload.name = name.trim();
      if (pin !== undefined) updatePayload.pin = pin;
      if (ageGroup !== undefined) updatePayload.age_group = ageGroup;
      if (avatar !== undefined) updatePayload.avatar = avatar;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ ok: false, msg: "No fields to update." }, { status: 400 });
    }

    const { data: updatedChild, error } = await sb
      .from("clats_children")
      .update(updatePayload)
      .eq("id", studentId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, student: updatedChild });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
