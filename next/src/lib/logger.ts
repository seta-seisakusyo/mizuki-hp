/**
 * シンプルなロガーユーティリティ
 * 本番環境ではエラーのみ出力、開発環境では全て出力
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const getCurrentLevel = (): number => {
  if (process.env.NODE_ENV === "production") {
    return LOG_LEVELS.error; // 本番環境ではエラーのみ
  }
  return LOG_LEVELS.debug; // 開発環境では全て
};

const formatMessage = (level: LogLevel, message: string, meta?: unknown): string => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= getCurrentLevel();
};

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", message, meta));
    }
  },

  info: (message: string, meta?: unknown) => {
    if (shouldLog("info")) {
      console.info(formatMessage("info", message, meta));
    }
  },

  warn: (message: string, meta?: unknown) => {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message, meta));
    }
  },

  error: (message: string, error?: unknown) => {
    if (shouldLog("error")) {
      const errorMeta = error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
      console.error(formatMessage("error", message, errorMeta));
    }
  },
};

export default logger;
