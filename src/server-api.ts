import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { SignJWT, jwtVerify } from "jose";
import { Resend } from "resend";
import { GoogleGenAI } from "@google/genai";
import { db, migrate, nanoid } from "./db.ts";

/* ─── Init ─────────────────────────────────────────── */
let migrated = false;
async function ensureMigrated() {
  if (!migrated) {
    await migrate();
    migrated = true;
  }
}

const app = new Hono();
const resend = new Resend(process.env.RESEND_API_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.AISDK_API_KEY || "" });

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-32-chars-min"
);
const APP_URL = process.env.APP_URL || "http://localhost:3000";

/* ─── CORS ──────────────────────────────────────────── */
app.use("*", cors({ origin: APP_URL, credentials: true }));
app.use("*", async (_c, next) => {
  await ensureMigrated();
  await next();
});

/* ─── Content data (shared with client via API) ─────── */
const HABITS = [
  { id: "bible", label: "Read the Bible", stat: "discipline", emoji: "📖" },
  { id: "pray", label: "Pray", stat: "faith", emoji: "🙏" },
  { id: "water", label: "Drink Water", stat: "energy", emoji: "💧" },
  { id: "phone", label: "No Phone Before God", stat: "focus", emoji: "📵" },
  { id: "encourage", label: "Encourage Someone", stat: "purpose", emoji: "❤️" },
];

const CONTENT = [
  { verse: "Wake up, sleeper, rise from the dead, and Christ will shine on you.", ref: "Ephesians 5:14", focusWord: "AWAKE", focusDesc: "Stay present. Stay aware. God is speaking — are you listening?", mission: "Before you check your phone this morning, sit in silence for two minutes and just notice you're alive. Say thank you." },
  { verse: "Let the morning bring me word of your unfailing love, for I have put my trust in you.", ref: "Psalm 143:8", focusWord: "TRUST", focusDesc: "You don't need the whole plan. You just need to take the next step with Him.", mission: "Write down one thing you're anxious about, then hand it to God in a single honest sentence." },
  { verse: "His mercies are new every morning; great is your faithfulness.", ref: "Lamentations 3:22-23", focusWord: "MERCY", focusDesc: "Yesterday doesn't get a vote today. You get a clean page.", mission: "Forgive yourself for one thing you've been quietly carrying from yesterday." },
  { verse: "In the morning, Lord, you hear my voice; in the morning I lay my requests before you and wait expectantly.", ref: "Psalm 5:3", focusWord: "EXPECTANT", focusDesc: "Ask like you believe He's actually listening. Because He is.", mission: "Pray one specific request out loud before you do anything else today." },
  { verse: "Those who hope in the Lord will renew their strength.", ref: "Isaiah 40:31", focusWord: "STRENGTH", focusDesc: "You're not running on your own supply. His doesn't run out.", mission: "Do the one hard thing you've been avoiding. Just start it — you don't have to finish it today." },
  { verse: "Seek first his kingdom and his righteousness, and all these things will be given to you as well.", ref: "Matthew 6:33", focusWord: "PRIORITY", focusDesc: "What gets your first attention shapes everything after it.", mission: "Before you open any app this morning, open your Bible. Even for one verse." },
  { verse: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind.", ref: "Romans 12:2", focusWord: "RENEWED", focusDesc: "Your mind is a battlefield worth showing up for.", mission: "Notice one thought pattern today that isn't from God, and replace it with something true." },
  { verse: "This is the day the Lord has made; let us rejoice and be glad in it.", ref: "Psalm 118:24", focusWord: "PRESENT", focusDesc: "Not yesterday. Not five years from now. Today is the assignment.", mission: "Name three good things about today before it's even 9am." },
  { verse: "The Sovereign Lord is my strength; he makes my feet like the feet of a deer.", ref: "Habakkuk 3:19", focusWord: "STEADY", focusDesc: "You don't need to sprint. You need to keep your footing.", mission: "Take one real step toward your goal today, even if it's a small one." },
  { verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.", ref: "Jeremiah 29:11", focusWord: "PURPOSE", focusDesc: "You're not an accident. This season has a reason.", mission: "Write down one way you think God might be using this season of your life." },
];

/* ─── Auth helpers ──────────────────────────────────── */
async function signToken(payload: object, expiresIn = "30d") {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  class: string;
  start_date: string;
  seen_how: number;
  seen_level_intro: number;
  calorie_goal?: number;
  water_goal?: number;
  created_at: string;
}

async function getUser(c: any) {
  const token = getCookie(c, "session");
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload?.sub) return null;
  const row = await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [payload.sub as string] });
  return (row.rows[0] as unknown as UserRow) || null;
}

