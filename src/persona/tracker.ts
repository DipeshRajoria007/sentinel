import { getDb } from "../state/db.js";
import { createLogger } from "../logging/logger.js";
import { upsertTrait } from "./store.js";
import type { QueryCategory } from "./types.js";

const log = createLogger("persona-tracker");

const CATEGORY_KEYWORDS: Record<QueryCategory, string[]> = {
  revenue: [
    "revenue", "sales", "arr", "mrr", "pricing", "billing",
    "subscription", "churn", "ltv", "cac", "conversion", "money",
    "income", "profit", "margin", "cost", "spend", "budget",
  ],
  engineering: [
    "pr", "pull request", "merge", "deploy", "deployment", "build",
    "ci", "cd", "pipeline", "bug", "issue", "commit", "branch",
    "release", "sprint", "velocity", "code", "repo", "github",
    "test", "coverage", "incident", "outage", "downtime",
  ],
  product: [
    "feature", "roadmap", "user", "ux", "ui", "design",
    "feedback", "nps", "retention", "engagement", "activation",
    "onboarding", "funnel", "metric", "kpi", "dau", "wau", "mau",
    "product", "launch", "experiment", "a/b",
  ],
  team: [
    "team", "hire", "hiring", "headcount", "performance",
    "review", "standup", "meeting", "org", "organization",
    "culture", "morale", "attrition", "turnover", "capacity",
    "bandwidth", "resource", "people",
  ],
  general: [],
};

export function categorizeQuery(text: string): QueryCategory {
  const lower = text.toLowerCase();
  const scores: Record<QueryCategory, number> = {
    revenue: 0,
    engineering: 0,
    product: 0,
    team: 0,
    general: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "general") continue;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[category as QueryCategory]++;
      }
    }
  }

  const best = Object.entries(scores).reduce((a, b) =>
    a[1] >= b[1] ? a : b
  );

  return best[1] > 0 ? (best[0] as QueryCategory) : "general";
}

export function trackQuery(
  userId: string,
  channelId: string,
  threadTs: string,
  queryText: string
): void {
  const db = getDb();
  const category = categorizeQuery(queryText);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO query_log (user_id, channel_id, thread_ts, query_text, category, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, channelId, threadTs, queryText, category, now);

  if (category !== "general") {
    upsertTrait(userId, "focus_area", category);
    log.info({ userId, category }, "Tracked query and updated persona trait");
  } else {
    log.debug({ userId }, "Tracked general query (no trait update)");
  }
}
