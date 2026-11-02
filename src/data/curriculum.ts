/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course, AgeGroup, Module, Lesson, QuizQuestion } from "../types";

// Static metadata definitions for ALL modules across all 4 Academies
interface ModuleMetadata {
  id: string;
  name: { en: string; ig: string; yo: string };
  goal: { en: string; ig: string; yo: string };
  badge: { name: string; icon: string };
  lessons: string[];
}

const ACADEMY_METADATA: Record<AgeGroup, ModuleMetadata[]> = {
  "early explorers": [
    // PATHWAY 1: AI & SMART TECHNOLOGY
    {
      id: "t-a1m1",
      name: {
        en: "Module 1: Technology Around Me",
        ig: "Nkeji 1: Teknụzụ Gburugburu M",
        yo: "Mọ́dù 1: Ìmọ̀-ẹ̀rọ ní Àyíká Mi"
      },
      goal: {
        en: "Learn what technology is and spot smart computers around us.",
        ig: "Mụta ihe bụ teknụzụ ma hụ kọmputa nọ anyị gburugburu.",
        yo: "Kọ́ ohun tí ìmọ̀-ẹ̀rọ jẹ́ àti mọ àwọn kọmputa olóye."
      },
      badge: { name: "AI Tiny Explorer", icon: "🌱" },
      lessons: [
        "What is Technology?",
        "Smart Things Around Us",
        "Technology at Home",
        "Technology at School"
      ]
    },
    {
      id: "t-a1m2",
      name: {
        en: "Module 2: Learning With AI",
        ig: "Nkeji 2: Mmụta na AI",
        yo: "Mọ́dù 2: Kíkọ́ Ẹ̀kọ́ pẹ̀lú AI"
      },
      goal: {
        en: "Discover how AI perceives objects, listens to commands, talks, and learns patterns.",
        ig: "Mụta ka AI si ahụ ihe, na-anụ okwu, ma na-achọpụta usoro.",
        yo: "Wo bí AI ṣe ń ríran, gbọ́ràn àti rí àwọn àpẹẹrẹ nǹkan."
      },
      badge: { name: "AI Brain Box", icon: "🧠" },
      lessons: [
        "AI Can See",
        "AI Can Listen",
        "AI Can Talk",
        "AI Can Learn Patterns"
      ]
    },

    // PATHWAY 2: DIGITAL LITERACY AND CYBER SAFETY
    {
      id: "t-a2m1",
      name: {
        en: "Module 1: My Digital World",
        ig: "Nkeji 1: Ụwa Dijitalụ M",
        yo: "Mọ́dù 1: Ayé Dijitálì Mi"
      },
      goal: {
        en: "Learn kindness online, balanced screen time, and requesting device helpers.",
        ig: "Mụta obiọma na ịntanetị, oge ihuenyo kwesịrị ekwesị, na nkwado nne na nna.",
        yo: "Kọ́ ríràn lọ́wọ́ lórí ayélujára àti láti tọrọ fún ìrànlọ́wọ́."
      },
      badge: { name: "Digital Citizen Badge", icon: "🌍" },
      lessons: [
        "Asking Before Using Devices",
        "Good Screen Time",
        "Kindness Online",
        "Safe Videos",
        "Healthy Tech Habits"
      ]
    },

    // PATHWAY 3: CREATIVITY & PLAY
    {
      id: "t-a3m1",
      name: {
        en: "Module 1: Creative Explorer",
        ig: "Nkeji 1: Onye Nchọpụta Okike",
        yo: "Mọ́dù 1: Olùṣàwárí Ìṣẹ̀dá"
      },
      goal: {
        en: "Use colors, shapes, digital drawings, and sounds to build stories.",
        ig: "Jiri agba, ụdị, eserese dijitalụ, na ụda mepụta akụkọ.",
        yo: "Lo àwọ̀, àwòrán àti ohùn kọmputa láti kọ ìtàn kíkọ."
      },
      badge: { name: "Creative Explorer", icon: "🎨" },
      lessons: [
        "Colors and Shapes",
        "Digital Drawing",
        "Story Adventures",
        "Music and Sounds",
        "Creative Challenge"
      ]
    },

    // PATHWAY 4: ADAPTABILITY & LIFELONG LEARNING
    {
      id: "t-a4m1",
      name: {
        en: "Module 1: Curious Explorers",
        ig: "Nkeji 1: Ndị Nchọpụta Na-achọ ịmata ihe",
        yo: "Mọ́dù 1: Olùṣàwárí Tó nì Ìfẹ́-ìmọ̀"
      },
      goal: {
        en: "Develop critical inquiry, observation, and pattern recognition skills.",
        ig: "Zụlite usoro nleba anya ziri ezi yana ịmata usoro n'ụzọ dị mfe.",
        yo: "Kọ́ láti wo àpẹẹrẹ nǹkan àti láti bi fún ìṣàwárí dídára."
      },
      badge: { name: "Curious Explorer", icon: "🔍" },
      lessons: [
        "Why Asking Questions Matters",
        "Let's Discover Together",
        "Finding Patterns Around Us",
        "Trying New Things",
        "Curiosity Challenge"
      ]
    },
    {
      id: "t-a4m2",
      name: {
        en: "Module 2: Learning Adventures",
        ig: "Nkeji 2: Njem Mmụta Ọhụrụ",
        yo: "Mọ́dù 2: Ìrìn-Àjò Kíkọ́ Ẹ̀kọ́"
      },
      goal: {
        en: "Practice everyday learning, grow from mistakes, explore new ideas, and work together.",
        ig: "Mụta ihe kwa ụbọchị, mụta site na mmejọ, nyochaa echiche ọhụrụ, ma rụkọọ ọrụ ọnụ.",
        yo: "Kọ́ nǹkan ojoojúmọ́, kọ́ láti inú àṣìṣe, ṣàwárí èrò tuntun, kí ẹ sì ṣiṣẹ́ papọ̀."
      },
      badge: { name: "Adventure Explorer", icon: "🧭" },
      lessons: [
        "Learning Every Day",
        "Mistakes Help Us Grow",
        "Exploring New Ideas",
        "Working Together",
        "Adventure Quest"
      ]
    }
  ],
  "young innovators": [
    // ACADEMY 1: AI & EMERGING TECHNOLOGIES
    {
      id: "j-a1m1",
      name: {
        en: "Module 1: AI Foundations",
        ig: "Nkeji 1: Ntọala AI",
        yo: "Mọ́dù 1: Ìpìlẹ̀ AI"
      },
      goal: {
        en: "Understand history of tech, smart machines, benefits, and ethical AI risks.",
        ig: "Ghọta akụkọ teknụzụ, igwe mara mma, uru na ihe egwu dị na AI.",
        yo: "Yé kókó ìtàn ìmọ̀-ẹ̀rọ, kọmputa olóye àti ewu rẹ̀."
      },
      badge: { name: "AI Explorer Badge", icon: "⚡" },
      lessons: [
        "History of Technology",
        "History of AI",
        "What is AI?",
        "AI vs Humans",
        "Smart Machines",
        "AI Around Us",
        "Benefits of AI",
        "Risks of AI"
      ]
    },
    {
      id: "j-a1m2",
      name: {
        en: "Module 2: AI in Everyday Life",
        ig: "Nkeji 2: AI na Ndụ Anyị",
        yo: "Mọ́dù 2: AI ní Ayé Gidi"
      },
      goal: {
        en: "Explore AI inside phones, school games, transportation, and innovations.",
        ig: "Mụta ka AI si arụ ọrụ na ekwentị, egwuregwu, na ụgbọala gburugburu Afrika.",
        yo: "Wo bí a ṣe ń lo AI nínú foonu, ìṣeré, ilé-ìwé àti gidi Ilẹ̀ Afrika."
      },
      badge: { name: "Everyday Hero Badge", icon: "🌍" },
      lessons: [
        "AI in Phones",
        "AI in Games",
        "AI in Schools",
        "AI in Healthcare",
        "AI in Transportation",
        "AI in Shopping",
        "AI Innovations"
      ]
    },
    {
      id: "j-a1m3",
      name: {
        en: "Module 3: Learning With AI Tools",
        ig: "Nkeji 3: Mmụta na Ngwa AI",
        yo: "Mọ́dù 3: Kíkọ́ Ẹ̀kọ́ pẹ̀lú Ohun Ìrànlọ́wọ́ AI"
      },
      goal: {
        en: "Discover generative templates, dialogue prompting, and responsible play patterns.",
        ig: "Mụta gbasara generative AI, ịmepụta prompts kwesịrị ekwesị mfe.",
        yo: "Kọ́ lórí bí generative AI àti ìbéèrè dídára ṣe ń mú kíkọ́ yára."
      },
      badge: { name: "Kids Tech Tool Star", icon: "🛠️" },
      lessons: [
        "What is Generative AI?",
        "Talking to AI",
        "Writing Better Prompts",
        "AI for Homework",
        "AI for Creativity",
        "Responsible AI Use"
      ]
    },
    {
      id: "j-a1m4",
      name: {
        en: "Module 4: Future Technology Explorer",
        ig: "Nkeji 4: Onye Nchọpụta Teknụzụ Ọdịnihu",
        yo: "Mọ́dù 4: Olùṣàwárí Ìmọ̀-ẹ̀rọ Iwájú"
      },
      goal: {
        en: "Master blockchain ledgers, digital sandboxes, virtual layers, and Web3 keys.",
        ig: "Ghọta blockchain, akụ dijitalụ, na njikọ nke Web3 ọhụrụ.",
        yo: "Kọ́ nípà blockchain, ohun ìní kọmputa àti ayé foju-inu Web3."
      },
      badge: { name: "Future Tech Champ", icon: "🚀" },
      lessons: [
        "What is Blockchain?",
        "Digital Ownership",
        "Virtual Worlds",
        "Future Jobs",
        "Becoming an Innovator"
      ]
    },

    // ACADEMY 2: DIGITAL CITIZENSHIP & CYBERSECURITY
    {
      id: "j-a2m1",
      name: {
        en: "Module 1: Digital Literacy",
        ig: "Nkeji 1: Ịgụ na Ide Dijitalụ",
        yo: "Mọ́dù 1: Ìmọ̀ Kọmputa Ìbẹ̀rẹ̀"
      },
      goal: {
        en: "Understand essential screen parts, active web links, and digital communication.",
        ig: "Ghọta akụkụ kọmputa bụ isi, njikọ weebụ na nkwukọrịta ziri ezi.",
        yo: "Mọ àwọn ẹ̀rọ kọmputa, bí ayélujára ṣe ń ṣiṣẹ́ àti ìbánisọ̀rọ̀ dídára."
      },
      badge: { name: "Digital Literacy Pro", icon: "🌐" },
      lessons: [
        "Understanding Devices",
        "Internet Basics",
        "Websites vs Apps",
        "Search Skills",
        "Digital Communication"
      ]
    },
    {
      id: "j-a2m2",
      name: {
        en: "Module 2: Cyber Safety",
        ig: "Nkeji 2: Nchekwa Ịntanetị",
        yo: "Mọ́dù 2: Àbò lórí Ayélujára"
      },
      goal: {
        en: "Craft strong secret key grids, identify internet scams, and bypass safety threats.",
        ig: "Rụpụta okwuntughe siri ike, mata scammers na nchekwa gbara ọkpụrụkpụ.",
        yo: "Dá àbò lórí secret keys rẹ, mọ scam tí ó wà àti ààbò fún foonu."
      },
      badge: { name: "Safety Officer", icon: "🔒" },
      lessons: [
        "Passwords",
        "Online Strangers",
        "Scams",
        "Protecting Information",
        "Safe Browsing"
      ]
    },

    // ACADEMY 3: DESIGN & CREATION
    {
      id: "j-a3m1",
      name: {
        en: "Module 1: Design Basics",
        ig: "Nkeji 1: Ntọala Imebe Ihe",
        yo: "Mọ́dù 1: Ìpìlẹ̀ Ìṣetò Ìmọ̀"
      },
      goal: {
        en: "Unleash balance of color contrasts, creative visual posters, and layouts.",
        ig: "Mụta nhazi agba mara mma na imepụta akwụkwọ mmori ziri ezi.",
        yo: "Gbìyànjú àwọn àwọ̀ dídán, sọ ìtàn rẹ nípasẹ̀ àpẹẹrẹ bíi poster gidi."
      },
      badge: { name: "Junior Designer", icon: "📐" },
      lessons: [
        "What is Design?",
        "Colors and Creativity",
        "Storytelling Through Design",
        "Poster Creation",
        "Digital Creativity Project"
      ]
    },
    {
      id: "j-a3m2",
      name: {
        en: "Module 2: Creative Technology",
        ig: "Nkeji 2: Teknụzụ Okike",
        yo: "Mọ́dù 2: Ìmọ̀-ẹ̀rọ Ìṣẹ̀dá"
      },
      goal: {
        en: "Animate visual vectors, create active sliders, and master design frameworks.",
        ig: "Mụta isi ihe nkiri, okike akụkọ ọhụrụ, na ngwa nka dị iche iche.",
        yo: "Kọ́ nípa animation kékeré, ìpìlẹ̀ àwòrán àti àpẹẹrẹ visual tools."
      },
      badge: { name: "Media Creator", icon: "🎬" },
      lessons: [
        "Animation Basics",
        "Visual Storytelling",
        "Creative AI Tools",
        "Designing for Others",
        "Mini Design Challenge"
      ]
    },

    // ACADEMY 4: ADAPTABILITY & LIFELONG LEARNING
    {
      id: "j-a4m1",
      name: {
        en: "Module 1: Thinking Like An Innovator",
        ig: "Nkeji 1: Ịtụgharị Echiche Dị Ka Onye Mmepụta",
        yo: "Mọ́dù 1: Ìrònú bí Olùṣẹ̀dá Tuntun"
      },
      goal: {
        en: "Build critical thinking loops, query techniques, and resilient problem solving.",
        ig: "Zụlite usoro nchọpụta echiche zuru oke, ụzọ ajụjụ isi, na idozi nsogbu.",
        yo: "Kọ́ kókó ìrònú dídára, dídá ìbéèrè jorojoro àti yín dídá afojúsùn."
      },
      badge: { name: "Innovator Brain", icon: "💡" },
      lessons: [
        "Critical Thinking Basics",
        "Asking Better Questions",
        "Learning From Mistakes",
        "Solving Everyday Problems",
        "Innovation Challenge"
      ]
    },
    {
      id: "j-a4m2",
      name: {
        en: "Module 2: Technology Confidence",
        ig: "Nkeji 2: Obi Ike na Teknụzụ",
        yo: "Mọ́dù 2: Ìgboyà Ìmọ̀-ẹ̀rọ Tuntun"
      },
      goal: {
        en: "Establish a fearless approach to new technologies and learning formats.",
        ig: "Zụlite obi ike pụrụ iche ịnakwere ngwa teknụzụ ọhụrụ n'atụghị egwu.",
        yo: "Dá ìgboyà gidi sínu rẹ láti lo àwọn ohun èlò kọmputa tuntun."
      },
      badge: { name: "Confidence Champ", icon: "🛡️" },
      lessons: [
        "Trying New Tools",
        "Learning New Skills",
        "Digital Confidence",
        "Building Resilience",
        "Confidence Quest"
      ]
    }
  ],
  "future builders": [
    // ACADEMY 1: AI & EMERGING TECHNOLOGIES
    {
      id: "p-a1m1",
      name: {
        en: "Module 1: AI Foundations",
        ig: "Nkeji 1: Ntọala AI",
        yo: "Mọ́dù 1: Ìpìlẹ̀ AI"
      },
      goal: {
        en: "Deep dive into model weights, neural activation networks, and deep machine learning.",
        ig: "Nyochaa algoridim dabere n'ụbụrụ mmadụ na usoro nke neural networks dị elu.",
        yo: "Yé kókó algorithm convolutional, neural layers àti bi kọmputa ṣe ń 'ríran'."
      },
      badge: { name: "Teen Tech Innovator", icon: "🚀" },
      lessons: [
        "Evolution of Technology",
        "History of AI",
        "Machine Learning Fundamentals",
        "Deep Learning Basics",
        "Neural Networks",
        "Understanding AI Systems"
      ]
    },
    {
      id: "p-a1m2",
      name: {
        en: "Module 2: Generative AI",
        ig: "Nkeji 2: Generative AI",
        yo: "Mọ́dù 2: Generative AI Gíga"
      },
      goal: {
        en: "Practice prompt structure parameters, remote AI workflows, and ethics validation.",
        ig: "Mụta nhazi prompts kwesịrị ekwesị yana iwu nchịkwa ọma nke AI.",
        yo: "Mọ kíkọ àwọn prompts fún pixels tàbí research dídára fún productivity."
      },
      badge: { name: "Prompt Architect Badge", icon: "📂" },
      lessons: [
        "Introduction to Generative AI",
        "Prompt Engineering Fundamentals",
        "AI Research Techniques",
        "AI Productivity Workflows",
        "AI for Creativity",
        "AI Ethics and Responsibility"
      ]
    },
    {
      id: "p-a1m3",
      name: {
        en: "Module 3: Building With AI",
        ig: "Nkeji 3: Iji AI Na-ewu Ihe",
        yo: "Mọ́dù 3: Ìṣelọ́rọ̀ pẹ̀lú AI"
      },
      goal: {
        en: "Design agentive triggers, automation chains, and draft local startup concept canvases.",
        ig: "Mepụta ngwa egwuregwu, agents ọhụrụ, na startups gbara ọkpụrụkpụ.",
        yo: "Ṣètò àwọn agents rẹ fún automation, ìlànà iṣẹ́ àti startup dídùn loju-ewé."
      },
      badge: { name: "Graduate Career Ready Badge", icon: "🎓" },
      lessons: [
        "AI Products and Solutions",
        "AI Agents",
        "AI Automation",
        "AI Workflows",
        "AI Startup Ideas",
        "AI Capstone Project"
      ]
    },
    {
      id: "p-a1m4",
      name: {
        en: "Module 4: Blockchain & Web3",
        ig: "Nkeji 4: Blockchain & Web3",
        yo: "Mọ́dù 4: Blockchain & Web3 Gíga"
      },
      goal: {
        en: "Master decentralized smart contracts, digital gas ledgers, and token architecture.",
        ig: "Ghọta cryptography node na ka esi mepụta akụ dijitalụ dị nchebe n'onwe ya.",
        yo: "Yé smart contracts, cryptographic ledger dídún àti digital economies tuntun."
      },
      badge: { name: "Future Digital economies", icon: "⛓️" },
      lessons: [
        "Blockchain Fundamentals",
        "Smart Contracts",
        "Digital Assets",
        "Web3 Ecosystems",
        "Future Digital Economies"
      ]
    },

    // ACADEMY 2: DIGITAL CITIZENSHIP & CYBERSECURITY
    {
      id: "p-a2m1",
      name: {
        en: "Module 1: Digital Literacy Essentials",
        ig: "Nkeji 1: Ịgụ na Ide Dijitalụ Zuru Oke",
        yo: "Mọ́dù 1: Ìpìlẹ̀ Ìbánisọ̀rọ̀ Kọmputa Gíga"
      },
      goal: {
        en: "Master fact-checking online content, advanced cloud collaborations and tools.",
        ig: "Mụta ịtụle akụkọ asị na ịntanetị, imekọ ihe ọnụ mfe n'igwe ojii (cloud systems).",
        yo: "Kọ́ ṣíṣe àyẹ̀wò àwọn nǹkan ayélujára (fact-checking) àti tools fún iṣẹ́-papọ̀."
      },
      badge: { name: "Literacy Master", icon: "📚" },
      lessons: [
        "Research Skills",
        "Information Verification",
        "Digital Communication",
        "Collaboration Tools",
        "Digital Productivity"
      ]
    },
    {
      id: "p-a2m2",
      name: {
        en: "Module 2: Cybersecurity Foundations",
        ig: "Nkeji 2: Ntọala Cybersecurity",
        yo: "Mọ́dù 2: Àbò àti Ìbáṣepọ̀ Kọmputa"
      },
      goal: {
        en: "Defend identity breaches, understand phishing tricks, threat patterns, and data privacy.",
        ig: "Mata ka esi echebe okwu nzuzo, ịghọta scammers, na njikwa nzuzo ozi.",
        yo: "Yé phishing ewu gidi, bí a ṣe ń dá àwòrán secure passwords àti data protection gidi."
      },
      badge: { name: "Cyber Defender", icon: "🛡️" },
      lessons: [
        "Cybersecurity Basics",
        "Privacy Protection",
        "Password Security",
        "Threat Detection",
        "Phishing Attacks",
        "Data Protection",
        "Ethical Technology"
      ]
    },

    // ACADEMY 3: DESIGN & CREATION
    {
      id: "p-a3m1",
      name: {
        en: "Module 1: Design Thinking",
        ig: "Nkeji 1: Echiche Nhazi Okike",
        yo: "Mọ́dù 1: Ìrònú Ìṣetò Ìmọ̀"
      },
      goal: {
        en: "Map active user profiles, ideate solution screens, and craft conceptual mockups.",
        ig: "Mụta usoro nhazi echiche, ịchọta mkpa ndị mmadụ na idebe nhazi ngwa ziri ezi.",
        yo: "Yé bí a ṣe ń wo àfojúmọ́ ọlọ́lọ́rọ̀ yanjú ìṣòro (user research) àti prototype."
      },
      badge: { name: "Design Thinker", icon: "💡" },
      lessons: [
        "Design Thinking",
        "Problem Identification",
        "User Research",
        "Idea Generation",
        "Prototyping"
      ]
    },
    {
      id: "p-a3m2",
      name: {
        en: "Module 2: Product Design",
        ig: "Nkeji 2: Nhazi Ngwaahịa",
        yo: "Mọ́dù 2: Ìṣetò Ojú Kọmputa (UI/UX)"
      },
      goal: {
        en: "Build wireframe hierarchies, structured UX architectures, and system layouts.",
        ig: "Ghọta UI na UX, eserese sitemaps, na otu esi mepụta component design systems siri ike.",
        yo: "Kọ́ wireframes dídára fún kọmputa (UI/UX Design), àpẹẹrẹ flow charts àti layout."
      },
      badge: { name: "Product Designer", icon: "📱" },
      lessons: [
        "UI Design",
        "UX Design",
        "Wireframing",
        "Product Prototyping",
        "Design Systems"
      ]
    },
    {
      id: "p-a3m3",
      name: {
        en: "Module 3: Digital Creation",
        ig: "Nkeji 3: Okike Dijitalụ",
        yo: "Mọ́dù 3: Ìṣẹ̀dá Content gidi"
      },
      goal: {
        en: "Formulate branding schemes, compose portfolios, and publish digital channels.",
        ig: "Mụta okike ozi ziri ezi, rụpụta portfolio mfe na njikọ branding nke gị.",
        yo: "Mọ kíkọ́ branding dídùn, digital storytelling àti portfolio fun iṣẹ́."
      },
      badge: { name: "Content Creator", icon: "📹" },
      lessons: [
        "Content Creation",
        "Branding",
        "Storytelling",
        "Creative Portfolios",
        "Design Capstone"
      ]
    },

    // ACADEMY 4: INNOVATION & CAREER READINESS
    {
      id: "p-a4m1",
      name: {
        en: "Module 1: Future Careers",
        ig: "Nkeji 1: Ọrụ Ọdịnihu",
        yo: "Mọ́dù 1: Iṣẹ́-Ọwọ́ Ọjọ́ Iwájú"
      },
      goal: {
        en: "Review tech roles, master resume grids, construct LinkedIn pages and networking.",
        ig: "Mụta maka ọrụ dị iche iche na teknụzụ, okike CV, na LinkedIn ziri ezi.",
        yo: "Kọ́ nípa iṣẹ́-ọwọ́ rẹ padà fún kọmputa, LinkedIn, CV building àti career plan."
      },
      badge: { name: "Career Scout", icon: "💼" },
      lessons: [
        "Technology Careers",
        "Building a Portfolio",
        "LinkedIn Basics",
        "Personal Branding",
        "Networking",
        "Career Planning"
      ]
    },
    {
      id: "p-a4m2",
      name: {
        en: "Module 2: Entrepreneurship & Leadership",
        ig: "Nkeji 2: Nduzi na Okike Ahịa",
        yo: "Mọ́dù 2: Olórí àti Ìpinnu Iṣẹ́ Ahịa"
      },
      goal: {
        en: "Formulate business structures, pitching cases, and team collaborative leadership.",
        ig: "Mụta na nduzi egwuregwu, nti ahịa ziri ezi (pitches), na models azụmahịa.",
        yo: "Kọ́ nípa startup model, teamwork dídára àti bí a ṣe ń ṣe pitch rọrùn fún investors."
      },
      badge: { name: "Teen Entrepreneur", icon: "🚀" },
      lessons: [
        "Leadership",
        "Communication",
        "Teamwork",
        "Startup Thinking",
        "Business Models",
        "Innovation Project"
      ]
    },
    {
      id: "p-a4m3",
      name: {
        en: "Module 3: Professional Readiness",
        ig: "Nkeji 3: Nkwadebe Ọkachamara",
        yo: "Mọ́dù 3: Ìpalémọ́ fún Ayé Iṣẹ́ Gidi"
      },
      goal: {
        en: "Prepare mock speech interviews, freelancing profiles, and find remote global scopes.",
        ig: "Mụta ajụjụ ọnụ gbara ọkpụrụkpụ, freelancing mfe na ohere gburugburu ụwa.",
        yo: "Yé bí a ṣe ń ṣe interview dídára, freelancing channels àti remote global opportunities."
      },
      badge: { name: "Professional Master", icon: "🎖️" },
      lessons: [
        "CV Building",
        "Interview Skills",
        "Freelancing Basics",
        "Global Opportunities",
        "Career Capstone"
      ]
    },

    // ACADEMY 5: ADAPTABILITY & LIFELONG LEARNING
    {
      id: "p-a5m1",
      name: {
        en: "Module 1: Learning Agility",
        ig: "Nkeji 1: Mmụta Ngwa Ngwa",
        yo: "Mọ́dù 1: Ìrọ̀rùn Kíkọ́ Ẹ̀kọ́"
      },
      goal: {
        en: "Master meta-learning strategies, growth mindset loops, and rapid self-directed skillups.",
        ig: "Mụta usoro mmụta dị elu mfe, echiche uto siri ike, na ịmụta nkà n'onwe gị.",
        yo: "Kọ́ ọgbọ́n kíkọ́ ẹ̀kọ́ yára, gbígbé growth mindset àti self-directed learning."
      },
      badge: { name: "Agility Master", icon: "⚡" },
      lessons: [
        "How Learning Works",
        "Learning Faster",
        "Self-Directed Learning",
        "Growth Mindset",
        "Learning Challenge"
      ]
    },
    {
      id: "p-a5m2",
      name: {
        en: "Module 2: Future Adaptability",
        ig: "Nkeji 2: Mgbanwe Ọdịnihu",
        yo: "Mọ́dù 2: Ìyípadà àti Ìpalémọ́ Ọjọ́ Iwájú"
      },
      goal: {
        en: "Navigate fast industrial shifts, apply strategic thinking schemas, and anchor tech resilience.",
        ig: "Mụta ịgbanwe omume gị dabere na mgbanwe teknụzụ ngwa ngwa n'ụwa.",
        yo: "Dáàbò bo ara rẹ lórí rapid technology shifts nípa strategic thinking tuntun."
      },
      badge: { name: "Future Ready Grad", icon: "🎖️" },
      lessons: [
        "Technology Changes Quickly",
        "Emerging Fields",
        "Problem Solving Frameworks",
        "Adaptability In Action",
        "Future Readiness Project"
      ]
    }
  ]
};

