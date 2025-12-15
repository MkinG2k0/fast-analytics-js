import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PageVisitTransport } from "./page-visit-transport";
import type { InitOptions, PageVisitPayload } from "../model";

describe("PageVisitTransport", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let transport: PageVisitTransport;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (transport) {
      transport.flush();
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("конструктор", () => {
    it("должен создавать транспорт с дефолтным endpoint", () => {
      const options: InitOptions = {
        projectKey: "test-key",
      };
      transport = new PageVisitTransport(options);

      expect(transport).toBeDefined();
    });

    it("должен создавать транспорт с кастомным endpoint", () => {
      const options: InitOptions = {
        projectKey: "test-key",
        endpoint: "https://custom.com/api/events",
      };
      transport = new PageVisitTransport(options);

      expect(transport).toBeDefined();
    });
  });

  describe("send", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });
    });

    it("должен добавлять посещение в батч", async () => {
      const options: InitOptions = {
        projectKey: "test-key",
        batchSize: 10,
      };
      transport = new PageVisitTransport(options);

      const visit: PageVisitPayload = {
        url: "https://example.com",
        pathname: "/",
      };

      await transport.send(visit);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("должен отправлять батч при достижении batchSize", async () => {
      const options: InitOptions = {
        projectKey: "test-key",
        batchSize: 2,
      };
      transport = new PageVisitTransport(options);

      const visit1: PageVisitPayload = {
        url: "https://example.com/page1",
        pathname: "/page1",
      };
      const visit2: PageVisitPayload = {
        url: "https://example.com/page2",
        pathname: "/page2",
      };

      await transport.send(visit1);
      await transport.send(visit2);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/api/page-visits");
      expect(mockFetch.mock.calls[0][1]).toMatchObject({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-api-key": "test-key",
        }),
        body: JSON.stringify([visit1, visit2]),
      });
    });

    it("должен отправлять батч по таймауту", async () => {
      const options: InitOptions = {
        projectKey: "test-key",
        batchSize: 10,
        batchTimeout: 1000,
      };
      transport = new PageVisitTransport(options);

      const visit: PageVisitPayload = {
        url: "https://example.com",
        pathname: "/",
      };

      await transport.send(visit);
      expect(mockFetch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][1].body).toBe(JSON.stringify([visit]));
    });

    it("не должен отправлять пустой батч", async () => {
      const options: InitOptions = {
        projectKey: "test-key",
      };
      transport = new PageVisitTransport(options);

      // Вызываем sendBatch напрямую через flush с пустым батчем
      await transport.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("должен обрабатывать ошибки отправки", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });
      const options: InitOptions = {
        projectKey: "test-key",
        batchSize: 1,
      };
      transport = new PageVisitTransport(options);

      const visit: PageVisitPayload = {
        url: "https://example.com",
        pathname: "/",
      };

      await transport.send(visit);

      expect(mockFetch).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it("должен обрабатывать сетевые ошибки", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const options: InitOptions = {
        projectKey: "test-key",
        batchSize: 1,
      };
      transport = new PageVisitTransport(options);

      const visit: PageVisitPayload = {
        url: "https://example.com",
        pathname: "/",
      };

      await transport.send(visit);

      expect(mockFetch).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it("должен очищать таймер при достижении batchSize", async () => {
      const options: InitOptions = {
        projectKey: "test-key",
        batchSize: 2,
        batchTimeout: 1000,
      };
      transport = new PageVisitTransport(options);

      const visit1: PageVisitPayload = {
        url: "https://example.com/page1",
        pathname: "/page1",
      };
      const visit2: PageVisitPayload = {
        url: "https://example.com/page2",
        pathname: "/page2",
      };

      await transport.send(visit1);
      await transport.send(visit2);

      expect(mockFetch).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      // Таймер не должен сработать, так как батч уже был отправлен
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("flush", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });
    });

    it("должен отправлять все накопленные посещения", async () => {
      const options: InitOptions = {
        projectKey: "test-key",
        batchSize: 10,
      };
      transport = new PageVisitTransport(options);

      const visit1: PageVisitPayload = {
        url: "https://example.com/page1",
        pathname: "/page1",
      };
      const visit2: PageVisitPayload = {
        url: "https://example.com/page2",
        pathname: "/page2",
      };

      await transport.send(visit1);
      await transport.send(visit2);

      expect(mockFetch).not.toHaveBeenCalled();

      await transport.flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0][1].body).toBe(
        JSON.stringify([visit1, visit2])
      );
    });

    it("должен очищать таймер при flush", async () => {
      const options: InitOptions = {
        projectKey: "test-key",
        batchSize: 10,
        batchTimeout: 1000,
      };
      transport = new PageVisitTransport(options);

      const visit: PageVisitPayload = {
        url: "https://example.com",
        pathname: "/",
      };

      await transport.send(visit);
      await transport.flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      // Таймер не должен сработать после flush
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("не должен отправлять запрос если батч пуст", async () => {
      const options: InitOptions = {
        projectKey: "test-key",
      };
      transport = new PageVisitTransport(options);

      await transport.flush();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
