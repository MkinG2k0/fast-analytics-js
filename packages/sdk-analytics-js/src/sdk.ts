import type { EventContext, EventLevel, InitOptions, PageVisitPayload } from "./model";
import { getDefaultEndpoint } from "./config";
import { createEventPayload, PageVisitTracker } from "./lib";
import { Interceptors } from "./interceptors";
import { SessionManager } from "./session";
import { PageVisitTransport, Transport } from "./transport";
import { HeartbeatTransport } from "./transport/heartbeat-transport";

export class FastAnalyticsSDK {
  private transport: Transport | null = null;
  private pageVisitTransport: PageVisitTransport | null = null;
  private heartbeatTransport: HeartbeatTransport | null = null;
  private sessionManager: SessionManager;
  private interceptors: Interceptors | null = null;
  private pageVisitTracker: PageVisitTracker;
  private initialized = false;
  private userId: string | undefined;
  private enablePageTracking: boolean = false;
  private enableOnlineTracking: boolean = false;
  private pageTrackingCleanup: (() => void) | null = null;

  constructor() {
    this.sessionManager = new SessionManager();
    this.pageVisitTracker = new PageVisitTracker();
  }

  init(options: InitOptions): void {
    if (this.initialized) {
      console.warn("[Fast Analytics SDK] SDK уже инициализирован");
      return;
    }

    this.userId = options.userId;
    this.transport = new Transport(options);
    this.pageVisitTransport = new PageVisitTransport(options);
    this.interceptors = new Interceptors(
      this.transport,
      this.sessionManager,
      () => this.userId,
      options.endpoint ?? getDefaultEndpoint(),
      options.enableScreenshotOnError ?? false
    );

    if (options.enableAutoCapture !== false) {
      this.interceptors.setup();
    }

    // Устанавливаем initialized перед setupPageTracking, так как он вызывает trackPageVisit
    this.initialized = true;

    // Автоматическое отслеживание посещений страниц
    if (options.enablePageTracking !== false) {
      this.enablePageTracking = true;
      this.setupPageTracking();
    }

    // Автоматическое отслеживание онлайн статуса
    if (options.enableOnlineTracking !== false) {
      this.enableOnlineTracking = true;
      this.heartbeatTransport = new HeartbeatTransport(
        options,
        this.sessionManager.getSessionId()
      );
      this.heartbeatTransport.start();
    }
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
    if (this.pageVisitTransport) {
      await this.pageVisitTransport.flush();
    }
  }

  getSessionId(): string {
    return this.sessionManager.getSessionId();
  }

  resetSession(): void {
    this.sessionManager.resetSession();
    if (this.heartbeatTransport) {
      this.heartbeatTransport.updateSessionId(
        this.sessionManager.getSessionId()
      );
    }
  }

  private setupPageTracking(): void {
    if (typeof window === "undefined") {
      return;
    }

    // Отслеживаем первое посещение страницы
    this.trackPageVisit();

    // Перехватываем History API для SPA
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const handleStateChange = () => {
      // Небольшая задержка, чтобы URL успел обновиться
      setTimeout(() => {
        this.trackPageVisit();
      }, 0);
    };

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      handleStateChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      handleStateChange();
    };

    // Отслеживаем события popstate (назад/вперед в истории)
    const handlePopState = () => {
      this.trackPageVisit();
    };
    window.addEventListener("popstate", handlePopState);

    // Отслеживаем перед уходом со страницы
    const handleBeforeUnload = () => {
      this.trackPageVisit();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Сохраняем функцию очистки
    this.pageTrackingCleanup = () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }

  async trackPageVisit(
    url?: string,
    pathname?: string,
    referrer?: string
  ): Promise<void> {
    this.ensureInitialized();

    if (!this.pageVisitTransport) {
      return;
    }

    const visit = this.pageVisitTracker.trackPageView(
      url,
      pathname,
      referrer,
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      this.sessionManager.getSessionId(),
      this.userId
    );

    await this.pageVisitTransport.send(visit);
  }

  teardown(): void {
    if (this.interceptors) {
      this.interceptors.teardown();
    }
    if (this.pageTrackingCleanup) {
      this.pageTrackingCleanup();
      this.pageTrackingCleanup = null;
    }
    if (this.heartbeatTransport) {
      this.heartbeatTransport.stop();
      this.heartbeatTransport = null;
    }
    this.initialized = false;
    this.userId = undefined;
    this.transport = null;
    this.pageVisitTransport = null;
    this.interceptors = null;
  }
}

