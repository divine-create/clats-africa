/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language, AgeGroup, Parent, Child } from "../types";

// Design Colors
export const C = {
  teal: "#22d3ee",
  tealDark: "#06b6d4",
  tealDeep: "#0891b2",
  tealGhost: "rgba(34, 211, 238, 0.08)",
  yellow: "#FACC15",
  yellowDark: "#EAB308",
  yellowSoft: "rgba(250, 204, 21, 0.08)",
  yellowGlow: "rgba(250, 204, 21, 0.25)",
  charcoal: "#F8FAFC",
  slate: "#CBD5E1",
  stone: "#94A3B8",
  fog: "#64748B",
  mist: "rgba(255, 255, 255, 0.08)",
  snow: "#0A0A0B",
  white: "#111114",
  green: "#10B981",
  red: "#F43F5E",
  amber: "#F59E0B",
  lavender: "#A78BFA",
  lavSoft: "rgba(167, 139, 250, 0.08)",
  igboAccent: "#F97316",
  yorubaAccent: "#FB923C"
};

// Font Families
export const F = {
  display: "'Baloo 2', system-ui, sans-serif",
  body: "'Baloo 2', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace"
};

// Translation Table
export const T: Record<Language, Record<string, string>> = {
  en: {
    tagline: "Building tomorrow's tech minds today",
    getStarted: "Get Started",
    signIn: "Sign In",
    welcomeBack: "Welcome back",
    createAccount: "Create Account",
    hello: "Hello",
    readyToLearn: "Ready to learn today?",
    startLearning: "Start Learning",
    timeLeft: "Time left today",
    lessonsComplete: "lessons complete",
    continueLesson: "Continue",
    markComplete: "Mark Complete",
    nextLesson: "Next Lesson",
    correct: "Correct.",
    incorrect: "Not quite — but that is how learning works.",
    sessionDone: "Session Complete",
    greatJob: "Great job today! See you next session.",
    fiveMinsLeft: "You have 5 minutes left for this session.",
    kobeSays: "Kobe says",
    askKobe: "Ask Kobe",
    parentDash: "Parent Dashboard",
    childMode: "Enter Child Mode",
    community: "Community",
    settings: "Settings",
    progress: "Progress",
    level: "Level",
    xp: "XP",
    stars: "Stars",
    language: "Language",
    back: "Back",
    parentAuthTitle: "Parent Dashboard Link",
    parentAuthSubtitle: "Manage schedules, view progress, and access learning paths.",
    createChildProfile: "Create Child Profile",
    enterParentMode: "Parent Controls",
    howManyMinutes: "Minutes per learning block",
    completeQuizToFinish: "Solve the quiz question below to finish this lesson!",
    welcomeParent: "Good Evening",
    trackJourney: "Track your child's future-tech learning journey.",
    weeklyLearningTime: "Weekly Learning Time (Min)",
    lessonCompletion: "Lesson Completion Analytics",
    quizPerformance: "Quiz Performance Analytics",
    learningConsistency: "Learning Consistency",
    aiLearningInsights: "🤖 AI Learning Insights",
    skillsTracker: "Skills Development Tracker",
    screenTimeAnalytics: "Screen Time Analytics",
    achievementsCenter: "Achievements Center",
    feedbackWidget: "🚀 Help Us Improve CLATS",
    submitFeedback: "Submit Feedback",
    testingBanner: "🎉 Thank you for helping test CLATS!",
    testingShare: "Share Feedback",
    testingDesc: "Your feedback is helping us build the future-ready learning platform for children.",
    weeklyAverage: "Weekly Average",
    remaining: "Remaining",
    usedToday: "Used Today",
    dailyLimit: "Daily Limit",
    xpMilestones: "XP Milestones",
    badges: "Badges",
    certificates: "Certificates",
    recentDiscussions: "Recent Parent Discussions",
    learningTips: "Learning Tips",
    upcomingEvents: "Upcoming Events",
    workshops: "Workshops",
    viewCommunity: "View Community",
    improveClats: "Your feedback helps us build a better learning experience for children.",
    enrolledChildren: "Enrolled Children",
    sessionControls: "Session Controls",
    sessionDays: "Learning Days",
    bestStreak: "Best Streak",
    currentStreak: "Current Streak",
    averageScore: "Average Score",
    recentQuizScores: "Recent Quiz Scores",
    passRate: "Pass Rate",
    trackDone: "Track Done",
    activeProfiles: "Active Profiles",
    addProfile: "Add Child Profile",
    todayStudy: "Today's Study",
    completed: "Completed",
    latestAssessment: "Learning Assessment",
    automaticAnalysis: "Automatic analysis for",
    recentAssessments: "Recent Assessments",
    passed: "PASSED",
    needsReview: "NEEDS REVIEW",
    correctCount: "Correct",
    viewCommunitySpace: "View Community Space",
    noKidsYet: "No kids profiles added yet. Set one up to start!"
  },
  ig: {
    tagline: "Anyị na-eto uche teknụzụ n'ọdịnihu taa",
    getStarted: "Bido mbụ",
    signIn: "Banye",
    welcomeBack: "Nnabata ọzọ",
    createAccount: "Mepee Ọkwa",
    hello: "Ndewo",
    readyToLearn: "I dịla njikere ịmụta ihe taa?",
    startLearning: "Bido ịmụ ihe",
    timeLeft: "Oge fọdụrụ taa",
    lessonsComplete: "ihe ọmụmụ gachara",
    continueLesson: "Gaa n'ihu",
    markComplete: "Emechara",
    nextLesson: "Ihe Ọmụmụ Ọzọ",
    correct: "Ezi okwu.",
    incorrect: "Ọ bụghị nnọọ — mana ọ bụ otu ahụ ka anyị si amụta ihe.",
    sessionDone: "Oge Agwụla",
    greatJob: "Ọrụ dị mma taa! Hụ gị n'oge ọzọ.",
    fiveMinsLeft: "Oge fọro gị nkeji ise n'oge a.",
    kobeSays: "Kobe sị",
    askKobe: "Jụọ Kobe",
    parentDash: "Mbadamba Ndị Nne na Nna",
    childMode: "Banye Ụdị Nwa",
    community: "Obodo Anyị",
    settings: "Ntọala",
    progress: "Ihe Ngosipụta",
    level: "Ọkwa",
    xp: "XP ọgụgụ",
    stars: "Kpakpando",
    language: "Asụsụ",
    back: "Laghachi",
    parentAuthTitle: "Maka Ndị Nne na Nna",
    parentAuthSubtitle: "Njikwa oge ihuenyo, ihe ngosipụta na mbadamba mmụta.",
    createChildProfile: "Mepụta Profaịlụ Nwa",
    enterParentMode: "Ihe nchịkwa ndị Nne na Nna",
    howManyMinutes: "Nkeji maka oge mmụta ọ bụla",
    completeQuizToFinish: "Zaghachi ajụjụ quiz dị n'okpuru iji mechaa ihe ọmụmụ a!",
    welcomeParent: "Kachasị, Ndị Nne na Nna",
    trackJourney: "Dekọọ ka nwa gị si amụta teknụzụ n'ọdịnihu.",
    weeklyLearningTime: "Oge Mmụta Kwa Izu (Nkeji)",
    lessonCompletion: "Nchọpụta Mmụta Ihe Ọmụmụ",
    quizPerformance: "Arụmọrụ Quiz Ajụjụ",
    learningConsistency: "Nkwekọrịta Mmụta",
    aiLearningInsights: "🤖 AI Nkọwa Mmụta",
    skillsTracker: "Ihe Ndekọ Ndị Nwere Nkà",
    screenTimeAnalytics: "Nnyocha Oge Ihuenyo",
    achievementsCenter: "Ebe Ọrụ Ọma",
    feedbackWidget: "🚀 Nyere Anyị Aka Imeziwanye CLATS",
    submitFeedback: "Zipu Nzaghachi Gị",
    testingBanner: "🎉 Daalụ maka inyere anyị aka ịnwale CLATS!",
    testingShare: "Nyefee Nzaghachi",
    testingDesc: "Nzaghachi gị na-enyere anyị aka wuo ikpo okwu mmụta teknụzụ ọdịnihu maka ụmụaka n'Afrịka.",
    weeklyAverage: "Nkezi gbakọtara",
    remaining: "Oge Fọdụrụ",
    usedToday: "Eji Mee Ihe Taa",
    dailyLimit: "Oke Kwa Ụbọchị",
    xpMilestones: "XP Mile Ọkwa",
    badges: "Ngosipụta Badge",
    certificates: "Asambodo",
    recentDiscussions: "Mkparịta Ụka Ndị Nne Na Nna",
    learningTips: "Atụmatụ Mmụta Ọma",
    upcomingEvents: "Ihe Omume Na-abịa",
    workshops: "Ebe Ọmụmụ Ọrụ",
    viewCommunity: "Leba Anya N'obodo",
    improveClats: "Nzaghachi gị na-enyere anyị aka wuo ahụmịhe mmụta anyị dị mma.",
    enrolledChildren: "Ụmụaka Na-amụ Ihe",
    sessionControls: "Ihe Nchịkwa Session",
    sessionDays: "Ụbọchị Mmụta",
    bestStreak: "Lọgụ Kachasị Mma",
    currentStreak: "Lọgụ Ugbu A",
    averageScore: "Nkezi Akara",
    recentQuizScores: "Quiz Ikpeazụ",
    passRate: "Faas Rate",
    trackDone: "Emechara",
    activeProfiles: "Profaịlụ Na-arụ Ọrụ",
    addProfile: "Tinye Profaịlụ Nwa",
    todayStudy: "Mmụta Taa",
    completed: "Emechara",
    latestAssessment: "Nlele Mmụta",
    automaticAnalysis: "Nnyocha akpaghị aka maka",
    recentAssessments: "Nlele Nso Nso A",
    passed: "AGAFEELA",
    needsReview: "CHỌRỌ NLELE",
    correctCount: "Ziri Ezi",
    viewCommunitySpace: "Leba anya n'obodo anyị",
    noKidsYet: "Enweghị profaịlụ ụmụaka agbakwunyere. Mepụta otu ugbu a!"
  },
  yo: {
    tagline: "A ń kọ́ ọpọlọ ìmọ̀-ẹ̀rọ ọjọ́ ọla lónìí",
    getStarted: "Bẹ̀rẹ̀",
    signIn: "Wọlé",
    welcomeBack: "Ẹ káàbọ̀ padà",
    createAccount: "Ṣe Àpamọ́ Tuntun",
    hello: "Pẹ̀lẹ́",
    readyToLearn: "Ṣé o ti múra tán láti kọ́ ẹ̀kọ́ lónìí?",
    startLearning: "Bẹ̀rẹ̀ Ẹ̀kọ́",
    timeLeft: "Àkókò tó kù lónìí",
    lessonsComplete: "ẹ̀kọ́ tí o ti parí",
    continueLesson: "Tẹ̀síwájú",
    markComplete: "Fidájú Parí",
    nextLesson: "Ẹ̀kọ́ Tó Kàn",
    correct: "Ó tọ́.",
    incorrect: "Kò tọ́ pátápátá — ṣùgbọ́n bẹ́ẹ̀ ni a ṣe ń kọ́ ẹ̀kọ́.",
    sessionDone: "Àkókò Kọ́parí",
    greatJob: "O ṣe dada lónìí! Ó dìgbà àkókò kàn.",
    fiveMinsLeft: "O ní ìṣẹ́jú márùn-ún jù lọ fún ìpele yí.",
    kobeSays: "Kobe sọ pé",
    askKobe: "Bi Kobe Lérò",
    parentDash: "Ojú-ewé Àwọn Obi",
    childMode: "Wọ Ojú Ọmọdé",
    community: "Àwùjọ Ọlọ́gbọ́n",
    settings: "Ètò",
    progress: "Àṣeyọrí",
    level: "Ìpele",
    xp: "XP",
    stars: "Ìràwọ̀",
    language: "Èdè",
    back: "Padà",
    parentAuthTitle: "Ojú Àwọn Obi tàbí Olùtọ́jú",
    parentAuthSubtitle: "Ṣàkóso àkókò tàbìlì àti àṣeyọrí ọmọ rẹ pọ̀.",
    createChildProfile: "Ṣèdá Ojú Ọmọ Tuntun",
    enterParentMode: "Ìṣàkóso Àwọn Obi",
    howManyMinutes: "Ìṣẹ́jú fún ìpele ẹ̀kọ́ kọ̀ọ̀kan",
    completeQuizToFinish: "Dáhùn ìbéèrè ìdánwò kékeré tó wà nísàlẹ̀ láti parí ẹ̀kọ́ yí!",
    welcomeParent: "Káàsán, Obi",
    trackJourney: "Tọpinpin irin-ajo ìmọ̀-ẹ̀rọ ọmọ rẹ.",
    weeklyLearningTime: "Àkókò Kíkẹ́kọ̀ọ́ Ọ̀sẹ̀ (Ìṣẹ́jú)",
    lessonCompletion: "Wíwo Àṣeyọrí Ẹ̀kọ́",
    quizPerformance: "Àyẹ̀wò Idánwò Kékeré",
    learningConsistency: "Ìbáṣepọ̀ Ẹ̀kọ́ Láìdábọ̀",
    aiLearningInsights: "🤖 Ìmọ̀ràn Pípé AI",
    skillsTracker: "Àtọpinpin Agbára",
    screenTimeAnalytics: "Àyẹ̀wò Àkókò Tábìlì",
    achievementsCenter: "Eré Àṣeyọrí Gbogbo",
    feedbackWidget: "🚀 Ràn wá lọ́wọ́ láti ṣàtúnṣe CLATS",
    submitFeedback: "Fi Èrò Rẹ Ránṣẹ́",
    testingBanner: "🎉 Oṣéun fún ìrànlọ́wọ́ láti dán CLATS wò!",
    testingShare: "Share Feedback",
    testingDesc: "Èrò rẹ ń ràn wá lọ́wọ́ láti kọ́ pẹpẹ ìmọ̀-ẹ̀rọ ọjọ́ ọla fún àwọn ọmọdé ní ilẹ̀ Áfíríkà.",
    weeklyAverage: "Nkezi Akoko Ọsẹ",
    remaining: "Àkókò Tó Kù",
    usedToday: "Lò Lónìí",
    dailyLimit: "Ààlà Lónìí",
    xpMilestones: "XP Milestones nla",
    badges: "Páálí Àṣeyọrí",
    certificates: "Ìwé-ẹ̀rí",
    recentDiscussions: "Ìjíròrò Àwọn Obi",
    learningTips: "Ìmọ̀ràn Lórí Ẹ̀kọ́",
    upcomingEvents: "Àwọn Ètò Tó Ń Bọ̀",
    workshops: "Ètò Ìkẹ́kọ̀ọ́",
    viewCommunity: "Wọ Àwùjọ Ọlọ́gbọ́n",
    improveClats: "Èrò rẹ ń ràn wá lọ́wọ́ láti ṣẹ̀dá ìrírí ẹ̀kọ́ tó dára jù.",
    enrolledChildren: "Àwọn Ọmọ Tí A Forúkọsílẹ̀",
    sessionControls: "Ìṣàkóso Ìpele Àkókò",
    sessionDays: "Ọjọ́ Kíkẹ́kọ̀ọ́",
    bestStreak: "Streak Aláṣeyọrí Jù",
    currentStreak: "Streak Lọ́ọ́lọ́ọ́",
    averageScore: "Nkezi Akara",
    recentQuizScores: "Quiz Tuntun",
    passRate: "Ìpín Ìrékọjá",
    trackDone: "Pari",
    activeProfiles: "Àwọn Ojú Ọmọ Tó Ń Ṣiṣẹ́",
    addProfile: "Ṣèdá Ojú Ọmọ Tuntun",
    todayStudy: "Ẹ̀kọ́ Lónìí",
    completed: "Ti Parí",
    latestAssessment: "Àyẹ̀wò Ẹ̀kọ́",
    automaticAnalysis: "Àyẹ̀wò fúnra rẹ̀ fún",
    recentAssessments: "Àyẹ̀wò Tuntun",
    passed: "YALÉṢE",
    needsReview: "GBA ÀTÚNYẸ̀WÒ",
    correctCount: "Ó tọ́",
    viewCommunitySpace: "Wo àwùjọ àwọn obi",
    noKidsYet: "Kò sí ojú ọmọ kankan lórí pẹpẹ lábẹ́ yín. Ṣèdá kan láti bẹ̀rẹ̀!"
  },
  fr: {
    tagline: "Construire les esprits technologiques de demain, aujourd'hui",
    getStarted: "Commencer",
    signIn: "Se connecter",
    welcomeBack: "Bon retour",
    createAccount: "Créer un compte",
    hello: "Bonjour",
    readyToLearn: "Prêt à apprendre aujourd'hui ?",
    startLearning: "Commencer à apprendre",
    timeLeft: "Temps restant aujourd'hui",
    lessonsComplete: "leçons terminées",
    continueLesson: "Continuer",
    markComplete: "Terminé",
    nextLesson: "Leçon suivante",
    correct: "Correct.",
    incorrect: "Pas tout à fait — mais c'est comme ça qu'on apprend.",
    sessionDone: "Session terminée",
    greatJob: "Excellent travail ! À la prochaine session.",
    fiveMinsLeft: "Il vous reste 5 minutes.",
    kobeSays: "Kobe dit",
    askKobe: "Demander à Kobe",
    parentDash: "Tableau de bord",
    childMode: "Mode Enfant",
    community: "Communauté",
    settings: "Paramètres",
    progress: "Progrès",
    level: "Niveau",
    xp: "XP",
    stars: "Étoiles",
    language: "Langue",
    back: "Retour",
    parentAuthTitle: "Tableau de bord Parent",
    parentAuthSubtitle: "Gérer les horaires, voir les progrès et accéder aux parcours d'apprentissage.",
    createChildProfile: "Créer un profil Enfant",
    enterParentMode: "Contrôles Parentaux",
    howManyMinutes: "Minutes par bloc d'apprentissage",
    completeQuizToFinish: "Résolvez le quiz ci-dessous pour terminer cette leçon !",
    welcomeParent: "Bonsoir",
    trackJourney: "Suivez le parcours d'apprentissage de votre enfant.",
    weeklyLearningTime: "Temps d'apprentissage hebdo (Min)",
    lessonCompletion: "Analytique des leçons",
    quizPerformance: "Analytique des Quiz",
    learningConsistency: "Régularité",
    aiLearningInsights: "🤖 Aperçus de l'IA",
    skillsTracker: "Suivi des compétences",
    screenTimeAnalytics: "Temps d'écran",
    achievementsCenter: "Centre des réussites",
    feedbackWidget: "🚀 Aidez-nous à améliorer CLATS",
    submitFeedback: "Soumettre",
    testingBanner: "🎉 Merci de tester CLATS !",
    testingShare: "Partager des commentaires",
    testingDesc: "Vos commentaires nous aident à construire la plateforme de demain.",
    weeklyAverage: "Moyenne Hebdo",
    remaining: "Restant",
    usedToday: "Utilisé aujourd'hui",
    dailyLimit: "Limite quotidienne",
    xpMilestones: "Paliers XP",
    badges: "Badges",
    certificates: "Certificats",
    recentDiscussions: "Discussions Récentes",
    learningTips: "Astuces",
    upcomingEvents: "Événements à venir",
    workshops: "Ateliers",
    viewCommunity: "Voir la communauté",
    improveClats: "Vos retours nous aident à améliorer l'expérience.",
    enrolledChildren: "Enfants Inscrits",
    sessionControls: "Contrôles de Session",
    sessionDays: "Jours d'apprentissage",
    bestStreak: "Meilleure Série",
    currentStreak: "Série Actuelle",
    averageScore: "Score Moyen",
    recentQuizScores: "Scores Récents",
    passRate: "Taux de réussite",
    trackDone: "Suivi terminé",
    activeProfiles: "Profils Actifs",
    addProfile: "Ajouter un profil Enfant",
    todayStudy: "Étude d'aujourd'hui",
    completed: "Terminé",
    latestAssessment: "Dernière évaluation",
    automaticAnalysis: "Analyse automatique pour",
    recentAssessments: "Évaluations récentes",
    passed: "RÉUSSI",
    needsReview: "À REVOIR",
    correctCount: "Corrects",
    viewCommunitySpace: "Voir l'espace communautaire",
    noKidsYet: "Aucun enfant n'est ajouté. Créez-en un pour commencer !"
  },
  ha: {
    tagline: "Ginin gobe fasaha hankali a yau",
    getStarted: "Fara",
    signIn: "Shiga",
    welcomeBack: "Barka da dawowa",
    createAccount: "Ƙirƙiri asusu",
    hello: "Sannu",
    readyToLearn: "Shirya don koyo yau?",
    startLearning: "Fara Koyo",
    timeLeft: "Sauran lokaci yau",
    lessonsComplete: "darussan kammala",
    continueLesson: "Ci gaba",
    markComplete: "Kammala",
    nextLesson: "Darasi na gaba",
    correct: "Daidai.",
    incorrect: "Ba daidai ba - amma hakan ne ake koyo.",
    sessionDone: "Zama ya kare",
    greatJob: "Kyakkyawan aiki! Sai an jima.",
    fiveMinsLeft: "Kina da sauran minti 5.",
    kobeSays: "Kobe yace",
    askKobe: "Tambayi Kobe",
    parentDash: "Dashboard na Iyayen",
    childMode: "Shiga Yanayin Yara",
    community: "Al'umma",
    settings: "Saituna",
    progress: "Cigaba",
    level: "Mataki",
    xp: "XP",
    stars: "Taurari",
    language: "Harshe",
    back: "Baya",
    parentAuthTitle: "Dashboard na Iyayen",
    parentAuthSubtitle: "Sarrafa jadawali, duba ci gaba, da hanyoyin koyo.",
    createChildProfile: "Ƙirƙiri Bayanin Yara",
    enterParentMode: "Gudanarwar Iyayen",
    howManyMinutes: "Minti a kowane shafin koyo",
    completeQuizToFinish: "Amsa tambayoyin da ke ƙasa don kammala!",
    welcomeParent: "Barka da yamma",
    trackJourney: "Kula da tafiyar koyon yaran ku.",
    weeklyLearningTime: "Lokacin Koyo na Mako-mako (Minti)",
    lessonCompletion: "Nazarin Kammala Darasi",
    quizPerformance: "Nazarin Ayyukan Tambayoyi",
    learningConsistency: "Dorewar Koyo",
    aiLearningInsights: "🤖 Cikakkun bayanan AI",
    skillsTracker: "Mai Kula da Ƙwarewa",
    screenTimeAnalytics: "Nazarin Lokacin Allo",
    achievementsCenter: "Cibiyar Nasarori",
    feedbackWidget: "🚀 Taimaka Mana Inganta CLATS",
    submitFeedback: "Sanya Ra'ayi",
    testingBanner: "🎉 Mun gode da gwada CLATS!",
    testingShare: "Bada Ra'ayi",
    testingDesc: "Ra'ayinku yana taimaka mana gina dandalin gaba.",
    weeklyAverage: "Matsakaicin Mako",
    remaining: "Sauran",
    usedToday: "An yi amfani yau",
    dailyLimit: "Iyakar yau da kullum",
    xpMilestones: "Tsayawar XP",
    badges: "Lamba",
    certificates: "Takaddun shaida",
    recentDiscussions: "Tattaunawar kwanan nan",
    learningTips: "Shawarwarin Koyo",
    upcomingEvents: "Abubuwan Da Suka Zo",
    workshops: "Tarurrukan Bita",
    viewCommunity: "Duba Al'umma",
    improveClats: "Ra'ayinku yana taimaka mana gina ingantaccen tsarin.",
    enrolledChildren: "Yaran Da Aka Yi Rijista",
    sessionControls: "Gudanarwar Zama",
    sessionDays: "Kwanakin Koyo",
    bestStreak: "Mafi Kyawun Tsari",
    currentStreak: "Tsari Na Yanzu",
    averageScore: "Matsakaicin Maki",
    recentQuizScores: "Sakamakon kwanan nan",
    passRate: "Yawan Nasara",
    trackDone: "Kula da Kammala",
    activeProfiles: "Bayanan aiki",
    addProfile: "Ƙara Bayanin Yara",
    todayStudy: "Nazarin Yau",
    completed: "An kammala",
    latestAssessment: "Sabon Gwaji",
    automaticAnalysis: "Bincike na atomatik ga",
    recentAssessments: "Gwaje-gwaje kwanan nan",
    passed: "AN WUCE",
    needsReview: "ANA BUKATAR DUBA",
    correctCount: "Daidai",
    viewCommunitySpace: "Duba Filin Al'umma",
    noKidsYet: "Babu yara da aka ƙara. Ƙirƙiri don farawa!"
  }
};

