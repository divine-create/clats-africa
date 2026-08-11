import fs from 'fs';
import path from 'path';
import { CURRICULUM } from '../src/data/curriculum';

const courses = [
  CURRICULUM["early explorers"],
  CURRICULUM["young innovators"],
  CURRICULUM["future builders"]
];

let sql = `-- AUTO-GENERATED COMPLETE SEED DATA FROM HARDCODED CURRICULUM\n\n`;

// 1. Pathways (We just hardcode the 5 main ones since they are static)
sql += `-- 1. Seed Learning Pathways\n`;
sql += `INSERT INTO learning_pathways (id, title, description, age_group, status) VALUES\n`;
sql += `('academy-1', 'AI & Emerging Technologies', 'Learn how artificial intelligence works, how technology evolved, how machines learn, and how future technologies are shaping tomorrow.', 'all', 'active'),\n`;
sql += `('academy-2', 'Digital Citizenship & Cybersecurity', 'Build digital confidence, internet safety awareness, responsible technology habits, and cybersecurity skills.', 'all', 'active'),\n`;
sql += `('academy-3', 'Design & Creation', 'Develop creativity, storytelling, design thinking, digital creation, and product design skills.', 'all', 'active'),\n`;
sql += `('academy-4', 'Innovation & Career Readiness', 'Learn leadership, entrepreneurship, communication, teamwork, and future career skills.', 'future', 'active'),\n`;
sql += `('academy-5', 'Adaptability & Lifelong Learning', 'Develop the mindset and human skills needed to thrive regardless of how technology changes.', 'all', 'active')\n`;
sql += `ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;\n\n`;

const escapeSql = (str) => {
  if (!str) return "''";
  return "'" + str.replace(/'/g, "''") + "'";
};

// 2. Modules
sql += `-- 2. Seed Modules\n`;
sql += `INSERT INTO modules (id, pathway_id, title, description, age_group, order_number) VALUES\n`;

const moduleValues = [];
const lessonValues = [];
const quizValues = [];

courses.forEach(course => {
  if (!course || !course.modules) return;
  
  course.modules.forEach((mod, modIdx) => {
    // Map the prefix to a pathway
    let pathwayId = 'academy-1';
    if (mod.id.includes('a2')) pathwayId = 'academy-2';
    else if (mod.id.includes('a3')) pathwayId = 'academy-3';
    else if (mod.id.includes('a4')) pathwayId = 'academy-4';
    else if (mod.id.includes('a5')) pathwayId = 'academy-5';

    moduleValues.push(`(${escapeSql(mod.id)}, ${escapeSql(pathwayId)}, ${escapeSql(mod.name.en)}, ${escapeSql(mod.goal.en)}, ${escapeSql(course.id)}, ${modIdx + 1})`);
    
    // Lessons
    if (mod.lessons) {
      mod.lessons.forEach((les, lesIdx) => {
        lessonValues.push(`(${escapeSql(les.id)}, ${escapeSql(mod.id)}, ${escapeSql(les.title.en)}, ${escapeSql(les.story?.en || "Custom curated lesson content.")}, ${lesIdx + 1}, 'published')`);
        
        // Quizzes
        if (les.quiz) {
          les.quiz.forEach((q, qIdx) => {
            const qId = \`qz-\${les.id}-\${qIdx + 1}\`;
            const optA = q.opts.en[0] || '';
            const optB = q.opts.en[1] || '';
            const optC = q.opts.en[2] || '';
            const optD = q.opts.en[3] || '';
            
            let correctAns = 'A';
            if (q.ans === 1) correctAns = 'B';
            else if (q.ans === 2) correctAns = 'C';
            else if (q.ans === 3) correctAns = 'D';

            quizValues.push(`(${escapeSql(qId)}, ${escapeSql(les.id)}, ${escapeSql(q.q.en)}, ${escapeSql(optA)}, ${escapeSql(optB)}, ${escapeSql(optC)}, ${escapeSql(optD)}, ${escapeSql(correctAns)})`);
          });
        }
      });
    }
  });
});

sql += moduleValues.join(",\n") + `\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, pathway_id = EXCLUDED.pathway_id;\n\n`;

// 3. Lessons
sql += `-- 3. Seed Lessons\n`;
sql += `INSERT INTO lessons (id, module_id, title, description, lesson_order, status) VALUES\n`;
sql += lessonValues.join(",\n") + `\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;\n\n`;

// 4. Quizzes
if (quizValues.length > 0) {
  sql += `-- 4. Seed Quizzes\n`;
  sql += `INSERT INTO quizzes (id, lesson_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES\n`;
  sql += quizValues.join(",\n") + `\nON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, correct_answer = EXCLUDED.correct_answer;\n\n`;
}

fs.writeFileSync(path.join(__dirname, 'complete_seed.sql'), sql);
console.log("SUCCESS! Generated complete_seed.sql");
