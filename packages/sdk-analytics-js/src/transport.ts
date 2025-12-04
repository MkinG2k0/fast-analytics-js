import type { EventPayload, InitOptions } from "./types";

class Transport {
  private endpoint: string;
  private projectKey: string;
  private batch: EventPayload[] = [];
  private batchSize: number;
  private batchTimeout: number;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(options: InitOptions) {
    this.endpoint = options.endpoint || "https://fast-analytics.vercel.app/api/events";
    this.projectKey = options.projectKey;
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 5000;
  }

  private async sendBatch(events: EventPayload[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    // Отладочное логирование
    console.log("[Fast Analytics SDK] Отправка событий:", {
      count: events.length,
      events: events.map((event) => ({
        level: event.level,
        message: event.message,
        hasContext: !!event.context,
        context: event.context,
        contextKeys: event.context ? Object.keys(event.context) : [],
      })),
    });

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.projectKey,
        },
        body: JSON.stringify(events),
      });

      if (!response.ok) {
        console.error(
          "[Fast Analytics SDK] Ошибка ответа сервера:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("[Fast Analytics SDK] Ошибка отправки событий:", error);
    }
  }

  async send(event: EventPayload): Promise<void> {
    // Добавляем контекст браузера, если не указан
    if (!event.userAgent && typeof navigator !== "undefined") {
      event.userAgent = navigator.userAgent;
    }
    if (!event.url && typeof window !== "undefined") {
      event.url = window.location.href;
    }

    this.batch.push(event);

    // Отправляем сразу, если достигли размера батча
    if (this.batch.length >= this.batchSize) {
      const eventsToSend = [...this.batch];
      this.batch = [];
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
      await this.sendBatch(eventsToSend);
      return;
    }

    // Устанавливаем таймер для отправки батча
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        const eventsToSend = [...this.batch];
        this.batch = [];
        this.batchTimer = null;
        this.sendBatch(eventsToSend);
      }, this.batchTimeout);
    }
  }

  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    if (this.batch.length > 0) {
      const eventsToSend = [...this.batch];
      this.batch = [];
      await this.sendBatch(eventsToSend);
    }
  }
}

export default Transport;
