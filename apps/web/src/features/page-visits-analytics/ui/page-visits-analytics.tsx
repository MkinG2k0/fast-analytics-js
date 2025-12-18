"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { Card, Table } from "antd";
import { BarChartOutlined } from "@ant-design/icons";
import { message } from "antd";
import dayjs from "@/shared/config/dayjs";
import {
  usePageVisitsAnalytics,
  useOnlineUsersCount,
  useAnalyticsTableColumns,
  useVisitsTableColumns,
} from "../lib";
import { AnalyticsStatistics } from "./analytics-statistics";
import { AnalyticsFilters } from "./analytics-filters";

interface PageVisitsAnalyticsProps {
  projectId: string;
}

type GroupBy = "url" | "date" | "hour";

export function PageVisitsAnalytics({ projectId }: PageVisitsAnalyticsProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("url");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    [dayjs().subtract(1, "month"), dayjs()]
  );

  const {
    data: analytics,
    isLoading: isLoadingAnalytics,
    refetch: refetchAnalytics,
  } = usePageVisitsAnalytics({
    projectId,
    groupBy,
    dateRange,
  });

  const onlineUsersCount = useOnlineUsersCount(projectId);

  const analyticsColumns = useAnalyticsTableColumns({
    groupBy,
    projectId,
    dateRange,
  });

  const visitsColumns = useVisitsTableColumns();

  const handleGroupByChange = useCallback((value: GroupBy) => {
    setGroupBy(value);
  }, []);

  const handleDateRangeChange = useCallback((dates: unknown) => {
    setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await refetchAnalytics();
    } catch {
      message.error("Ошибка загрузки аналитики посещений");
    }
  }, [refetchAnalytics]);

  const analyticsRowKey = useCallback(
    (record: {
      url?: string;
      date?: string;
      hour?: string;
      visits: number;
      uniqueSessions: number;
    }) =>
      record.url ||
      record.date ||
      record.hour ||
      `${record.visits}-${record.uniqueSessions}`,
    []
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-blue-500 text-lg" />
          </div>
          <AnalyticsFilters
            groupBy={groupBy}
            dateRange={dateRange}
            loading={isLoadingAnalytics}
            onGroupByChange={handleGroupByChange}
            onDateRangeChange={handleDateRangeChange}
            onRefresh={handleRefresh}
          />
        </div>

        <AnalyticsStatistics
          onlineUsersCount={onlineUsersCount}
          analytics={analytics}
          loading={isLoadingAnalytics}
        />
      </Card>

      <Card title="Статистика по страницам" loading={isLoadingAnalytics}>
        <Table
          columns={analyticsColumns}
          dataSource={analytics?.analytics || []}
          rowKey={analyticsRowKey}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Card title="Последние посещения" loading={isLoadingAnalytics}>
        <Table
          columns={visitsColumns}
          dataSource={analytics?.visits || []}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
