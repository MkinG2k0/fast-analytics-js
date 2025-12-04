import type { EventPayload, EventContext } from "./types";
import Transport from "./transport";
import SessionManager from "./session";

class Interceptors {
  private transport: Transport;
  private sessionManager: SessionManager;
  private getUserId: () => string | undefined;
  private sdkEndpoint: string;
  private originalErrorHandler: typeof window.onerror | null = null;
  private unhandledRejectionHandler:
    | ((event: PromiseRejectionEvent) => void)
    | null = null;
  private resourceErrorHandler: ((event: ErrorEvent) => void) | null = null;
  private originalFetch: typeof fetch | null = null;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
  private originalXHRSetRequestHeader:
    | typeof XMLHttpRequest.prototype.setRequestHeader
    | null = null;

  constructor(
    transport: Transport,
    sessionManager: SessionManager,
    getUserId: () => string | undefined,
    sdkEndpoint: string
  ) {
    this.transport = transport;
    this.sessionManager = sessionManager;
    this.getUserId = getUserId;
    this.sdkEndpoint = sdkEndpoint;
  }

  private isSDKRequest(url: string): boolean {
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

  private createErrorPayload(
    message: string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
    context?: EventContext
  ): EventPayload {
    // Формируем stack только для JavaScript ошибок (когда есть error.stack или все параметры source, lineno, colno)
    let stack: string | undefined;
    if (error?.stack) {
      stack = error.stack;
    } else if (source && lineno !== undefined && colno !== undefined) {
      stack = `${source}:${lineno}:${colno}`;
    }

    return {
      level: "error",
      message: error?.message || message,
      stack,
      context,
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
      let resourceUrl = "unknown";

      if (
        target instanceof HTMLImageElement ||
        target instanceof HTMLScriptElement
      ) {
        resourceUrl = target.src || "unknown";
      } else if (target instanceof HTMLLinkElement) {
        resourceUrl = target.href || "unknown";
      }

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

    // Перехват fetch API для автоматического логирования ошибок HTTP-запросов
    this.setupFetchInterceptor();

    // Перехват XMLHttpRequest для автоматического логирования ошибок HTTP-запросов
    this.setupXHRInterceptor();
  }

  private setupFetchInterceptor(): void {
    if (typeof window === "undefined" || !window.fetch) {
      return;
    }

    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      // Пропускаем запросы к самому SDK, чтобы избежать бесконечного цикла
      if (self.isSDKRequest(url)) {
        return self.originalFetch!.call(window, input, init);
      }

      // Извлекаем тело запроса для логирования
      let requestBody: string | undefined;
      let requestBodyJson: unknown;
      let requestContentType = "";

      // Извлекаем Content-Type из заголовков
      if (init?.headers) {
        if (typeof init.headers === "string") {
          requestContentType = init.headers;
        } else if (Array.isArray(init.headers)) {
          const contentTypeHeader = init.headers.find(
            ([key]) => key.toLowerCase() === "content-type"
          );
          requestContentType = contentTypeHeader?.[1] || "";
        } else if (init.headers instanceof Headers) {
          requestContentType = init.headers.get("content-type") || "";
        } else {
          const headersObj = init.headers as Record<string, string>;
          requestContentType =
            headersObj["content-type"] || headersObj["Content-Type"] || "";
        }
      }

      if (init?.body) {
        if (typeof init.body === "string") {
          requestBody = init.body;
          // Пытаемся распарсить JSON, если это JSON-запрос
          if (requestContentType.includes("application/json") && requestBody) {
            try {
              requestBodyJson = JSON.parse(requestBody);
            } catch {
              // Если не удалось распарсить, оставляем как строку
            }
          }
        } else if (init.body instanceof FormData) {
          // Для FormData сохраняем информацию о том, что это FormData
          requestBody = "[FormData]";
        } else if (init.body instanceof URLSearchParams) {
          requestBody = init.body.toString();
        } else if (init.body instanceof Blob) {
          requestBody = "[Blob]";
        } else {
          requestBody = String(init.body);
        }
      }

      // Засекаем время начала запроса
      const requestStartTime = performance.now();
      const requestStartTimestamp = Date.now();

      try {
        const response = await self.originalFetch!.call(window, input, init);

        // Вычисляем время выполнения запроса
        const requestDuration = performance.now() - requestStartTime;

        // Логируем ошибки HTTP (4xx, 5xx статусы)
        if (!response.ok) {
          let responseBody: string | undefined;
          let responseBodyJson: unknown;
          const contentType = response.headers.get("content-type") || "";

          try {
            const clonedResponse = response.clone();
            responseBody = await clonedResponse.text();

            // Пытаемся распарсить JSON, если это JSON-ответ
            if (contentType.includes("application/json") && responseBody) {
              try {
                responseBodyJson = JSON.parse(responseBody);
              } catch {
                // Если не удалось распарсить, оставляем как строку
              }
            }
          } catch {
            // Игнорируем ошибки чтения тела ответа
          }

          const payload = self.createErrorPayload(
            `HTTP ошибка: ${response.status} ${response.statusText}`,
            url,
            undefined,
            undefined,
            undefined,
            {
              customTags: {
                errorType: "http_error",
                statusCode: String(response.status),
                statusText: response.statusText,
                method: init?.method || "GET",
                url,
                requestContentType,
                contentType,
                ...(requestBody && {
                  requestBody:
                    requestBody.length > 5000
                      ? requestBody.substring(0, 5000) + "... (обрезано)"
                      : requestBody,
                }),
                ...(responseBody && {
                  responseBody:
                    responseBody.length > 5000
                      ? responseBody.substring(0, 5000) + "... (обрезано)"
                      : responseBody,
                }),
              },
              ...(requestBodyJson &&
              typeof requestBodyJson === "object" &&
              requestBodyJson !== null
                ? { requestData: requestBodyJson }
                : {}),
              ...(responseBodyJson &&
              typeof responseBodyJson === "object" &&
              responseBodyJson !== null
                ? { responseData: responseBodyJson }
                : {}),
            }
          );

          // Добавляем метрики производительности
          payload.performance = {
            requestDuration,
            timestamp: requestStartTimestamp,
          };

          self.transport.send(payload).catch(() => {
            // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
          });
        }

        return response;
      } catch (error) {
        // Логируем сетевые ошибки (нет соединения, таймаут и т.д.)
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Сетевая ошибка при запросе: ${url}`;

        const payload = self.createErrorPayload(
          errorMessage,
          url,
          undefined,
          undefined,
          error instanceof Error ? error : undefined,
          {
            customTags: {
              errorType: "network_error",
              method: init?.method || "GET",
              url,
            },
          }
        );

        // Добавляем метрики производительности
        payload.performance = {
          requestDuration: performance.now() - requestStartTime,
          timestamp: requestStartTimestamp,
        };

        self.transport.send(payload).catch(() => {
          // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
        });

        throw error;
      }
    };
  }

  private setupXHRInterceptor(): void {
    if (typeof window === "undefined" || !window.XMLHttpRequest) {
      return;
    }

    const self = this;
    const OriginalXHR = window.XMLHttpRequest;

    this.originalXHROpen = OriginalXHR.prototype.open;
    this.originalXHRSend = OriginalXHR.prototype.send;
    this.originalXHRSetRequestHeader = OriginalXHR.prototype.setRequestHeader;

    // Перехватываем setRequestHeader для сохранения Content-Type
    OriginalXHR.prototype.setRequestHeader = function (
      name: string,
      value: string
    ): void {
      const xhr = this as XMLHttpRequest & {
        _fastAnalyticsRequestContentType?: string;
      };
      if (name.toLowerCase() === "content-type") {
        xhr._fastAnalyticsRequestContentType = value;
      }
      self.originalXHRSetRequestHeader!.call(this, name, value);
    };

    OriginalXHR.prototype.open = function (
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ): void {
      const urlString = typeof url === "string" ? url : url.toString();
      (this as unknown as { _fastAnalyticsUrl: string })._fastAnalyticsUrl =
        urlString;
      (
        this as unknown as { _fastAnalyticsMethod: string }
      )._fastAnalyticsMethod = method;
      (
        this as unknown as { _fastAnalyticsIsSDKRequest: boolean }
      )._fastAnalyticsIsSDKRequest = self.isSDKRequest(urlString);
      (
        this as unknown as { _fastAnalyticsRequestContentType?: string }
      )._fastAnalyticsRequestContentType = undefined;

      self.originalXHROpen!.call(
        this,
        method,
        url,
        async ?? true,
        username,
        password
      );
    };

    OriginalXHR.prototype.send = function (
      body?: Document | XMLHttpRequestBodyInit | null
    ): void {
      const xhr = this as XMLHttpRequest & {
        _fastAnalyticsUrl: string;
        _fastAnalyticsMethod: string;
        _fastAnalyticsIsSDKRequest: boolean;
        _fastAnalyticsRequestBody?: string;
        _fastAnalyticsRequestData?: unknown;
        _fastAnalyticsRequestContentType?: string;
        _fastAnalyticsRequestStartTime?: number;
        _fastAnalyticsRequestStartTimestamp?: number;
      };

      // Пропускаем запросы к самому SDK
      if (xhr._fastAnalyticsIsSDKRequest) {
        self.originalXHRSend!.call(this, body);
        return;
      }

      // Засекаем время начала запроса
      xhr._fastAnalyticsRequestStartTime = performance.now();
      xhr._fastAnalyticsRequestStartTimestamp = Date.now();

      // Извлекаем тело запроса для логирования
      if (body) {
        if (typeof body === "string") {
          xhr._fastAnalyticsRequestBody = body;
          const contentType = xhr._fastAnalyticsRequestContentType || "";
          if (contentType.includes("application/json") && body) {
            try {
              xhr._fastAnalyticsRequestData = JSON.parse(body);
            } catch {
              // Если не удалось распарсить, оставляем как строку
            }
          }
        } else if (body instanceof FormData) {
          xhr._fastAnalyticsRequestBody = "[FormData]";
        } else if (body instanceof URLSearchParams) {
          xhr._fastAnalyticsRequestBody = body.toString();
        } else if (body instanceof Blob) {
          xhr._fastAnalyticsRequestBody = "[Blob]";
        } else if (body instanceof Document) {
          xhr._fastAnalyticsRequestBody = "[Document]";
        } else {
          xhr._fastAnalyticsRequestBody = String(body);
        }
      }

      const originalOnError = xhr.onerror;
      const originalOnLoad = xhr.onload;

      xhr.onerror = function (event: ProgressEvent<EventTarget>): void {
        const requestDuration = xhr._fastAnalyticsRequestStartTime
          ? performance.now() - xhr._fastAnalyticsRequestStartTime
          : undefined;

        const payload = self.createErrorPayload(
          `XMLHttpRequest ошибка: ${xhr.status} ${xhr.statusText || "Network Error"}`,
          xhr._fastAnalyticsUrl,
          undefined,
          undefined,
          undefined,
          {
            customTags: {
              errorType: "xhr_error",
              statusCode: String(xhr.status || 0),
              statusText: xhr.statusText || "Network Error",
              method: xhr._fastAnalyticsMethod,
              url: xhr._fastAnalyticsUrl,
            },
          }
        );

        // Добавляем метрики производительности
        if (requestDuration !== undefined && xhr._fastAnalyticsRequestStartTimestamp) {
          payload.performance = {
            requestDuration,
            timestamp: xhr._fastAnalyticsRequestStartTimestamp,
          };
        }

        self.transport.send(payload).catch(() => {
          // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
        });

        if (originalOnError) {
          originalOnError.call(this, event);
        }
      };

      xhr.onload = function (event: ProgressEvent<EventTarget>): void {
        // Вычисляем время выполнения запроса
        const requestDuration = xhr._fastAnalyticsRequestStartTime
          ? performance.now() - xhr._fastAnalyticsRequestStartTime
          : undefined;

        // Логируем ошибки HTTP (4xx, 5xx статусы)
        if (xhr.status >= 400) {
          let responseBody: string | undefined;
          let responseBodyJson: unknown;
          const contentType = xhr.getResponseHeader("content-type") || "";
          const requestContentType = xhr._fastAnalyticsRequestContentType || "";

          try {
            responseBody = xhr.responseText;

            // Пытаемся распарсить JSON, если это JSON-ответ
            if (contentType.includes("application/json") && responseBody) {
              try {
                responseBodyJson = JSON.parse(responseBody);
              } catch {
                // Если не удалось распарсить, оставляем как строку
              }
            }
          } catch {
            // Игнорируем ошибки чтения ответа
          }

          const payload = self.createErrorPayload(
            `HTTP ошибка: ${xhr.status} ${xhr.statusText}`,
            xhr._fastAnalyticsUrl,
            undefined,
            undefined,
            undefined,
            {
              customTags: {
                errorType: "xhr_http_error",
                statusCode: String(xhr.status),
                statusText: xhr.statusText,
                method: xhr._fastAnalyticsMethod,
                url: xhr._fastAnalyticsUrl,
                requestContentType,
                contentType,
                ...(xhr._fastAnalyticsRequestBody && {
                  requestBody:
                    xhr._fastAnalyticsRequestBody.length > 5000
                      ? xhr._fastAnalyticsRequestBody.substring(0, 5000) +
                        "... (обрезано)"
                      : xhr._fastAnalyticsRequestBody,
                }),
                ...(responseBody && {
                  responseBody:
                    responseBody.length > 5000
                      ? responseBody.substring(0, 5000) + "... (обрезано)"
                      : responseBody,
                }),
              },
              ...(xhr._fastAnalyticsRequestData &&
              typeof xhr._fastAnalyticsRequestData === "object" &&
              xhr._fastAnalyticsRequestData !== null
                ? { requestData: xhr._fastAnalyticsRequestData }
                : {}),
              ...(responseBodyJson &&
              typeof responseBodyJson === "object" &&
              responseBodyJson !== null
                ? { responseData: responseBodyJson }
                : {}),
            }
          );

          // Добавляем метрики производительности
          if (requestDuration !== undefined && xhr._fastAnalyticsRequestStartTimestamp) {
            payload.performance = {
              requestDuration,
              timestamp: xhr._fastAnalyticsRequestStartTimestamp,
            };
          }

          self.transport.send(payload).catch(() => {
            // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
          });
        }

        if (originalOnLoad) {
          originalOnLoad.call(this, event);
        }
      };

      self.originalXHRSend!.call(this, body);
    };
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

    // Восстанавливаем оригинальный fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    // Восстанавливаем оригинальные XMLHttpRequest методы
    if (
      this.originalXHROpen &&
      this.originalXHRSend &&
      this.originalXHRSetRequestHeader &&
      window.XMLHttpRequest
    ) {
      window.XMLHttpRequest.prototype.open = this.originalXHROpen;
      window.XMLHttpRequest.prototype.send = this.originalXHRSend;
      window.XMLHttpRequest.prototype.setRequestHeader =
        this.originalXHRSetRequestHeader;
      this.originalXHROpen = null;
      this.originalXHRSend = null;
      this.originalXHRSetRequestHeader = null;
    }
  }
}

export default Interceptors;
