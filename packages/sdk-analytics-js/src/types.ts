export type EventLevel = "error" | "warn" | "info" | "debug";

export interface EventContext {
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  customTags?: Record<string, string>;
  [key: string]: unknown;
}

export interface InitOptions {
  projectKey: string;
  endpoint?: string;
  enableAutoCapture?: boolean;
  batchSize?: number;
  batchTimeout?: number;
  userId?: string;
}

export interface EventPerformance {
  requestDuration?: number; // время выполнения запроса в миллисекундах
  timestamp?: number; // timestamp начала запроса
  [key: string]: unknown;
}

export interface EventPayload {
  level: EventLevel;
  message: string;
  stack?: string;
  context?: EventContext;
  userAgent?: string;
  url?: string;
  sessionId?: string;
  userId?: string;
  performance?: EventPerformance;
}

