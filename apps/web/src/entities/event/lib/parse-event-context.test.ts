import { describe, expect, it } from "vitest";
import type { Event } from "@repo/database";
import { parseEventContext, type ParsedEventContext } from "./parse-event-context";

describe("parseEventContext", () => {
  it("должен возвращать пустой результат для события без context", () => {
    const event: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: null,
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parseEventContext(event);
    expect(result).toEqual({
      hasRequestData: false,
      hasResponseData: false,
      hasHttpData: false,
    });
  });

  it("должен парсить customTags", () => {
    const event: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: {
        customTags: {
          tag1: "value1",
          tag2: "value2",
        },
      },
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parseEventContext(event);
    expect(result.customTags).toEqual({
      tag1: "value1",
      tag2: "value2",
    });
  });

  it("должен парсить HTTP данные из customTags", () => {
    const event: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: {
        customTags: {
          method: "POST",
          url: "https://example.com/api",
          statusCode: "200",
          statusText: "OK",
          requestBody: '{"key":"value"}',
          responseBody: '{"result":"success"}',
          contentType: "application/json",
          requestContentType: "application/json",
        },
      },
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parseEventContext(event);
    expect(result.method).toBe("POST");
    expect(result.requestUrl).toBe("https://example.com/api");
    expect(result.statusCode).toBe("200");
    expect(result.statusText).toBe("OK");
    expect(result.requestBody).toBe('{"key":"value"}');
    expect(result.responseBody).toBe('{"result":"success"}');
    expect(result.contentType).toBe("application/json");
    expect(result.requestContentType).toBe("application/json");
    expect(result.hasRequestData).toBe(true);
    expect(result.hasResponseData).toBe(true);
    expect(result.hasHttpData).toBe(true);
  });

  it("должен парсить requestData и responseData из context", () => {
    const event: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: {
        requestData: { key: "value" },
        responseData: { result: "success" },
      },
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parseEventContext(event);
    expect(result.requestData).toEqual({ key: "value" });
    expect(result.responseData).toEqual({ result: "success" });
    expect(result.hasRequestData).toBe(true);
    expect(result.hasResponseData).toBe(true);
    expect(result.hasHttpData).toBe(true);
  });

  it("должен парсить requestHeaders и responseHeaders", () => {
    const event: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: {
        requestHeaders: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        responseHeaders: {
          "Content-Type": "application/json",
          "X-Request-ID": "123",
        },
      },
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parseEventContext(event);
    expect(result.requestHeaders).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    });
    expect(result.responseHeaders).toEqual({
      "Content-Type": "application/json",
      "X-Request-ID": "123",
    });
  });

  it("должен игнорировать не-строковые значения в customTags", () => {
    const event: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: {
        customTags: {
          method: "POST",
          numberValue: 123 as unknown as string,
          objectValue: { key: "value" } as unknown as string,
        },
      },
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parseEventContext(event);
    // Если customTags содержит не-строковые значения, isStringRecord вернет false
    // и customTags станет undefined, поэтому method тоже будет undefined
    expect(result.customTags).toBeUndefined();
    expect(result.method).toBeUndefined();
  });

  it("должен игнорировать не-строковые записи в headers", () => {
    const event: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: {
        requestHeaders: {
          "Content-Type": "application/json",
          invalid: 123 as unknown as string,
        } as Record<string, string>,
      },
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parseEventContext(event);
    // requestHeaders должны быть undefined, так как не все значения строки
    expect(result.requestHeaders).toBeUndefined();
  });

  it("должен парсить errorType из customTags", () => {
    const event: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: {
        customTags: {
          errorType: "TypeError",
        },
      },
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parseEventContext(event);
    expect(result.errorType).toBe("TypeError");
  });

  it("должен определять hasHttpData на основе наличия HTTP данных", () => {
    const event1: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: {
        customTags: {
          method: "GET",
        },
      },
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result1 = parseEventContext(event1);
    expect(result1.hasHttpData).toBe(true);

    const event2: Event = {
      id: "2",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: {
        customTags: {
          otherTag: "value",
        },
      },
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result2 = parseEventContext(event2);
    expect(result2.hasHttpData).toBe(false);
  });

  it("должен обрабатывать context с массивом (не объектом)", () => {
    const event: Event = {
      id: "1",
      projectId: "project1",
      level: "error",
      message: "Test error",
      context: ["not", "an", "object"] as unknown as Record<string, unknown>,
      stack: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = parseEventContext(event);
    expect(result).toEqual({
      hasRequestData: false,
      hasResponseData: false,
      hasHttpData: false,
    });
  });
});