type Env = {
  Variables: {
    user: UserRow;
  };
};

/* ─── Auth routes ───────────────────────────────────── */
const auth = new Hono<Env>();

auth.post("/magic", async (c) => {
  const { email } = await c.req.json();
  if (!email || !email.includes("@")) return c.json({ error: "Invalid email" }, 400);

  const userId = nanoid();
  const today = new Date().toISOString().slice(0, 10);
  await db.execute({
    sql: `INSERT INTO users (id, email, start_date) VALUES (?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET email = excluded.email`,
    args: [userId, email, today],
  });

  const userRow = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
  const firstUser = userRow.rows[0];
  if (!firstUser || !firstUser.id) return c.json({ error: "Failed to create user" }, 500);
  const uid = firstUser.id as string;

  const tokenId = nanoid(40);
  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db.execute({
    sql: "INSERT INTO magic_tokens (id, email, token, expires_at) VALUES (?, ?, ?, ?)",
    args: [nanoid(), email, tokenId, expires],
  });

  const magicUrl = `${APP_URL}/api/auth/verify?token=${tokenId}`;

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "LevelUp <noreply@levelupnation.app>",
      to: email,
      subject: "🎮 Your LevelUp Magic Link",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#0d1117;color:#e8e8ec;padding:40px;border-radius:16px;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:40px;margin-bottom:8px;">⚔️</div>
            <h1 style="font-family:sans-serif;font-size:24px;font-weight:800;margin:0;color:#fff;">LevelUp Nation</h1>
            <p style="color:#a8adba;margin:8px 0 0;">Your magic link is ready</p>
          </div>
          <p style="color:#a8adba;line-height:1.6;">Click below to log in. This link expires in <strong style="color:#e8e8ec">15 minutes</strong>.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${magicUrl}" style="display:inline-block;background:#3b5bdb;color:#fff;font-weight:700;font-size:16px;padding:16px 32px;border-radius:10px;text-decoration:none;">✨ Enter the Game</a>
          </div>
          <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } else {
    console.log("\n🔗 MAGIC LINK (dev mode, no Resend key):", magicUrl, "\n");
  }

  return c.json({ ok: true });
});

auth.get("/verify", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.redirect("/?error=invalid");

  const row = await db.execute({
    sql: "SELECT * FROM magic_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')",
    args: [token],
  });

  if (!row.rows.length) return c.redirect("/?error=expired");

  const magicRow = row.rows[0];
  if (!magicRow || !magicRow.email) return c.redirect("/?error=expired");
  await db.execute({ sql: "UPDATE magic_tokens SET used = 1 WHERE token = ?", args: [token] });

  const userRow = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [magicRow.email as string] });
  const firstUser = userRow.rows[0];
  if (!firstUser || !firstUser.id) return c.redirect("/?error=expired");
  const uid = firstUser.id as string;

  await db.execute({
    sql: `INSERT OR IGNORE INTO stats (user_id, last_visit_date) VALUES (?, ?)`,
    args: [uid, new Date().toISOString().slice(0, 10)],
  });

  const sessionToken = await signToken({ sub: uid });
  setCookie(c, "session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return c.redirect("/");
});

auth.post("/logout", (c) => {
  deleteCookie(c, "session", { path: "/" });
  return c.json({ ok: true });
});

auth.get("/me", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ user: null });
  return c.json({ user });
});

