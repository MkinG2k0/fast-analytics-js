import type { PageVisitPayload } from "../model";
import { groupPageVisitPathname } from "./group-page-visit";

export class PageVisitTracker {
  private pageStartTime: number = Date.now();
  private currentUrl: string = "";
  private currentPathname: string = "";
  private groupPageVisitsGroup?: string[];

  constructor(groupPageVisitsGroup?: string[]) {
    this.groupPageVisitsGroup = groupPageVisitsGroup;
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

    // Обновляем currentUrl и currentPathname если переданы параметры
    if (url) {
      this.currentUrl = url;
    }
    if (pathname) {
      this.currentPathname = pathname;
    }

    const rawPathname = pathname || this.currentPathname;
    const groupedPathname = groupPageVisitPathname(
      rawPathname,
      this.groupPageVisitsGroup
    );

    const visit: PageVisitPayload = {
      url: url || this.currentUrl,
      pathname: groupedPathname,
      referrer:
        referrer ||
        (typeof document !== "undefined" ? document.referrer : undefined),
      userAgent:
        userAgent ||
        (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
      sessionId,
      userId,
      duration: duration >= 0 ? duration : undefined,
    };

    // Обновляем время начала для следующей страницы
    this.pageStartTime = now;
    if (typeof window !== "undefined" && !url) {
      this.currentUrl = window.location.href;
    }
    if (typeof window !== "undefined" && !pathname) {
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