// Gamification Mechanics
export const XP_PER_LESSON = 100;
export const XP_PER_CORRECT = 25;

export const LEVELS = [
  { level: 1, label: "Beginner", xpNeeded: 0 },
  { level: 2, label: "Explorer", xpNeeded: 200 },
  { level: 3, label: "Innovator", xpNeeded: 500 },
  { level: 4, label: "Builder", xpNeeded: 900 },
  { level: 5, label: "Tech Pioneer", xpNeeded: 1400 }
];

export function getLevel(xp: number) {
  let cur = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpNeeded) cur = l;
  }
  return cur;
}

export function getNextLevel(xp: number) {
  for (const l of LEVELS) {
    if (xp < l.xpNeeded) return l;
  }
  return null;
}

// Dev allowance timing presets (in seconds)
export const DEV_DEFAULTS = {
  "early explorers": { morning: 120, afternoon: 120, evening: 60 },
  "young innovators": { morning: 300, afternoon: 300, evening: 300 },
  "future builders": { morning: 900, afternoon: 0, evening: 900 }
};

export const AGE_LABEL = {
  "early explorers": "Early Explorers",
  "young innovators": "Young Innovators",
  "future builders": "Future Builders"
};

export const AGE_AGES = {
  "early explorers": "2–5",
  "young innovators": "6–12",
  "future builders": "13–18"
};