app.route("/api/auth", auth);

/* ─── Profile routes ────────────────────────────────── */
const profile = new Hono<Env>();

profile.use("*", async (c, next) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  c.set("user", user);
  await next();
});

interface DBStats {
  faith?: number;
  discipline?: number;
  focus?: number;
  energy?: number;
  purpose?: number;
  streak?: number;
  last_completed_date?: string;
  last_visit_date?: string;
}

profile.get("/", async (c) => {
  const user = c.get("user");
  const statsRow = await db.execute({ sql: "SELECT * FROM stats WHERE user_id = ?", args: [user.id] });
  const stats = (statsRow.rows[0] as unknown as DBStats) || {};

  const today = new Date().toISOString().slice(0, 10);
  const habitRows = await db.execute({
    sql: "SELECT habit_id FROM habits_log WHERE user_id = ? AND date = ?",
    args: [user.id, today],
  });
  const completedToday = habitRows.rows.map((r) => r.habit_id as string);

  const lootRows = await db.execute({
    sql: "SELECT * FROM loot_log WHERE user_id = ? AND date = ?",
    args: [user.id, today],
  });

  const reflectionRow = await db.execute({
    sql: "SELECT text FROM reflections WHERE user_id = ? AND date = ?",
    args: [user.id, today],
  });

  const startDate = user.start_date;
  const dayNum = Math.max(
    1,
    Math.round(
      (new Date(today + "T00:00:00").getTime() - new Date(startDate + "T00:00:00").getTime()) /
      86400000
    ) + 1
  );
  const content = CONTENT[(dayNum - 1) % CONTENT.length];

  return c.json({
    user,
    stats: {
      faith: Number(stats.faith) || 0,
      discipline: Number(stats.discipline) || 0,
      focus: Number(stats.focus) || 0,
      energy: Number(stats.energy) || 0,
      purpose: Number(stats.purpose) || 0,
      streak: Number(stats.streak) || 0,
      lastCompletedDate: stats.last_completed_date || null,
    },
    habits: HABITS,
    completedToday,
    lootClaimedToday: lootRows.rows.length > 0,
    reflection: (reflectionRow.rows[0]?.text as string) || "",
    dayNumber: dayNum,
    content,
  });
});

profile.post("/setup", async (c) => {
  const user = c.get("user");
  const { name, cls } = await c.req.json();
  if (!name || !cls) return c.json({ error: "name and cls required" }, 400);
  await db.execute({
    sql: "UPDATE users SET name = ?, class = ? WHERE id = ?",
    args: [name, cls, user.id],
  });
  return c.json({ ok: true });
});

profile.post("/seen-how", async (c) => {
  const user = c.get("user");
  await db.execute({ sql: "UPDATE users SET seen_how = 1 WHERE id = ?", args: [user.id] });
  return c.json({ ok: true });
});

profile.post("/seen-intro", async (c) => {
  const user = c.get("user");
  await db.execute({ sql: "UPDATE users SET seen_level_intro = 1 WHERE id = ?", args: [user.id] });
  return c.json({ ok: true });
});

app.route("/api/profile", profile);

/* ─── Habits routes ─────────────────────────────────── */
const habits = new Hono<Env>();

habits.use("*", async (c, next) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  c.set("user", user);
  await next();
});

