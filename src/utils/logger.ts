/**
 * Logging configuration and utilities
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
}

class Logger {
  private isDev = typeof window === "undefined" ? process.env.NODE_ENV === "development" : false;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  log(level: LogLevel, context: string, message: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    };

    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    const icon = {
      [LogLevel.DEBUG]: "🔍",
      [LogLevel.INFO]: "ℹ️",
      [LogLevel.WARN]: "⚠️",
      [LogLevel.ERROR]: "❌",
    }[level];

    const style = {
      [LogLevel.DEBUG]: "color: #666",
      [LogLevel.INFO]: "color: #0066cc",
      [LogLevel.WARN]: "color: #ff9900",
      [LogLevel.ERROR]: "color: #cc0000",
    }[level];

    if (this.isDev || level === LogLevel.ERROR) {
      console.log(
        `%c${icon} [${context}] ${message}`,
        style,
        data || ""
      );
    }
  }

  debug(context: string, message: string, data?: unknown) {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  info(context: string, message: string, data?: unknown) {
    this.log(LogLevel.INFO, context, message, data);
  }

  warn(context: string, message: string, data?: unknown) {
    this.log(LogLevel.WARN, context, message, data);
  }

  error(context: string, message: string, data?: unknown) {
    this.log(LogLevel.ERROR, context, message, data);
  }

  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory() {
    this.logHistory = [];
  }
}

export const logger = new Logger();