// Approved Young Explorers (Ages 6–10) Pathway 1 lesson videos & 3-question quizzes (offline fallback matching Supabase & PDF)
const APPROVED_EARLY_EXPLORERS_LESSONS: Record<string, {
  title: string;
  video_url?: string;
  story: { en: string; ig: string; yo: string };
  quiz: QuizQuestion[];
}> = {
  "t-a1m1-l1": {
    title: "What is Technology?",
    video_url: "https://youtu.be/bHDcP9ao4wk",
    story: {
      en: "Technology is something people make to help us do things! Examples like a smartphone and a light bulb are helpful tools people designed to make everyday tasks easier.",
      ig: "Teknụzụ bụ ihe ndị mmadụ na-emepụta iji nyere anyị aka ime ihe! Ekwentị smart na ọkụ latrik bụ ngwa ọrụ bara uru.",
      yo: "Ìmọ̀-ẹ̀rọ jẹ́ ohun tí àwọn ènìyàn ṣe láti ràn wá lọ́wọ́ láti ṣe nǹkan! Foonu olóye àti gílóòbù iná jẹ́ àpẹẹrẹ."
    },
    quiz: [
      {
        q: { en: "What is technology?", ig: "What is technology?", yo: "What is technology?" },
        opts: {
          en: ["Something people make to help us do things", "Something we eat", "Something that grows on a tree", "A pet animal"],
          ig: ["Something people make to help us do things", "Something we eat", "Something that grows on a tree", "A pet animal"],
          yo: ["Something people make to help us do things", "Something we eat", "Something that grows on a tree", "A pet animal"]
        },
        ans: 0
      },
      {
        q: { en: "Which one is technology?", ig: "Which one is technology?", yo: "Which one is technology?" },
        opts: {
          en: ["A teddy bear", "A smartphone", "An apple", "A tree"],
          ig: ["A teddy bear", "A smartphone", "An apple", "A tree"],
          yo: ["A teddy bear", "A smartphone", "An apple", "A tree"]
        },
        ans: 1
      },
      {
        q: { en: "Which one is technology?", ig: "Which one is technology?", yo: "Which one is technology?" },
        opts: {
          en: ["A light bulb", "A ball", "A banana", "A rock"],
          ig: ["A light bulb", "A ball", "A banana", "A rock"],
          yo: ["A light bulb", "A ball", "A banana", "A rock"]
        },
        ans: 0
      }
    ]
  },
  "t-a1m1-l2": {
    title: "Smart Things Around Us",
    video_url: "https://youtu.be/MlyT33sVKgc",
    story: {
      en: "Some smart things around us can sense, respond, and help us! For example, a smart light is a smart thing, and a smart speaker can listen and respond when we speak.",
      ig: "Ụfọdụ ihe smart dị anyị gburugburu nwere ike ịhụ ihe, zaa, ma nyere anyị aka! Ọkụ smart na igwe okwu smart bụ ihe atụ.",
      yo: "Àwọn nǹkan olóye tó wà láyìíká wa lè mọ nǹkan, dáhùn, kí wọ́n sì ràn wá lọ́wọ́! Iná olóye àti agbọ́hùnsọ olóye jẹ́ àpẹẹrẹ."
    },
    quiz: [
      {
        q: { en: "What can some smart things do?", ig: "What can some smart things do?", yo: "What can some smart things do?" },
        opts: {
          en: ["Sense, respond, and help", "Grow on trees", "Become food", "Fly to the moon"],
          ig: ["Sense, respond, and help", "Grow on trees", "Become food", "Fly to the moon"],
          yo: ["Sense, respond, and help", "Grow on trees", "Become food", "Fly to the moon"]
        },
        ans: 0
      },
      {
        q: { en: "Which one is a smart thing?", ig: "Which one is a smart thing?", yo: "Which one is a smart thing?" },
        opts: {
          en: ["Smart light", "Teddy bear", "Spoon", "Pillow"],
          ig: ["Smart light", "Teddy bear", "Spoon", "Pillow"],
          yo: ["Smart light", "Teddy bear", "Spoon", "Pillow"]
        },
        ans: 0
      },
      {
        q: { en: "Which smart thing can listen and respond when we speak?", ig: "Which smart thing can listen and respond when we speak?", yo: "Which smart thing can listen and respond when we speak?" },
        opts: {
          en: ["Smart screen", "Smart speaker", "Smart light", "Smart fridge"],
          ig: ["Smart screen", "Smart speaker", "Smart light", "Smart fridge"],
          yo: ["Smart screen", "Smart speaker", "Smart light", "Smart fridge"]
        },
        ans: 1
      }
    ]
  },
  "t-a1m1-l3": {
    title: "Technology at Home",
    video_url: "https://youtu.be/dmvw4GGH4KY",
    story: {
      en: "Technology helps our families at home every day! A light helps us see when it is dark, a fan helps us stay comfortable when it is hot, and a tablet or computer helps us learn new things.",
      ig: "Teknụzụ na-enyere ezinụlọ anyị aka n'ụlọ kwa ụbọchị! Ọkụ na-enyere anyị aka ịhụ ụzọ n'ọchịchịrị, fan na-eme ka ahụ dị jụụ, kọmputa na-enyere anyị aka ịmụ ihe ọhụrụ.",
      yo: "Ìmọ̀-ẹ̀rọ ń ran ìdílé wa lọ́wọ́ nílé lójoojúmọ́! Iná ń jẹ́ ká ríran nínú òkùnkùn, abẹ́bẹ́ ń mú kí ara tutù, tábílẹ́ẹ̀tì tàbí kọmputa sì ń jẹ́ ká kọ́ nǹkan tuntun."
    },
    quiz: [
      {
        q: { en: "Which technology helps us see when it is dark?", ig: "Which technology helps us see when it is dark?", yo: "Which technology helps us see when it is dark?" },
        opts: {
          en: ["A pillow", "A light", "A spoon", "A fan"],
          ig: ["A pillow", "A light", "A spoon", "A fan"],
          yo: ["A pillow", "A light", "A spoon", "A fan"]
        },
        ans: 1
      },
      {
        q: { en: "What can a fan help us do?", ig: "What can a fan help us do?", yo: "What can a fan help us do?" },
        opts: {
          en: ["Stay comfortable when it is hot", "Read a book", "Talk to someone far away", "Cook food"],
          ig: ["Stay comfortable when it is hot", "Read a book", "Talk to someone far away", "Cook food"],
          yo: ["Stay comfortable when it is hot", "Read a book", "Talk to someone far away", "Cook food"]
        },
        ans: 0
      },
      {
        q: { en: "What can we use technology like a tablet or computer to do at home?", ig: "What can we use technology like a tablet or computer to do at home?", yo: "What can we use technology like a tablet or computer to do at home?" },
        opts: {
          en: ["Learn new things", "Sleep on it", "Eat food", "Wear it as a hat"],
          ig: ["Learn new things", "Sleep on it", "Eat food", "Wear it as a hat"],
          yo: ["Learn new things", "Sleep on it", "Eat food", "Wear it as a hat"]
        },
        ans: 0
      }
    ]
  },
  "t-a1m1-l4": {
    title: "Technology at School",
    video_url: "https://youtu.be/ty86odcrjPc",
    story: {
      en: "Technology is all around us at home and at school! A television, projector, or computer is technology that helps teachers teach and children learn many useful things.",
      ig: "Teknụzụ dị anyị gburugburu n'ụlọ na n'ụlọ akwụkwọ! Igwe onyonyo na kọmputa na-enyere ndị nkuzi aka ịkụzi ihe na ụmụaka ịmụ ihe.",
      yo: "Ìmọ̀-ẹ̀rọ wà láyìíká wa nílé àti nílé-ìwé! Tẹlifíṣọ̀nù àti kọmputa ń ran àwọn olùkọ́ lọ́wọ́ láti kọ́ni àti àwọn ọmọdé láti kọ́ ẹ̀kọ́."
    },
    quiz: [
      {
        q: { en: "Which one is technology?", ig: "Which one is technology?", yo: "Which one is technology?" },
        opts: {
          en: ["A television", "A pillow", "A spoon", "A plant"],
          ig: ["A television", "A pillow", "A spoon", "A plant"],
          yo: ["A television", "A pillow", "A spoon", "A plant"]
        },
        ans: 0
      },
      {
        q: { en: "What can technology help us do at home?", ig: "What can technology help us do at home?", yo: "What can technology help us do at home?" },
        opts: {
          en: ["Learn new things", "Eat a spoon", "Sleep on a fan", "Grow a tree"],
          ig: ["Learn new things", "Eat a spoon", "Sleep on a fan", "Grow a tree"],
          yo: ["Learn new things", "Eat a spoon", "Sleep on a fan", "Grow a tree"]
        },
        ans: 0
      },
      {
        q: { en: "How can technology help us at school?", ig: "How can technology help us at school?", yo: "How can technology help us at school?" },
        opts: {
          en: ["It can help teachers teach and children learn.", "It can become our lunch.", "It can turn into a teddy bear.", "It can clean the floor."],
          ig: ["It can help teachers teach and children learn.", "It can become our lunch.", "It can turn into a teddy bear.", "It can clean the floor."],
          yo: ["It can help teachers teach and children learn.", "It can become our lunch.", "It can turn into a teddy bear.", "It can clean the floor."]
        },
        ans: 0
      }
    ]
  },
  "t-a1m2-l1": {
    title: "AI Can See",
    video_url: "https://youtu.be/Fno0L_XsdWM",
    story: {
      en: "People use their eyes to see! Cameras can capture pictures, and some Artificial Intelligence systems can process pictures and recognize things inside the picture.",
      ig: "Ndị mmadụ na-eji anya ha ahụ ụzọ! Igwefoto na-ese foto, ụfọdụ usoro AI nwekwara ike ịmata ihe dị n'ime foto ahụ.",
      yo: "Àwọn ènìyàn ń lo ojú wọn láti ríran! Kámẹ́rà lè ya fọ́tò, àwọn ẹ̀rọ AI kan sì lè dá àwọn nǹkan inú fọ́tò náà mọ̀."
    },
    quiz: [
      {
        q: { en: "What do people use to see?", ig: "What do people use to see?", yo: "What do people use to see?" },
        opts: {
          en: ["Their ears", "Their eyes", "A microphone", "A speaker"],
          ig: ["Their ears", "Their eyes", "A microphone", "A speaker"],
          yo: ["Their ears", "Their eyes", "A microphone", "A speaker"]
        },
        ans: 1
      },
      {
        q: { en: "What can a camera do?", ig: "What can a camera do?", yo: "What can a camera do?" },
        opts: {
          en: ["Capture a picture", "Eat food", "Sing a song", "Run fast"],
          ig: ["Capture a picture", "Eat food", "Sing a song", "Run fast"],
          yo: ["Capture a picture", "Eat food", "Sing a song", "Run fast"]
        },
        ans: 0
      },
      {
        q: { en: "What can some AI systems do with pictures?", ig: "What can some AI systems do with pictures?", yo: "What can some AI systems do with pictures?" },
        opts: {
          en: ["Recognize some things in the picture", "Eat the picture", "Sleep inside the picture", "Throw the picture"],
          ig: ["Recognize some things in the picture", "Eat the picture", "Sleep inside the picture", "Throw the picture"],
          yo: ["Recognize some things in the picture", "Eat the picture", "Sleep inside the picture", "Throw the picture"]
        },
        ans: 0
      }
    ]
  },
  "t-a1m2-l2": {
    title: "AI Can Listen",
    video_url: "https://youtu.be/I9DkSDMDHGg",
    story: {
      en: "People use their ears to hear sounds! Microphones can capture sounds, and some Artificial Intelligence systems can recognize spoken words and respond.",
      ig: "Ndị mmadụ na-eji ntị ha anụ ụda! Igwe okwu (microphone) na-anata ụda, ụfọdụ usoro AI nwekwara ike ịmata okwu a gwara ha ma zaa.",
      yo: "Àwọn ènìyàn ń lo etí wọn láti gbọ́ ohùn! Kọ́nrín-ohùn (microphone) lè gba ohùn, àwọn ẹ̀rọ AI kan sì lè mọ ọ̀rọ̀ tí a sọ kí wọ́n sì dáhùn."
    },
    quiz: [
      {
        q: { en: "What do people use to hear sounds?", ig: "What do people use to hear sounds?", yo: "What do people use to hear sounds?" },
        opts: {
          en: ["Their eyes", "Their ears", "A camera", "A screen"],
          ig: ["Their eyes", "Their ears", "A camera", "A screen"],
          yo: ["Their eyes", "Their ears", "A camera", "A screen"]
        },
        ans: 1
      },
      {
        q: { en: "What can a microphone do?", ig: "What can a microphone do?", yo: "What can a microphone do?" },
        opts: {
          en: ["Capture sounds", "Eat food", "Take a nap", "Play games"],
          ig: ["Capture sounds", "Eat food", "Take a nap", "Play games"],
          yo: ["Capture sounds", "Eat food", "Take a nap", "Play games"]
        },
        ans: 0
      },
      {
        q: { en: "What can some Artificial Intelligence systems do with sounds or spoken words?", ig: "What can some Artificial Intelligence systems do with sounds or spoken words?", yo: "What can some Artificial Intelligence systems do with sounds or spoken words?" },
        opts: {
          en: ["Recognize some words and respond", "Turn into a person", "Eat the sounds", "Go to sleep"],
          ig: ["Recognize some words and respond", "Turn into a person", "Eat the sounds", "Go to sleep"],
          yo: ["Recognize some words and respond", "Turn into a person", "Eat the sounds", "Go to sleep"]
        },
        ans: 0
      }
    ]
  },
  "t-a1m2-l3": {
    title: "AI Can Talk",
    video_url: "https://youtu.be/Bmn0XBDXcy4",
    story: {
      en: "Some Artificial Intelligence systems can respond to spoken words and use technology to communicate with people! A voice assistant can respond when we speak to it, using technology rather than a human mouth.",
      ig: "Ụfọdụ usoro AI nwere ike ịza okwu a gwara ha ma jiri teknụzụ kwurịta okwu! Voice assistant na-eji teknụzụ aza anyị mgbe anyị kwuru okwu.",
      yo: "Àwọn ẹ̀rọ AI kan lè dáhùn sí ọ̀rọ̀ tí a sọ nípa lílo ìmọ̀-ẹ̀rọ! Olùrànlọ́wọ́ ohùn (voice assistant) ń lo ìmọ̀-ẹ̀rọ láti dáhùn nígbà tí a bá bá a sọ̀rọ̀."
    },
    quiz: [
      {
        q: { en: "What can some AI systems do after receiving spoken words?", ig: "What can some AI systems do after receiving spoken words?", yo: "What can some AI systems do after receiving spoken words?" },
        opts: {
          en: ["Respond to people", "Eat the words", "Turn into a toy", "Run away"],
          ig: ["Respond to people", "Eat the words", "Turn into a toy", "Run away"],
          yo: ["Respond to people", "Eat the words", "Turn into a toy", "Run away"]
        },
        ans: 0
      },
      {
        q: { en: "What can a voice assistant do?", ig: "What can a voice assistant do?", yo: "What can a voice assistant do?" },
        opts: {
          en: ["Respond when we speak to it", "Sleep all day", "Eat food", "Watch TV"],
          ig: ["Respond when we speak to it", "Sleep all day", "Eat food", "Watch TV"],
          yo: ["Respond when we speak to it", "Sleep all day", "Eat food", "Watch TV"]
        },
        ans: 0
      },
      {
        q: { en: "Can AI talk exactly like a person?", ig: "Can AI talk exactly like a person?", yo: "Can AI talk exactly like a person?" },
        opts: {
          en: ["Yes, AI is a human", "No, AI uses technology to respond to people.", "Yes, AI has a human mouth", "Yes, AI goes to school"],
          ig: ["Yes, AI is a human", "No, AI uses technology to respond to people.", "Yes, AI has a human mouth", "Yes, AI goes to school"],
          yo: ["Yes, AI is a human", "No, AI uses technology to respond to people.", "Yes, AI has a human mouth", "Yes, AI goes to school"]
        },
        ans: 1
      }
    ]
  },
  "t-a1m2-l4": {
    title: "AI Can Learn Patterns",
    video_url: "https://youtu.be/d24j_K4puCk",
    story: {
      en: "Some Artificial Intelligence systems work with pictures, sounds, and patterns! By noticing repeating patterns in pictures, sounds, or spoken words, AI can recognize things and respond helpfully.",
      ig: "Ụfọdụ usoro AI na-arụ ọrụ na foto, ụda, na usoro (patterns)! Site n'ịchọpụta usoro na-emegharị emegharị, AI nwere ike ịmata ihe ma zaa nke ọma.",
      yo: "Àwọn ẹ̀rọ AI kan ń ṣiṣẹ́ pẹ̀lú fọ́tò, ohùn, àti àpẹẹrẹ (patterns)! Nípa kíyèsí àwọn àpẹẹrẹ tó ń tún ara wọn ṣe, AI lè dá nǹkan mọ̀ kí ó sì dáhùn."
    },
    quiz: [
      {
        q: { en: "What can some Artificial Intelligence systems work with?", ig: "What can some Artificial Intelligence systems work with?", yo: "What can some Artificial Intelligence systems work with?" },
        opts: {
          en: ["Pictures and sounds", "Food and toys", "Pillows and blankets", "Shoes and socks"],
          ig: ["Pictures and sounds", "Food and toys", "Pillows and blankets", "Shoes and socks"],
          yo: ["Pictures and sounds", "Food and toys", "Pillows and blankets", "Shoes and socks"]
        },
        ans: 0
      },
      {
        q: { en: "What can a microphone do?", ig: "What can a microphone do?", yo: "What can a microphone do?" },
        opts: {
          en: ["Capture sounds", "Take pictures", "Turn into a person", "Clean the house"],
          ig: ["Capture sounds", "Take pictures", "Turn into a person", "Clean the house"],
          yo: ["Capture sounds", "Take pictures", "Turn into a person", "Clean the house"]
        },
        ans: 0
      },
      {
        q: { en: "What can some Artificial Intelligence systems do?", ig: "What can some Artificial Intelligence systems do?", yo: "What can some Artificial Intelligence systems do?" },
        opts: {
          en: ["Recognize some pictures, sounds, or spoken words and respond", "Become a human", "Eat and sleep like a child", "Cook dinner"],
          ig: ["Recognize some pictures, sounds, or spoken words and respond", "Become a human", "Eat and sleep like a child", "Cook dinner"],
          yo: ["Recognize some pictures, sounds, or spoken words and respond", "Become a human", "Eat and sleep like a child", "Cook dinner"]
        },
        ans: 0
      }
    ]
  }
};

