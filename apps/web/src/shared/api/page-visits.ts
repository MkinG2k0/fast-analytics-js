import { apiClient } from "@/shared/lib/axios";

const API_BASE = "/api/page-visits";

export interface GetPageVisitsParams {
  projectId: string;
  startDate?: string;
  endDate?: string;
  groupBy?: "url" | "date" | "hour";
}

export interface PageVisit {
  id: string;
  projectId: string;
  url: string;
  pathname: string | null;
  referrer: string | null;
  userAgent: string | null;
  sessionId: string | null;
  userId: string | null;
  duration: number | null;
  timestamp: string;
  createdAt: string;
}

export interface PageVisitsAnalytics {
  analytics: Array<{
    url?: string;
    pathname?: string | null;
    date?: string;
    hour?: string;
    visits: number;
    uniqueSessions: number;
    avgDuration?: number;
    errors: number;
  }>;
  summary: {
    totalVisits: number;
    uniqueSessions: number;
    avgDuration: number;
    totalErrors: number;
  };
  visits: PageVisit[];
}

export async function getPageVisitsAnalytics(
  params: GetPageVisitsParams
): Promise<PageVisitsAnalytics> {
  const { data } = await apiClient.get<PageVisitsAnalytics>(API_BASE, {
    params,
  });
  return data;
}

