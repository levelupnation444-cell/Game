export interface User {
  id: string;
  email: string;
  name: string;
  class: string;
  start_date: string;
  seen_how: number;
  seen_level_intro: number;
  calorie_goal?: number;
  water_goal?: number;
}

export interface Stats {
  faith: number;
  discipline: number;
  focus: number;
  energy: number;
  purpose: number;
  streak: number;
  lastCompletedDate: string | null;
}

export interface Content {
  verse: string;
  ref: string;
  focusWord: string;
  focusDesc: string;
  mission: string;
}

export interface Habit {
  id: string;
  label: string;
  stat: keyof Omit<Stats, "streak" | "lastCompletedDate">;
  emoji: string;
}

export interface LeaderboardEntry {
  name: string;
  class: string;
  streak: number;
  faith: number;
  discipline: number;
  focus: number;
  energy: number;
  purpose: number;
}

export interface ProfileData {
  user: User;
  stats: Stats;
  habits: Habit[];
  completedToday: string[];
  lootClaimedToday: boolean;
  reflection: string;
  dayNumber: number;
  content: Content;
}

export interface ForumComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userClass: string;
  content: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  userId: string;
  userName: string;
  userClass: string;
  title: string;
  content: string;
  createdAt: string;
  commentsCount: number;
  comments?: ForumComment[];
}

export interface FoodLog {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
}

export interface HealthData {
  calorieGoal: number;
  waterGoal: number;
  totalCalories: number;
  totalWater: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  foodLogs: FoodLog[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error occurred" }));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    sendMagicLink: (email: string) => request<{ ok: boolean }>("/api/auth/magic", { method: "POST", body: JSON.stringify({ email }) }),
    logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    me: () => request<{ user: User | null }>("/api/auth/me"),
  },
  profile: {
    get: () => request<ProfileData>("/api/profile"),
    setup: (name: string, cls: string) => request<{ ok: boolean }>("/api/profile/setup", { method: "POST", body: JSON.stringify({ name, cls }) }),
    seenHow: () => request<{ ok: boolean }>("/api/profile/seen-how", { method: "POST" }),
    seenIntro: () => request<{ ok: boolean }>("/api/profile/seen-intro", { method: "POST" }),
  },
  habits: {
    toggle: (habitId: string, completed: boolean) => request<{ ok: boolean }>("/api/habits/toggle", { method: "POST", body: JSON.stringify({ habitId, completed }) }),
  },
  game: {
    claimLoot: (day: number, text: string) => request<{ ok: boolean }>("/api/game/loot/claim", { method: "POST", body: JSON.stringify({ day, text }) }),
    saveReflection: (text: string) => request<{ ok: boolean }>("/api/game/reflection", { method: "POST", body: JSON.stringify({ text }) }),
  },
  leaderboard: {
    get: () => request<{ leaderboard: LeaderboardEntry[] }>("/api/leaderboard"),
  },
  forum: {
    getPosts: () => request<{ posts: ForumPost[] }>("/api/forum/posts"),
    createPost: (title: string, content: string) => request<{ post: ForumPost }>("/api/forum/posts", { method: "POST", body: JSON.stringify({ title, content }) }),
    getPost: (id: string) => request<{ post: ForumPost; comments: ForumComment[] }>(`/api/forum/posts/${id}`),
    addComment: (postId: string, content: string) => request<{ comment: ForumComment }>(`/api/forum/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  },
  health: {
    get: () => request<HealthData>("/api/health"),
    logFoodAI: (imageBase64: string) => request<{ log: FoodLog }>("/api/health/food/ai", { method: "POST", body: JSON.stringify({ imageBase64 }) }),
    logFoodManual: (name: string, calories: number, protein?: number, carbs?: number, fat?: number) => request<{ log: FoodLog }>("/api/health/food/manual", { method: "POST", body: JSON.stringify({ name, calories, protein, carbs, fat }) }),
    deleteFood: (id: string) => request<{ ok: boolean }>(`/api/health/food/${id}`, { method: "DELETE" }),
    addWater: (amount: number) => request<{ ok: boolean }>("/api/health/water", { method: "POST", body: JSON.stringify({ amount }) }),
    updateGoals: (calorieGoal: number, waterGoal: number) => request<{ ok: boolean }>("/api/health/goals", { method: "POST", body: JSON.stringify({ calorieGoal, waterGoal }) }),
  },
};
