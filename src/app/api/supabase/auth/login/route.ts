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
    const { email, password, device, browser } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, msg: "Email and password are required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." });
    }

    // 1. Verify credentials with Supabase Auth
    const { data: authData, error: authError } = await sb.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    let isAuthenticated = false;

    if (!authError && authData.user) {
      isAuthenticated = true;
    } else {
      // Fallback for legacy users whose passwords are in clats_parents and not yet migrated to auth.users
      const { data: legacyUser } = await sb
        .from("clats_parents")
        .select("password")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (legacyUser && legacyUser.password === password) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      try {
        await sb.from("system_logs").insert([{
          event_type: "auth",
          event_name: "failed_login",
          parent_email: email,
          device_info: JSON.stringify({ device, browser }),
          details: "Reason: Invalid credentials (Secure Auth)"
        }]);
      } catch (e) {}
      return NextResponse.json({ ok: false, msg: "Incorrect email or password." }, { status: 400 });
    }

    // 2. Fetch the profile and children to return to the client
    const { data: parent } = await sb
      .from("clats_parents")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (!parent) {
      return NextResponse.json({ ok: false, msg: "Account verified, but profile not found." }, { status: 400 });
    }

    const { data: childrenData, error: childrenError } = await sb
      .from("clats_children")
      .select("*")
      .eq("parent_email", email.toLowerCase().trim());
      
    if (childrenError) {
      throw new Error(`Failed to fetch children data: ${childrenError.message}`);
    }

    // Map snake_case DB columns back to camelCase for the frontend
    parent.children = (childrenData || []).map((kid: any) => ({
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
        is_premium: kid.is_premium || false,
    }));

    // Update last login (non-critical, don't fail login if columns are missing)
    try {
      await sb.from("clats_parents").update({
        last_login_at: Date.now(),
      }).eq("email", parent.email);
    } catch (e) {
      console.warn("Failed to update last_login_at:", e);
    }

    return NextResponse.json({ ok: true, parent });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
