import { describe, it, expect, beforeEach } from "vitest";
import { PageVisitTracker } from "./page-visit-tracker";

describe("PageVisitTracker", () => {
  let tracker: PageVisitTracker;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: {
        href: "https://example.com/test",
        pathname: "/test",
      },
      writable: true,
      configurable: true,
    });
    tracker = new PageVisitTracker();
  });

  describe("trackPageView", () => {
    it("должен отслеживать посещение страницы", () => {
      const visit = tracker.trackPageView();

      expect(visit.url).toBeDefined();
      expect(visit.pathname).toBeDefined();
      expect(visit.duration).toBeDefined();
    });

    it("должен использовать переданные параметры", () => {
      const visit = tracker.trackPageView(
        "https://example.com/new",
        "/new",
        "https://example.com/referrer",
        "test-agent",
        "session-123",
        "user-456"
      );

      expect(visit.url).toBe("https://example.com/new");
      expect(visit.pathname).toBe("/new");
      expect(visit.referrer).toBe("https://example.com/referrer");
      expect(visit.userAgent).toBe("test-agent");
      expect(visit.sessionId).toBe("session-123");
      expect(visit.userId).toBe("user-456");
    });

    it("должен обновлять время начала для следующей страницы", () => {
      tracker.trackPageView();

      // Небольшая задержка
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // Ждем
      }

      const visit2 = tracker.trackPageView();
      const duration2 = visit2.duration || 0;

      // duration2 должен быть примерно равен времени между вызовами (около 10мс)
      // так как pageStartTime обновился после первого вызова
      expect(duration2).toBeGreaterThanOrEqual(8);
      expect(duration2).toBeLessThan(20);
    });
  });

  describe("resetPageStartTime", () => {
    it("должен сбрасывать время начала страницы", () => {
      tracker.trackPageView();
      const timeBeforeReset = Date.now();
      tracker.resetPageStartTime();
      const timeAfterReset = Date.now();

      const visit = tracker.trackPageView();
      expect(visit.duration).toBeDefined();
      // Duration должен быть очень маленьким (время между reset и trackPageView)
      expect(visit.duration).toBeLessThan(
        timeAfterReset - timeBeforeReset + 10
      );
    });
  });

  describe("getCurrentUrl", () => {
    it("должен возвращать текущий URL", () => {
      tracker.trackPageView("https://example.com/current", "/current");
      const url = tracker.getCurrentUrl();

      expect(url).toBe("https://example.com/current");
    });

    it("должен возвращать URL из window.location если не был установлен", () => {
      const newTracker = new PageVisitTracker();
      const url = newTracker.getCurrentUrl();
      expect(url).toBeDefined();
    });
  });

  describe("getCurrentPathname", () => {
    it("должен возвращать текущий pathname", () => {
      tracker.trackPageView("https://example.com/current", "/current");
      const pathname = tracker.getCurrentPathname();

      expect(pathname).toBe("/current");
    });

    it("должен возвращать pathname из window.location если не был установлен", () => {
      const newTracker = new PageVisitTracker();
      const pathname = newTracker.getCurrentPathname();
      expect(pathname).toBeDefined();
    });
  });
});