// Returns interactive stories and matching quizzes on the fly for all lessons!
function generateLessonDetails(lId: string, title: string, ageGroup: AgeGroup): Partial<Lesson> {
  const codeNum = lId.split("-l")[1] || "1";
  const codeChar = title.substring(0, 1).toUpperCase();
  const code = `${codeChar}${codeNum}`;

  if (APPROVED_EARLY_EXPLORERS_LESSONS[lId]) {
    const approved = APPROVED_EARLY_EXPLORERS_LESSONS[lId];
    return {
      id: lId,
      title: { en: approved.title, ig: approved.title, yo: approved.title },
      code: `L${codeNum}`,
      duration: "⏱ 3 min",
      type: "story",
      video_url: approved.video_url,
      story: approved.story,
      quiz: approved.quiz
    };
  }

  // Custom tailored content engine based on matching words or topics in lesson title
  let enStory = "";
  let igStory = "";
  let yoStory = "";
  
  // Custom quiz questions matching the exact lesson topic
  let qEnPost = "";
  let qIgPost = "";
  let qYoPost = "";
  let qOptsEn: string[] = [];
  let qOptsIg: string[] = [];
  let qOptsYo: string[] = [];
  let correctOpt = 0;

  const t = title.toLowerCase();

  if (t.includes("technology") || t.includes("devices") || t.includes("internet")) {
    enStory = `Welcome! Technology represents the helper tools that humans design and build to solve everyday problems. Inventions like pencils, chairs, refrigerators, television sets, and smartphones are key examples of technology! They make work simpler and allow us to learn together across distances.`;
    igStory = `Nnọọ! Teknụzụ na-anọchi anya ngwa ọrụ dị iche iche anyị ji eme ka ọrụ dị mfe. Ihe ndị dị ka ekwentị, pensụl, na igwe kwụ otu ebe bụ ihe atụ! Ha na-enyere anyị aka ịmụ ihe na imezu ọrụ ọsọ ọsọ.`;
    yoStory = `Kábọ̀! Ìmọ̀-ẹ̀rọ ni àwọn ohun èlò tí a kọ mọ́ láti ran ènìyàn lọ́wọ́ nínú iṣẹ́ gbogbo. Foonu, alèfò kọmputa, kẹkẹ́ àti tàbìlì jẹ́ àpẹẹrẹ tó dán mọ́ràn!`;
    
    qEnPost = "What is the primary goal of creating technology?";
    qIgPost = "Kedu ihe bụ isi ebumnuche nke imepụta teknụzụ?";
    qYoPost = "Kí ni gbágbe pàtàkì tí a fi ń ṣe ìmọ̀-ẹ̀rọ?";
    qOptsEn = ["To build helpful tools that solve real problems", "To replace outdoor play entirely"];
    qOptsIg = ["Ịmepụta ngwa ọrụ na-edozi nsogbu", "Iji dochie egwuregwu gbara ọtụmọ"];
    qOptsYo = ["Láti ṣe àwọn ohun èlò tó lè yanjú ìṣòro", "Láti dín àyè ìṣeré kù patapata"];
    correctOpt = 0;
  }
  else if (t.includes("ai") || t.includes("artificial") || t.includes("intelligence") || t.includes("smart") || t.includes("machine") || t.includes("helper")) {
    enStory = `Meet friendly AI helpers! Artificial Intelligence means computer programs that are trained to learn from examples. Just like you learn from stories, smart computers look at thousands of photos of apples to recognize a green apple! They can answer questions, play custom songs, and guide driverless cars safely.`;
    igStory = `Zute onye enyemaka AI! Artificial Intelligence pụtara kọmputa nwere ike ịmụta ihe site na ihe atụ na foto tupu anyị ajuo ya ajụjụ. Ọ na-arụ ọrụ dika ụbụrụ mmadụ site na data anyị nyere ya!`;
    yoStory = `Pàdé AI tí ó jẹ́ ọ̀rẹ́ kọmputa gidi! AI túmọ̀ sí kọmputa tó lè ronú nípasẹ̀ àpẹẹrẹ bíi fọ́tò tàbí ìtàn púpọ̀ láti mọ nǹkan. Ó lè kọrin papọ̀, dáhùn ìbéèrè kọmputa rẹ dídára.`;
    
    qEnPost = "How does Artificial Intelligence (AI) learn to recognize things?";
    qIgPost = "Kedu ka AI si amụta ịmata ihe dị iche iche?";
    qYoPost = "Báwo ni AI ṣe ń kọ́ láti mọ nǹkan oríṣìíraṣìí?";
    qOptsEn = ["By analyzing thousands of examples and training data", "By using biological human eyes and ears"];
    qOptsIg = ["Site n'ịtụle ọtụtụ pụkụ ihe atụ na data anyị nyere ya", "Site n'iji anya na ntị mmadụ adị ndụ"];
    qOptsYo = ["Nípasẹ̀ àpẹẹrẹ dídára àti data tó pọ̀", "Nípasẹ̀ lilo ojú àti etí ènìyàn gidi"];
    correctOpt = 0;
  }
  else if (t.includes("kobe") || t.includes("chibi") || t.includes("companion")) {
    enStory = `Hello there! I am your companion on this learning journey. My goal is to make sure you have tons of fun while building tech solutions. I will support you under every module, share tips, and celebrate your points! Let's build something awesome.`;
    igStory = `Nnọọ enyi m! Mụ na gị ga-agba ndagharị n'ụwa ndụ nke teknụzụ. Agam akuziri gị ihe ọhụrụ ma na-enyere gị aka inweta akara ọma na badges n'ụzọ dị mfe!`;
    yoStory = `Pàlọ́mọ́ ọ̀rẹ́ mi! Èmi ni akẹgbẹ́ rẹ lórí ìrìn-àjò ìmọ̀ yìí. Mò wà láti lò ọ́ lọ́wọ́ láti sọ ìtàn kọmputa dídùn àti gba badges púpọ̀!`;
    
    qEnPost = "What is your friendly companion helping you to complete?";
    qIgPost = "Kedu enyemaka enyi gị na-enye gị oge niile?";
    qYoPost = "Kí ni ọ̀rẹ́ rẹ tuntun ń ràn ọ́ lọ́wọ́ láti parí?";
    qOptsEn = ["To learn tech, solve quizzes, and earn awesome achievements", "To do house cleaning chores"];
    qOptsIg = ["Ịmụ teknụzụ, ịza ajụjụ na inweta badges", "Ịrụ ọrụ nhicha ụlọ"];
    qOptsYo = ["Láti kọ́ ìmọ̀ kọmputa, dahùn ìbéèrè, àti gba badges", "Láti gba koriko nínú ọgbà"];
    correctOpt = 0;
  }
  else if (t.includes("password") || t.includes("safety") || t.includes("privacy") || t.includes("protection") || t.includes("browsing") || t.includes("safe") || t.includes("security") || t.includes("cyber")) {
    enStory = `Security is a super power! Cyber safety means locking your digital identity with strong passwords, just like parent locking the door at home. Strong passwords should contain unique letters, numbers, and symbols. Under no condition should you share secret keys with friends or strangers online.`;
    igStory = `Nchekwa bụ ike siri ike! Nchegbe ozi gị na ịntanetị pụtara iji okwuntughe siri ike mechie ụzọ gị, dịka nne na nna si akpọchi ụzọ ụlọ. Ejila ya gwa onye ọ bụla ọzọ ma ọ bụghị ndị nne na nna gị!`;
    yoStory = `Ààbò jẹ́ ohun kókó! Bí a ṣe ń dá ààbò lórí secret keys rẹ sọ̀rọ̀ bíi ká tilekùn ilé. Má ṣe sọ ọ̀rọ̀-ìpamọ́ (password) rẹ fún ẹnikẹ́ni yàtọ̀ fún mọmí tàbí dádì gbogbo.`;
    
    qEnPost = "Why should we use strong, unique passwords?";
    qIgPost = "Gịnị kpatara anyị ga-eji jiri okwuntughe siri ike?";
    qYoPost = "Kí nìdí tí a fi ń lo ọ̀rọ̀-ìpamọ́ tó lágbára?";
    qOptsEn = ["To prevent unauthorized access to our private profiles", "To make it easier for strangers to guess"];
    qOptsIg = ["Iji chebe ozi nzuzo anyị ka onye ọzọ ghara ịhụ ya", "Iji mee ka ọ dịrị ndị ọbịa mfe ịmata ya"];
    qOptsYo = ["Láti dá ààbò lórí profiles rẹ kí ẹnikẹ́ni má lè wọle", "Láti jẹ́ kí ó rọrùn fún àwọn àlejò láti mọ ọ́"];
    correctOpt = 0;
  }
  else if (t.includes("design") || t.includes("drawing") || t.includes("colors") || t.includes("shapes") || t.includes("wireframe") || t.includes("portfolio")) {
    enStory = `Let's create together! Design is about choosing colors, shapes, and structural layouts to make information beautiful and incredibly easy to find. Before code is written, designers draft simple blueprint sketches called 'wireframes' to visualize panels and buttons perfectly.`;
    igStory = `Ka anyị mepụta ihe! Nhazi nka pụtara ijikọ agba na ụdị dị iche iche iji mee ka ozi nwee nnukwu mma. Tupu koodu, ndị na-ese nka na-ese ihe nkiri obere oge iji hụ ka ihuenyo ga-adị!`;
    yoStory = `Ẹ jẹ́ ká ṣẹ̀dá papọ̀! Ìṣetò mọ́ àwọ̀ àti àwòrán dídára láti ba ojú kọmputa rẹ dún mọ́ràn àti rọrùn fún lilo. A máa ń kọ́kọ́ ya wireframes dídùn kí a tó kọ koodu.`;
    
    qEnPost = "What is a 'wireframe' used for in modern product design?";
    qIgPost = "Kedu ihe e ji wireframe arụ ọrụ na nhazi nka kọmputa?";
    qYoPost = "Kí ni a ń lo 'wireframe' fún nínú ìṣetò kọmputa gidi?";
    qOptsEn = ["A basic layout blueprint to plan button alignments", "A physical metal frame to hold laptop batteries"];
    qOptsIg = ["Usoro nhazi obere iji hụ ebe bọtịnụ ga-anọ", "Igwe anaghị agba nchara na-ejide batrị kọmputa"];
    qOptsYo = ["Àpẹẹrẹ dídùn láti mọ bí bọ́tìnì àti ojú-ewé ṣe máa wà", "Gba irin kọmputa kan láti mú rọrùn fún laptop"];
    correctOpt = 0;
  }
  else if (t.includes("mistake") || t.includes("learning every day") || t.includes("exploring new ideas") || t.includes("working together") || t.includes("adventure quest")) {
    enStory = `Every day is a new learning adventure! Curious explorers know that asking questions, trying new ideas, working together with friends, and learning from mistakes help our brains grow stronger and smarter.`;
    igStory = `Ụbọchị ọ bụla bụ njem mmụta ọhụrụ! Ndị nchọpụta maara na ịjụ ajụjụ, ịnwale echiche ọhụrụ, ịrụkọ ọrụ ọnụ, na ịmụta ihe site na mmejọ na-eme ka ụbụrụ anyị sie ike.`;
    yoStory = `Ojoojúmọ́ ni ìrìn-àjò ẹ̀kọ́ tuntun! Àwọn olùṣàwárí mọ̀ pé bíbéèrè ìbéèrè, gbígbìyànjú èrò tuntun, ṣíṣiṣẹ́ papọ̀, àti kíkọ́ láti inú àṣìṣe ń mú kí ọpọlọ wa lágbára sí i.`;

    qEnPost = `What helps an explorer succeed in "${title}"?`;
    qIgPost = `Kedu ihe na-enyere onye nchọpụta aka ịga nke ọma na "${title}"?`;
    qYoPost = `Kí ni ó ń ran olùṣàwárí lọ́wọ́ láti ṣàṣeyọrí nínú "${title}"?`;
    qOptsEn = ["Staying curious, trying again after mistakes, and working together", "Giving up the first time something feels tricky"];
    qOptsIg = ["Ịchọ ịmata ihe, ịnwale ọzọ mgbe e mejọrọ, na ịrụkọ ọrụ ọnụ", "Ịkwụsị ozugbo ihe siri ike"];
    qOptsYo = ["Níní ìfẹ́-ìmọ̀, gbígbìyànjú lẹ́ẹ̀kan sí i, àti ṣíṣiṣẹ́ papọ̀", "Ṣíṣíwọ́ lẹ́sẹ̀kẹsẹ̀ tí nǹkan bá le"];
    correctOpt = 0;
  }
  else if (t.includes("career") || t.includes("careers") || t.includes("startup") || t.includes("dream") || t.includes("business") || t.includes("linkedin") || t.includes("cv") || t.includes("professional") || t.includes("freelancing") || t.includes("global")) {
    enStory = `Step into the future of work! Modern careers in technology revolve around product design, software engineering, and innovative entrepreneurship. Creating a digital portfolio to display your creations helps connect you with teams globally and launch your dream pathways.`;
    igStory = `Nye aka n'ọrụ ọdịnihu gị! Ọrụ na teknụzụ gụnyere imepụta ngwa, ide koodu, na imeghe startups ọhụrụ. Okike nke portfolio gị na-akwado gị maka ohere gburugburu ụwa!`;
    yoStory = `Gbìyànjú fún iṣẹ́-iwájú rẹ! Iṣẹ́ tuntun lórí kọmputa dá lórí kọ́dù kíkọ, UI/UX design, àti startup dídá fún Nigeria àti gbogbo ayé gidi. Pésè portfolio rẹ dídára!`;
    
    qEnPost = "How does building a digital portfolio help tech career explorers?";
    qIgPost = "Kedu ka portfolio gị si enyere gị aka n'ọrụ gbara ọkpụrụkpụ?";
    qYoPost = "Báwo ni portfolio rẹ ṣe ń ràn ọ́ lọ́wọ́ fún iṣẹ́-iwájú?";
    qOptsEn = ["By proving your real product concepts to future employers", "By increasing your score in arcade video games"];
    qOptsIg = ["Iji gosipụta ọrụ gị na nkà gị nye ndị isi ọrụ", "Iji mụbaa akara gị n'egwuregwu kọmputa nkịtị"];
    qOptsYo = ["Nípasẹ̀ àpẹẹrẹ iṣẹ́ dídùn tí o ti ṣe fún àwọn èrò ahịa", "Láti kọrin púpọ̀ síi nínú foonu lásán"];
    correctOpt = 0;
  }
  else if (t.includes("blockchain") || t.includes("web3") || t.includes("contracts") || t.includes("contract") || t.includes("ownership")) {
    enStory = `Welcome to the secure decentralized web! Blockchain is a shared digital ledger running across thousands of computers globally. Information added to this record contains special cryptography keys and cannot be altered or erased by anyone. This enables digital ownership!`;
    igStory = `Ghọta nke ọma banyere blockchain! Blockchain dị ka akwụkwọ ndekọ ozi nke kọmputa dị iche iche na-ekerịta n'ụwa. Ọ bụ ebe dị nchebe nke ukwuu nke na onye ọ bụla enweghị ike ihichapụ ozi nwere okwuntughe cryptograph!`;
    yoStory = `Kábọ̀ sí ayé Web3! Blockchain jẹ́ ìwé-ndekọ kọmputa gbogbo ayélujára tí ó mọ ríràn lọ́wọ́ nípà encryption àti digital assets dídára tí ẹnikẹ́ni kò lè parẹ́.`;
    
    qEnPost = "What is a key security feature of blockchain records?";
    qIgPost = "Kedu ihe bụ isi nchekwa dị na blockchain?";
    qYoPost = "Kí ni àbò gidi tí ó wà nínú blockchain records?";
    qOptsEn = ["They are secure, decentralized, and immutable (cannot be changed)", "They can be easily edited or deleted by anyone online"];
    qOptsIg = ["Ha nwere nchebe, kesasịrị, ma ghara ịgbanwe agbanwe", "Onye ọ bụla nwere ike ihichapụ ya ma ọ bụ gbanwee ya"];
    qOptsYo = ["Wọn ní àbò dídára, dákọ̀ tí kò ṣeé parẹ́ tàbí yípadà", "Ẹnikẹ́ni lè yí ìwé náà padà lórí foonu rẹ̀"];
    correctOpt = 0;
  }
  else {
    // Custom fallback dynamic content incorporating lesson title nicely
    enStory = `Welcome to the active lesson on "${title}"! In this interactive module, Kobe and Chibi guide you step-by-step through the core technological ideas behind this topic. Learn how to innovate, develop active mental problem-solving patterns, and acquire real edtech skills!`;
    igStory = `Nnọọ na nkuzi anyị gbasara "${title}"! Mụta ihe zuru oke banyere isi ihe dị na ya ma rụọ ọrụ ọma site na ntinye echiche na imepụta ụzọ mmụta dị elu gị na Kobe na Chibi.`;
    yoStory = `Kábọ̀ sí ẹ̀kọ́ asọ̀rọ̀ lórí "${title}"! Níní ìmọ̀ dídára lẹ́gbẹ́ Kobe àti Chibi láti kọ́ ọ nípà sọfitiwe àti ìlànà títun láti yàgò fún ìṣòro.`;
    
    qEnPost = `Which of the following describes the best way to approach "${title}"?`;
    qIgPost = `Kedu ụzọ kacha mma iji mezuo amamihe gbasara "${title}"?`;
    qYoPost = `Kí ni ọ̀nà tó dára jùlọ láti gba ìmọ̀ lórí "${title}"?`;
    qOptsEn = ["By reviewing lessons, practicing concepts, and asking questions", "By rushing without reading"];
    qOptsIg = ["Site n'ịtụle ihe mmụta, ime koodu, na ịjụ ndị enyemaka ajụjụ", "Site n'ịgba ọsọ na-agụghị akwụkwọ"];
    qOptsYo = ["Nípasẹ̀ àyẹ̀wò ẹ̀kọ́, ìṣeré pẹ̀lú ọgbọ́n àti ìbéèrè dídá", "Láti yára parí láìka ìwé rárá"];
    correctOpt = 0;
  }

  const quiz: QuizQuestion[] = [
    {
      q: {
        en: qEnPost,
        ig: qIgPost,
        yo: qYoPost
      },
      opts: {
        en: qOptsEn,
        ig: qOptsIg,
        yo: qOptsYo
      },
      ans: correctOpt
    }
  ];

  return {
    id: lId,
    title: { en: title, ig: title, yo: title },
    code,
    duration: "⏱ 3 min", // The explicit user required time duration format
    type: t.includes("challenge") || t.includes("project") || t.includes("capstone") ? "project" : "story",
    story: {
      en: enStory,
      ig: igStory,
      yo: yoStory
    },
    quiz
  };
}

