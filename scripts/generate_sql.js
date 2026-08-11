const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '..', 'src', 'data', 'curriculum.ts');
const content = fs.readFileSync(filepath, 'utf8');

const sql = [];
sql.push("-- AUTO-GENERATED COMPLETE SEED DATA FROM HARDCODED CURRICULUM");
sql.push("");
sql.push("-- 1. Seed Learning Pathways");
sql.push("INSERT INTO learning_pathways (id, title, description, age_group, status) VALUES");
sql.push("('academy-1', 'AI & Emerging Technologies', 'Learn how artificial intelligence works.', 'all', 'active'),");
sql.push("('academy-2', 'Digital Citizenship & Cybersecurity', 'Build digital confidence.', 'all', 'active'),");
sql.push("('academy-3', 'Design & Creation', 'Develop creativity, storytelling.', 'all', 'active'),");
sql.push("('academy-4', 'Innovation & Career Readiness', 'Learn leadership.', 'future', 'active'),");
sql.push("('academy-5', 'Adaptability & Lifelong Learning', 'Develop the mindset.', 'all', 'active')");
sql.push("ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;");
sql.push("");
sql.push("-- 2. Seed Modules");
sql.push("INSERT INTO modules (id, pathway_id, title, description, age_group, order_number) VALUES");

const modulePattern = /id:\s*"([^"]+)",\s*name:\s*{\s*en:\s*"([^"]+)"[^{}]*},\s*goal:\s*{\s*en:\s*"([^"]+)"/g;
const modules = [];
let match;
while ((match = modulePattern.exec(content)) !== null) {
    modules.push({ id: match[1], name: match[2], goal: match[3] });
}

const modSql = [];
modules.forEach((m, i) => {
    let pathwayId = "academy-1";
    if (m.id.includes("a2")) pathwayId = "academy-2";
    if (m.id.includes("a3")) pathwayId = "academy-3";
    if (m.id.includes("a4")) pathwayId = "academy-4";
    if (m.id.includes("a5")) pathwayId = "academy-5";
    
    let ageGroup = "young innovators";
    if (m.id.startsWith("t-")) ageGroup = "early explorers";
    else if (m.id.startsWith("p-")) ageGroup = "future builders";
    
    const name = m.name.replace(/'/g, "''");
    const goal = m.goal.replace(/'/g, "''");
    
    modSql.push(`('${m.id}', '${pathwayId}', '${name}', '${goal}', '${ageGroup}', ${i+1})`);
});

sql.push(modSql.join(",\n"));
sql.push("ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, pathway_id = EXCLUDED.pathway_id;");
sql.push("");
sql.push("-- 3. Seed Lessons");
sql.push("INSERT INTO lessons (id, module_id, title, description, lesson_order, status) VALUES");

const lessonBlockPattern = /id:\s*"([^"]+)".*?lessons:\s*\[([\s\S]*?)\]/g;
const lesSql = [];
while ((match = lessonBlockPattern.exec(content)) !== null) {
    const mId = match[1];
    const lessonsStr = match[2];
    
    const titlePattern = /"([^"]+)"/g;
    let titleMatch;
    let idx = 0;
    while ((titleMatch = titlePattern.exec(lessonsStr)) !== null) {
        idx++;
        const title = titleMatch[1].replace(/'/g, "''");
        const lId = `${mId}-l${idx}`;
        lesSql.push(`('${lId}', '${mId}', '${title}', 'Custom curated lesson content.', ${idx}, 'published')`);
    }
}

sql.push(lesSql.join(",\n"));
sql.push("ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;");

fs.writeFileSync(path.join(__dirname, 'all_seed_data.sql'), sql.join("\n"));
console.log("SQL file generated successfully in scripts/all_seed_data.sql!");
