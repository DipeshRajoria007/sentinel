import pino from "pino";
import { config } from "../config.js";

export const logger = pino({
  level: config.LOG_LEVEL,
  name: "sentinel",
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createLogger(component: string) {
  return logger.child({ component });
}