// Helper to hydrate a static ModuleMetadata block into a full Module
function hydrateStaticModule(mMeta: ModuleMetadata, ageGroupKey: AgeGroup): Module {
  const lessons: Lesson[] = mMeta.lessons.map((lessonTitle, idx) => {
    const lessonId = `${mMeta.id}-l${idx + 1}`;
    const baseDetails = generateLessonDetails(lessonId, lessonTitle, ageGroupKey);

    return {
      id: lessonId,
      title: baseDetails.title || { en: lessonTitle, ig: lessonTitle, yo: lessonTitle },
      code: baseDetails.code || `L${idx + 1}`,
      duration: baseDetails.duration || "⏱ 3 min",
      type: baseDetails.type || "story",
      video_url: baseDetails.video_url,
      story: baseDetails.story,
      quiz: baseDetails.quiz || []
    } as Lesson;
  });

  return {
    id: mMeta.id,
    name: {
      en: mMeta.name.en,
      ig: mMeta.name.ig,
      yo: mMeta.name.yo
    },
    goal: {
      en: mMeta.goal.en,
      ig: mMeta.goal.ig,
      yo: mMeta.goal.yo
    },
    badge: {
      name: mMeta.badge.name,
      icon: mMeta.badge.icon
    },
    lessons
  } as Module;
}

