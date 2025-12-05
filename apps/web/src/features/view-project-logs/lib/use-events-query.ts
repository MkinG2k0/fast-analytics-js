import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/shared/api/events";
import type { GetEventsParams } from "@/shared/api/events";
import type { LogsTableFilters } from "@/widgets/logs-table/model";

interface UseEventsQueryParams {
  projectId: string;
  filters: LogsTableFilters;
  page: number;
  pageSize: number;
}

export function useEventsQuery({
  projectId,
  filters,
  page,
  pageSize,
}: UseEventsQueryParams) {
  return useQuery({
    queryKey: ["events", projectId, filters, page, pageSize],
    queryFn: async () => {
      const params: GetEventsParams = {
        projectId,
        page,
        limit: pageSize,
        ...(filters.level && { level: filters.level }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.search && { search: filters.search }),
        ...(filters.url && { url: filters.url }),
        ...(filters.userId && { userId: filters.userId }),
      };

      return getEvents(params);
    },
    enabled: !!projectId,
  });
}

