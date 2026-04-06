import bolt from "@slack/bolt";
const { App } = bolt;
import { config } from "../config.js";
import { createLogger } from "../logging/logger.js";
import type { SlackEventEnvelope } from "../types/contracts.js";

const log = createLogger("slack");

export type EventHandler = (
  envelope: SlackEventEnvelope,
  client: InstanceType<typeof App>["client"]
) => Promise<void>;

export function createSlackApp(handler: EventHandler) {
  const app = new App({
    token: config.SLACK_BOT_TOKEN,
    appToken: config.SLACK_APP_TOKEN,
    socketMode: true,
    logLevel: bolt.LogLevel.WARN,
  });

  // Handle @mentions
  app.event("app_mention", async ({ event, client }) => {
    const userId = event.user;
    if (!userId || !isAllowed(userId)) {
      log.warn({ userId }, "Unauthorized or unknown user, ignoring mention");
      return;
    }

    const text = stripBotMention(event.text);
    const threadTs = event.thread_ts ?? event.ts;

    const envelope: SlackEventEnvelope = {
      type: "mention",
      userId,
      channelId: event.channel,
      threadTs,
      text,
      messageTs: event.ts,
    };

    await handler(envelope, client);
  });

  // Handle DMs — use the message shortcut which properly types GenericMessageEvent
  app.message(async ({ message, client }) => {
    // Cast to access properties — Bolt's message types are a complex union
    const msg = message as unknown as Record<string, unknown>;

    // Only handle plain messages in DMs (no subtype)
    if (msg.channel_type !== "im" || msg.subtype) return;

    const userId = msg.user as string | undefined;
    if (!userId || userId === config.BOT_USER_ID) return;
    if (!isAllowed(userId)) {
      log.warn({ userId }, "Unauthorized user, ignoring DM");
      return;
    }

    const threadTs =
      (msg.thread_ts as string | undefined) ?? (msg.ts as string);

    const envelope: SlackEventEnvelope = {
      type: "dm",
      userId,
      channelId: msg.channel as string,
      threadTs,
      text: (msg.text as string) ?? "",
      messageTs: msg.ts as string,
    };

    await handler(envelope, client);
  });

  // Handle /sentinel slash command
  app.command("/sentinel", async ({ command, ack, client }) => {
    await ack();

    if (!isAllowed(command.user_id)) {
      log.warn(
        { userId: command.user_id },
        "Unauthorized user, ignoring command"
      );
      return;
    }

    // Post an initial message to create a thread
    const result = await client.chat.postMessage({
      channel: command.channel_id,
      text: `:satellite_antenna: Processing: _${command.text || "What can I help with?"}_`,
    });

    const envelope: SlackEventEnvelope = {
      type: "slash_command",
      userId: command.user_id,
      channelId: command.channel_id,
      threadTs: result.ts!,
      text: command.text || "What can I help with?",
      messageTs: result.ts!,
    };

    await handler(envelope, client);
  });

  return app;
}

function isAllowed(userId: string): boolean {
  return config.ALLOWED_USER_IDS.includes(userId);
}

function stripBotMention(text: string): string {
  return text.replace(new RegExp(`<@${config.BOT_USER_ID}>`, "g"), "").trim();
}
