import type { EventContext, EventPayload } from "../model";
import { Transport } from "../transport";
import { truncateBody } from "../lib/parse-request-body";
import { parseXHRResponseBody, truncateBody as truncateResponseBody } from "../lib/parse-response-body";

interface XHRInterceptorOptions {
  transport: Transport;
  sessionManager: { getSessionId: () => string };
  getUserId: () => string | undefined;
  isSDKRequest: (url: string) => boolean;
  createErrorPayload: (
    message: string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
    context?: EventContext
  ) => Promise<EventPayload>;
}

interface ExtendedXHR extends XMLHttpRequest {
  _fastAnalyticsUrl: string;
  _fastAnalyticsMethod: string;
  _fastAnalyticsIsSDKRequest: boolean;
  _fastAnalyticsRequestBody?: string;
  _fastAnalyticsRequestData?: unknown;
  _fastAnalyticsRequestContentType?: string;
  _fastAnalyticsRequestStartTime?: number;
  _fastAnalyticsRequestStartTimestamp?: number;
}

export const setupXHRInterceptor = (
  options: XHRInterceptorOptions
): (() => void) => {
  const { transport, isSDKRequest, createErrorPayload } = options;

  if (typeof window === "undefined" || !window.XMLHttpRequest) {
    return () => {};
  }

  const OriginalXHR = window.XMLHttpRequest;
  const originalXHROpen = OriginalXHR.prototype.open;
  const originalXHRSend = OriginalXHR.prototype.send;
  const originalXHRSetRequestHeader = OriginalXHR.prototype.setRequestHeader;

  OriginalXHR.prototype.setRequestHeader = function (
    name: string,
    value: string
  ): void {
    const xhr = this as ExtendedXHR;
    if (name.toLowerCase() === "content-type") {
      xhr._fastAnalyticsRequestContentType = value;
    }
    originalXHRSetRequestHeader.call(this, name, value);
  };

  OriginalXHR.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ): void {
    const xhr = this as ExtendedXHR;
    const urlString = typeof url === "string" ? url : url.toString();
    xhr._fastAnalyticsUrl = urlString;
    xhr._fastAnalyticsMethod = method;
    xhr._fastAnalyticsIsSDKRequest = isSDKRequest(urlString);
    xhr._fastAnalyticsRequestContentType = undefined;

    originalXHROpen.call(this, method, url, async ?? true, username, password);
  };

  OriginalXHR.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null
  ): void {
    const xhr = this as ExtendedXHR;

    if (xhr._fastAnalyticsIsSDKRequest) {
      originalXHRSend.call(this, body);
      return;
    }

    xhr._fastAnalyticsRequestStartTime = performance.now();
    xhr._fastAnalyticsRequestStartTimestamp = Date.now();

    if (body) {
      if (typeof body === "string") {
        xhr._fastAnalyticsRequestBody = body;
        const contentType = xhr._fastAnalyticsRequestContentType ?? "";
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

      createErrorPayload(
        `XMLHttpRequest ошибка: ${xhr.status} ${xhr.statusText ?? "Network Error"}`,
        xhr._fastAnalyticsUrl,
        undefined,
        undefined,
        undefined,
        {
          customTags: {
            errorType: "xhr_error",
            method: xhr._fastAnalyticsMethod,
            statusCode: String(xhr.status || 0),
            statusText: xhr.statusText ?? "Network Error",
            url: xhr._fastAnalyticsUrl,
          },
        }
      )
        .then((payload) => {
          if (
            requestDuration !== undefined &&
            xhr._fastAnalyticsRequestStartTimestamp
          ) {
            payload.performance = {
              requestDuration,
              timestamp: xhr._fastAnalyticsRequestStartTimestamp,
            };
          }

          transport.send(payload).catch(() => {
            // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
          });
        })
        .catch(() => {
          // Игнорируем ошибки создания payload
        });

      if (originalOnError) {
        originalOnError.call(this, event);
      }
    };

    xhr.onload = function (event: ProgressEvent<EventTarget>): void {
      const requestDuration = xhr._fastAnalyticsRequestStartTime
        ? performance.now() - xhr._fastAnalyticsRequestStartTime
        : undefined;

      if (xhr.status >= 400) {
        const { body: responseBody, bodyJson: responseBodyJson } =
          parseXHRResponseBody(xhr);
        const contentType = xhr.getResponseHeader("content-type") ?? "";
        const requestContentType = xhr._fastAnalyticsRequestContentType ?? "";

        createErrorPayload(
          `HTTP ошибка: ${xhr.status} ${xhr.statusText}`,
          xhr._fastAnalyticsUrl,
          undefined,
          undefined,
          undefined,
          {
            customTags: {
              contentType,
              errorType: "xhr_http_error",
              method: xhr._fastAnalyticsMethod,
              requestContentType,
              statusCode: String(xhr.status),
              statusText: xhr.statusText,
              url: xhr._fastAnalyticsUrl,
              ...(xhr._fastAnalyticsRequestBody && {
                requestBody: truncateBody(xhr._fastAnalyticsRequestBody),
              }),
              ...(responseBody && {
                responseBody: truncateResponseBody(responseBody),
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
        )
          .then((payload) => {
            if (
              requestDuration !== undefined &&
              xhr._fastAnalyticsRequestStartTimestamp
            ) {
              payload.performance = {
                requestDuration,
                timestamp: xhr._fastAnalyticsRequestStartTimestamp,
              };
            }

            transport.send(payload).catch(() => {
              // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
            });
          })
          .catch(() => {
            // Игнорируем ошибки создания payload
          });
      }

      if (originalOnLoad) {
        originalOnLoad.call(this, event);
      }
    };

    originalXHRSend.call(this, body);
  };

  return () => {
    if (
      typeof window !== "undefined" &&
      window.XMLHttpRequest &&
      originalXHROpen &&
      originalXHRSend &&
      originalXHRSetRequestHeader
    ) {
      window.XMLHttpRequest.prototype.open = originalXHROpen;
      window.XMLHttpRequest.prototype.send = originalXHRSend;
      window.XMLHttpRequest.prototype.setRequestHeader = originalXHRSetRequestHeader;
    }
  };
};

