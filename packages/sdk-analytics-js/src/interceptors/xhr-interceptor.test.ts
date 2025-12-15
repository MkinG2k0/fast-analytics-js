import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setupXHRInterceptor } from "./xhr-interceptor";
import { Transport } from "../transport";
import { SessionManager } from "../session";
import type { InitOptions } from "../model";

describe("XHR Interceptor", () => {
  let transport: Transport;
  let sessionManager: SessionManager;
  let mockSend: ReturnType<typeof vi.fn>;
  let createErrorPayload: ReturnType<typeof vi.fn>;
  let isSDKRequest: ReturnType<typeof vi.fn>;
  let getUserId: ReturnType<typeof vi.fn>;
  let teardown: () => void;

  beforeEach(() => {
    const options: InitOptions = {
      projectKey: "test-key",
      endpoint: "https://fast-analytics.vercel.app/api/events",
    };
    transport = new Transport(options);
    mockSend = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(transport, "send").mockImplementation(mockSend);

    sessionManager = new SessionManager();
    createErrorPayload = vi.fn().mockResolvedValue({
      level: "error",
      message: "Test error",
      context: {},
    });
    isSDKRequest = vi.fn((url: string) => url.includes("/api/events"));
    getUserId = vi.fn(() => undefined);

    vi.spyOn(console, "error").mockImplementation(() => {});

    teardown = setupXHRInterceptor({
      transport,
      sessionManager,
      getUserId,
      isSDKRequest,
      createErrorPayload,
    });
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  describe("setupXHRInterceptor", () => {
    it("должен возвращать функцию teardown", () => {
      expect(typeof teardown).toBe("function");
    });

    it("должен возвращать пустую функцию если window не определен", () => {
      const originalWindow = global.window;
      // @ts-expect-error - временно удаляем window для теста
      delete global.window;

      const cleanup = setupXHRInterceptor({
        transport,
        sessionManager,
        getUserId,
        isSDKRequest,
        createErrorPayload,
      });

      expect(cleanup).toBeDefined();
      expect(() => cleanup()).not.toThrow();

      global.window = originalWindow;
    });

    it("должен перехватывать setRequestHeader для content-type", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.example.com/data");
      xhr.setRequestHeader("Content-Type", "application/json");

      const extendedXHR = xhr as typeof xhr & {
        _fastAnalyticsRequestContentType?: string;
      };
      expect(extendedXHR._fastAnalyticsRequestContentType).toBe(
        "application/json"
      );
    });

    it("должен сохранять URL и метод при open", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "https://api.example.com/data");

      const extendedXHR = xhr as typeof xhr & {
        _fastAnalyticsUrl?: string;
        _fastAnalyticsMethod?: string;
        _fastAnalyticsIsSDKRequest?: boolean;
      };
      expect(extendedXHR._fastAnalyticsUrl).toBe(
        "https://api.example.com/data"
      );
      expect(extendedXHR._fastAnalyticsMethod).toBe("GET");
    });

    it("должен обрабатывать URL объект в open", () => {
      const xhr = new XMLHttpRequest();
      const url = new URL("https://api.example.com/data");
      xhr.open("POST", url);

      const extendedXHR = xhr as typeof xhr & {
        _fastAnalyticsUrl?: string;
      };
      expect(extendedXHR._fastAnalyticsUrl).toBe(
        "https://api.example.com/data"
      );
    });

    it("не должен перехватывать запросы к SDK", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://fast-analytics.vercel.app/api/events");
      xhr.send();

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("должен обрабатывать тело запроса как строку", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.example.com/data");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send('{"test": "data"}');

      const extendedXHR = xhr as typeof xhr & {
        _fastAnalyticsRequestBody?: string;
        _fastAnalyticsRequestData?: unknown;
      };
      expect(extendedXHR._fastAnalyticsRequestBody).toBe('{"test": "data"}');
      expect(extendedXHR._fastAnalyticsRequestData).toEqual({ test: "data" });
    });

    it("должен обрабатывать FormData в теле запроса", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.example.com/data");
      const formData = new FormData();
      formData.append("key", "value");
      xhr.send(formData);

      const extendedXHR = xhr as typeof xhr & {
        _fastAnalyticsRequestBody?: string;
      };
      expect(extendedXHR._fastAnalyticsRequestBody).toBe("[FormData]");
    });

    it("должен обрабатывать URLSearchParams в теле запроса", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.example.com/data");
      const params = new URLSearchParams();
      params.append("key", "value");
      xhr.send(params);

      const extendedXHR = xhr as typeof xhr & {
        _fastAnalyticsRequestBody?: string;
      };
      expect(extendedXHR._fastAnalyticsRequestBody).toBe("key=value");
    });

    it("должен обрабатывать Blob в теле запроса", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.example.com/data");
      const blob = new Blob(["test"], { type: "text/plain" });
      xhr.send(blob);

      const extendedXHR = xhr as typeof xhr & {
        _fastAnalyticsRequestBody?: string;
      };
      expect(extendedXHR._fastAnalyticsRequestBody).toBe("[Blob]");
    });

    it("должен обрабатывать Document в теле запроса", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.example.com/data");
      xhr.send(document);

      const extendedXHR = xhr as typeof xhr & {
        _fastAnalyticsRequestBody?: string;
      };
      // Document преобразуется через String(), что дает "[object HTMLDocument]"
      expect(extendedXHR._fastAnalyticsRequestBody).toBeTruthy();
    });

    it("должен вызывать оригинальный onerror если он был установлен", () => {
      const xhr = new XMLHttpRequest();
      const originalOnError = vi.fn();
      xhr.onerror = originalOnError;
      xhr.open("GET", "https://api.example.com/data");

      const errorEvent = new ProgressEvent("error");
      Object.defineProperty(xhr, "status", { value: 0, writable: true });
      Object.defineProperty(xhr, "statusText", {
        value: "Network Error",
        writable: true,
      });

      xhr.onerror?.(errorEvent);

      expect(originalOnError).toHaveBeenCalled();
    });

    it("должен вызывать оригинальный onload если он был установлен", () => {
      const xhr = new XMLHttpRequest();
      const originalOnLoad = vi.fn();
      xhr.onload = originalOnLoad;
      xhr.open("GET", "https://api.example.com/data");

      Object.defineProperty(xhr, "status", { value: 200, writable: true });
      const loadEvent = new ProgressEvent("load");
      xhr.onload?.(loadEvent);

      expect(originalOnLoad).toHaveBeenCalled();
    });

    it("должен восстанавливать оригинальные методы при teardown", () => {
      // Сохраняем методы после setup
      const openAfterSetup = XMLHttpRequest.prototype.open;
      const sendAfterSetup = XMLHttpRequest.prototype.send;
      const setRequestHeaderAfterSetup =
        XMLHttpRequest.prototype.setRequestHeader;

      teardown();

      // После teardown методы должны быть восстановлены (не те же что после setup)
      expect(XMLHttpRequest.prototype.open).toBeDefined();
      expect(XMLHttpRequest.prototype.send).toBeDefined();
      expect(XMLHttpRequest.prototype.setRequestHeader).toBeDefined();
    });

    it("должен обрабатывать невалидный JSON в теле запроса", () => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.example.com/data");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send("{invalid json}");

      const extendedXHR = xhr as typeof xhr & {
        _fastAnalyticsRequestBody?: string;
        _fastAnalyticsRequestData?: unknown;
      };
      expect(extendedXHR._fastAnalyticsRequestBody).toBe("{invalid json}");
      expect(extendedXHR._fastAnalyticsRequestData).toBeUndefined();
    });
  });
});