habits.post("/toggle", async (c) => {
  const user = c.get("user");
  const { habitId, completed } = await c.req.json();
  const today = new Date().toISOString().slice(0, 10);

  const habit = HABITS.find((h) => h.id === habitId);
  if (!habit) return c.json({ error: "Unknown habit" }, 400);

  if (completed) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO habits_log (id, user_id, habit_id, date) VALUES (?, ?, ?, ?)",
      args: [nanoid(), user.id, habitId, today],
    });
    await db.execute({
      sql: `INSERT INTO stats (user_id, ${habit.stat}, last_visit_date) VALUES (?, 5, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              ${habit.stat} = MIN(100, ${habit.stat} + 5),
               last_visit_date = ?`,
      args: [user.id, today, today],
    });
  } else {
    await db.execute({
      sql: "DELETE FROM habits_log WHERE user_id = ? AND habit_id = ? AND date = ?",
      args: [user.id, habitId, today],
    });
    await db.execute({
      sql: `UPDATE stats SET ${habit.stat} = MAX(0, ${habit.stat} - 5) WHERE user_id = ?`,
      args: [user.id],
    });
  }

  const doneRows = await db.execute({
    sql: "SELECT COUNT(*) as cnt FROM habits_log WHERE user_id = ? AND date = ?",
    args: [user.id, today],
  });
  const doneCount = Number(doneRows.rows[0]?.cnt ?? 0);
  const allDone = doneCount >= HABITS.length;

  if (allDone) {
    const statsRow = await db.execute({ sql: "SELECT * FROM stats WHERE user_id = ?", args: [user.id] });
    const s = (statsRow.rows[0] as unknown as DBStats) || {};
    if (s.last_completed_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = s.last_completed_date === yesterday ? Number(s.streak ?? 0) + 1 : 1;
      await db.execute({
        sql: "UPDATE stats SET streak = ?, last_completed_date = ? WHERE user_id = ?",
        args: [newStreak, today, user.id],
      });
    }
  }

  return c.json({ ok: true });
});

app.route("/api/habits", habits);

/* ─── Loot & Reflection ─────────────────────────────── */
const game = new Hono<Env>();

game.use("*", async (c, next) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  c.set("user", user);
  await next();
});

game.post("/loot/claim", async (c) => {
  const user = c.get("user");
  const { day, text } = await c.req.json();
  const today = new Date().toISOString().slice(0, 10);

  const exists = await db.execute({
    sql: "SELECT id FROM loot_log WHERE user_id = ? AND date = ?",
    args: [user.id, today],
  });
  if (exists.rows.length) return c.json({ ok: true, already: true });

  await db.execute({
    sql: "INSERT INTO loot_log (id, user_id, day, text, date) VALUES (?, ?, ?, ?, ?)",
    args: [nanoid(), user.id, day, text || "(no note)", today],
  });
  return c.json({ ok: true });
});

game.post("/reflection", async (c) => {
  const user = c.get("user");
  const { text } = await c.req.json();
  const today = new Date().toISOString().slice(0, 10);
  await db.execute({
    sql: `INSERT INTO reflections (id, user_id, date, text) VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, date) DO UPDATE SET text = excluded.text`,
    args: [nanoid(), user.id, today, text],
  });
  return c.json({ ok: true });
});

app.route("/api/game", game);

/* ─── Forum routes ──────────────────────────────────── */
const forum = new Hono<Env>();

forum.use("*", async (c, next) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  c.set("user", user);
  await next();
});

forum.get("/posts", async (c) => {
  const rows = await db.execute({
    sql: `SELECT p.id, p.user_id as userId, p.user_name as userName, p.user_class as userClass,
                 p.title, p.content, p.created_at as createdAt,
                 (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) as commentsCount
          FROM forum_posts p
          ORDER BY p.created_at DESC`,
    args: [],
  });
  return c.json({ posts: rows.rows });
});

