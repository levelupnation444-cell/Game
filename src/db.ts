import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_PASSWORD,
});

export async function migrate() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT DEFAULT '',
      class TEXT DEFAULT '',
      start_date TEXT NOT NULL,
      seen_how INTEGER DEFAULT 0,
      seen_level_intro INTEGER DEFAULT 0,
      calorie_goal INTEGER DEFAULT 2000,
      water_goal INTEGER DEFAULT 2500,
      is_subscribed INTEGER DEFAULT 0,
      stripe_customer_id TEXT DEFAULT '',
      stripe_subscription_id TEXT DEFAULT '',
      subscription_status TEXT DEFAULT 'inactive',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habits_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, habit_id, date),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stats (
      user_id TEXT PRIMARY KEY,
      faith INTEGER DEFAULT 0,
      discipline INTEGER DEFAULT 0,
      focus INTEGER DEFAULT 0,
      energy INTEGER DEFAULT 0,
      purpose INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_completed_date TEXT,
      last_visit_date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reflections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      text TEXT DEFAULT '',
      UNIQUE(user_id, date),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS loot_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      day INTEGER NOT NULL,
      text TEXT DEFAULT '',
      date TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS magic_tokens (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_class TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS forum_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_class TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(post_id) REFERENCES forum_posts(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS food_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein INTEGER DEFAULT 0,
      carbs INTEGER DEFAULT 0,
      fat INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Migrate columns for existing databases safely
  try {
    await db.execute("ALTER TABLE users ADD COLUMN calorie_goal INTEGER DEFAULT 2000");
  } catch {}
  try {
    await db.execute("ALTER TABLE users ADD COLUMN water_goal INTEGER DEFAULT 2500");
  } catch {}
  try {
    await db.execute("ALTER TABLE users ADD COLUMN is_subscribed INTEGER DEFAULT 0");
  } catch {}
  try {
    await db.execute("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT DEFAULT ''");
  } catch {}
  try {
    await db.execute("ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT DEFAULT ''");
  } catch {}
  try {
    await db.execute("ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'inactive'");
  } catch {}

  console.log("✅ DB migrated with Health tables & goals");
}

export function nanoid(n = 21) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < n; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}
