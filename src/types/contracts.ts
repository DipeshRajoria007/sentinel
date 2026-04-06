export interface SlackEventEnvelope {
  type: "mention" | "dm" | "slash_command";
  userId: string;
  channelId: string;
  threadTs: string;
  text: string;
  messageTs: string;
}

export interface ThreadMessage {
  userId: string;
  text: string;
  ts: string;
}

export interface ClaudeResponse {
  text: string;
  durationMs: number;
}
