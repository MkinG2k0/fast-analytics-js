import type { EventContext, EventPayload } from "../model";
import { Transport } from "../transport";
import { createEventPayload } from "../lib/create-event-payload";
import {
  extractContentType,
  parseRequestBody,
  truncateBody,
} from "../lib/parse-request-body";
import { parseResponseBody } from "../lib/parse-response-body";

interface FetchInterceptorOptions {
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

export const setupFetchInterceptor = (
  options: FetchInterceptorOptions
): (() => void) => {
  const { transport, sessionManager, getUserId, isSDKRequest, createErrorPayload } =
    options;

  if (typeof window === "undefined" || !window.fetch) {
    return () => {};
  }

  const originalFetch = window.fetch;

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

    if (isSDKRequest(url)) {
      return originalFetch.call(window, input, init);
    }

    const requestContentType = extractContentType(init?.headers);
    const { body: requestBody, bodyJson: requestBodyJson } = parseRequestBody(
      init?.body,
      requestContentType
    );

    const requestStartTime = performance.now();
    const requestStartTimestamp = Date.now();

    try {
      const response = await originalFetch.call(window, input, init);
      const requestDuration = performance.now() - requestStartTime;

      if (!response.ok) {
        const { body: responseBody, bodyJson: responseBodyJson } =
          await parseResponseBody(response);
        const contentType = response.headers.get("content-type") ?? "";

        const payload = await createErrorPayload(
          `HTTP ошибка: ${response.status} ${response.statusText}`,
          url,
          undefined,
          undefined,
          undefined,
          {
            customTags: {
              contentType,
              errorType: "http_error",
              method: init?.method ?? "GET",
              requestContentType,
              statusCode: String(response.status),
              statusText: response.statusText,
              url,
              ...(requestBody && { requestBody: truncateBody(requestBody) }),
              ...(responseBody && { responseBody: truncateBody(responseBody) }),
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

        payload.performance = {
          requestDuration,
          timestamp: requestStartTimestamp,
        };

        transport.send(payload).catch(() => {
          // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
        });
      }

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Сетевая ошибка при запросе: ${url}`;

      const payload = await createErrorPayload(
        errorMessage,
        url,
        undefined,
        undefined,
        error instanceof Error ? error : undefined,
        {
          customTags: {
            errorType: "network_error",
            method: init?.method ?? "GET",
            url,
          },
        }
      );

      payload.performance = {
        requestDuration: performance.now() - requestStartTime,
        timestamp: requestStartTimestamp,
      };

      transport.send(payload).catch(() => {
        // Игнорируем ошибки отправки, чтобы не создавать бесконечный цикл
      });

      throw error;
    }
  };

  return () => {
    if (typeof window !== "undefined" && originalFetch) {
      window.fetch = originalFetch;
    }
  };
};

