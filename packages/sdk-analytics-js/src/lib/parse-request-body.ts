import { MAX_BODY_LENGTH } from "../model";

export interface ParsedRequestBody {
  body: string | undefined;
  bodyJson: unknown;
  contentType: string;
}

export const extractContentType = (headers?: HeadersInit): string => {
  if (!headers) {
    return "";
  }

  if (typeof headers === "string") {
    return headers;
  }

  if (Array.isArray(headers)) {
    const contentTypeHeader = headers.find(
      ([key]) => key.toLowerCase() === "content-type"
    );
    return contentTypeHeader?.[1] ?? "";
  }

  if (headers instanceof Headers) {
    return headers.get("content-type") ?? "";
  }

  const headersObj = headers as Record<string, string>;
  return headersObj["content-type"] ?? headersObj["Content-Type"] ?? "";
};

export const parseRequestBody = (
  body: BodyInit | null | undefined,
  contentType: string
): ParsedRequestBody => {
  let requestBody: string | undefined;
  let requestBodyJson: unknown;

  if (!body) {
    return { body: undefined, bodyJson: undefined, contentType };
  }

  if (typeof body === "string") {
    requestBody = body;
    if (contentType.includes("application/json") && requestBody) {
      try {
        requestBodyJson = JSON.parse(requestBody);
      } catch {
        // Если не удалось распарсить, оставляем как строку
      }
    }
  } else if (body instanceof FormData) {
    requestBody = "[FormData]";
  } else if (body instanceof URLSearchParams) {
    requestBody = body.toString();
  } else if (body instanceof Blob) {
    requestBody = "[Blob]";
  } else if (body instanceof Document) {
    requestBody = "[Document]";
  } else {
    requestBody = String(body);
  }

  return { body: requestBody, bodyJson: requestBodyJson, contentType };
};

export const truncateBody = (body: string): string => {
  if (body.length <= MAX_BODY_LENGTH) {
    return body;
  }
  return `${body.substring(0, MAX_BODY_LENGTH)}... (обрезано)`;
};

