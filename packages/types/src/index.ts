export type EventLevel = "error" | "warn" | "info" | "debug";

export interface EventContext {
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  customTags?: Record<string, string>;
  [key: string]: unknown;
}

export interface EventPerformance {
  requestDuration?: number; // время выполнения запроса в миллисекундах
  timestamp?: number; // timestamp начала запроса
  [key: string]: unknown;
}

export interface CreateEventDto {
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

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  apiKey: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  projectId: string;
  timestamp: Date;
  level: EventLevel;
  message: string;
  stack: string | null;
  context: EventContext | null;
  userAgent: string | null;
  url: string | null;
  sessionId: string | null;
  userId: string | null;
  createdAt: Date;
  screenshotUrl: string | null;
  clickTrace: unknown | null;
  performance: unknown | null;
  metadata: unknown | null;
}

