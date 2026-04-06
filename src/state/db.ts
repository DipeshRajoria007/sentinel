import Database from "better-sqlite3";
import { config } from "../config.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  log.info({ path: config.SQLITE_DB_PATH }, "Opening SQLite database");
  _db = new Database(config.SQLITE_DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  runMigrations(_db);
  return _db;
}

function runMigrations(db: Database.Database): void {
  log.info("Running database migrations");

  db.exec(`
    CREATE TABLE IF NOT EXISTS personas (
      user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      role TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS persona_traits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.5,
      evidence_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, label, value)
    );

    CREATE TABLE IF NOT EXISTS query_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      thread_ts TEXT NOT NULL,
      query_text TEXT NOT NULL,
      category TEXT,
      created_at TEXT NOT NULL
    );
  `);

  log.info("Migrations complete");
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
    log.info("Database closed");
  }
}