export const AGE_META = {
  "early explorers": {
    color: C.amber,
    soft: C.yellowSoft,
    kobeStyle: [
      "warm, extremely gentle, playful,",
      "very short and simple sentences appropriate for ages 2 to 5,",
      "celebrate every step, max one emoji per response,",
      "give friendly verbal pattern hints."
    ].join(" ")
  },
  "young innovators": {
    color: C.teal,
    soft: C.tealGhost,
    kobeStyle: [
      "friendly, energetic, extremely clear,",
      "uses relatable local references,",
      "explains machine learning or cyber safety step-by-step with zero jargon,",
      "highly positive, interactive, under 4 sentences."
    ].join(" ")
  },
  "future builders": {
    color: C.lavender,
    soft: C.lavSoft,
    kobeStyle: [
      "highly substantive, respectful, peer-to-peer, professional but inspiring mentor vibe,",
      "addresses teenagers directly as future creators, startups founders, and builders,",
      "explains deep neural networks, logic algorithms, prompt engineering rules, or crypto hash tags in detail,",
      "concise but technically solid, zero fluff or childish chatter."
    ].join(" ")
  }
};

export const SLOT_NAMES: Array<"morning" | "afternoon" | "evening"> = [
  "morning",
  "afternoon",
  "evening"
];

