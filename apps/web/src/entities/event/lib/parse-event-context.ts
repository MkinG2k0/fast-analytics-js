import type { Event } from "@repo/database";

export interface ParsedEventContext {
  customTags?: Record<string, string>;
  requestData?: unknown;
  responseData?: unknown;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  method?: string;
  statusCode?: string;
  statusText?: string;
  requestUrl?: string;
  requestContentType?: string;
  contentType?: string;
  errorType?: string;
  hasRequestData: boolean;
  hasResponseData: boolean;
  hasHttpData: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every((v) => typeof v === "string");
}

function getStringValue(
  source: Record<string, string> | undefined,
  key: string
): string | undefined {
  if (!source) {
    return undefined;
  }
  return source[key];
}

function getStringRecordValue(
  source: Record<string, unknown> | undefined,
  key: string
): Record<string, string> | undefined {
  if (!source) {
    return undefined;
  }
  const value = source[key];
  return isStringRecord(value) ? value : undefined;
}

export function parseEventContext(event: Event): ParsedEventContext {
  const context = event.context;

  if (!context || !isRecord(context)) {
    return {
      hasRequestData: false,
      hasResponseData: false,
      hasHttpData: false,
    };
  }

  const customTags = isStringRecord(context.customTags)
    ? context.customTags
    : undefined;

  // Строковые значения берутся только из customTags (как делает SDK)
  const requestBody = getStringValue(customTags, "requestBody");
  const responseBody = getStringValue(customTags, "responseBody");
  const method = getStringValue(customTags, "method");
  const statusCode = getStringValue(customTags, "statusCode");
  const statusText = getStringValue(customTags, "statusText");
  const requestUrl = getStringValue(customTags, "url");
  const requestContentType = getStringValue(customTags, "requestContentType");
  const contentType = getStringValue(customTags, "contentType");
  const errorType = getStringValue(customTags, "errorType");

  // Объекты берутся напрямую из context
  const requestData = context.requestData;
  const responseData = context.responseData;
  const requestHeaders = getStringRecordValue(context, "requestHeaders");
  const responseHeaders = getStringRecordValue(context, "responseHeaders");

  const hasRequestData = Boolean(requestBody || requestData);
  const hasResponseData = Boolean(responseBody || responseData);
  const hasHttpData = Boolean(
    method || requestUrl || hasRequestData || statusCode || hasResponseData
  );

  return {
    customTags,
    requestData,
    responseData,
    requestHeaders,
    responseHeaders,
    requestBody,
    responseBody,
    method,
    statusCode,
    statusText,
    requestUrl,
    requestContentType,
    contentType,
    errorType,
    hasRequestData,
    hasResponseData,
    hasHttpData,
  };
}
