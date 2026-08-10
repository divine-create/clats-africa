/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = "en" | "ig" | "yo" | "fr" | "ha";

export type AgeGroup = "early explorers" | "young innovators" | "future builders";

export interface Child {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  avatar: string;
  username: string;
  pin: string;
  interests: string[];
  completed: Record<string, boolean>; // lessonId -> true
  xp: number;
  stars: Record<string, number>; // lessonId -> count
  createdAt: number;
  companion?: "kobe" | "chibi"; // Preferred companion, Kobe (boy) or Chibi (girl)
  quizResults?: Record<string, {
    score: number;
    correctCount: number;
    totalQuestions: number;
    status: "Passed" | "Needs Review";
    completedAt: string;
  }>;
  child_tutorial_completed?: boolean;
  last_active_at?: string;
  streak_count?: number;
  best_streak?: number;
}

export interface Parent {
  email: string;
  name: string;
  children: Child[];
  tutorial_completed?: boolean;
  user_id?: string;
  avatar_url?: string;
  provider?: string;
  timezone?: string;
  last_login_at?: number | null;
  login_device?: string;
  login_browser?: string;
  login_location?: string;
  isB2B?: boolean;
}

export type Localized<T> = {
  en: T;
  ig: T;
  yo: T;
  fr?: T;
  ha?: T;
};

export interface QuizQuestion {
  q: Localized<string>;
  opts: Localized<string[]>;
  ans: number;
}

export interface Lesson {
  id: string;
  title: Localized<string>;
  code: string;
  duration: string;
  type: "story" | "puzzle" | "project";
  story?: Localized<string>;
  puzzle?: {
    text: Localized<string>;
    items: {
      en: string[];
      ig?: string[];
      yo?: string[];
      correct: boolean[];
    };
  };
  project?: Localized<string>;
  quiz: QuizQuestion[];
}

export interface Module {
  id: string;
  name: Localized<string>;
  goal: Localized<string>;
  lessons: Lesson[];
  badge: {
    name: string;
    icon: string;
  };
  comingSoon?: boolean;
}

export interface Course {
  id: AgeGroup;
  title: Localized<string>;
  description: Localized<string>;
  modules: Module[];
}
