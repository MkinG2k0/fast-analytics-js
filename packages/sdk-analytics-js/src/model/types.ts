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
  enablePageTracking?: boolean;
  enableScreenshotOnError?: boolean;
  enableOnlineTracking?: boolean;
  batchSize?: number;
  batchTimeout?: number;
  heartbeatInterval?: number;
  userId?: string;
}

export interface EventPerformance {
  requestDuration?: number;
  timestamp?: number;
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
  screenshotUrl?: string;
}

export interface PageVisitPayload {
  url: string;
  pathname?: string;
  referrer?: string;
  userAgent?: string;
  sessionId?: string;
  userId?: string;
  duration?: number;
}

