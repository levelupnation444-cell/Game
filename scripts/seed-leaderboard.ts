/**
 * seed-leaderboard.ts
 * Run with:  bun scripts/seed-leaderboard.ts
 *
 * Inserts 75 fake-but-realistic users into the Turso DB
 * with plausible names, classes, stats, and streaks.
 * Safe to run multiple times (uses INSERT OR IGNORE).
 */
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

// ── Credentials ────────────────────────────────────────────────────────────
const TURSO_URL =
  process.env.TURSO_URL ||
  "libsql://game-levelupnation444-cell.aws-us-west-2.turso.io";
const TURSO_PASSWORD =
  process.env.TURSO_PASSWORD ||
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQ1OTE1OTIsImlkIjoiMDE5ZjgxZjItNWQwMS03OTIyLTk5YmYtODQwZDRjYjhiMTg4Iiwia2lkIjoiRi1maFgwb3hKS1gzTzFSVWpkUlBkejhMaUtqbHVjTTI4UGNia2tDbGxWayIsInJpZCI6ImQ3ZTQwZmI4LWI3OTUtNDIzOS1iNDNlLWMzNjUwMzQ3YzU3ZiJ9.Gi0ad6zUmRwD6tAYs5QwdcCZVpv_XHLTqZpst9S0Uk_Ufbkx-v2zs3v_6cXJ10-ni5aFE4dQkBCJQNk8QrCgBw";

const db = createClient({ url: TURSO_URL, authToken: TURSO_PASSWORD });

// ── Data pools ─────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Marcus", "Jordan", "Devon", "Kai", "Nate", "Elias", "Zach", "Tyler",
  "Andre", "Liam", "Owen", "Cole", "Ryan", "Jake", "Seth", "Miles", "Aaron",
  "Brooks", "Finn", "Reid", "Cody", "Luke", "Dean", "Grant", "Chase",
  "Alexis", "Morgan", "Riley", "Taylor", "Avery", "Quinn", "Peyton",
  "Sophia", "Mia", "Leah", "Nadia", "Camille", "Zoe", "Layla", "Iris",
  "Maya", "Jade", "Luna", "Sera", "Dani", "Mara", "Brynn", "Kira",
  "Jaden", "Mateo", "Ezra", "Cyrus", "Theo", "Felix", "Asher", "Eli",
  "Ryu", "Soren", "Kieran", "Dante", "Nico", "Atlas", "Cruz", "Blaise",
  "Sarai", "Freya", "Nova", "Sloane", "Harper", "Hazel", "Wren", "Astrid",
  "Emmett", "Rowan", "Hugo", "Idris", "Leon",
];

const LAST_NAMES = [
  "Cole", "Nash", "Vance", "Stone", "Pierce", "Drake", "Ford", "Cross",
  "Webb", "Lane", "Hart", "Gray", "Reed", "Fox", "West", "Dunn", "Steele",
  "Miles", "Sharp", "Knox", "Grant", "Banks", "Holt", "Lyons", "Dean",
  "Clarke", "Brady", "Hayes", "Quinn", "Marsh", "Wells", "Brooks",
  "Torres", "Reyes", "Ortiz", "Cruz", "Flores", "Rivera", "Morales",
  "Nguyen", "Pham", "Kim", "Park", "Lee", "Chen", "Lin", "Wu", "Zhou",
  "Okonkwo", "Adeyemi", "Mensah", "Diallo", "Traore",
];

const CLASSES = [
  "Monk", "Warrior", "Sage", "Scout", "Scholar",
  "Guardian", "Ranger", "Alchemist", "Strategist", "Templar",
];

// ── TikTok / grind-culture handle parts ───────────────────────────────────
const HANDLE_ADJECTIVES = [
  "silent", "daily", "real", "grind", "locked", "built", "raw",
  "cold", "clean", "focused", "lone", "early", "late",
  "dark", "pure", "iron", "steel", "just", "always", "stay",
  "never", "only", "hard", "deep", "true", "live",
];
const HANDLE_NOUNS = [
  "mode", "kai", "wolf", "monk", "grind", "protocol", "atlas",
  "era", "form", "path", "arc", "vision", "shift", "heat",
  "base", "core", "routine", "sigma", "fox", "nate", "ghost",
  "blade", "mind", "king", "goat", "god", "dog", "bro",
];

/**
 * Generates a realistic, varied display name.
 *
 * Breakdown (roughly):
 *  15% — TikTok-style handle (silentmode, grind.arc47)
 *  12% — first_last or first.last lowercased
 *  10% — first name only, proper case
 *  10% — first name only, all lowercase
 *   8% — last name only
 *   8% — first + number (riley27, nate93)
 *   7% — full "First Last"
 *   7% — "random spam" like user8821, xoxo_maya, lil_kai
 *   8% — nickname style: its[name], im[name], just[name]
 *  15% — mixed bag: first.last, lastfirst, f.last, etc.
 */
