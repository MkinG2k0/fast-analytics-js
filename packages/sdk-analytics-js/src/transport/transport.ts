import type { EventPayload, InitOptions } from "../model";
import {
  getDefaultBatchSize,
  getDefaultBatchTimeout,
  getDefaultEndpoint,
} from "../config";

export class Transport {
  private endpoint: string;
  private projectKey: string;
  private batch: EventPayload[] = [];
  private batchSize: number;
  private batchTimeout: number;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(options: InitOptions) {
    this.endpoint = options.endpoint ?? getDefaultEndpoint();
    this.projectKey = options.projectKey;
    this.batchSize = options.batchSize ?? getDefaultBatchSize();
    this.batchTimeout = options.batchTimeout ?? getDefaultBatchTimeout();
  }

  private async sendBatch(events: EventPayload[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      const response = await fetch(this.endpoint, {
        body: JSON.stringify(events),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.projectKey,
        },
        method: "POST",
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
    if (!event.userAgent && typeof navigator !== "undefined") {
      event.userAgent = navigator.userAgent;
    }
    if (!event.url && typeof window !== "undefined") {
      event.url = window.location.href;
    }

    this.batch.push(event);

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
