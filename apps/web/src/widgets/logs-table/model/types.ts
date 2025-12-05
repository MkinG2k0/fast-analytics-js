import type { Event, EventLevel } from "@/entities/event";

export interface LogsTablePagination {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

export interface LogsTableFilters {
  level?: EventLevel;
  startDate?: string;
  endDate?: string;
  search?: string;
  url?: string;
  userId?: string;
}

export interface LogsTableProps {
  projectId: string;
}