export function getCurrentSlot(): "morning" | "afternoon" | "evening" | null {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18) return "evening";
  return null;
}

export function getNextSlotLabel(ag: AgeGroup, lang: Language = "en") {
  const slot = getCurrentSlot();
  const cfg = getParentLimits(null, ag);
  if (!slot) {
    return lang === "en"
      ? "your morning session"
      : lang === "ig"
      ? "oge mmụta ụtụtụ"
      : "ìpele owurọ̀";
  }
  if (slot === "morning" && (cfg.afternoon || 0) > 0) {
    return lang === "en" ? "this afternoon" : lang === "ig" ? "ehihie a" : "ọ̀sán";
  }
  if (slot === "afternoon" && (cfg.evening || 0) > 0) {
    return lang === "en" ? "this evening" : lang === "ig" ? "anyasị a" : "ìrọ̀lẹ́";
  }
  return lang === "en"
    ? "tomorrow morning"
    : lang === "ig"
    ? "ụtụtụ echi"
    : "owurọ̀ ọla";
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};

// Storage keys
const SESS_KEY = "clats_sess_v1";
const TIME_KEY = "clats_time_v1";
const SETTINGS_KEY = "clats_settings_v1";
const LANG_KEY = "clats_lang_v1";

export const S = {
  getSess: () => {
    try {
      return JSON.parse(localStorage.getItem(SESS_KEY) || "null");
    } catch {
      return null;
    }
  },
  setSess: (s: any) => localStorage.setItem(SESS_KEY, JSON.stringify(s)),
  clearSess: () => localStorage.removeItem(SESS_KEY),
  getTime: (): Record<string, any> => {
    try {
      return JSON.parse(localStorage.getItem(TIME_KEY) || "{}");
    } catch {
      return {};
    }
  },
  setTime: (t: any) => localStorage.setItem(TIME_KEY, JSON.stringify(t)),
  getSettings: (): Record<string, any> => {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    } catch {
      return {};
    }
  },
  setSettings: (s: any) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)),
  getLang: () => localStorage.getItem(LANG_KEY) || "en",
  setLang: (l: string) => localStorage.setItem(LANG_KEY, l),
  getParents: (): Record<string, any> => {
    try {
      return JSON.parse(localStorage.getItem("clats_parents_v1") || "{}");
    } catch {
      return {};
    }
  },
  setParents: (p: any) => localStorage.setItem("clats_parents_v1", JSON.stringify(p))
};

