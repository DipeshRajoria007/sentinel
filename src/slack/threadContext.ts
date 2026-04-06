import type { WebClient } from "@slack/web-api";
import { createLogger } from "../logging/logger.js";
import type { ThreadMessage } from "../types/contracts.js";

const log = createLogger("thread-context");

export async function fetchThreadContext(
  client: WebClient,
  channelId: string,
  threadTs: string
): Promise<ThreadMessage[]> {
  try {
    const result = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
      limit: 50,
    });

    if (!result.messages || result.messages.length <= 1) {
      return [];
    }

    // Skip the first message (the parent) and return the rest
    return result.messages.slice(1).map((msg) => ({
      userId: msg.user ?? "unknown",
      text: msg.text ?? "",
      ts: msg.ts ?? "",
    }));
  } catch (err) {
    log.warn({ err, channelId, threadTs }, "Failed to fetch thread context");
    return [];
  }
}
