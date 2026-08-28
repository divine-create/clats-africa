import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client to update the child table
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { childId } = await req.json();

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // 1. Fetch the child data from Supabase
    const { data: child, error } = await supabase
      .from("clats_children")
      .select("*")
      .eq("id", childId)
      .single();

    if (error || !child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // 2. Check cache: If insight was generated less than 3 days ago, return it
    if (child.ai_insight && child.ai_insight_generated_at) {
      const generatedAt = new Date(child.ai_insight_generated_at);
      const daysSince = (new Date().getTime() - generatedAt.getTime()) / (1000 * 3600 * 24);
      
      if (daysSince < 3) {
        return NextResponse.json({ insight: child.ai_insight, cached: true });
      }
    }

    // 3. Fetch deep session data
    const { data: sessionsData } = await supabase
      .from("learning_sessions")
      .select("duration_seconds, created_at, modules_completed")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(10);
      
    const recentSessions = sessionsData || [];
    const totalMinutesRecent = Math.round(recentSessions.reduce((acc: any, s: any) => acc + (s.duration_seconds || 0), 0) / 60);

    // 4. Prepare data for the AI prompt
    const completedKeys = Object.keys(child.completed_lessons || {});
    let recentCompletedTitles: string[] = [];
    
    if (completedKeys.length > 0) {
      // Fetch human-readable lesson titles from the database
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, title_en")
        .in("id", completedKeys.slice(-5));
        
      if (lessons && lessons.length > 0) {
        recentCompletedTitles = lessons.map(l => l.title || l.title_en || l.id);
      } else {
        recentCompletedTitles = completedKeys.slice(-3); // fallback
      }
    }

    const recentCompleted = recentCompletedTitles.join(", ");
    
    const quizResults = child.quiz_results || {};
    const quizKeys = Object.keys(quizResults);
    let quizAverage = 0;
    let strugglingTopics: string[] = [];
    let strongTopics: string[] = [];

    if (quizKeys.length > 0) {
      quizAverage = Math.round(quizKeys.reduce((a: any, k: any) => a + (quizResults[k]?.score || 0), 0) / quizKeys.length);
      
      // Fetch human-readable quiz titles from the database
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, title, title_en, module_id")
        .in("id", quizKeys);
        
      // Some quiz IDs are actually lesson IDs, so let's also fetch lessons for the quiz keys
      const { data: quizLessons } = await supabase
        .from("lessons")
        .select("id, title, title_en")
        .in("id", quizKeys);
        
      const quizMap = new Map();
      if (quizzes) {
        quizzes.forEach(q => quizMap.set(q.id, q.title || q.title_en || q.module_id || q.id));
      }
      if (quizLessons) {
        quizLessons.forEach(l => {
          if (!quizMap.has(l.id)) {
             quizMap.set(l.id, l.title || l.title_en || l.id);
          }
        });
      }

      quizKeys.forEach((k: any) => {
        const q = quizResults[k];
        const topicName = quizMap.get(k) || k;
        if (q.score < 70 || q.attempts > 2) strugglingTopics.push(topicName);
        else if (q.score >= 90) strongTopics.push(topicName);
      });
    }

    const companion = child.companion || "Chibi"; // Chibi is supportive, Kobe is analytical
    const badges = child.badges ? child.badges.join(", ") : "None yet";

    const systemPrompt = `You are an expert child educator and AI assistant for the CLATS platform.
Your job is to deeply analyze a childs learning data and provide a highly personalized, psychological, and encouraging progress report for their parent.

Data points:
- Child Name: ${child.name}
- Age Group: ${child.age_group}
- Interests: ${child.interests?.join(", ") || "technology"}
- Learning Companion Chosen: ${companion} (${companion === "Kobe" ? "Prefers analytical/logical challenges" : "Prefers story-driven/supportive learning"})
- Badges Earned: ${badges}
- Current XP: ${child.xp} | Current Streak: ${child.streak_count} days
- Recent Study Time: ${totalMinutesRecent} minutes across the last ${recentSessions.length} sessions
- Last 3 Lessons Completed: ${recentCompleted || "None"}
- Quiz Average: ${quizAverage}%
- Strong Topics: ${strongTopics.join(", ") || "None"}
- Struggling Topics: ${strugglingTopics.join(", ") || "None"}

Based on this deep data, provide a JSON response with exactly these 4 keys:
{
  "summary": "A 2-sentence positive summary of their overall progress.",
  "strength": "1 sentence highlighting what they are doing best.",
  "focusArea": "1 sentence on what they should focus on next (be gentle).",
  "parentAction": "A specific 1-sentence conversation starter or action for the parent to do with the child today."
}
Return ONLY valid JSON. No markdown formatting, no extra text.`;

    // 4. Call OpenRouter API (Meta Llama 3.3)
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured in .env.local" }, { status: 500 });
    }

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://app.clats.org", // Required by OpenRouter
        "X-Title": "CLATS Progress AI" // Required by OpenRouter
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze the childs data and provide the JSON." }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OpenRouter API Error:", errText);
      return NextResponse.json({ error: `OpenRouter API Error: ${errText}` }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    let insightJson;
    try {
      insightJson = JSON.parse(aiData.choices[0].message.content);
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // 5. Save the insight back to the database
    const { error: updateError } = await supabase
      .from("clats_children")
      .update({ 
        ai_insight: insightJson,
        ai_insight_generated_at: new Date().toISOString()
      })
      .eq("id", childId);

    if (updateError) {
      console.error("Failed to cache AI insight in DB:", updateError);
    }

    return NextResponse.json({ insight: insightJson, cached: false });

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}