export function getParentLimits(email: string | null, ageGroup: AgeGroup) {
  if (!email) return DEV_DEFAULTS[ageGroup] || { morning: 0, afternoon: 0, evening: 0 };
  const settings = S.getSettings();
  const saved = settings[email.toLowerCase()];
  if (saved && saved.limitsEnabled && saved.slots) return saved.slots;
  return DEV_DEFAULTS[ageGroup] || { morning: 0, afternoon: 0, evening: 0 };
}

export function slotAllowance(email: string, ageGroup: AgeGroup) {
  const slot = getCurrentSlot();
  if (!slot) return 0;
  return getParentLimits(email, ageGroup)[slot] || 0;
}

export function getTimeLog(email: string) {
  const logs = S.getTime();
  return (logs[email] && logs[email][todayKey()]) || { morning: 0, afternoon: 0, evening: 0 };
}

export function addTime(email: string, slot: "morning" | "afternoon" | "evening", secs: number) {
  const logs = S.getTime();
  const day = todayKey();
  if (!logs[email]) logs[email] = {};
  if (!logs[email][day]) logs[email][day] = { morning: 0, afternoon: 0, evening: 0 };
  logs[email][day][slot] = (logs[email][day][slot] || 0) + secs;
  S.setTime(logs);
}

// No local mock functions anymore.


