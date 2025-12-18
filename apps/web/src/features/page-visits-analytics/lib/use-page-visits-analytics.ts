import { useQuery } from "@tanstack/react-query";
import { getPageVisitsAnalytics } from "@/shared/api/page-visits";
import type { GetPageVisitsParams } from "@/shared/api/page-visits";
import dayjs from "@/shared/config/dayjs";

interface UsePageVisitsAnalyticsParams {
  projectId: string;
  groupBy: "url" | "date" | "hour";
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
}

export function usePageVisitsAnalytics({
  projectId,
  groupBy,
  dateRange,
}: UsePageVisitsAnalyticsParams) {
  return useQuery({
    queryKey: ["page-visits-analytics", projectId, groupBy, dateRange],
    queryFn: async () => {
      const params: GetPageVisitsParams = {
        projectId,
        groupBy,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      };
      return getPageVisitsAnalytics(params);
    },
    enabled: !!projectId && !!dateRange,
  });
}
