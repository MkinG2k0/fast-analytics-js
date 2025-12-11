import type { InitOptions } from "../model";
import { DEFAULT_ENDPOINT } from "../model";

export class HeartbeatTransport {
  private endpoint: string;
  private projectKey: string;
  private sessionId: string;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs: number = 30000; // 30 секунд

  constructor(options: InitOptions, sessionId: string) {
    // Извлекаем базовый URL из endpoint для events
    let baseEndpoint: string;
    if (options.endpoint) {
      baseEndpoint = options.endpoint.replace(/\/api\/events\/?$/, "");
    } else {
      baseEndpoint = DEFAULT_ENDPOINT.replace(/\/api\/events\/?$/, "");
    }
    this.endpoint = `${baseEndpoint}/api/online-users/heartbeat`;
    this.projectKey = options.projectKey;
    this.sessionId = sessionId;
    this.heartbeatIntervalMs = options.heartbeatInterval ?? 30000;
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      const response = await fetch(this.endpoint, {
        body: JSON.stringify({ sessionId: this.sessionId }),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.projectKey,
        },
        method: "POST",
      });

      if (!response.ok) {
        console.error(
          "[Fast Analytics SDK] Ошибка отправки heartbeat:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("[Fast Analytics SDK] Ошибка отправки heartbeat:", error);
    }
  }

  start(): void {
    // Отправляем сразу при старте
    this.sendHeartbeat();

    // Затем отправляем периодически
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  updateSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }
}