// ----------------------------------------------------
// 🔥 SUPABASE CLIENT-SIDE PROXIES & SYNC ROUTINES 🔥
// ----------------------------------------------------

export async function getSupabaseStatus(): Promise<{ enabled: boolean; url: string }> {
  try {
    const res = await fetch("/api/supabase/status");
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Could not retrieve Supabase connection status:", e);
  }
  return { enabled: false, url: "Not configured" };
}

export async function syncToSupabase(parent: Parent, tutorial_completed?: boolean) {
  try {
    const res = await fetch("/api/supabase/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentEmail: parent.email,
        parentName: parent.name,
        parentPassword: (parent as any).password,
        children: parent.children || [],
        tutorial_completed
      })
    });
    if (res.status === 404) {
      const data = await res.json();
      if (data.code === "ACCOUNT_DELETED") {
        return { ok: false, code: "ACCOUNT_DELETED", error: data.error };
      }
    }
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Offline: Supabase state backing deferred.", e);
  }
  return { ok: true, synced: false };
}

export async function pullParentFromSupabase(email: string): Promise<Parent | null> {
  try {
    const res = await fetch("/api/supabase/parent/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (res.status === 404) {
      const data = await res.json();
      if (data.code === "ACCOUNT_DELETED") {
        throw new Error("ACCOUNT_DELETED");
      }
    }
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.parent) {
        return data.parent;
      }
    }
  } catch (e: any) {
    if (e?.message === "ACCOUNT_DELETED") {
      throw e;
    }
    console.warn("Could not pull parent from Supabase:", e);
  }
  return null;
}

