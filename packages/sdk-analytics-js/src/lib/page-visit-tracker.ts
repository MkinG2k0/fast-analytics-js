import type { PageVisitPayload } from "../model";

export class PageVisitTracker {
  private pageStartTime: number = Date.now();
  private currentUrl: string = "";
  private currentPathname: string = "";

  constructor() {
    if (typeof window !== "undefined") {
      this.currentUrl = window.location.href;
      this.currentPathname = window.location.pathname;
    }
  }

  trackPageView(
    url?: string,
    pathname?: string,
    referrer?: string,
    userAgent?: string,
    sessionId?: string,
    userId?: string
  ): PageVisitPayload {
    const now = Date.now();
    const duration = now - this.pageStartTime;

    const visit: PageVisitPayload = {
      url: url || this.currentUrl,
      pathname: pathname || this.currentPathname,
      referrer: referrer || (typeof document !== "undefined" ? document.referrer : undefined),
      userAgent: userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
      sessionId,
      userId,
      duration: duration > 0 ? duration : undefined,
    };

    // Обновляем время начала для следующей страницы
    this.pageStartTime = now;
    if (typeof window !== "undefined") {
      this.currentUrl = window.location.href;
      this.currentPathname = window.location.pathname;
    }

    return visit;
  }

  resetPageStartTime(): void {
    this.pageStartTime = Date.now();
  }

  getCurrentUrl(): string {
    return this.currentUrl;
  }

  getCurrentPathname(): string {
    return this.currentPathname;
  }
}

