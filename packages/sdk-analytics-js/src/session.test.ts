import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionManager } from "./session";

describe("SessionManager", () => {
  beforeEach(() => {
    // Очищаем localStorage перед каждым тестом
    localStorage.clear();
  });

  describe("конструктор", () => {
    it("должен создавать новую сессию при инициализации", () => {
      const manager = new SessionManager();
      const sessionId = manager.getSessionId();

      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it("должен сохранять sessionId в localStorage в браузере", () => {
      const manager = new SessionManager();
      const sessionId = manager.getSessionId();

      expect(localStorage.getItem("fast_analytics_session_id")).toBe(sessionId);
    });

    it("должен использовать существующий sessionId из localStorage", () => {
      const existingSessionId = "session_1234567890_abc123";
      localStorage.setItem("fast_analytics_session_id", existingSessionId);

      const manager = new SessionManager();
      const sessionId = manager.getSessionId();

      expect(sessionId).toBe(existingSessionId);
    });
  });

  describe("getSessionId", () => {
    it("должен возвращать тот же sessionId при повторных вызовах", () => {
      const manager = new SessionManager();
      const sessionId1 = manager.getSessionId();
      const sessionId2 = manager.getSessionId();

      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe("resetSession", () => {
    it("должен создавать новый sessionId", () => {
      const manager = new SessionManager();
      const oldSessionId = manager.getSessionId();

      manager.resetSession();
      const newSessionId = manager.getSessionId();

      expect(newSessionId).not.toBe(oldSessionId);
      expect(newSessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it("должен удалять старый sessionId из localStorage", () => {
      const manager = new SessionManager();
      const oldSessionId = manager.getSessionId();

      expect(localStorage.getItem("fast_analytics_session_id")).toBe(
        oldSessionId
      );

      manager.resetSession();
      const newSessionId = manager.getSessionId();

      expect(localStorage.getItem("fast_analytics_session_id")).toBe(
        newSessionId
      );
      expect(newSessionId).not.toBe(oldSessionId);
    });

    it("должен создавать новый sessionId даже если localStorage был пуст", () => {
      localStorage.clear();
      const manager = new SessionManager();

      manager.resetSession();
      const newSessionId = manager.getSessionId();

      expect(newSessionId).toBeDefined();
      expect(newSessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });
});
