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
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ ok: false, msg: "Username and PIN/password are required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    if (!sb) {
      return NextResponse.json({ ok: false, msg: "Supabase not configured." });
    }

    const normalizedQuery = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // 1. Try to find a parent with this email
    const { data: parentMatch } = await sb
      .from("clats_parents")
      .select("*")
      .eq("email", normalizedQuery)
      .maybeSingle();

    if (parentMatch) {
      // Fetch children for this parent
      const { data: childrenData, error: childrenError } = await sb
        .from("clats_children")
        .select("*")
        .eq("parent_email", normalizedQuery);
        
      if (childrenError) {
        throw new Error(`Failed to fetch children data: ${childrenError.message}`);
      }
        
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
        is_premium: kid.is_premium || false,
      }));

      // Dual Mode A: Parent Gmail + Student's Private PIN code
      const matchedByPin = children.find((c: any) => c.pin === normalizedPassword);
      if (matchedByPin) {
        return NextResponse.json({ ok: true, type: "child", child: matchedByPin });
      }

      // Dual Mode B: Parent Gmail + Parent General Account Password
      // For this, we either check Supabase Auth or the plaintext password fallback.
      // Since it's child login, we just check if it matches the legacy password, or we can't easily verify Supabase Auth without signing in.
      // Actually, we can use signInWithPassword.
      const { data: authData, error: authError } = await sb.auth.signInWithPassword({
        email: normalizedQuery,
        password: normalizedPassword,
      });

      let isAuthenticated = false;
      if (!authError && authData.user) {
        isAuthenticated = true;
      } else if (parentMatch.password === normalizedPassword) {
        isAuthenticated = true;
      }

      if (isAuthenticated) {
        if (children.length > 0) {
          return NextResponse.json({ ok: true, type: "parent_with_children", children });
        } else {
          return NextResponse.json({ ok: false, msg: "Your parent credentials are correct, but they have not completed enrolling any student profile yet!" }, { status: 400 });
        }
      }
    }

    // Dual Mode C: Fallback to direct Child Username/Name + PIN
    const { data: directChildMatch } = await sb
      .from("clats_children")
      .select("*")
      .eq("pin", normalizedPassword);
      
    if (directChildMatch && directChildMatch.length > 0) {
      for (const kid of directChildMatch) {
        const kidUsername = (kid.username || kid.name.toLowerCase().replace(/\s+/g, "_")).toLowerCase();
        const kidName = kid.name.toLowerCase();
        if (kidUsername === normalizedQuery || kidName === normalizedQuery) {
          const child = {
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
          };
          return NextResponse.json({ ok: true, type: "child", child });
        }
      }
    }

    return NextResponse.json({ ok: false, msg: "Incorrect credentials / PIN. Please try again or ask your parent!" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
