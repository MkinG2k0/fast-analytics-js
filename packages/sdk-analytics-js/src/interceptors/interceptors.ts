import type { EventContext, EventPayload } from "../model";
import { Transport } from "../transport";
import { SessionManager } from "../session";
import { createEventPayload, createScreenshot } from "../lib";
import { setupFetchInterceptor } from "./fetch-interceptor";
import { setupXHRInterceptor } from "./xhr-interceptor";

export class Interceptors {
  private transport: Transport;
  private sessionManager: SessionManager;
  private getUserId: () => string | undefined;
  private sdkEndpoint: string;
  private enableScreenshotOnError: boolean;
  private originalErrorHandler: typeof window.onerror | null = null;
  private unhandledRejectionHandler:
    | ((event: PromiseRejectionEvent) => void)
    | null = null;
  private resourceErrorHandler: ((event: ErrorEvent) => void) | null = null;
  private teardownFetch: (() => void) | null = null;
  private teardownXHR: (() => void) | null = null;

  constructor(
    transport: Transport,
    sessionManager: SessionManager,
    getUserId: () => string | undefined,
    sdkEndpoint: string,
    enableScreenshotOnError: boolean = false
  ) {
    this.transport = transport;
    this.sessionManager = sessionManager;
    this.getUserId = getUserId;
    this.sdkEndpoint = sdkEndpoint;
    this.enableScreenshotOnError = enableScreenshotOnError;
  }

  private isSDKRequest(url: string): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const requestUrl = new URL(url, window.location.href);
      const sdkUrl = new URL(this.sdkEndpoint, window.location.href);
      return (
        requestUrl.origin === sdkUrl.origin &&
        requestUrl.pathname === sdkUrl.pathname
      );
    } catch {
      return false;
    }
  }

  private async createErrorPayload(
    message: string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
    context?: EventContext
  ): Promise<EventPayload> {
    let stack: string | undefined;
    if (error?.stack) {
      stack = error.stack;
    } else if (source && lineno !== undefined && colno !== undefined) {
      stack = `${source}:${lineno}:${colno}`;
    }

    let screenshotUrl: string | undefined;
    if (this.enableScreenshotOnError) {
      screenshotUrl = await createScreenshot() ?? undefined;
    }

    return createEventPayload({
      context,
      level: "error",
      message: error?.message ?? message,
      sessionId: this.sessionManager.getSessionId(),
      stack,
      userId: context?.userId ?? this.getUserId(),
      screenshotUrl,
    });
  }

  setup(): void {
    if (typeof window === "undefined") {
      return;
    }

    this.originalErrorHandler = window.onerror;
    window.onerror = (
      message,
      source,
      lineno,
      colno,
      error
    ): boolean => {
      this.createErrorPayload(
        String(message),
        source?.toString(),
        lineno,
        colno,
        error ?? undefined,
        undefined
      )
        .then((payload) => {
          this.transport.send(payload).catch(() => {
            // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
          });
        })
        .catch(() => {
          // Игнорируем ошибки создания payload
        });

      if (this.originalErrorHandler) {
        return this.originalErrorHandler(message, source, lineno, colno, error);
      }

      return false;
    };

    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      this.createErrorPayload(
        error.message,
        undefined,
        undefined,
        undefined,
        error,
        undefined
      )
        .then((payload) => {
          this.transport.send(payload).catch(() => {
            // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
          });
        })
        .catch(() => {
          // Игнорируем ошибки создания payload
        });
    };

    window.addEventListener("unhandledrejection", this.unhandledRejectionHandler);

    this.resourceErrorHandler = (event: ErrorEvent) => {
      if (event.error) {
        return;
      }

      const target = event.target as HTMLElement;
      const resourceType = target?.tagName?.toLowerCase() ?? "unknown";
      let resourceUrl = "unknown";

      if (
        target instanceof HTMLImageElement ||
        target instanceof HTMLScriptElement
      ) {
        resourceUrl = target.src ?? "unknown";
      } else if (target instanceof HTMLLinkElement) {
        resourceUrl = target.href ?? "unknown";
      }

      const message = `Ошибка загрузки ресурса: ${resourceType} - ${resourceUrl}`;

      this.createErrorPayload(
        message,
        resourceUrl,
        undefined,
        undefined,
        undefined,
        {
          customTags: {
            errorType: "resource_load_error",
            resourceType,
            resourceUrl,
          },
        }
      )
        .then((payload) => {
          this.transport.send(payload).catch(() => {
            // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
          });
        })
        .catch(() => {
          // Игнорируем ошибки создания payload
        });
    };

    window.addEventListener("error", this.resourceErrorHandler, true);

    this.teardownFetch = setupFetchInterceptor({
      createErrorPayload: async (
        message: string,
        source?: string,
        lineno?: number,
        colno?: number,
        error?: Error,
        context?: EventContext
      ) => {
        return this.createErrorPayload(
          message,
          source,
          lineno,
          colno,
          error,
          context
        );
      },
      getUserId: this.getUserId,
      isSDKRequest: this.isSDKRequest.bind(this),
      sessionManager: this.sessionManager,
      transport: this.transport,
    });

    this.teardownXHR = setupXHRInterceptor({
      createErrorPayload: async (
        message: string,
        source?: string,
        lineno?: number,
        colno?: number,
        error?: Error,
        context?: EventContext
      ) => {
        return this.createErrorPayload(
          message,
          source,
          lineno,
          colno,
          error,
          context
        );
      },
      getUserId: this.getUserId,
      isSDKRequest: this.isSDKRequest.bind(this),
      sessionManager: this.sessionManager,
      transport: this.transport,
    });
  }

  teardown(): void {
    if (typeof window === "undefined") {
      return;
    }

    if (this.originalErrorHandler !== null) {
      window.onerror = this.originalErrorHandler;
    } else {
      window.onerror = null;
    }

    if (this.unhandledRejectionHandler) {
      window.removeEventListener(
        "unhandledrejection",
        this.unhandledRejectionHandler
      );
      this.unhandledRejectionHandler = null;
    }

    if (this.resourceErrorHandler) {
      window.removeEventListener("error", this.resourceErrorHandler, true);
      this.resourceErrorHandler = null;
    }

    if (this.teardownFetch) {
      this.teardownFetch();
      this.teardownFetch = null;
    }

    if (this.teardownXHR) {
      this.teardownXHR();
      this.teardownXHR = null;
    }
  }
}

