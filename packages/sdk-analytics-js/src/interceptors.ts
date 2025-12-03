import type { EventPayload } from "./types";
import Transport from "./transport";
import SessionManager from "./session";

class Interceptors {
  private transport: Transport;
  private sessionManager: SessionManager;
  private originalErrorHandler: typeof window.onerror | null = null;
  private unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(transport: Transport, sessionManager: SessionManager) {
    this.transport = transport;
    this.sessionManager = sessionManager;
  }

  private createErrorPayload(
    message: string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ): EventPayload {
    return {
      level: "error",
      message: error?.message || message,
      stack: error?.stack || `${source}:${lineno}:${colno}`,
      sessionId: this.sessionManager.getSessionId(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };
  }

  setup(): void {
    if (typeof window === "undefined") {
      return;
    }

    // Перехват window.onerror
    this.originalErrorHandler = window.onerror;
    window.onerror = (
      message,
      source,
      lineno,
      colno,
      error
    ): boolean => {
      const payload = this.createErrorPayload(
        String(message),
        source?.toString(),
        lineno,
        colno,
        error || undefined
      );

      this.transport.send(payload);

      // Вызываем оригинальный обработчик, если он был
      if (this.originalErrorHandler) {
        return this.originalErrorHandler(message, source, lineno, colno, error);
      }

      return false;
    };

    // Перехват unhandledrejection
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
        error
      );

      this.transport.send(payload);
    };

    window.addEventListener("unhandledrejection", this.unhandledRejectionHandler);
  }

  teardown(): void {
    if (typeof window === "undefined") {
      return;
    }

    if (this.originalErrorHandler) {
      window.onerror = this.originalErrorHandler;
    }

    if (this.unhandledRejectionHandler) {
      window.removeEventListener("unhandledrejection", this.unhandledRejectionHandler);
      this.unhandledRejectionHandler = null;
    }
  }
}

export default Interceptors;

