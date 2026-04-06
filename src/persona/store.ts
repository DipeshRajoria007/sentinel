import { getDb } from "../state/db.js";
import { createLogger } from "../logging/logger.js";
import type { PersonaProfile, PersonaTrait } from "./types.js";

const log = createLogger("persona-store");

export function getOrCreatePersona(
  userId: string,
  displayName: string
): PersonaProfile {
  const db = getDb();
  const now = new Date().toISOString();

  const existing = db
    .prepare("SELECT * FROM personas WHERE user_id = ?")
    .get(userId) as PersonaProfile | undefined;

  if (existing) return existing;

  log.info({ userId, displayName }, "Creating new persona");
  db.prepare(
    `INSERT INTO personas (user_id, display_name, role, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?)`
  ).run(userId, displayName, now, now);

  return {
    userId,
    displayName,
    role: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function getTraits(userId: string): PersonaTrait[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM persona_traits WHERE user_id = ? ORDER BY confidence DESC"
    )
    .all(userId) as PersonaTrait[];
}

export function upsertTrait(
  userId: string,
  label: string,
  value: string
): void {
  const db = getDb();
  const now = new Date().toISOString();

  const existing = db
    .prepare(
      "SELECT * FROM persona_traits WHERE user_id = ? AND label = ? AND value = ?"
    )
    .get(userId, label, value) as PersonaTrait | undefined;

  if (existing) {
    const newConfidence = Math.min(
      existing.confidence + (1 - existing.confidence) * 0.15,
      0.95
    );
    db.prepare(
      `UPDATE persona_traits
       SET confidence = ?, evidence_count = evidence_count + 1, updated_at = ?
       WHERE id = ?`
    ).run(newConfidence, now, existing.id);
    log.debug(
      { userId, label, value, confidence: newConfidence },
      "Updated trait"
    );
  } else {
    db.prepare(
      `INSERT INTO persona_traits (user_id, label, value, confidence, evidence_count, created_at, updated_at)
       VALUES (?, ?, ?, 0.5, 1, ?, ?)`
    ).run(userId, label, value, now, now);
    log.debug({ userId, label, value }, "Created new trait");
  }
}