export async function submitFeedbackSupabase(email: string, message: string) {
  try {
    const res = await fetch("/api/supabase/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, message })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Offline: feedback save deferred to localStorage.", e);
  }
  return { ok: true, synced: false };
}

export async function pullCurriculumFromSupabase() {
  try {
    const [pathwaysRes, modulesRes, lessonsRes, quizzesRes] = await Promise.all([
      fetch("/api/supabase/learning_pathways").then(r => r.json()),
      fetch("/api/supabase/modules").then(r => r.json()),
      fetch("/api/supabase/lessons").then(r => r.json()),
      fetch("/api/supabase/quizzes").then(r => r.json()),
    ]);

    if (pathwaysRes.ok && modulesRes.ok && lessonsRes.ok && quizzesRes.ok) {
      const pathways = pathwaysRes.data || [];
      const modules = modulesRes.data || [];
      const lessons = lessonsRes.data || [];
      const quizzes = quizzesRes.data || [];

      // Always populate the live in-memory cache directly on window
      if (typeof window !== "undefined") {
        (window as any).__supabaseCurriculumData = { pathways, modules, lessons, quizzes };
      }

      // Re-map into curriculumData structure
      const curriculumData: any = {
        early: { pathways: [], modules: [], lessons: [], quizzes: [], stories: [], projects: [] },
        young: { pathways: [], modules: [], lessons: [], quizzes: [], stories: [], projects: [] },
        future: { pathways: [], modules: [], lessons: [], quizzes: [], stories: [], projects: [] }
      };

      const mapAgeGroup = (ag: string): "early" | "young" | "future" => {
        const normalized = String(ag || "").toLowerCase();
        if (normalized.includes("early") || normalized === "early") return "early";
        if (normalized.includes("young") || normalized === "young") return "young";
        return "future";
      };

      // 1. Populate Pathways
      pathways.forEach((p: any) => {
        const key = mapAgeGroup(p.age_group);
        curriculumData[key].pathways.push({
          id: p.id,
          name: p.title,
          desc: p.description
        });
      });

      // 2. Populate Modules
      modules.forEach((m: any) => {
        const key = mapAgeGroup(m.age_group);
        curriculumData[key].modules.push({
          id: m.id,
          pathwayId: m.pathway_id,
          title: m.title,
          desc: m.description,
          order: m.order_number || 1
        });
      });

      // 3. Populate Lessons
      lessons.forEach((l: any) => {
        const mod = modules.find((m: any) => m.id === l.module_id);
        const key = mod ? mapAgeGroup(mod.age_group) : "young";
        curriculumData[key].lessons.push({
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          type: l.description?.includes("Story") || l.video_url === "" ? "Story Lesson" : "Video Lesson",
          progressTime: l.estimated_duration || "5 mins",
          youtubeUrl: l.video_url || "",
          xp: 120, // default standardized XP
          difficulty: "Beginner",
          published: l.status === "published"
        });
      });

      // 4. Populate Quizzes
      quizzes.forEach((q: any) => {
        const lesson = lessons.find((l: any) => l.id === q.lesson_id);
        const mod = lesson ? modules.find((m: any) => m.id === lesson.module_id) : null;
        const key = mod ? mapAgeGroup(mod.age_group) : "young";

        let modQuiz = curriculumData[key].quizzes.find((mq: any) => mq.moduleId === (mod ? mod.id : ""));
        if (!modQuiz) {
          modQuiz = {
            id: q.id,
            moduleId: mod ? mod.id : q.lesson_id,
            title: `${mod ? mod.title : "Lesson"} Knowledge Challenge`,
            questionsCount: 0,
            passScore: 75,
            badgeReward: `${mod ? mod.title : "Lesson"} Expert`,
            xp: 50,
            questions: []
          };
          curriculumData[key].quizzes.push(modQuiz);
        }
        modQuiz.questionsCount++;
        modQuiz.questions.push({
          id: q.id,
          lessonId: q.lesson_id,
          question: q.question,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          correct: q.correct_answer
        });
      });

      // Merge fallback static content to keep full storyboards operational (highly compatible fallback)
      curriculumData.early.stories = [
        { id: "es1", title: "Chibi & Kobe's Magical Password", chapters: 3, narratedBy: "Chibi", hasQuestions: true, bannerEmoji: "🏰" },
        { id: "es2", title: "The Screen that Wanted a Bedtime", chapters: 2, narratedBy: "Kobe", hasQuestions: false, bannerEmoji: "🌟" }
      ];
      curriculumData.young.projects = [
        { id: "ypj1", name: "Design a Helpful Robot Companion", rubric: "Creativity (40%), Labelling (30%), Helper Tasks (30%)", submissions: 14 }
      ];
      curriculumData.future.projects = [
        { id: "fpj1", name: "Create a Custom Discord Assistant Drone", rubric: "API integration (40%), Token Safety (40%), System Prompt (20%)", submissions: 8 },
        { id: "fpj2", name: "Build a Secure Encrypted Messenger Prototype", rubric: "SHA-256 integrity check, LocalStorage storage", submissions: 5 }
      ];

      console.log("Successfully synchronized dynamic curriculum from Supabase to in-memory cache!");
      return curriculumData;
    }
  } catch (err) {
    console.warn("Could not sync curriculum from Supabase, resorting to in-memory fallback:", err);
  }
  return null;
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  const isMobile = /Mobi|Android|iPhone/i.test(ua);
  const deviceType = isMobile ? "Mobile" : "Desktop";

  return { browser, device: deviceType };
}

