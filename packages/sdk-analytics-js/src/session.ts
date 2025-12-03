class SessionManager {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === "undefined") {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const storageKey = "fast_analytics_session_id";
    let sessionId = localStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  resetSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("fast_analytics_session_id");
      this.sessionId = this.getOrCreateSessionId();
    }
  }
}

export default SessionManager;

