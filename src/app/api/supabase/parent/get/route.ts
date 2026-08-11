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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ ok: false, msg: "Email required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." });
    }

    const { data: parent, error } = await sb
      .from("clats_parents")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, msg: error.message }, { status: 500 });
    }

    if (!parent) {
      return NextResponse.json({ ok: false, code: "ACCOUNT_DELETED", msg: "Parent not found." }, { status: 404 });
    }

    const { data: childrenData, error: childrenError } = await sb
      .from("clats_children")
      .select("*")
      .eq("parent_email", email.toLowerCase().trim());
      
    if (childrenError) {
      throw new Error(`Failed to fetch children data: ${childrenError.message}`);
    }

    // Map snake_case DB columns back to camelCase for the frontend
    const children = (childrenData || []).map((kid: any) => ({
        id: kid.id,
        name: kid.name,
        username: kid.username || kid.name.toLowerCase().replace(/\s+/g, "_"),
        ageGroup: kid.age_group,
        avatar: kid.avatar,
        pin: kid.pin,
        interests: kid.interests || [],
        completed: kid.completed_lessons || {},
        xp: kid.xp || 0,
        stars: kid.stars || {},
        quizResults: kid.quiz_results || {},
        companion: kid.companion || "kobe",
        child_tutorial_completed: kid.child_tutorial_completed || false,
        last_active_at: kid.last_active_at || null,
        streak_count: kid.streak_count || 0,
        best_streak: kid.best_streak || 0,
    }));

    parent.children = children;

    return NextResponse.json({ ok: true, parent });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
