export type {
  Account,
  Event,
  Project,
  ProjectInvitation,
  ProjectMember,
  Session,
  User,
  VerificationToken,
} from "@prisma/client";

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

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

export type ProjectInvitationStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "cancelled";