import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * CLATS Professional Learning Evidence & Progress AI Report Engine
 * Powered by Meta AI (Meta Llama 3.3 70B Instruct via OpenRouter)
 *
 * Generates detailed, psychologically encouraging, and actionable educational reports
 * for authorized parents, guardians, and school educators based on practical
 * demonstrated learning evidence.
 */

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Database credentials not configured." }, { status: 503 });
    }

    const { childId } = await req.json();

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // 1. Fetch child record from Supabase
    const { data: child, error } = await supabase
      .from("clats_children")
      .select("*")
      .eq("id", childId)
      .single();

    if (error || !child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // 2. Check 24-hour cache (refresh if older than 1 day)
    if (child.ai_insight && child.ai_insight_generated_at) {
      const generatedAt = new Date(child.ai_insight_generated_at);
      const daysSince = (new Date().getTime() - generatedAt.getTime()) / (1000 * 3600 * 24);
      
      if (daysSince < 1 && child.ai_insight.demonstratedCompetencies) {
        return NextResponse.json({ insight: child.ai_insight, cached: true });
      }
    }

    // 3. Fetch recent session duration
    const { data: sessionsData } = await supabase
      .from("learning_sessions")
      .select("duration_seconds, created_at, modules_completed")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(10);
      
    const recentSessions = sessionsData || [];
    const totalMinutesRecent = Math.round(recentSessions.reduce((acc: any, s: any) => acc + (s.duration_seconds || 0), 0) / 60);

    // 4. Fetch human-readable lesson history
    const completedKeys = Object.keys(child.completed_lessons || {});
    let recentCompletedTitles: string[] = [];
    
    if (completedKeys.length > 0) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, title_en")
        .in("id", completedKeys.slice(-5));
        
      if (lessons && lessons.length > 0) {
        recentCompletedTitles = lessons.map(l => l.title || l.title_en || l.id);
      } else {
        recentCompletedTitles = completedKeys.slice(-3);
      }
    }
    const recentCompleted = recentCompletedTitles.join(", ");

    // 5. Fetch quiz performance
    const quizResults = child.quiz_results || {};
    const quizKeys = Object.keys(quizResults);
    let quizAverage = 0;
    const strugglingTopics: string[] = [];
    const strongTopics: string[] = [];

    if (quizKeys.length > 0) {
      quizAverage = Math.round(quizKeys.reduce((a: any, k: any) => a + (quizResults[k]?.score || 0), 0) / quizKeys.length);
      
      const { data: quizzes } = await supabase
        .from("quizzes")
        .select("id, title, title_en, module_id")
        .in("id", quizKeys);
        
      const { data: quizLessons } = await supabase
        .from("lessons")
        .select("id, title, title_en")
        .in("id", quizKeys);
        
      const quizMap = new Map();
      if (quizzes) quizzes.forEach(q => quizMap.set(q.id, q.title || q.title_en || q.module_id || q.id));
      if (quizLessons) {
        quizLessons.forEach(l => {
          if (!quizMap.has(l.id)) quizMap.set(l.id, l.title || l.title_en || l.id);
        });
      }

      quizKeys.forEach((k: any) => {
        const q = quizResults[k];
        const topicName = quizMap.get(k) || k;
        if (q.score < 70 || q.attempts > 2) strugglingTopics.push(topicName);
        else if (q.score >= 90) strongTopics.push(topicName);
      });
    }

    // 6. Fetch genuine practical skill evidence (games, pattern quest, cyber safety)
    let skillEvidenceList: any[] = [];
    try {
      const { data: evidenceRows } = await supabase
        .from("child_skill_evidence")
        .select("skill_id, source_id, demonstrated, hints_requested, attempt_count, context_data")
        .eq("child_id", childId)
        .order("recorded_at", { ascending: false })
        .limit(20);

      if (evidenceRows && evidenceRows.length > 0) {
        skillEvidenceList = evidenceRows;
      } else if (Array.isArray(child.skill_evidence)) {
        skillEvidenceList = child.skill_evidence.slice(-20);
      }
    } catch (e) {
      // Graceful fallback
    }

    const demonstratedSkillsList = skillEvidenceList
      .filter((e: any) => e.demonstrated)
      .map((e: any) => e.context_data?.skillName || e.skill_id)
      .filter(Boolean);

    const emergingSkillsList = skillEvidenceList
      .filter((e: any) => !e.demonstrated || (e.hints_requested || 0) > 0)
      .map((e: any) => e.context_data?.skillName || e.skill_id)
      .filter(Boolean);

    const companion = child.companion === "chibi" ? "Chibi" : "Kobe";
    const badges = Array.isArray(child.badges) && child.badges.length > 0 ? child.badges.join(", ") : "None yet";

    // 7. Meta AI / Llama 3 Prompt Specification
    const systemPrompt = `You are a distinguished child education specialist and developmental technologist advising families and schools on the CLATS platform (Building Tomorrow’s Tech Minds, Today).
Your task is to write a comprehensive, highly personalized, professional, and encouraging learning evaluation report for the child's parents and school teachers based on real demonstrated evidence.

Underlying AI Provider: Powered by Meta AI (Meta Llama 3.3 70B Instruct).

Data telemetry:
- Learner Name: ${child.name}
- Age Cohort: ${child.age_group || "early explorers (Ages 6-10)"}
- Learning Companion: ${companion} (${companion === "Kobe" ? "Analytical & Logic Explorer" : "Curious & Creative Explorer"})
- XP Sparks: ${child.xp || 0} | Streak: ${child.streak_count || child.streak || 0} days
- Recent Engagement: ${totalMinutesRecent} minutes across ${recentSessions.length} active sessions
- Recent Curriculum Completed: ${recentCompleted || "Initial orientation completed"}
- Quiz Accuracy Average: ${quizAverage}%
- Strong Concept Checkpoints: ${strongTopics.join(", ") || "Foundational concepts in progress"}
- Concept Checkpoints Needing Scaffolding: ${strugglingTopics.join(", ") || "None flagged"}
- Practical Skills Successfully Demonstrated: ${demonstratedSkillsList.join(", ") || "Binary pattern recognition, basic tech helper identification"}
- Skills Needing Scaffolding or Multiple Hints: ${emergingSkillsList.join(", ") || "Multi-attribute pattern synthesis, advanced rule articulation"}
- Badges Unlocked: ${badges}

Provide a rich, structured educational consultation in JSON format with exactly the following structure:
{
  "summary": "2-sentence warm summary of overall technological mindset and progress.",
  "strength": "1 clear sentence on the strongest skill demonstrated so far.",
  "focusArea": "1 gentle sentence highlighting where they should practice next.",
  "parentAction": "A specific 1-sentence prompt or conversational question for home.",
  "executiveSummary": "A detailed 3 to 4 sentence professional assessment of the learner's computational thinking, adaptability, safety posture, and cognitive problem-solving growth.",
  "demonstratedCompetencies": [
    {
      "competency": "Name of the demonstrated skill",
      "observableEvidence": "Concrete description of the observable task the child successfully solved (e.g. independently completed alternating pattern sequences, correctly identified deceptive phishing cues, or classified training data)."
    }
  ],
  "areasForImprovement": [
    {
      "area": "Specific learning concept or skill",
      "professionalObservation": "Constructive, low-shame evaluation of where the learner currently uses hints or requires multiple attempts.",
      "recommendedStrategy": "Actionable pedagogical strategy to help the learner build mastery in this area."
    }
  ],
  "scaffoldingGuide": {
    "forParents": [
      {
        "title": "Practical Home Activity or Conversation",
        "action": "Detailed, specific way a parent or guardian can support this concept at home (e.g., during screen-time handoffs, identifying patterns in kitchen tiles, or discussing safe passwords)."
      },
      {
        "title": "Positive Reinforcement Prompt",
        "action": "Specific praise that reinforces effort and process (e.g., 'Now I know what to try next') rather than innate intelligence."
      }
    ],
    "forEducators": [
      {
        "title": "Classroom / Lab Scaffolding",
        "action": "Actionable recommendation for a school coordinator or teacher to reinforce this student's progress in a group or lab setting."
      }
    ]
  },
  "nextRecommendedQuest": {
    "title": "Specific lesson title, game world, or challenge",
    "rationale": "Clear rationale connecting this recommended quest directly to their evidence profile."
  }
}

Return ONLY valid JSON. No markdown backticks, no markdown formatting.`;

    // 8. Call OpenRouter API (Meta Llama 3.3 70B Instruct)
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://app.clats.africa",
        "X-Title": "CLATS Learning Evidence Engine"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate the comprehensive educational evaluation JSON for ${child.name}.` }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OpenRouter API Error:", errText);
      return NextResponse.json({ error: `Meta AI Generation Error: ${errText}` }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    let insightJson;
    try {
      const rawText = aiData.choices[0].message.content;
      // Sanitize potential backticks
      const cleanJson = rawText.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
      insightJson = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Meta AI response:", e);
      return NextResponse.json({ error: "Failed to parse AI evaluation response" }, { status: 500 });
    }

    // 9. Cache the comprehensive insight back to clats_children
    await supabase
      .from("clats_children")
      .update({ 
        ai_insight: insightJson,
        ai_insight_generated_at: new Date().toISOString()
      })
      .eq("id", childId);

    return NextResponse.json({ insight: insightJson, cached: false, provider: "Meta Llama 3.3" });

  } catch (error: any) {
    console.error("AI Report Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}