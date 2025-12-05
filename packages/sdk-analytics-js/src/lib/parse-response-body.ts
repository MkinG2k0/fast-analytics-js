import { MAX_BODY_LENGTH } from "../model";

export interface ParsedResponseBody {
  body: string | undefined;
  bodyJson: unknown;
}

export const parseResponseBody = async (
  response: Response
): Promise<ParsedResponseBody> => {
  const contentType = response.headers.get("content-type") ?? "";
  let responseBody: string | undefined;
  let responseBodyJson: unknown;

  try {
    const clonedResponse = response.clone();
    responseBody = await clonedResponse.text();

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

  return { body: responseBody, bodyJson: responseBodyJson };
};

export const parseXHRResponseBody = (xhr: XMLHttpRequest): ParsedResponseBody => {
  const contentType = xhr.getResponseHeader("content-type") ?? "";
  let responseBody: string | undefined;
  let responseBodyJson: unknown;

  try {
    responseBody = xhr.responseText;

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

  return { body: responseBody, bodyJson: responseBodyJson };
};

export const truncateBody = (body: string): string => {
  if (body.length <= MAX_BODY_LENGTH) {
    return body;
  }
  return `${body.substring(0, MAX_BODY_LENGTH)}... (обрезано)`;
};

