import type { EventContext, EventLevel, EventPayload } from "../model";
import { getBrowserUrl, getBrowserUserAgent } from "./get-browser-info";

interface CreateEventPayloadOptions {
  level: EventLevel;
  message: string;
  stack?: string;
  context?: EventContext;
  sessionId: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  screenshotUrl?: string;
}

export const createEventPayload = (
  options: CreateEventPayloadOptions
): EventPayload => {
  const {
    level,
    message,
    stack,
    context,
    sessionId,
    userId,
    screenshotUrl,
  } = options;

  const url = options.url ?? getBrowserUrl();
  const userAgent = options.userAgent ?? getBrowserUserAgent();

  return {
    level,
    message,
    stack,
    context,
    sessionId,
    userId: context?.userId || userId,
    url,
    userAgent,
    screenshotUrl,
  };
};

