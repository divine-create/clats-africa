import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json();
    if (!code) return NextResponse.json({ ok: false, msg: "Missing auth code" }, { status: 400 });

    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    // 1. Exchange auth code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json({ ok: false, msg: tokenData.error_description || "Failed to exchange token" }, { status: 400 });
    }

    // 2. Fetch user profile from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok) {
      return NextResponse.json({ ok: false, msg: "Failed to fetch Google profile" }, { status: 400 });
    }

    const email = userData.email;
    const name = userData.name || "Parent";
    const userId = userData.id;

    if (!email) {
      return NextResponse.json({ ok: false, msg: "No email associated with this Google account" }, { status: 400 });
    }

    // 3. Connect to Supabase to save user in clats_parents
    const sbUrl = process.env.SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!sbUrl || !sbKey) {
        return NextResponse.json({ ok: false, msg: "Database not configured." });
    }

    const sb = createClient(sbUrl, sbKey, { auth: { persistSession: false } });

    // Check if the user already exists
    const { data: existing, error: fetchErr } = await sb
      .from("clats_parents")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      // Fetch children just like the regular login route
      const { data: childrenData, error: childrenError } = await sb
        .from("clats_children")
        .select("*")
        .eq("parent_email", email.toLowerCase().trim());

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
      }));

      existing.children = children;
      return NextResponse.json({ ok: true, parent: existing });
    }

    // We keep the payload minimal to avoid schema errors on missing columns
    const dbPayload = {
      email: email.toLowerCase().trim(),
      password: "GOOGLE_OAUTH_NATIVE",
      name: name,
    };

    const { error: insertErr } = await sb.from("clats_parents").insert([dbPayload]);
    
    if (insertErr && insertErr.code !== '23505') {
        throw new Error(`Failed to insert into clats_parents: ${insertErr.message}`);
    }
    
    // Pass extra meta fields back to the client even if not saved in DB
    const clientPayload = {
      ...dbPayload,
      created_at: Date.now(),
      tutorial_completed: false,
      timezone: "UTC",
      provider: "google",
      user_id: userId,
      children: []
    };
    
    return NextResponse.json({ ok: true, parent: clientPayload });

  } catch (e: any) {
    return NextResponse.json({ ok: false, msg: e.message }, { status: 500 });
  }
}
