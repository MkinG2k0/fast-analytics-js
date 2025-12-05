import type { EventContext, EventLevel, InitOptions } from "./model";
import { getDefaultEndpoint } from "./config";
import { createEventPayload } from "./lib";
import { Interceptors } from "./interceptors";
import { SessionManager } from "./session";
import { Transport } from "./transport";

export class FastAnalyticsSDK {
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
      options.endpoint ?? getDefaultEndpoint()
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

  private async log(
    level: EventLevel,
    message: string,
    stack: string | undefined,
    context?: EventContext
  ): Promise<void> {
    this.ensureInitialized();

    const payload = createEventPayload({
      context,
      level,
      message,
      sessionId: this.sessionManager.getSessionId(),
      stack,
      userId: context?.userId ?? this.userId,
    });

    await this.transport!.send(payload);
  }

  async logError(error: Error | string, context?: EventContext): Promise<void> {
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    await this.log("error", message, stack, context);
  }

  async logWarning(message: string, context?: EventContext): Promise<void> {
    await this.log("warn", message, undefined, context);
  }

  async logInfo(message: string, context?: EventContext): Promise<void> {
    await this.log("info", message, undefined, context);
  }

  async logDebug(message: string, context?: EventContext): Promise<void> {
    await this.log("debug", message, undefined, context);
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
    this.userId = undefined;
    this.transport = null;
    this.interceptors = null;
  }
}

