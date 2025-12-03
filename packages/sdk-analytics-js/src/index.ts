import Transport from "./transport";
import SessionManager from "./session";
import Interceptors from "./interceptors";
import type { InitOptions, EventPayload, EventContext } from "./types";

class FastAnalyticsSDK {
  private transport: Transport | null = null;
  private sessionManager: SessionManager;
  private interceptors: Interceptors | null = null;
  private initialized = false;
  private userId: string | undefined;

  constructor() {
    this.sessionManager = new SessionManager();
  }

  init(options: InitOptions): void {
    if (this.initialized) {
      console.warn("[Fast Analytics SDK] SDK уже инициализирован");
      return;
    }

    this.userId = options.userId;
    this.transport = new Transport(options);
    this.interceptors = new Interceptors(
      this.transport,
      this.sessionManager,
      () => this.userId,
      options.endpoint
    );

    if (options.enableAutoCapture !== false) {
      this.interceptors.setup();
    }

    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.transport) {
      throw new Error(
        "[Fast Analytics SDK] SDK не инициализирован. Вызовите init() перед использованием."
      );
    }
  }

  async logError(error: Error | string, context?: EventContext): Promise<void> {
    this.ensureInitialized();

    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    const payload: EventPayload = {
      level: "error",
      message,
      stack,
      context,
      sessionId: this.sessionManager.getSessionId(),
      userId: context?.userId || this.userId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    await this.transport!.send(payload);
  }

  async logWarning(message: string, context?: EventContext): Promise<void> {
    this.ensureInitialized();

    const payload: EventPayload = {
      level: "warn",
      message,
      context,
      sessionId: this.sessionManager.getSessionId(),
      userId: context?.userId || this.userId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    await this.transport!.send(payload);
  }

  async logInfo(message: string, context?: EventContext): Promise<void> {
    this.ensureInitialized();

    const payload: EventPayload = {
      level: "info",
      message,
      context,
      sessionId: this.sessionManager.getSessionId(),
      userId: context?.userId || this.userId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    await this.transport!.send(payload);
  }

  async logDebug(message: string, context?: EventContext): Promise<void> {
    this.ensureInitialized();

    const payload: EventPayload = {
      level: "debug",
      message,
      context,
      sessionId: this.sessionManager.getSessionId(),
      userId: context?.userId || this.userId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    await this.transport!.send(payload);
  }

  async flush(): Promise<void> {
    if (this.transport) {
      await this.transport.flush();
    }
  }

  getSessionId(): string {
    return this.sessionManager.getSessionId();
  }

  resetSession(): void {
    this.sessionManager.resetSession();
  }

  teardown(): void {
    if (this.interceptors) {
      this.interceptors.teardown();
    }
    this.initialized = false;
  }
}

// Создаем singleton экземпляр
const sdk = new FastAnalyticsSDK();

export const init = (options: InitOptions) => sdk.init(options);
export const logError = (error: Error | string, context?: EventContext) =>
  sdk.logError(error, context);
export const logWarning = (message: string, context?: EventContext) =>
  sdk.logWarning(message, context);
export const logInfo = (message: string, context?: EventContext) =>
  sdk.logInfo(message, context);
export const logDebug = (message: string, context?: EventContext) =>
  sdk.logDebug(message, context);
export const flush = () => sdk.flush();
export const getSessionId = () => sdk.getSessionId();
export const resetSession = () => sdk.resetSession();
export const teardown = () => sdk.teardown();

export default sdk;
export type {
  InitOptions,
  EventContext,
  EventPayload,
  EventLevel,
} from "./types";