forum.post("/posts", async (c) => {
  const user = c.get("user");
  const { title, content } = await c.req.json();
  if (!title || !title.trim() || !content || !content.trim()) {
    return c.json({ error: "Title and content required" }, 400);
  }

  const postId = nanoid();
  await db.execute({
    sql: `INSERT INTO forum_posts (id, user_id, user_name, user_class, title, content)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [postId, user.id, user.name || "Anonymous", user.class || "Wanderer", title.trim(), content.trim()],
  });

  const postRow = await db.execute({
    sql: `SELECT p.id, p.user_id as userId, p.user_name as userName, p.user_class as userClass,
                 p.title, p.content, p.created_at as createdAt, 0 as commentsCount
          FROM forum_posts p WHERE id = ?`,
    args: [postId],
  });

  return c.json({ post: postRow.rows[0] });
});

forum.get("/posts/:id", async (c) => {
  const postId = c.req.param("id");
  const postRow = await db.execute({
    sql: `SELECT p.id, p.user_id as userId, p.user_name as userName, p.user_class as userClass,
                 p.title, p.content, p.created_at as createdAt,
                 (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) as commentsCount
          FROM forum_posts p WHERE id = ?`,
    args: [postId],
  });

  if (!postRow.rows.length) return c.json({ error: "Post not found" }, 404);

  const commentsRow = await db.execute({
    sql: `SELECT c.id, c.post_id as postId, c.user_id as userId, c.user_name as userName,
                 c.user_class as userClass, c.content, c.created_at as createdAt
          FROM forum_comments c WHERE post_id = ? ORDER BY c.created_at ASC`,
    args: [postId],
  });

  return c.json({ post: postRow.rows[0], comments: commentsRow.rows });
});

forum.post("/posts/:id/comments", async (c) => {
  const user = c.get("user");
  const postId = c.req.param("id");
  const { content } = await c.req.json();
  if (!content || !content.trim()) {
    return c.json({ error: "Comment content required" }, 400);
  }

  const commentId = nanoid();
  await db.execute({
    sql: `INSERT INTO forum_comments (id, post_id, user_id, user_name, user_class, content)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [commentId, postId, user.id, user.name || "Anonymous", user.class || "Wanderer", content.trim()],
  });

  const commentRow = await db.execute({
    sql: `SELECT c.id, c.post_id as postId, c.user_id as userId, c.user_name as userName,
                 c.user_class as userClass, c.content, c.created_at as createdAt
          FROM forum_comments c WHERE id = ?`,
    args: [commentId],
  });

  return c.json({ comment: commentRow.rows[0] });
});

app.route("/api/forum", forum);

/* ─── Health routes ──────────────────────────────────── */
const health = new Hono<Env>();

health.use("*", async (c, next) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  c.set("user", user);
  await next();
});

health.get("/", async (c) => {
  const user = c.get("user");
  const today = new Date().toISOString().slice(0, 10);

  const foodRows = await db.execute({
    sql: "SELECT * FROM food_logs WHERE user_id = ? AND date = ? ORDER BY created_at DESC",
    args: [user.id, today],
  });

  const waterRows = await db.execute({
    sql: "SELECT SUM(amount) as total FROM water_logs WHERE user_id = ? AND date = ?",
    args: [user.id, today],
  });

  const foodLogs = foodRows.rows.map((r: any) => ({
    id: r.id as string,
    name: r.name as string,
    calories: Number(r.calories) || 0,
    protein: Number(r.protein) || 0,
    carbs: Number(r.carbs) || 0,
    fat: Number(r.fat) || 0,
    createdAt: r.created_at as string,
  }));

  const totalCalories = foodLogs.reduce((acc, item) => acc + item.calories, 0);
  const totalProtein = foodLogs.reduce((acc, item) => acc + item.protein, 0);
  const totalCarbs = foodLogs.reduce((acc, item) => acc + item.carbs, 0);
  const totalFat = foodLogs.reduce((acc, item) => acc + item.fat, 0);
  const totalWater = Math.max(0, Number(waterRows.rows[0]?.total) || 0);

  return c.json({
    calorieGoal: user.calorie_goal || 2000,
    waterGoal: user.water_goal || 2500,
    totalCalories,
    totalWater,
    totalProtein,
    totalCarbs,
    totalFat,
    foodLogs,
  });
});

