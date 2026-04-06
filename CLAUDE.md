# Sentinel

Leadership data bot POC — Slack bot powered by Claude CLI with MCP tools for Metabase, GitHub, and Notion.

## Build & Run

- `npm run dev` — run in dev mode with tsx
- `npm run build` — compile TypeScript
- `npm start` — run compiled JS
- `npm test` — run tests with vitest

## Architecture

- **Slack Socket Mode** via @slack/bolt — handles mentions, DMs, slash commands
- **Claude CLI** spawned as subprocess with `--mcp-config` for tool access
- **MCP servers**: Metabase (custom), GitHub (@modelcontextprotocol/server-github), Notion (@modelcontextprotocol/server-notion)
- **Persona system**: SQLite-backed per-user persona that evolves based on query patterns
- **Module system**: ESM with NodeNext resolution — all imports use `.js` extensions

## Conventions

- TypeScript strict mode, ESM modules
- All relative imports must include `.js` extension
- Pino for structured logging
- Zod for config/input validation
- SQLite with WAL mode for persistence
