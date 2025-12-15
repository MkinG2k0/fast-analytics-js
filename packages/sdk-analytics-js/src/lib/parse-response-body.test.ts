import { describe, it, expect, vi } from "vitest";
import {
  parseResponseBody,
  parseXHRResponseBody,
  truncateBody,
} from "./parse-response-body";
import { MAX_BODY_LENGTH } from "../model";

describe("parseResponseBody", () => {
  it("должен парсить JSON ответ", async () => {
    const response = new Response('{"key": "value"}', {
      headers: { "content-type": "application/json" },
    });

    const result = await parseResponseBody(response);

    expect(result.body).toBe('{"key": "value"}');
    expect(result.bodyJson).toEqual({ key: "value" });
  });

  it("должен парсить текстовый ответ", async () => {
    const response = new Response("plain text", {
      headers: { "content-type": "text/plain" },
    });

    const result = await parseResponseBody(response);

    expect(result.body).toBe("plain text");
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать невалидный JSON", async () => {
    const response = new Response("{invalid json}", {
      headers: { "content-type": "application/json" },
    });

    const result = await parseResponseBody(response);

    expect(result.body).toBe("{invalid json}");
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать пустой ответ", async () => {
    const response = new Response("", {
      headers: { "content-type": "application/json" },
    });

    const result = await parseResponseBody(response);

    expect(result.body).toBe("");
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать ошибки чтения тела ответа", async () => {
    const response = new Response("test", {
      headers: { "content-type": "text/plain" },
    });

    // Мокаем clone чтобы выбросить ошибку
    const originalClone = response.clone;
    response.clone = vi.fn(() => {
      throw new Error("Clone error");
    });

    const result = await parseResponseBody(response);

    expect(result.body).toBeUndefined();
    expect(result.bodyJson).toBeUndefined();

    response.clone = originalClone;
  });

  it("должен обрабатывать отсутствующий content-type", async () => {
    const response = new Response('{"key": "value"}', {
      headers: {},
    });

    const result = await parseResponseBody(response);

    expect(result.body).toBe('{"key": "value"}');
    expect(result.bodyJson).toBeUndefined();
  });
});

describe("parseXHRResponseBody", () => {
  it("должен парсить JSON ответ из XHR", () => {
    const xhr = {
      responseText: '{"key": "value"}',
      getResponseHeader: vi.fn(() => "application/json"),
    } as unknown as XMLHttpRequest;

    const result = parseXHRResponseBody(xhr);

    expect(result.body).toBe('{"key": "value"}');
    expect(result.bodyJson).toEqual({ key: "value" });
  });

  it("должен парсить текстовый ответ из XHR", () => {
    const xhr = {
      responseText: "plain text",
      getResponseHeader: vi.fn(() => "text/plain"),
    } as unknown as XMLHttpRequest;

    const result = parseXHRResponseBody(xhr);

    expect(result.body).toBe("plain text");
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать невалидный JSON из XHR", () => {
    const xhr = {
      responseText: "{invalid json}",
      getResponseHeader: vi.fn(() => "application/json"),
    } as unknown as XMLHttpRequest;

    const result = parseXHRResponseBody(xhr);

    expect(result.body).toBe("{invalid json}");
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать ошибки чтения responseText", () => {
    const xhr = {
      get responseText() {
        throw new Error("Read error");
      },
      getResponseHeader: vi.fn(() => "application/json"),
    } as unknown as XMLHttpRequest;

    const result = parseXHRResponseBody(xhr);

    expect(result.body).toBeUndefined();
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать отсутствующий content-type в XHR", () => {
    const xhr = {
      responseText: '{"key": "value"}',
      getResponseHeader: vi.fn(() => null),
    } as unknown as XMLHttpRequest;

    const result = parseXHRResponseBody(xhr);

    expect(result.body).toBe('{"key": "value"}');
    expect(result.bodyJson).toBeUndefined();
  });
});

describe("truncateBody", () => {
  it("должен возвращать тело без изменений если оно короткое", () => {
    const shortBody = "short text";
    const result = truncateBody(shortBody);
    expect(result).toBe(shortBody);
  });

  it("должен обрезать длинное тело", () => {
    const longBody = "a".repeat(MAX_BODY_LENGTH + 100);
    const result = truncateBody(longBody);

    expect(result.length).toBeLessThanOrEqual(MAX_BODY_LENGTH + 20); // +20 для "... (обрезано)"
    expect(result).toContain("... (обрезано)");
    expect(result.substring(0, MAX_BODY_LENGTH)).toBe(
      longBody.substring(0, MAX_BODY_LENGTH)
    );
  });

  it("должен обрезать тело точно на MAX_BODY_LENGTH", () => {
    const longBody = "a".repeat(MAX_BODY_LENGTH + 50);
    const result = truncateBody(longBody);

    expect(result.substring(0, MAX_BODY_LENGTH)).toBe(
      longBody.substring(0, MAX_BODY_LENGTH)
    );
  });
});
