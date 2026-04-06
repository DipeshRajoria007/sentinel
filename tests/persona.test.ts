import { describe, it, expect, vi } from "vitest";

// Mock config module to prevent process.exit on missing env vars
vi.mock("../src/config.js", () => ({
  config: {
    SQLITE_DB_PATH: ":memory:",
    LOG_LEVEL: "silent",
  },
}));

// Mock pino to avoid logger noise
vi.mock("pino", () => {
  const noop = () => {};
  const logger = { info: noop, warn: noop, error: noop, debug: noop, fatal: noop, trace: noop, child: () => logger };
  const pino = () => logger;
  pino.stdTimeFunctions = { isoTime: () => "" };
  return { default: pino };
});

import { categorizeQuery } from "../src/persona/tracker.js";

describe("categorizeQuery", () => {
  it("categorizes revenue queries", () => {
    expect(categorizeQuery("What were our revenue numbers last month?")).toBe(
      "revenue"
    );
    expect(categorizeQuery("Show me MRR trends")).toBe("revenue");
    expect(categorizeQuery("What's our current churn rate?")).toBe("revenue");
  });

  it("categorizes engineering queries", () => {
    expect(categorizeQuery("Show me open PRs on newton-web")).toBe(
      "engineering"
    );
    expect(categorizeQuery("How many deploys this week?")).toBe("engineering");
    expect(categorizeQuery("Any recent incidents or outages?")).toBe(
      "engineering"
    );
  });

  it("categorizes product queries", () => {
    expect(categorizeQuery("What's on the product roadmap?")).toBe("product");
    expect(categorizeQuery("Show me user retention metrics")).toBe("product");
    expect(categorizeQuery("What's our DAU this week?")).toBe("product");
  });

  it("categorizes team queries", () => {
    expect(categorizeQuery("How's the hiring going?")).toBe("team");
    expect(categorizeQuery("Show me team headcount")).toBe("team");
    expect(categorizeQuery("What's the org structure?")).toBe("team");
  });

  it("defaults to general for ambiguous queries", () => {
    expect(categorizeQuery("give me an update")).toBe("general");
    expect(categorizeQuery("what's new?")).toBe("general");
    expect(categorizeQuery("hello")).toBe("general");
  });

  it("picks the category with more keyword matches", () => {
    expect(
      categorizeQuery(
        "What's our revenue, MRR, and churn rate compared to sales targets?"
      )
    ).toBe("revenue");
  });
});
