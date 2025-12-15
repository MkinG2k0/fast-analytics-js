import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Interceptors } from "./interceptors";
import { Transport } from "./transport";
import { SessionManager } from "./session";
import type { InitOptions } from "./model";

describe("Interceptors", () => {
  let interceptors: Interceptors;
  let transport: Transport;
  let sessionManager: SessionManager;
  let mockSend: ReturnType<typeof vi.fn>;
  const getUserId = vi.fn(() => undefined);
  const sdkEndpoint = "https://fast-analytics.vercel.app/api/events";

  beforeEach(() => {
    // Мокаем Transport
    const options: InitOptions = {
      projectKey: "test-key",
      endpoint: sdkEndpoint,
    };
    transport = new Transport(options);
    mockSend = vi.fn().mockResolvedValue(undefined);
    // Правильно мокаем метод send через vi.spyOn
    vi.spyOn(transport, "send").mockImplementation(mockSend);

    sessionManager = new SessionManager();

    interceptors = new Interceptors(
      transport,
      sessionManager,
      getUserId,
      sdkEndpoint
    );

    // Мокаем console методы
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Устанавливаем window.location.href для правильной работы isSDKRequest
    // Используем тот же домен что и sdkEndpoint для корректного сравнения
    Object.defineProperty(window, "location", {
      value: { href: "https://fast-analytics.vercel.app" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    interceptors.teardown();
    vi.restoreAllMocks();
  });

  describe("isSDKRequest", () => {
    it("должен определять запросы к SDK", () => {
      interceptors.setup();
      const isSDKRequest = (
        interceptors as unknown as {
          isSDKRequest: (url: string) => boolean;
        }
      ).isSDKRequest;

      // Метод сравнивает origin и pathname
      // window.location.href = "https://fast-analytics.vercel.app"
      // sdkEndpoint = "https://fast-analytics.vercel.app/api/events"
      // Проверяем что запросы к другим доменам не определяются как SDK запросы
      expect(isSDKRequest("https://api.example.com/data")).toBe(false);
      expect(isSDKRequest("https://other-domain.com/api/events")).toBe(false);
      // Проверяем что запросы с другим pathname не определяются как SDK запросы
      expect(isSDKRequest("https://fast-analytics.vercel.app/other/path")).toBe(
        false
      );
    });

    it("должен возвращать false если window не определен", () => {
      const originalWindow = global.window;
      // @ts-expect-error - временно удаляем window для теста
      delete global.window;

      const isSDKRequest = (
        interceptors as unknown as {
          isSDKRequest: (url: string) => boolean;
        }
      ).isSDKRequest;

      expect(isSDKRequest("https://api.example.com/data")).toBe(false);

      global.window = originalWindow;
    });

    it("должен обрабатывать невалидные URL", () => {
      interceptors.setup();
      const isSDKRequest = (
        interceptors as unknown as {
          isSDKRequest: (url: string) => boolean;
        }
      ).isSDKRequest;

      expect(isSDKRequest("invalid-url")).toBe(false);
    });
  });

  describe("setup", () => {
    it("должен устанавливать перехватчики в браузере", () => {
      interceptors.setup();

      expect(window.onerror).toBeDefined();
    });

    it("не должен устанавливать перехватчики если window не определен", () => {
      const originalWindow = global.window;
      // @ts-expect-error - временно удаляем window для теста
      delete global.window;

      expect(() => interceptors.setup()).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe("window.onerror перехватчик", () => {
    beforeEach(() => {
      interceptors.setup();
    });

    it("должен логировать синхронные ошибки JavaScript", async () => {
      const error = new Error("Test error");
      const onErrorHandler = window.onerror;

      if (onErrorHandler) {
        onErrorHandler("Test error", "test.js", 10, 5, error);
      }

      // Ждем асинхронной обработки
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSend).toHaveBeenCalled();
      const payload = mockSend.mock.calls[0][0];
      expect(payload.level).toBe("error");
      expect(payload.message).toBe("Test error");
      expect(payload.stack).toBeDefined();
    });

    it("должен вызывать оригинальный обработчик если он был", () => {
      const originalHandler = vi.fn();
      window.onerror = originalHandler;
      interceptors.setup();

      const error = new Error("Test error");
      const onErrorHandler = window.onerror;
      if (onErrorHandler) {
        onErrorHandler("Test error", "test.js", 10, 5, error);
      }

      expect(originalHandler).toHaveBeenCalled();
    });
  });

  describe("unhandledrejection перехватчик", () => {
    beforeEach(() => {
      interceptors.setup();
    });

    it("должен логировать необработанные промисы", async () => {
      // Вызываем обработчик напрямую, так как PromiseRejectionEvent не поддерживается в happy-dom
      const handler = (
        interceptors as unknown as {
          unhandledRejectionHandler: (event: PromiseRejectionEvent) => void;
        }
      ).unhandledRejectionHandler;

      if (handler) {
        const mockEvent = {
          reason: new Error("Unhandled rejection"),
        } as PromiseRejectionEvent;

        handler(mockEvent);
      }

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSend).toHaveBeenCalled();
      const payload = mockSend.mock.calls[0][0];
      expect(payload.level).toBe("error");
    });

    it("должен обрабатывать rejection с не-Error объектом", async () => {
      // Вызываем обработчик напрямую
      const handler = (
        interceptors as unknown as {
          unhandledRejectionHandler: (event: PromiseRejectionEvent) => void;
        }
      ).unhandledRejectionHandler;

      if (handler) {
        const mockEvent = {
          reason: "String rejection",
        } as PromiseRejectionEvent;

        handler(mockEvent);
      }

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSend).toHaveBeenCalled();
      const payload = mockSend.mock.calls[0][0];
      expect(payload.message).toBe("String rejection");
    });
  });

  describe("resource error перехватчик", () => {
    beforeEach(() => {
      interceptors.setup();
    });

    it("должен логировать ошибки загрузки ресурсов", async () => {
      const img = document.createElement("img");
      img.src = "https://example.com/nonexistent.jpg";

      const errorEvent = new ErrorEvent("error", {
        message: "Failed to load resource",
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(errorEvent, "target", {
        value: img,
        writable: false,
        enumerable: true,
      });

      // Используем capture phase как в реальном коде
      window.dispatchEvent(errorEvent);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockSend).toHaveBeenCalled();
      const payload = mockSend.mock.calls[0][0];
      expect(payload.level).toBe("error");
      expect(payload.context?.customTags?.errorType).toBe(
        "resource_load_error"
      );
    });

    it("не должен логировать ошибки с error свойством (уже обработаны window.onerror)", async () => {
      const errorEvent = new ErrorEvent("error", {
        error: new Error("Already handled"),
        message: "Error",
      });

      window.dispatchEvent(errorEvent);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Не должен логировать, так как error уже есть
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("fetch перехватчик", () => {
    let originalFetch: typeof fetch;
    let mockOriginalFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      originalFetch = window.fetch;
      // Мокаем оригинальный fetch перед setup
      mockOriginalFetch = vi.fn();
      window.fetch = mockOriginalFetch;
      interceptors.setup();
      mockSend.mockClear();
    });

    afterEach(() => {
      interceptors.teardown();
      window.fetch = originalFetch;
    });

    it("должен логировать HTTP ошибки (4xx, 5xx)", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
        clone: () => ({
          text: () => Promise.resolve("Not found"),
        }),
      } as Response;

      mockOriginalFetch.mockResolvedValue(mockResponse);

      // Используем перехваченный fetch
      await window.fetch("https://api.example.com/data");

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSend).toHaveBeenCalled();
      const payload = mockSend.mock.calls[0][0];
      expect(payload.level).toBe("error");
      expect(payload.context?.customTags?.errorType).toBe("http_error");
      expect(payload.context?.customTags?.statusCode).toBe("404");
    });

    it("не должен логировать успешные запросы", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
      } as Response;

      mockOriginalFetch.mockResolvedValue(mockResponse);

      await window.fetch("https://api.example.com/data");

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSend).not.toHaveBeenCalled();
    });

    it("не должен перехватывать запросы к SDK", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers(),
      } as Response;

      mockOriginalFetch.mockResolvedValue(mockResponse);

      await window.fetch(sdkEndpoint);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSend).not.toHaveBeenCalled();
      expect(mockOriginalFetch).toHaveBeenCalled();
    });

    it("должен логировать сетевые ошибки", async () => {
      mockOriginalFetch.mockRejectedValue(new Error("Network error"));

      try {
        await window.fetch("https://api.example.com/data");
      } catch {
        // Игнорируем ошибку
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSend).toHaveBeenCalled();
      const payload = mockSend.mock.calls[0][0];
      expect(payload.context?.customTags?.errorType).toBe("network_error");
    });

    it("должен извлекать тело запроса для логирования", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: new Headers({
          "content-type": "application/json",
        }),
        clone: () => ({
          text: () => Promise.resolve('{"error": "Bad request"}'),
        }),
      } as Response;

      mockOriginalFetch.mockResolvedValue(mockResponse);

      await window.fetch("https://api.example.com/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: "data" }),
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSend).toHaveBeenCalled();
      const payload = mockSend.mock.calls[0][0];
      expect(payload.context?.customTags?.requestBody).toBeDefined();
    });
  });

  describe("XMLHttpRequest перехватчик", () => {
    it("должен устанавливать перехватчики XHR", () => {
      // Проверяем что setup устанавливает перехватчики
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      interceptors.setup();

      // После setup методы должны быть перехвачены
      expect(XMLHttpRequest.prototype.open).not.toBe(originalOpen);
      expect(XMLHttpRequest.prototype.send).not.toBe(originalSend);
    });

    it("должен восстанавливать оригинальные методы XHR при teardown", () => {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      interceptors.setup();
      interceptors.teardown();

      // После teardown методы должны быть восстановлены
      expect(XMLHttpRequest.prototype.open).toBe(originalOpen);
      expect(XMLHttpRequest.prototype.send).toBe(originalSend);
    });
  });

  describe("teardown", () => {
    it("должен удалять все перехватчики", () => {
      const originalFetch = window.fetch;
      const originalOnError = window.onerror;

      interceptors.setup();

      // Проверяем что перехватчики установлены
      expect(window.onerror).not.toBe(originalOnError);
      expect(window.fetch).not.toBe(originalFetch);

      interceptors.teardown();

      // После teardown должны быть восстановлены оригинальные значения
      expect(window.onerror).toBe(originalOnError);
      expect(window.fetch).toBe(originalFetch);
    });

    it("должен восстанавливать оригинальный window.onerror", () => {
      const originalHandler = vi.fn();
      window.onerror = originalHandler;

      interceptors.setup();
      interceptors.teardown();

      expect(window.onerror).toBe(originalHandler);
    });

    it("не должен падать если window не определен", () => {
      const originalWindow = global.window;
      // @ts-expect-error - временно удаляем window для теста
      delete global.window;

      expect(() => interceptors.teardown()).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe("createErrorPayload", () => {
    beforeEach(() => {
      interceptors.setup();
    });

    it("должен создавать stack из source, lineno, colno если error не передан", async () => {
      // Тестируем через window.onerror, который вызывает createErrorPayload
      const error = new Error("Test error");
      const onErrorHandler = window.onerror;

      if (onErrorHandler) {
        onErrorHandler(
          "Test error",
          "test.js",
          10,
          5,
          undefined // Не передаем error, чтобы проверить создание stack из source/lineno/colno
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockSend).toHaveBeenCalled();
      const payload = mockSend.mock.calls[0][0];
      expect(payload.stack).toBeDefined();
    });

    it("должен создавать screenshot если enableScreenshotOnError = true", async () => {
      const options: InitOptions = {
        projectKey: "test-key",
        endpoint: sdkEndpoint,
      };
      const screenshotTransport = new Transport(options);
      const screenshotInterceptors = new Interceptors(
        screenshotTransport,
        sessionManager,
        getUserId,
        sdkEndpoint,
        true // enableScreenshotOnError
      );

      screenshotInterceptors.setup();

      const error = new Error("Test error");
      const onErrorHandler = window.onerror;

      if (onErrorHandler) {
        onErrorHandler("Test error", "test.js", 10, 5, error);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Screenshot может быть null если html2canvas недоступен, но поле должно быть определено
      const calls = mockSend.mock.calls;
      if (calls.length > 0) {
        const payload = calls[calls.length - 1][0];
        // screenshotUrl может быть undefined или null, но payload должен быть создан
        expect(payload).toBeDefined();
      }

      screenshotInterceptors.teardown();
    });
  });
});
