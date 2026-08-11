-- AUTO-GENERATED COMPLETE SEED DATA FROM HARDCODED CURRICULUM

-- 1. Seed Learning Pathways
INSERT INTO learning_pathways (id, title, description, age_group, status) VALUES
('academy-1', 'AI & Emerging Technologies', 'Learn how artificial intelligence works.', 'all', 'active'),
('academy-2', 'Digital Citizenship & Cybersecurity', 'Build digital confidence.', 'all', 'active'),
('academy-3', 'Design & Creation', 'Develop creativity, storytelling.', 'all', 'active'),
('academy-4', 'Innovation & Career Readiness', 'Learn leadership.', 'future', 'active'),
('academy-5', 'Adaptability & Lifelong Learning', 'Develop the mindset.', 'all', 'active')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- 2. Seed Modules
INSERT INTO modules (id, pathway_id, title, description, age_group, order_number) VALUES
('t-a1m1', 'academy-1', 'Module 1: Technology Around Me', 'Learn what technology is and spot smart computers around us.', 'early explorers', 1),
('t-a1m2', 'academy-1', 'Module 2: Meet AI Friends', 'Meet friendly mascot helpers Kobe and Chibi and see how AI can help.', 'early explorers', 2),
('t-a1m3', 'academy-1', 'Module 3: Learning With AI', 'Discover how AI perceives objects, listens to commands, and spot patterns.', 'early explorers', 3),
('t-a2m1', 'academy-2', 'Module 1: My Digital World', 'Learn kindness online, balanced screen time, and requesting device helpers.', 'early explorers', 4),
('t-a3m1', 'academy-3', 'Module 1: Creative Explorer', 'Use colors, shapes, digital drawings, and sounds to build stories.', 'early explorers', 5),
('t-a4m1', 'academy-4', 'Module 1: Curious Explorers', 'Develop critical inquiry, observation, and pattern recognition skills.', 'early explorers', 6),
('j-a1m1', 'academy-1', 'Module 1: AI Foundations', 'Understand history of tech, smart machines, benefits, and ethical AI risks.', 'young innovators', 7),
('j-a1m2', 'academy-1', 'Module 2: AI in Everyday Life', 'Explore AI inside phones, school games, transportation, and African innovations.', 'young innovators', 8),
('j-a1m3', 'academy-1', 'Module 3: Learning With AI Tools', 'Discover generative templates, dialogue prompting, and responsible play patterns.', 'young innovators', 9),
('j-a1m4', 'academy-1', 'Module 4: Future Technology Explorer', 'Master blockchain ledgers, digital sandboxes, virtual layers, and Web3 keys.', 'young innovators', 10),
('j-a2m1', 'academy-2', 'Module 1: Digital Literacy', 'Understand essential screen parts, active web links, and digital communication.', 'young innovators', 11),
('j-a2m2', 'academy-2', 'Module 2: Cyber Safety', 'Craft strong secret key grids, identify internet scams, and bypass safety threats.', 'young innovators', 12),
('j-a3m1', 'academy-3', 'Module 1: Design Basics', 'Unleash balance of color contrasts, creative visual posters, and layouts.', 'young innovators', 13),
('j-a3m2', 'academy-3', 'Module 2: Creative Technology', 'Animate visual vectors, create active sliders, and master design frameworks.', 'young innovators', 14),
('j-a4m1', 'academy-4', 'Module 1: Thinking Like An Innovator', 'Build critical thinking loops, query techniques, and resilient problem solving.', 'young innovators', 15),
('j-a4m2', 'academy-4', 'Module 2: Technology Confidence', 'Establish a fearless approach to new technologies and learning formats.', 'young innovators', 16),
('p-a1m1', 'academy-1', 'Module 1: AI Foundations', 'Deep dive into model weights, neural activation networks, and deep machine learning.', 'future builders', 17),
('p-a1m2', 'academy-1', 'Module 2: Generative AI', 'Practice prompt structure parameters, remote AI workflows, and ethics validation.', 'future builders', 18),
('p-a1m3', 'academy-1', 'Module 3: Building With AI', 'Design agentive triggers, automation chains, and draft local startup concept canvases.', 'future builders', 19),
('p-a1m4', 'academy-1', 'Module 4: Blockchain & Web3', 'Master decentralized smart contracts, digital gas ledgers, and token architecture.', 'future builders', 20),
('p-a2m1', 'academy-2', 'Module 1: Digital Literacy Essentials', 'Master fact-checking online content, advanced cloud collaborations and tools.', 'future builders', 21),
('p-a2m2', 'academy-2', 'Module 2: Cybersecurity Foundations', 'Defend identity breaches, understand phishing tricks, threat patterns, and data privacy.', 'future builders', 22),
('p-a3m1', 'academy-3', 'Module 1: Design Thinking', 'Map active user profiles, ideate solution screens, and craft conceptual mockups.', 'future builders', 23),
('p-a3m2', 'academy-3', 'Module 2: Product Design', 'Build wireframe hierarchies, structured UX architectures, and system layouts.', 'future builders', 24),
('p-a3m3', 'academy-3', 'Module 3: Digital Creation', 'Formulate branding schemes, compose portfolios, and publish digital channels.', 'future builders', 25),
('p-a4m1', 'academy-4', 'Module 1: Future Careers', 'Review tech roles, master resume grids, construct LinkedIn pages and networking.', 'future builders', 26),
('p-a4m2', 'academy-4', 'Module 2: Entrepreneurship & Leadership', 'Formulate business structures, pitching cases, and team collaborative leadership.', 'future builders', 27),
('p-a4m3', 'academy-4', 'Module 3: Professional Readiness', 'Prepare mock speech interviews, freelancing profiles, and find remote global scopes.', 'future builders', 28),
('p-a5m1', 'academy-5', 'Module 1: Learning Agility', 'Master meta-learning strategies, growth mindset loops, and rapid self-directed skillups.', 'future builders', 29),
('p-a5m2', 'academy-5', 'Module 2: Future Adaptability', 'Navigate fast industrial shifts, apply strategic thinking schemas, and anchor tech resilience.', 'future builders', 30)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, pathway_id = EXCLUDED.pathway_id;

-- 3. Seed Lessons
INSERT INTO lessons (id, module_id, title, description, lesson_order, status) VALUES

ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;