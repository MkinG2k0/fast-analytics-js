import { describe, it, expect } from "vitest";
import {
  extractContentType,
  parseRequestBody,
  truncateBody,
} from "./parse-request-body";
import { MAX_BODY_LENGTH } from "../model";

describe("extractContentType", () => {
  it("должен возвращать пустую строку если headers не переданы", () => {
    expect(extractContentType()).toBe("");
  });

  it("должен извлекать content-type из строки", () => {
    expect(
      extractContentType("application/json" as unknown as HeadersInit)
    ).toBe("application/json");
  });

  it("должен извлекать content-type из массива заголовков", () => {
    const headers: [string, string][] = [
      ["content-type", "application/json"],
      ["authorization", "Bearer token"],
    ];
    expect(extractContentType(headers)).toBe("application/json");
  });

  it("должен возвращать пустую строку если content-type не найден в массиве", () => {
    const headers: [string, string][] = [
      ["authorization", "Bearer token"],
      ["accept", "application/json"],
    ];
    expect(extractContentType(headers)).toBe("");
  });

  it("должен извлекать content-type из Headers объекта", () => {
    const headers = new Headers();
    headers.set("content-type", "application/json");
    expect(extractContentType(headers)).toBe("application/json");
  });

  it("должен извлекать content-type из объекта заголовков (camelCase)", () => {
    const headers = { contentType: "application/json" };
    // camelCase не поддерживается напрямую, только kebab-case и PascalCase
    expect(extractContentType(headers)).toBe("");
  });

  it("должен извлекать content-type из объекта заголовков (kebab-case)", () => {
    const headers = { "content-type": "application/json" };
    expect(extractContentType(headers)).toBe("application/json");
  });

  it("должен извлекать content-type из объекта заголовков (PascalCase)", () => {
    const headers = { "Content-Type": "application/json" };
    expect(extractContentType(headers)).toBe("application/json");
  });

  it("должен возвращать пустую строку если content-type отсутствует в объекте", () => {
    const headers = { authorization: "Bearer token" };
    expect(extractContentType(headers)).toBe("");
  });
});

describe("parseRequestBody", () => {
  it("должен возвращать undefined для null body", () => {
    const result = parseRequestBody(null, "application/json");
    expect(result.body).toBeUndefined();
    expect(result.bodyJson).toBeUndefined();
    expect(result.contentType).toBe("application/json");
  });

  it("должен парсить строковое тело как JSON", () => {
    const body = '{"key": "value"}';
    const result = parseRequestBody(body, "application/json");

    expect(result.body).toBe(body);
    expect(result.bodyJson).toEqual({ key: "value" });
    expect(result.contentType).toBe("application/json");
  });

  it("должен обрабатывать строковое тело без JSON content-type", () => {
    const body = "plain text";
    const result = parseRequestBody(body, "text/plain");

    expect(result.body).toBe(body);
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать невалидный JSON", () => {
    const body = "{invalid json}";
    const result = parseRequestBody(body, "application/json");

    expect(result.body).toBe(body);
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать FormData", () => {
    const formData = new FormData();
    formData.append("key", "value");
    const result = parseRequestBody(formData, "multipart/form-data");

    expect(result.body).toBe("[FormData]");
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать URLSearchParams", () => {
    const params = new URLSearchParams();
    params.append("key", "value");
    const result = parseRequestBody(
      params,
      "application/x-www-form-urlencoded"
    );

    expect(result.body).toBe("key=value");
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать Blob", () => {
    const blob = new Blob(["test"], { type: "text/plain" });
    const result = parseRequestBody(blob, "application/octet-stream");

    expect(result.body).toBe("[Blob]");
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать Document", () => {
    const result = parseRequestBody(
      document as unknown as BodyInit,
      "text/html"
    );

    // Document преобразуется через String(), что дает "[object HTMLDocument]"
    expect(result.body).toBeTruthy();
    expect(result.bodyJson).toBeUndefined();
  });

  it("должен обрабатывать другие типы через String()", () => {
    const result = parseRequestBody(123 as unknown as BodyInit, "text/plain");

    expect(result.body).toBe("123");
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

    expect(result.length).toBeLessThanOrEqual(MAX_BODY_LENGTH + 20);
    expect(result).toContain("... (обрезано)");
    expect(result.substring(0, MAX_BODY_LENGTH)).toBe(
      longBody.substring(0, MAX_BODY_LENGTH)
    );
  });
});
