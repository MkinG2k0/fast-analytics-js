import type { EventPayload, EventContext } from "./types";
import Transport from "./transport";
import SessionManager from "./session";

class Interceptors {
  private transport: Transport;
  private sessionManager: SessionManager;
  private getUserId: () => string | undefined;
  private originalErrorHandler: typeof window.onerror | null = null;
  private unhandledRejectionHandler:
    | ((event: PromiseRejectionEvent) => void)
    | null = null;
  private resourceErrorHandler: ((event: ErrorEvent) => void) | null = null;

  constructor(
    transport: Transport,
    sessionManager: SessionManager,
    getUserId: () => string | undefined
  ) {
    this.transport = transport;
    this.sessionManager = sessionManager;
    this.getUserId = getUserId;
  }

  private createErrorPayload(
    message: string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
    context?: EventContext
  ): EventPayload {
    return {
      level: "error",
      message: error?.message || message,
      stack:
        error?.stack || (source ? `${source}:${lineno}:${colno}` : undefined),
      sessionId: this.sessionManager.getSessionId(),
      userId: context?.userId || this.getUserId(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };
  }

  setup(): void {
    if (typeof window === "undefined") {
      return;
    }

    // Перехват window.onerror для синхронных ошибок JavaScript
    this.originalErrorHandler = window.onerror;
    window.onerror = (message, source, lineno, colno, error): boolean => {
      const payload = this.createErrorPayload(
        String(message),
        source?.toString(),
        lineno,
        colno,
        error || undefined,
        undefined
      );

      this.transport.send(payload).catch(() => {
        // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
      });

      // Вызываем оригинальный обработчик, если он был
      if (this.originalErrorHandler) {
        return this.originalErrorHandler(message, source, lineno, colno, error);
      }

      return false;
    };

    // Перехват unhandledrejection для необработанных промисов
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      const payload = this.createErrorPayload(
        error.message,
        undefined,
        undefined,
        undefined,
        error,
        undefined
      );

      this.transport.send(payload).catch(() => {
        // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
      });
    };

    window.addEventListener(
      "unhandledrejection",
      this.unhandledRejectionHandler
    );

    // Перехват ошибок загрузки ресурсов (изображения, скрипты, стили и т.д.)
    this.resourceErrorHandler = (event: ErrorEvent) => {
      // Пропускаем ошибки, которые уже обработаны window.onerror
      if (event.error) {
        return;
      }

      const target = event.target as HTMLElement;
      const resourceType = target?.tagName?.toLowerCase() || "unknown";
      const resourceUrl =
        (target as HTMLImageElement | HTMLScriptElement | HTMLLinkElement)
          ?.src ||
        (target as HTMLLinkElement)?.href ||
        "unknown";

      const message = `Ошибка загрузки ресурса: ${resourceType} - ${resourceUrl}`;

      const payload = this.createErrorPayload(
        message,
        resourceUrl,
        undefined,
        undefined,
        undefined,
        {
          customTags: {
            resourceType,
            resourceUrl,
            errorType: "resource_load_error",
          },
        }
      );

      this.transport.send(payload).catch(() => {
        // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
      });
    };

    window.addEventListener("error", this.resourceErrorHandler, true);
  }

  teardown(): void {
    if (typeof window === "undefined") {
      return;
    }

    // Восстанавливаем window.onerror
    if (this.originalErrorHandler !== null) {
      window.onerror = this.originalErrorHandler;
    } else {
      window.onerror = null;
    }

    // Удаляем обработчик unhandledrejection
    if (this.unhandledRejectionHandler) {
      window.removeEventListener(
        "unhandledrejection",
        this.unhandledRejectionHandler
      );
      this.unhandledRejectionHandler = null;
    }

    // Удаляем обработчик ошибок ресурсов
    if (this.resourceErrorHandler) {
      window.removeEventListener("error", this.resourceErrorHandler, true);
      this.resourceErrorHandler = null;
    }
  }
}

export default Interceptors;
