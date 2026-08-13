import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return NextResponse.json({ ok: false, msg: "Supabase not configured." });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { email, child_id, reference, plan_id } = await req.json();
    if (!child_id) throw new Error("Child ID required");

    // In a real app, you would verify the Paystack reference here server-side!
    // For this prototype, we immediately upgrade the child.
    const { error } = await sb
      .from("clats_children")
      .update({ is_premium: true })
      .eq("id", child_id);

    if (error) throw new Error(error.message);

    // Handle referrals and partner commissions
    if (email) {
      const { data: parent } = await sb.from("clats_parents").select("referred_by, partner_id").eq("email", email).single();
      
      if (parent) {
        // 1. Reward the referrer (e.g. +1 free month)
        if (parent.referred_by) {
          const { data: referrer } = await sb.from("clats_parents").select("id, free_months").eq("referral_code", parent.referred_by).single();
          if (referrer) {
            await sb.from("clats_parents").update({ free_months: (referrer.free_months || 0) + 1 }).eq("id", referrer.id);
          }
        }
        
        // 2. Calculate and insert partner commission
        if (parent.partner_id) {
          const amount = 5000; // Mock amount for prototype
          const { data: partner } = await sb.from("clats_partners").select("commission_rate").eq("partner_code", parent.partner_id).single();
          const rate = partner?.commission_rate || 20; // Default to 20%
          const commission_earned = (rate / 100) * amount;

          await sb.from("clats_commissions_ledger").insert({
            partner_id: parent.partner_id,
            parent_email: email,
            child_id: child_id,
            plan_id: plan_id || 'premium',
            amount_paid: amount,
            commission_rate: rate,
            commission_earned: commission_earned,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, msg: err.message }, { status: 500 });
  }
}
