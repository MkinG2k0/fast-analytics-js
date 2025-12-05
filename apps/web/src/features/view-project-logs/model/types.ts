import type { EventLevel } from "@/entities/event";

export interface ProjectLogsFilters {
  level?: EventLevel;
  startDate?: string;
  endDate?: string;
  search?: string;
  url?: string;
  userId?: string;
}

export interface ProjectLogsPagination {
  current: number;
  pageSize: number;
  total: number;
}

