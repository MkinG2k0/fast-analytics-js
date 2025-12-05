import type { PageVisitPayload, InitOptions } from "../model";
import { DEFAULT_PAGE_VISITS_ENDPOINT } from "../model";

export class PageVisitTransport {
  private endpoint: string;
  private projectKey: string;
  private batch: PageVisitPayload[] = [];
  private batchSize: number;
  private batchTimeout: number;
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(options: InitOptions) {
    // Извлекаем базовый URL из endpoint для events
    let baseEndpoint: string;
    if (options.endpoint) {
      // Если передан endpoint, извлекаем базовый URL (убираем /api/events)
      baseEndpoint = options.endpoint.replace(/\/api\/events\/?$/, "");
    } else {
      // Используем дефолтный endpoint и извлекаем базовый URL
      baseEndpoint = DEFAULT_PAGE_VISITS_ENDPOINT.replace(
        /\/api\/page-visits\/?$/,
        ""
      );
    }
    this.endpoint = `${baseEndpoint}/api/page-visits`;
    this.projectKey = options.projectKey;
    this.batchSize = options.batchSize ?? 10;
    this.batchTimeout = options.batchTimeout ?? 5000;
  }

  private async sendBatch(visits: PageVisitPayload[]): Promise<void> {
    if (visits.length === 0) {
      return;
    }

    try {
      const response = await fetch(this.endpoint, {
        body: JSON.stringify(visits),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.projectKey,
        },
        method: "POST",
      });

      if (!response.ok) {
        console.error(
          "[Fast Analytics SDK] Ошибка отправки посещений:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("[Fast Analytics SDK] Ошибка отправки посещений:", error);
    }
  }

  async send(visit: PageVisitPayload): Promise<void> {
    this.batch.push(visit);

    if (this.batch.length >= this.batchSize) {
      const visitsToSend = [...this.batch];
      this.batch = [];
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
      await this.sendBatch(visitsToSend);
      return;
    }

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        const visitsToSend = [...this.batch];
        this.batch = [];
        this.batchTimer = null;
        this.sendBatch(visitsToSend);
      }, this.batchTimeout);
    }
  }

  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    if (this.batch.length > 0) {
      const visitsToSend = [...this.batch];
      this.batch = [];
      await this.sendBatch(visitsToSend);
    }
  }
}
