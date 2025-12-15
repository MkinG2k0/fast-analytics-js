import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { HeartbeatTransport } from "./heartbeat-transport";
import type { InitOptions } from "../model";

describe("HeartbeatTransport", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let transport: HeartbeatTransport;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (transport) {
      transport.stop();
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("конструктор", () => {
    it("должен создавать транспорт с дефолтным endpoint", () => {
      const options: InitOptions = {
        projectKey: "test-key",
      };
      transport = new HeartbeatTransport(options, "session-123");

      expect(transport).toBeDefined();
    });

    it("должен создавать транспорт с кастомным endpoint", () => {
      const options: InitOptions = {
        projectKey: "test-key",
        endpoint: "https://custom.com/api/events",
      };
      transport = new HeartbeatTransport(options, "session-123");

      expect(transport).toBeDefined();
    });

    it("должен использовать кастомный heartbeatInterval", () => {
      const options: InitOptions = {
        projectKey: "test-key",
        heartbeatInterval: 5000,
      };
      transport = new HeartbeatTransport(options, "session-123");

      expect(transport).toBeDefined();
    });
  });

  describe("start", () => {
    it("должен отправлять heartbeat сразу при старте", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      const options: InitOptions = {
        projectKey: "test-key",
      };
      transport = new HeartbeatTransport(options, "session-123");

      transport.start();

      // Ждем выполнения асинхронного вызова (только первый вызов, не setInterval)
      await vi.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toContain(
        "/api/online-users/heartbeat"
      );
      expect(mockFetch.mock.calls[0][1]).toMatchObject({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-api-key": "test-key",
        }),
        body: JSON.stringify({ sessionId: "session-123" }),
      });
    });

    it("должен отправлять heartbeat периодически", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      const options: InitOptions = {
        projectKey: "test-key",
        heartbeatInterval: 100,
      };
      transport = new HeartbeatTransport(options, "session-123");

      transport.start();

      await vi.advanceTimersByTimeAsync(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(100);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("должен обрабатывать ошибки отправки heartbeat", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });
      const options: InitOptions = {
        projectKey: "test-key",
      };
      transport = new HeartbeatTransport(options, "session-123");

      transport.start();

      await vi.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it("должен обрабатывать сетевые ошибки", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const options: InitOptions = {
        projectKey: "test-key",
      };
      transport = new HeartbeatTransport(options, "session-123");

      transport.start();

      await vi.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("должен останавливать отправку heartbeat", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      const options: InitOptions = {
        projectKey: "test-key",
        heartbeatInterval: 100,
      };
      transport = new HeartbeatTransport(options, "session-123");

      transport.start();
      await vi.advanceTimersByTimeAsync(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      transport.stop();

      await vi.advanceTimersByTimeAsync(200);

      // Не должно быть новых вызовов после stop
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateSessionId", () => {
    it("должен обновлять sessionId", async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });
      const options: InitOptions = {
        projectKey: "test-key",
      };
      transport = new HeartbeatTransport(options, "session-123");

      transport.updateSessionId("session-456");
      transport.start();

      await vi.advanceTimersByTimeAsync(0);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][1].body).toBe(
        JSON.stringify({ sessionId: "session-456" })
      );
    });
  });
});
