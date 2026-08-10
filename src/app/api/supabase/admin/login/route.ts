import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, msg: "Email and password are required." }, { status: 400 });
    }

    // Mock authentication for development purposes
    // In production, you would verify against an admin_users table in Supabase
    if (email === "admin@clats.com" && password === "admin") {
        return NextResponse.json({ 
          ok: true, 
          admin: { 
            email, 
            role: "Super Admin", 
            name: "System Administrator" 
          } 
        });
    }

    return NextResponse.json({ 
        ok: false, 
        msg: "Invalid admin credentials. For development, use admin@clats.com and password: admin" 
    }, { status: 401 });

  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