function generateDisplayName(first: string, last: string): string {
  const r = Math.random();
  const fl = first.toLowerCase();
  const ll = last.toLowerCase();
  const num = () => String(rand(1, 9999));
  const sep = () => pick(["", ".", "_"]);

  if (r < 0.15) {
    // TikTok handle
    const adj = pick(HANDLE_ADJECTIVES);
    const noun = pick(HANDLE_NOUNS);
    const s = pick(["", "", ".", "_"]);
    const trail = Math.random() < 0.35 ? String(rand(1, 99)) : "";
    return `${adj}${s}${noun}${trail}`;

  } else if (r < 0.27) {
    // first_last or first.last lowercase
    return `${fl}${sep()}${ll}`;

  } else if (r < 0.37) {
    // First name proper case
    return first;

  } else if (r < 0.47) {
    // first name lowercase
    return fl;

  } else if (r < 0.55) {
    // Last name only
    return Math.random() < 0.5 ? last : ll;

  } else if (r < 0.63) {
    // first + number, no sep
    return `${fl}${num()}`;

  } else if (r < 0.70) {
    // Full "First Last"
    return `${first} ${last}`;

  } else if (r < 0.78) {
    // Spam / random-ish: user1234, xo_name, lil_name, name_xo
    const prefix = pick(["user", "its", "lil", "big", "xo", "yo", "og", "mr", "ms", ""]);
    const suffix = pick(["", "xo", "irl", "real", "official", num(), num()]);
    const core = pick([fl, ll, fl + sep() + ll]);
    return prefix ? `${prefix}${sep()}${core}` : `${core}${suffix ? sep() + suffix : ""}`;

  } else if (r < 0.86) {
    // its[name], im[name], just[name]
    const intro = pick(["its", "im", "just", "hey", "hi", "iam"]);
    return `${intro}${fl}`;

  } else {
    // f.last, firstl, last.first — mixed
    const variants = [
      `${fl[0]}${sep()}${ll}`,
      `${fl}${ll[0]}`,
      `${ll}${sep()}${fl}`,
      `${fl}${sep()}${ll}${rand(1, 99)}`,
    ];
    return pick(variants);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** Returns a date string N days in the past */
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

/** Generate a fake email that won't collide with real users */
const fakeEmail = (first: string, last: string, idx: number) =>
  `${first.toLowerCase()}.${last.toLowerCase()}${idx}@levelup.fake`;

interface FakeUser {
  id: string;
  email: string;
  name: string;
  cls: string;
  startDate: string;
  faith: number;
  discipline: number;
  focus: number;
  energy: number;
  purpose: number;
  streak: number;
}

function generateUser(idx: number): FakeUser {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);

  // Tier-based stats so leaderboard has a natural spread
  const tier = Math.random();
  let statMax: number;
  let streakMax: number;
  if (tier > 0.9) { statMax = 95; streakMax = 60; }       // top 10%
  else if (tier > 0.7) { statMax = 80; streakMax = 40; }  // solid
  else if (tier > 0.4) { statMax = 60; streakMax = 20; }  // mid
  else { statMax = 40; streakMax = 10; }                   // casual

  const stat = () => rand(Math.max(5, statMax - 30), statMax);

  return {
    id: randomUUID(),
    email: fakeEmail(first, last, idx),
    name: generateDisplayName(first, last),
    cls: pick(CLASSES),
    startDate: daysAgo(rand(10, 180)),
    faith: stat(),
    discipline: stat(),
    focus: stat(),
    energy: stat(),
    purpose: stat(),
    streak: rand(1, streakMax),
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
const TOTAL = 75;

async function seed() {
  console.log(`Seeding ${TOTAL} fake users into Turso...`);

  const users: FakeUser[] = Array.from({ length: TOTAL }, (_, i) => generateUser(i));

  let inserted = 0;
  for (const u of users) {
    // users row — INSERT OR IGNORE so re-runs are safe
    await db.execute({
      sql: `INSERT OR IGNORE INTO users (id, email, name, class, start_date, seen_how, seen_level_intro)
            VALUES (?, ?, ?, ?, ?, 1, 1)`,
      args: [u.id, u.email, u.name, u.cls, u.startDate],
    });

    // stats row
    await db.execute({
      sql: `INSERT OR IGNORE INTO stats
              (user_id, faith, discipline, focus, energy, purpose, streak, last_completed_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        u.id,
        u.faith, u.discipline, u.focus, u.energy, u.purpose,
        u.streak,
        daysAgo(rand(0, 3)), // recently active
      ],
    });

    inserted++;
    process.stdout.write(`\r  ${inserted}/${TOTAL} inserted`);
  }

  console.log(`\n✅ Done! ${TOTAL} fake users seeded.`);
  console.log("   Tip: run again to add more (existing emails are skipped).");
  db.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
