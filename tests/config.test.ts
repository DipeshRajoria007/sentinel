import { describe, it, expect } from "vitest";
import { z } from "zod";

// Test the schema logic directly (without triggering process.exit from config.ts)
const envSchema = z.object({
  SLACK_BOT_TOKEN: z.string().startsWith("xoxb-"),
  SLACK_APP_TOKEN: z.string().startsWith("xapp-"),
  BOT_USER_ID: z.string().min(1),
  CLAUDE_BIN: z.string().default("claude"),
  ANTHROPIC_API_KEY: z.string().min(1),
  METABASE_URL: z.string().url(),
  METABASE_USERNAME: z.string().min(1),
  METABASE_PASSWORD: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1),
  NOTION_API_KEY: z.string().min(1),
  SQLITE_DB_PATH: z.string().default("./sentinel.db"),
  ALLOWED_USER_IDS: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

describe("config schema", () => {
  const validEnv = {
    SLACK_BOT_TOKEN: "xoxb-test-token",
    SLACK_APP_TOKEN: "xapp-test-token",
    BOT_USER_ID: "U123456",
    ANTHROPIC_API_KEY: "sk-ant-test",
    METABASE_URL: "https://metabase.example.com",
    METABASE_USERNAME: "admin@test.com",
    METABASE_PASSWORD: "password",
    GITHUB_TOKEN: "ghp_test",
    NOTION_API_KEY: "ntn_test",
    ALLOWED_USER_IDS: "U123,U456",
  };

  it("parses valid env correctly", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ALLOWED_USER_IDS).toEqual(["U123", "U456"]);
      expect(result.data.LOG_LEVEL).toBe("info");
      expect(result.data.SQLITE_DB_PATH).toBe("./sentinel.db");
      expect(result.data.CLAUDE_BIN).toBe("claude");
    }
  });

  it("rejects invalid Slack bot token prefix", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      SLACK_BOT_TOKEN: "bad-token",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid Slack app token prefix", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      SLACK_APP_TOKEN: "bad-token",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid Metabase URL", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      METABASE_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("parses ALLOWED_USER_IDS with whitespace", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      ALLOWED_USER_IDS: " U111 , U222 , U333 ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ALLOWED_USER_IDS).toEqual(["U111", "U222", "U333"]);
    }
  });

  it("accepts valid log levels", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      LOG_LEVEL: "debug",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.LOG_LEVEL).toBe("debug");
    }
  });

  it("rejects invalid log level", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      LOG_LEVEL: "verbose",
    });
    expect(result.success).toBe(false);
  });
});