export async function detectAndStoreLocation(parentEmail: string) {
  let country = "Nigeria";
  let region = "Cross River";
  let city = "Calabar";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  try {
    const ipRes = await fetch("https://ipapi.co/json/");
    if (ipRes.ok) {
      const data = await ipRes.json();
      if (data.country_name) country = data.country_name;
      if (data.region) region = data.region;
      if (data.city) city = data.city;
    }
  } catch (error) {
    console.warn("IP geolocation fallback notice:", error);
  }

  if (navigator.geolocation) {
    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      });
    } catch (e) {
      console.warn("Browser GPS inactive; utilizing IP fallback.");
    }
  }

  try {
    await fetch("/api/supabase/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: parentEmail, country, region, city, timezone })
    });
  } catch (e) {
    console.warn("Unable to sync geolocation to database:", e);
  }
}

export async function logSystemEvent(eventType: string, eventName: string, childId?: string, parentEmail?: string, details?: string) {
  try {
    const { browser, device } = getDeviceInfo();
    await fetch("/api/supabase/system_logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        event_name: eventName,
        child_id: childId,
        parent_email: parentEmail,
        device_info: JSON.stringify({ browser, device }),
        details
      })
    });
  } catch (e) {
    console.warn("Could not log event:", e);
  }
}

export const AVATARS = [
  "👦🏾", "👧🏾", "👦🏿", "👧🏿", "👦🏽", "👧🏽", "🧒🏾", "🧒🏿", "👦", "👧", "🧒",
  "👩‍💻", "👨‍💻", "🧑‍💻", "👩‍🚀", "👨‍🚀", "🧑‍🚀", "👩‍🔬", "👨‍🔬", "🧑‍🔬",
  "🤖", "👾", "🛸", "💻", "🎮", "🕹️", "🛰️", "⚙️",
  "🧸", "🐱", "🐶", "🦊", "🦁", "🦄", "🐉", "🦉", "🦖",
  "🚀", "🪐", "⭐", "🧪", "🧬", "⚡", "🔮"
];
export const INTERESTS = [
  "Technology",
  "Design",
  "Data & Numbers",
  "Cyber Safety"
];
export const LANG_OPTIONS = [
  { code: "en", label: "English" },
  { code: "ig", label: "Igbo" },
  { code: "yo", label: "Yorùbá" },
  { code: "fr", label: "Français" },
  { code: "ha", label: "Hausa" }
];
