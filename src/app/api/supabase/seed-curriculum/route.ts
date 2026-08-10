import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CURRICULUM } from "@/data/curriculum";

function getSB() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST() {
  try {
    const sb = getSB();
    if (!sb) return NextResponse.json({ ok: false, error: "No DB connection" });

    let insertedModules = 0;
    let insertedLessons = 0;
    let insertedQuizzes = 0;

    for (const [ageGroup, course] of Object.entries(CURRICULUM)) {
      for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
        const m = course.modules[mIdx];
        
        // Push module
        const modPayload = {
          id: m.id,
          pathway_id: `lp-${m.id.split('-')[0]}-${ageGroup}`,
          title: m.name.en,
          description: m.goal.en,
          age_group: ageGroup,
          order_number: mIdx + 1,
          display_order: mIdx,
          name_en: m.name.en,
          name_ig: m.name.ig,
          name_yo: m.name.yo,
          goal_en: m.goal.en,
          goal_ig: m.goal.ig,
          goal_yo: m.goal.yo,
          badge_name: m.badge?.name || "Module Badge",
          badge_icon: m.badge?.icon || "🏆",
          published: true,
          standardized_id: m.id
        };

        const { error: modErr } = await sb.from("modules").upsert(modPayload);
        if (modErr) console.error("Module insert err:", modErr);
        else insertedModules++;

        for (let lIdx = 0; lIdx < m.lessons.length; lIdx++) {
          const l = m.lessons[lIdx];

          // Push lesson
          const lessonPayload = {
            id: l.id,
            module_id: m.id,
            title: l.title.en,
            description: l.story?.en || l.title.en,
            lesson_order: lIdx + 1,
            title_en: l.title.en,
            title_ig: l.title.ig,
            title_yo: l.title.yo,
            code: l.code || `L${lIdx + 1}`,
            lesson_type: l.type || "story",
            duration: l.duration || "3 mins",
            story_en: typeof l.story === 'object' ? l.story.en : l.story,
            story_ig: typeof l.story === 'object' ? l.story.ig : null,
            story_yo: typeof l.story === 'object' ? l.story.yo : null,
            xp_reward: 100,
            status: "published",
            standardized_id: l.id
          };

          const { error: lessonErr } = await sb.from("lessons").upsert(lessonPayload);
          if (lessonErr) console.error("Lesson insert err:", lessonErr);
          else insertedLessons++;

          // Push quizzes
          if (l.quiz && l.quiz.length > 0) {
            for (let qIdx = 0; qIdx < l.quiz.length; qIdx++) {
              const q = l.quiz[qIdx];
              const quizPayload = {
                id: `${l.id}-q${qIdx + 1}`,
                lesson_id: l.id,
                module_id: m.id,
                question_text_en: q.q.en,
                question_text_ig: q.q.ig,
                question_text_yo: q.q.yo,
                options_en: q.opts.en,
                options_ig: q.opts.ig,
                options_yo: q.opts.yo,
                correct_answer_index: q.ans,
                order_number: qIdx + 1
              };
              
              const { error: quizErr } = await sb.from("quizzes").upsert(quizPayload);
              if (quizErr) console.error("Quiz insert err:", quizErr);
              else insertedQuizzes++;
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      ok: true, 
      insertedModules,
      insertedLessons,
      insertedQuizzes
    });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
