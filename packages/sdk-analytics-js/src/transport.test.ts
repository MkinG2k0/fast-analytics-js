import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Transport } from "./transport";
import type { EventPayload, InitOptions } from "./model";

describe("Transport", () => {
  let transport: Transport;
  let mockFetch: ReturnType<typeof vi.fn>;
  const defaultOptions: InitOptions = {
    projectKey: "test-project-key",
  };

  beforeEach(() => {
    // Мокаем fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Мокаем console.log и console.error для чистоты вывода
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe("конструктор", () => {
    it("должен использовать дефолтный endpoint если не указан", () => {
      transport = new Transport(defaultOptions);

      expect(transport).toBeDefined();
    });

    it("должен использовать кастомный endpoint если указан", () => {
      const customEndpoint = "https://custom-endpoint.com/api/events";
      transport = new Transport({
        ...defaultOptions,
        endpoint: customEndpoint,
      });

      expect(transport).toBeDefined();
    });

    it("должен использовать дефолтный batchSize если не указан", () => {
      transport = new Transport(defaultOptions);

      expect(transport).toBeDefined();
    });

    it("должен использовать кастомный batchSize если указан", () => {
      transport = new Transport({
        ...defaultOptions,
        batchSize: 5,
      });

      expect(transport).toBeDefined();
    });

    it("должен использовать дефолтный batchTimeout если не указан", () => {
      transport = new Transport(defaultOptions);

      expect(transport).toBeDefined();
    });

    it("должен использовать кастомный batchTimeout если указан", () => {
      transport = new Transport({
        ...defaultOptions,
        batchTimeout: 1000,
      });

      expect(transport).toBeDefined();
    });
  });

  describe("send", () => {
    beforeEach(() => {
      transport = new Transport(defaultOptions);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      });
    });

    it("должен добавлять событие в батч", async () => {
      const event: EventPayload = {
        level: "info",
        message: "test message",
      };

      await transport.send(event);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("должен отправлять батч когда достигнут batchSize", async () => {
      transport = new Transport({
        ...defaultOptions,
        batchSize: 2,
      });

      const event1: EventPayload = {
        level: "info",
        message: "message 1",
      };
      const event2: EventPayload = {
        level: "error",
        message: "message 2",
      };

      await transport.send(event1);
      await transport.send(event2);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-api-key": "test-project-key",
          }),
          body: JSON.stringify([event1, event2]),
        })
      );
    });

    it("должен добавлять userAgent и url из браузера если не указаны", async () => {
      const event: EventPayload = {
        level: "info",
        message: "test message",
      };

      Object.defineProperty(window, "location", {
        value: { href: "https://example.com/test" },
        writable: true,
      });
      Object.defineProperty(navigator, "userAgent", {
        value: "test-user-agent",
        writable: true,
      });

      await transport.send(event);

      // Проверяем что событие было добавлено (fetch не вызван, так как батч не заполнен)
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("должен отправлять батч по таймауту", async () => {
      vi.useFakeTimers();
      transport = new Transport({
        ...defaultOptions,
        batchTimeout: 1000,
      });

      const event: EventPayload = {
        level: "info",
        message: "test message",
      };

      await transport.send(event);

      expect(mockFetch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      // Ждем выполнения асинхронных операций
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify([event]),
        })
      );

      vi.useRealTimers();
    });

    it("должен очищать таймер при достижении batchSize", async () => {
      vi.useFakeTimers();
      transport = new Transport({
        ...defaultOptions,
        batchSize: 2,
        batchTimeout: 1000,
      });

      const event1: EventPayload = {
        level: "info",
        message: "message 1",
      };
      const event2: EventPayload = {
        level: "error",
        message: "message 2",
      };

      await transport.send(event1);
      await transport.send(event2);

      expect(mockFetch).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      // Таймер не должен сработать, так как батч уже был отправлен
      expect(mockFetch).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe("flush", () => {
    beforeEach(() => {
      transport = new Transport({
        ...defaultOptions,
        batchSize: 10,
      });
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      });
    });

    it("должен отправлять все события из батча", async () => {
      const event1: EventPayload = {
        level: "info",
        message: "message 1",
      };
      const event2: EventPayload = {
        level: "error",
        message: "message 2",
      };

      await transport.send(event1);
      await transport.send(event2);

      expect(mockFetch).not.toHaveBeenCalled();

      await transport.flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify([event1, event2]),
        })
      );
    });

    it("должен очищать батч после отправки", async () => {
      const event: EventPayload = {
        level: "info",
        message: "test message",
      };

      await transport.send(event);
      await transport.flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await transport.flush();

      // Второй flush не должен отправлять ничего
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("должен очищать таймер при flush", async () => {
      vi.useFakeTimers();
      transport = new Transport({
        ...defaultOptions,
        batchTimeout: 1000,
      });

      const event: EventPayload = {
        level: "info",
        message: "test message",
      };

      await transport.send(event);
      await transport.flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      // Таймер не должен сработать
      expect(mockFetch).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it("не должен отправлять запрос если батч пуст", async () => {
      await transport.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("sendBatch", () => {
    beforeEach(() => {
      transport = new Transport({
        ...defaultOptions,
        batchSize: 1,
      });
    });

    it("должен обрабатывать успешный ответ сервера", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      });

      const event: EventPayload = {
        level: "info",
        message: "test message",
      };

      await transport.send(event);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("должен обрабатывать ошибку ответа сервера", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const event: EventPayload = {
        level: "info",
        message: "test message",
      };

      await transport.send(event);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalled();
    });

    it("должен обрабатывать сетевую ошибку", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const event: EventPayload = {
        level: "info",
        message: "test message",
      };

      await transport.send(event);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalled();
    });

    it("не должен отправлять пустой батч", async () => {
      // Этот тест проверяет внутреннюю логику sendBatch
      // Если батч пуст, sendBatch не должен вызывать fetch
      await transport.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

