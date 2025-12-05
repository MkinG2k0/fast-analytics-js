import { SESSION_STORAGE_KEY } from "../model";

export class SessionManager {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === "undefined") {
      return this.generateSessionId();
    }

    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);

    if (storedSessionId) {
      return storedSessionId;
    }

    const newSessionId = this.generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);

    return newSessionId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  resetSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      this.sessionId = this.getOrCreateSessionId();
    } else {
      this.sessionId = this.generateSessionId();
    }
  }
}

