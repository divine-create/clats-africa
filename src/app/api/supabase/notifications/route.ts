import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const parentId = req.nextUrl.searchParams.get("parent_id");
    if (!parentId) {
      return NextResponse.json({ error: "Missing parent_id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    
    return NextResponse.json({ data, ok: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: error.message, ok: false }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { notification_id, parent_id, mark_all } = await req.json();

    if (mark_all && parent_id) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("parent_id", parent_id)
        .eq("is_read", false);
      if (error) throw error;
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (notification_id) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification_id);
      if (error) throw error;
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: error.message, ok: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { parent_id, child_id, type, title, message, icon, badge_color } = await req.json();

    if (!parent_id || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          parent_id,
          child_id,
          type,
          title,
          message,
          icon: icon || "bell",
          badge_color: badge_color || "bg-blue-50 text-blue-600",
          is_read: false
        }
      ])
      .select();

    if (error) throw error;
    return NextResponse.json({ data, ok: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: error.message, ok: false }, { status: 500 });
  }
}
