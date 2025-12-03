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
  endpoint: string;
  enableAutoCapture?: boolean;
  batchSize?: number;
  batchTimeout?: number;
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
}

