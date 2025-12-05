import { FastAnalyticsSDK } from "./sdk";
import type {
  EventContext,
  EventLevel,
  EventPayload,
  EventPerformance,
  InitOptions,
} from "./model";

const sdk = new FastAnalyticsSDK();

export const init = (options: InitOptions): void => sdk.init(options);

export const logError = (
  error: Error | string,
  context?: EventContext
): Promise<void> => sdk.logError(error, context);

export const logWarning = (
  message: string,
  context?: EventContext
): Promise<void> => sdk.logWarning(message, context);

export const logInfo = (
  message: string,
  context?: EventContext
): Promise<void> => sdk.logInfo(message, context);

export const logDebug = (
  message: string,
  context?: EventContext
): Promise<void> => sdk.logDebug(message, context);

export const flush = (): Promise<void> => sdk.flush();

export const getSessionId = (): string => sdk.getSessionId();

export const resetSession = (): void => sdk.resetSession();

export const teardown = (): void => sdk.teardown();

export type {
  EventContext,
  EventLevel,
  EventPayload,
  EventPerformance,
  InitOptions,
};
