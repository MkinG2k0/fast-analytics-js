import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  init,
  logError,
  logWarning,
  logInfo,
  logDebug,
  flush,
  getSessionId,
  resetSession,
  teardown,
} from "./index";
import type { EventContext, InitOptions } from "./model";

describe("FastAnalyticsSDK", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Мокаем fetch
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });
    global.fetch = mockFetch;

    // Мокаем console методы
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Очищаем localStorage
    localStorage.clear();

    // Мокаем window.location и navigator
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/test" },
      writable: true,
    });
    Object.defineProperty(navigator, "userAgent", {
      value: "test-user-agent",
      writable: true,
    });
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe("init", () => {
    it("должен инициализировать SDK с минимальными опциями", () => {
      const options: InitOptions = {
        projectKey: "test-key",
      };

      expect(() => init(options)).not.toThrow();
    });

    it("должен инициализировать SDK со всеми опциями", () => {
      const options: InitOptions = {
        projectKey: "test-key",
        endpoint: "https://custom-endpoint.com/api/events",
        enableAutoCapture: true,
        batchSize: 5,
        batchTimeout: 1000,
        userId: "user-123",
      };

      expect(() => init(options)).not.toThrow();
    });

    it("должен предупреждать при повторной инициализации", () => {
      const options: InitOptions = {
        projectKey: "test-key",
      };

      init(options);
      init(options);

      expect(console.warn).toHaveBeenCalledWith(
        "[Fast Analytics SDK] SDK уже инициализирован"
      );
    });

    it("не должен устанавливать перехватчики если enableAutoCapture = false", () => {
      const options: InitOptions = {
        projectKey: "test-key",
        enableAutoCapture: false,
      };

      init(options);

      // Проверяем что window.onerror не был установлен
      expect(window.onerror).toBeNull();
    });
  });

  describe("logError", () => {
    beforeEach(() => {
      init({
        projectKey: "test-key",
        batchSize: 1, // Для немедленной отправки
      });
    });

    it("должен логировать ошибку с объектом Error", async () => {
      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at test.js:1:1";

      await logError(error);

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].level).toBe("error");
      expect(body[0].message).toBe("Test error");
      expect(body[0].stack).toBeDefined();
    });

    it("должен логировать ошибку со строкой", async () => {
      await logError("String error");

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].level).toBe("error");
      expect(body[0].message).toBe("String error");
    });

    it("должен включать контекст если передан", async () => {
      const error = new Error("Test error");
      const context: EventContext = {
        userId: "user-123",
        customTags: {
          component: "test-component",
        },
      };

      await logError(error, context);

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].context).toEqual(context);
      expect(body[0].userId).toBe("user-123");
    });

    it("должен использовать userId из init если не передан в контексте", async () => {
      teardown(); // Сбрасываем предыдущую инициализацию
      
      init({
        projectKey: "test-key",
        userId: "init-user-id",
        batchSize: 1,
      });

      await logError("Test error");

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].userId).toBe("init-user-id");
    });

    it("должен выбрасывать ошибку если SDK не инициализирован", async () => {
      teardown();

      await expect(logError("Test error")).rejects.toThrow(
        "[Fast Analytics SDK] SDK не инициализирован"
      );
    });
  });

  describe("logWarning", () => {
    beforeEach(() => {
      init({
        projectKey: "test-key",
        batchSize: 1,
      });
    });

    it("должен логировать предупреждение", async () => {
      await logWarning("Warning message");

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].level).toBe("warn");
      expect(body[0].message).toBe("Warning message");
    });

    it("должен включать контекст если передан", async () => {
      const context: EventContext = {
        customTags: {
          severity: "low",
        },
      };

      await logWarning("Warning message", context);

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].context).toEqual(context);
    });
  });

  describe("logInfo", () => {
    beforeEach(() => {
      init({
        projectKey: "test-key",
        batchSize: 1,
      });
    });

    it("должен логировать информационное сообщение", async () => {
      await logInfo("Info message");

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].level).toBe("info");
      expect(body[0].message).toBe("Info message");
    });
  });

  describe("logDebug", () => {
    beforeEach(() => {
      init({
        projectKey: "test-key",
        batchSize: 1,
      });
    });

    it("должен логировать отладочное сообщение", async () => {
      await logDebug("Debug message");

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].level).toBe("debug");
      expect(body[0].message).toBe("Debug message");
    });
  });

  describe("flush", () => {
    beforeEach(() => {
      init({
        projectKey: "test-key",
        batchSize: 10, // Большой размер батча для тестирования flush
      });
    });

    it("должен отправлять все накопленные события", async () => {
      await logInfo("Message 1");
      await logInfo("Message 2");

      expect(mockFetch).not.toHaveBeenCalled();

      await flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body).toHaveLength(2);
    });

    it("не должен выбрасывать ошибку если SDK не инициализирован", async () => {
      teardown();

      await expect(flush()).resolves.not.toThrow();
    });
  });

  describe("getSessionId", () => {
    beforeEach(() => {
      init({
        projectKey: "test-key",
      });
    });

    it("должен возвращать sessionId", () => {
      const sessionId = getSessionId();

      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it("должен возвращать тот же sessionId при повторных вызовах", () => {
      const sessionId1 = getSessionId();
      const sessionId2 = getSessionId();

      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe("resetSession", () => {
    beforeEach(() => {
      init({
        projectKey: "test-key",
      });
    });

    it("должен создавать новый sessionId", () => {
      const oldSessionId = getSessionId();

      resetSession();
      const newSessionId = getSessionId();

      expect(newSessionId).not.toBe(oldSessionId);
      expect(newSessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe("teardown", () => {
    it("должен удалять все перехватчики", () => {
      const originalFetch = window.fetch;
      const originalOnError = window.onerror;
      
      init({
        projectKey: "test-key",
        enableAutoCapture: true,
      });

      // Проверяем что перехватчики установлены
      expect(window.onerror).not.toBe(originalOnError);
      expect(window.fetch).not.toBe(originalFetch);

      teardown();

      // После teardown должны быть восстановлены оригинальные значения
      expect(window.onerror).toBe(originalOnError);
      expect(window.fetch).toBe(originalFetch);
    });

    it("должен сбрасывать флаг инициализации", async () => {
      init({
        projectKey: "test-key",
      });

      teardown();

      await expect(logError("Test")).rejects.toThrow(
        "[Fast Analytics SDK] SDK не инициализирован"
      );
    });
  });

  describe("интеграционные тесты", () => {
    beforeEach(() => {
      init({
        projectKey: "test-key",
        batchSize: 2,
      });
    });

    it("должен отправлять события батчами", async () => {
      await logInfo("Message 1");
      await logInfo("Message 2");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body).toHaveLength(2);
    });

    it("должен включать метаданные браузера в события", async () => {
      await logInfo("Test message");

      await flush();

      expect(mockFetch).toHaveBeenCalled();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body[0].url).toBe("https://example.com/test");
      expect(body[0].userAgent).toBe("test-user-agent");
      expect(body[0].sessionId).toBeDefined();
    });
  });
});