health.post("/food/ai", async (c) => {
  const user = c.get("user");
  const { imageBase64 } = await c.req.json();

  if (!imageBase64) {
    return c.json({ error: "Image required" }, 400);
  }

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        },
        {
          text: `Analyze this image. Return STRICT raw JSON (no markdown) with these keys: "detected" (boolean, true only if food/drink is clearly visible), "name" (short dish name or null), "calories" (integer or null), "protein" (grams integer or null), "carbs" (grams integer or null), "fat" (grams integer or null). If no food is detected, return {"detected":false}.`,
        },
      ],
    });

    const rawText = response.text || "{}";
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed.detected) {
      return c.json({ error: "No food detected" }, 422);
    }

    const logId = nanoid();
    const today = new Date().toISOString().slice(0, 10);
    const name = parsed.name || "Meal";
    const calories = Number(parsed.calories) || 0;
    const protein = Number(parsed.protein) || 0;
    const carbs = Number(parsed.carbs) || 0;
    const fat = Number(parsed.fat) || 0;

    await db.execute({
      sql: `INSERT INTO food_logs (id, user_id, name, calories, protein, carbs, fat, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [logId, user.id, name, calories, protein, carbs, fat, today],
    });

    return c.json({
      log: {
        id: logId,
        name,
        calories,
        protein,
        carbs,
        fat,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (e: any) {
    console.error("AI Calorie Estimation error:", e);
    return c.json({ error: e.message || "Failed to analyze image with AI" }, 500);
  }
});

health.post("/food/manual", async (c) => {
  const user = c.get("user");
  const { name, calories, protein, carbs, fat } = await c.req.json();

  if (!name || !calories) {
    return c.json({ error: "Name and calories required" }, 400);
  }

  const logId = nanoid();
  const today = new Date().toISOString().slice(0, 10);
  const foodName = name.trim();
  const calVal = Number(calories) || 0;
  const pVal = Number(protein) || 0;
  const cVal = Number(carbs) || 0;
  const fVal = Number(fat) || 0;

  await db.execute({
    sql: `INSERT INTO food_logs (id, user_id, name, calories, protein, carbs, fat, date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [logId, user.id, foodName, calVal, pVal, cVal, fVal, today],
  });

  return c.json({
    log: {
      id: logId,
      name: foodName,
      calories: calVal,
      protein: pVal,
      carbs: cVal,
      fat: fVal,
      createdAt: new Date().toISOString(),
    },
  });
});

health.delete("/food/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  await db.execute({
    sql: "DELETE FROM food_logs WHERE id = ? AND user_id = ?",
    args: [id, user.id],
  });
  return c.json({ ok: true });
});

health.post("/water", async (c) => {
  const user = c.get("user");
  const { amount } = await c.req.json();
  const today = new Date().toISOString().slice(0, 10);
  await db.execute({
    sql: "INSERT INTO water_logs (id, user_id, amount, date) VALUES (?, ?, ?, ?)",
    args: [nanoid(), user.id, Number(amount) || 250, today],
  });
  return c.json({ ok: true });
});

health.post("/goals", async (c) => {
  const user = c.get("user");
  const { calorieGoal, waterGoal } = await c.req.json();
  await db.execute({
    sql: "UPDATE users SET calorie_goal = ?, water_goal = ? WHERE id = ?",
    args: [Number(calorieGoal) || 2000, Number(waterGoal) || 2500, user.id],
  });
  return c.json({ ok: true });
});

app.route("/api/health", health);

/* ─── Leaderboard ───────────────────────────────────── */
app.get("/api/leaderboard", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const rows = await db.execute({
    sql: `SELECT u.name, u.class, s.streak, s.faith, s.discipline, s.focus, s.energy, s.purpose
          FROM users u JOIN stats s ON u.id = s.user_id
          WHERE u.name != ''
          ORDER BY s.streak DESC, (s.faith + s.discipline + s.focus + s.energy + s.purpose) DESC
          LIMIT 20`,
    args: [],
  });

  return c.json({ leaderboard: rows.rows });
});

app.get("/api/content", async (c) => {
  return c.json({ habits: HABITS, content: CONTENT });
});

/* ─── Coach (motivational chat) ─────────────────────── */
app.post("/api/coach", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { history, systemPrompt } = await c.req.json();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Got it." }] },
        ...(history || []),
      ],
    });

    const reply = response.text?.trim() || "Keep going. Don't stop now.";
    return c.json({ reply });
  } catch (e: any) {
    console.error("Coach error:", e);
    return c.json({ reply: "Can't connect right now. Keep pushing anyway." });
  }
});

export default app;
