import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { config } from "../config.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("mcp-config");

interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

let configPath: string | null = null;

export function getMcpConfigPath(): string {
  if (configPath) return configPath;

  const dir = join(tmpdir(), "sentinel-mcp");
  mkdirSync(dir, { recursive: true });
  configPath = join(dir, "mcp-config.json");

  const mcpConfig: McpConfig = {
    mcpServers: {
      metabase: {
        command: "node",
        args: [join(process.cwd(), "dist", "mcp", "metabase.js")],
        env: {
          METABASE_URL: config.METABASE_URL,
          METABASE_USERNAME: config.METABASE_USERNAME,
          METABASE_PASSWORD: config.METABASE_PASSWORD,
        },
      },
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: config.GITHUB_TOKEN,
        },
      },
      notion: {
        command: "npx",
        args: ["-y", "@notionhq/notion-mcp-server"],
        env: {
          OPENAPI_MCP_HEADERS: JSON.stringify({
            Authorization: `Bearer ${config.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
          }),
        },
      },
    },
  };

  writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2));
  log.info({ path: configPath }, "Wrote MCP config");

  return configPath;
}
