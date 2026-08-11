import re
import os

filepath = r"C:\Users\HomePC\Downloads\clats-nextjs\src\data\curriculum.ts"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Very basic regex to pull out modules and lessons
sql = []
sql.append("-- 1. Seed Learning Pathways")
sql.append("INSERT INTO learning_pathways (id, title, description, age_group, status) VALUES")
sql.append("('academy-1', 'AI & Emerging Technologies', 'Learn how artificial intelligence works.', 'all', 'active'),")
sql.append("('academy-2', 'Digital Citizenship & Cybersecurity', 'Build digital confidence.', 'all', 'active'),")
sql.append("('academy-3', 'Design & Creation', 'Develop creativity, storytelling.', 'all', 'active'),")
sql.append("('academy-4', 'Innovation & Career Readiness', 'Learn leadership.', 'future', 'active'),")
sql.append("('academy-5', 'Adaptability & Lifelong Learning', 'Develop the mindset.', 'all', 'active')")
sql.append("ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;")
sql.append("")
sql.append("-- 2. Seed Modules")
sql.append("INSERT INTO modules (id, pathway_id, title, description, age_group, order_number) VALUES")

module_pattern = r'id:\s*"([^"]+)",\s*name:\s*{\s*en:\s*"([^"]+)"[^{}]*},\s*goal:\s*{\s*en:\s*"([^"]+)"'
modules = re.findall(module_pattern, content)

mod_sql = []
for i, m in enumerate(modules):
    m_id, m_name, m_goal = m
    pathway_id = "academy-1"
    if "a2" in m_id: pathway_id = "academy-2"
    if "a3" in m_id: pathway_id = "academy-3"
    if "a4" in m_id: pathway_id = "academy-4"
    if "a5" in m_id: pathway_id = "academy-5"
    
    age_group = "young innovators"
    if m_id.startswith("t-"): age_group = "early explorers"
    elif m_id.startswith("p-"): age_group = "future builders"
    
    # escape single quotes
    m_name = m_name.replace("'", "''")
    m_goal = m_goal.replace("'", "''")
    
    mod_sql.append(f"('{m_id}', '{pathway_id}', '{m_name}', '{m_goal}', '{age_group}', {i+1})")

sql.append(",\n".join(mod_sql))
sql.append("ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, pathway_id = EXCLUDED.pathway_id;")
sql.append("")
sql.append("-- 3. Seed Lessons")
sql.append("INSERT INTO lessons (id, module_id, title, description, lesson_order, status) VALUES")

# Lessons extraction
# The lessons are in arrays: lessons: [ "Title 1", "Title 2" ]
lesson_block_pattern = r'id:\s*"([^"]+)".*?lessons:\s*\[([\s\S]*?)\]'
lesson_blocks = re.findall(lesson_block_pattern, content)

les_sql = []
for block in lesson_blocks:
    m_id, lessons_str = block
    titles = re.findall(r'"([^"]+)"', lessons_str)
    for idx, title in enumerate(titles):
        title = title.replace("'", "''")
        l_id = f"{m_id}-l{idx+1}"
        les_sql.append(f"('{l_id}', '{m_id}', '{title}', 'Custom curated lesson.', {idx+1}, 'published')")

sql.append(",\n".join(les_sql))
sql.append("ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;")

with open("all_seed_data.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql))
print("SQL file generated successfully!")