// Convert base flat metadata definitions dynamically into full Course definitions
function getDynamicCourse(ageGroupKey: AgeGroup): Course {
  const metadataList = ACADEMY_METADATA[ageGroupKey] || [];

  // Check for administrative localized curriculum overrides from in-memory cache
  if (typeof window !== "undefined") {
    try {
      const cache = (window as any).__supabaseCurriculumData;
      if (cache && Array.isArray(cache.pathways) && Array.isArray(cache.modules)) {
        // The database uses full names like "young innovators", but we will also match "young" just in case.
        const mapKeyShort = ageGroupKey === "early explorers" ? "early" : ageGroupKey === "young innovators" ? "young" : "future";
        const mapKeyFull = ageGroupKey;

        // 1. Get pathways for this age group
        const groupPathways = cache.pathways.filter((p: any) => p.age_group === mapKeyShort || p.age_group === mapKeyFull);
        const pathwayIds = groupPathways.map((p: any) => p.id);

        // 2. Get modules for this age_group or linking pathway
        const groupModules = cache.modules.filter((m: any) => m.age_group === mapKeyShort || m.age_group === mapKeyFull || pathwayIds.includes(m.pathway_id));
        groupModules.sort((a: any, b: any) => (a.order_number || 0) - (b.order_number || 0));

        // 3. Format modules and lessons matching standard frontend Course types
        const mappedModules: Module[] = groupModules.map((rm: any) => {
          const matchingStaticMeta = metadataList.find((m) => m.id === rm.id);

          // Find lessons belonging to this module
          const rawLessons = cache.lessons || [];
          const moduleLessons: Lesson[] = rawLessons
            .filter((rl: any) => rl.module_id === rm.id && rl.status !== "draft")
            .map((rl: any, idx: number) => {
              const lessonId = rl.id || `${rm.id}-l${idx + 1}`;
              const approvedLesson = APPROVED_EARLY_EXPLORERS_LESSONS[lessonId];

              const rawTitleEn = typeof rl.title === 'string' ? rl.title : (rl.title?.en || `Lesson ${idx + 1}`);
              const titleEn = approvedLesson ? approvedLesson.title : rawTitleEn;
              const titleIg = typeof rl.title === 'object' && rl.title?.ig ? rl.title.ig : titleEn;
              const titleYo = typeof rl.title === 'object' && rl.title?.yo ? rl.title.yo : titleEn;

              const baseDetails = generateLessonDetails(lessonId, titleEn, ageGroupKey);

              // Construct lesson questions dynamically from quizzes table
              const rawQuizzes = cache.quizzes || [];
              const quizQuestions = rawQuizzes
                .filter((q: any) => q.lesson_id === rl.id)
                .map((q: any) => {
                  return {
                    q: { en: q.question, ig: q.question, yo: q.question },
                    opts: {
                      en: [q.option_a, q.option_b, q.option_c, q.option_d].filter((o: any) => o !== undefined && o !== null),
                      ig: [q.option_a, q.option_b, q.option_c, q.option_d].filter((o: any) => o !== undefined && o !== null),
                      yo: [q.option_a, q.option_b, q.option_c, q.option_d].filter((o: any) => o !== undefined && o !== null)
                    },
                    ans: q.correct_answer === 'B' || q.correct_answer === '1' ? 1 :
                         q.correct_answer === 'C' || q.correct_answer === '2' ? 2 :
                         q.correct_answer === 'D' || q.correct_answer === '3' ? 3 : 0
                  } as QuizQuestion;
                });

              return {
                id: lessonId,
                title: { en: titleEn, ig: titleIg, yo: titleYo },
                code: rl.code || `L${idx + 1}`,
                duration: rl.estimated_duration ? (isNaN(Number(rl.estimated_duration)) ? String(rl.estimated_duration) : `⏱ ${rl.estimated_duration} min`) : "⏱ 3 min",
                type: "story", 
                story: { 
                  en: rl.description || baseDetails.story?.en || "Curriculum details discovery.",
                  ig: rl.description || baseDetails.story?.ig || "Metere ihe omumu gbara ozi.",
                  yo: rl.description || baseDetails.story?.yo || "Eko ekunrere lori ohun."
                },
                video_url: rl.video_url || baseDetails.video_url || undefined,
                quiz: quizQuestions.length > 0 ? quizQuestions : (baseDetails.quiz || [])
              } as Lesson;
            });

          // Order module lessons securely
          moduleLessons.sort((a: any, b: any) => {
            const aNum = Number(a.code?.replace(/\D/g, '')) || 0;
            const bNum = Number(b.code?.replace(/\D/g, '')) || 0;
            return aNum - bNum;
          });

          // Reconcile approved Young Explorers module names (e.g. t-a1m2 -> "Module 2: Learning With AI")
          if (ageGroupKey === "early explorers" && matchingStaticMeta) {
            return {
              id: rm.id,
              pathwayId: rm.pathway_id,
              name: matchingStaticMeta.name,
              goal: matchingStaticMeta.goal,
              badge: matchingStaticMeta.badge,
              lessons: moduleLessons.length > 0 ? moduleLessons : hydrateStaticModule(matchingStaticMeta, ageGroupKey).lessons
            } as Module;
          }

          const titleClean = typeof rm.title === 'string' ? rm.title : (rm.title?.en || "Custom Module");
          const descClean = rm.description || "Admin structured module category.";

          return {
            id: rm.id,
            pathwayId: rm.pathway_id,
            name: { en: titleClean, ig: titleClean, yo: titleClean },
            goal: { 
              en: descClean, 
              ig: `Mechaa usoro ihe omumu maka ${titleClean}`, 
              yo: `Pari eko fun ${titleClean}` 
            },
            badge: matchingStaticMeta?.badge || { name: `${titleClean} Badge`, icon: "🎖" },
            lessons: moduleLessons
          } as Module;
        });

        // Ensure any approved curriculum modules not yet seeded in Supabase cache are included in sequence
        const mappedIds = new Set(mappedModules.map((m) => m.id));
        metadataList.forEach((mMeta) => {
          if (!mappedIds.has(mMeta.id)) {
            mappedModules.push(hydrateStaticModule(mMeta, ageGroupKey));
          }
        });

        // Course standard metadata headers
        const courseHeaders: Record<AgeGroup, { title: any; desc: any }> = {
          "early explorers": {
            title: { en: "Early Explorers Track", ig: "Ugo mfe nke Ndị Nchọpụta", yo: "Ọ̀nà Àbẹ̀rẹ̀ fún Olùṣàwárí" },
            desc: { en: "Curiosity-driven learning, digital familiarity, and pattern play.", ig: "Mmụta mfe, ịma ama teknụzụ, na igwu egwu nke usoro.", yo: "Ẹ̀kọ́ orí ìfẹ́-ìmọ̀, mímọ ẹ̀rọ, àti ìṣeré tàbìlì dídára." }
          },
          "young innovators": {
            title: { en: "Young Innovators Track", ig: "Ugo Ndị Ntorobịa Na-emepụta Ihe", yo: "Ọ̀nà Àkànṣe fún Alákọ̀wé Títun" },
            desc: { en: "Foundational AI literacy, safe internet habits, and Basic Tech Literacy.", ig: "Ihe ọmụma zuru oke banyere AI, omume nchekwa na koodu mmalite.", yo: "Mímọ fúndàmẹ́ńtálì AI, ìbálò rọrùn àti ìmọ̀ kọ́dù tí ó rọrùn." }
          },
          "future builders": {
            title: { en: "Future Builders Track", ig: "Ugo Ndị Na-ewu Ọdịnihu", yo: "Ọ̀nà Àkànṣe fún Ọ̀dọ́mọbìnrin Olùkọ́-ẹ̀rọ" },
            desc: { en: "Career-oriented learning: AI, Web3, full coding algos, UI/UX, and capstones.", ig: "Mmụta gbasara ọrụ: AI, Web3, koodu zuru oke, UI/UX, na capstone.", yo: "Ẹ̀kọ́ iṣẹ́-ọwọ́ títun: AI gíga, Web3, kọ́dù alámì, àti iṣẹ́ agbábọ́ọ̀lù." }
          }
        };

        const currentHeader = courseHeaders[ageGroupKey];
        return {
          id: ageGroupKey,
          title: currentHeader.title,
          description: currentHeader.desc,
          pathways: groupPathways.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description
          })),
          modules: mappedModules
        };
      }
    } catch (e) {
      console.warn("Could not parse supabase cache in memory:", e);
    }
  }

  // Custom headers for each age group course
  const courseHeaders: Record<AgeGroup, { title: any; desc: any }> = {
    "early explorers": {
      title: {
        en: "Early Explorers Track",
        ig: "Ugo mfe nke Ndị Nchọpụta",
        yo: "Ọ̀nà Àbẹ̀rẹ̀ fún Olùṣàwárí"
      },
      desc: {
        en: "Curiosity-driven learning, digital familiarity, and pattern play.",
        ig: "Mmụta mfe, ịma ama teknụzụ, na igwu egwu nke usoro.",
        yo: "Ẹ̀kọ́ orí ìfẹ́-ìmọ̀, mímọ ẹ̀rọ, àti ìṣeré tàbìlì dídára."
      }
    },
    "young innovators": {
      title: {
        en: "Young Innovators Track",
        ig: "Ugo Ndị Ntorobịa Na-emepụta Ihe",
        yo: "Ọ̀nà Àkànṣe fún Alákọ̀wé Títun"
      },
      desc: {
        en: "Foundational AI literacy, safe internet habits, and Basic Tech Literacy.",
        ig: "Ihe ọmụma zuru oke banyere AI, omume nchekwa na koodu mmalite.",
        yo: "Mímọ fúndàmẹ́ńtálì AI, ìbálò rọrùn àti ìmọ̀ kọ́dù tí ó rọrùn."
      }
    },
    "future builders": {
      title: {
        en: "Future Builders Track",
        ig: "Ugo Ndị Na-ewu Ọdịnihu",
        yo: "Ọ̀nà Àkànṣe fún Ọ̀dọ́mọbìnrin Olùkọ́-ẹ̀rọ"
      },
      desc: {
        en: "Career-oriented learning: AI, Web3, full coding algos, UI/UX, and capstones.",
        ig: "Mmụta gbasara ọrụ: AI, Web3, koodu zuru oke, UI/UX, na capstone.",
        yo: "Ẹ̀kọ́ iṣẹ́-ọwọ́ títun: AI gíga, Web3, kọ́dù alámì, àti iṣẹ́ agbábọ́ọ̀lù."
      }
    }
  };

  const currentHeader = courseHeaders[ageGroupKey];

  // Map each metadata block into fully hydrated type-safe Modules with 100% playable lessons
  const modules: Module[] = metadataList.map((mMeta) => hydrateStaticModule(mMeta, ageGroupKey));

  return {
    id: ageGroupKey,
    title: currentHeader.title,
    description: currentHeader.desc,
    modules
  };
}

// Proxied CURRICULUM engine aggregates live data for the active child apps
const baseCURRICULUM: Record<AgeGroup, Course> = {
  "early explorers": getDynamicCourse("early explorers"),
  "young innovators": getDynamicCourse("young innovators"),
  "future builders": getDynamicCourse("future builders")
};

export const CURRICULUM: Record<AgeGroup, Course> = typeof window === "undefined"
  ? baseCURRICULUM
  : new Proxy(baseCURRICULUM, {
      get(target, prop) {
        if (prop === "early explorers" || prop === "young innovators" || prop === "future builders") {
          return getDynamicCourse(prop as AgeGroup);
        }
        return Reflect.get(target, prop);
      }
    });
