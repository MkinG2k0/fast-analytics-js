"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { PageVisitsAnalytics } from "@/shared/api/page-visits";
import { TableUrlCell } from "@/entities/event";
import { formatDuration } from "./format-duration";
import dayjs from "@/shared/config/dayjs";

const { Text } = Typography;

type GroupBy = "url" | "date" | "hour";

interface UseAnalyticsTableColumnsParams {
  groupBy: GroupBy;
  projectId: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
}

export function useAnalyticsTableColumns({
  groupBy,
  projectId,
  dateRange,
}: UseAnalyticsTableColumnsParams): ColumnsType<
  PageVisitsAnalytics["analytics"][0]
> {
  const router = useRouter();

  return useMemo(
    () => [
      {
        title: groupBy === "url" ? "URL" : groupBy === "date" ? "Дата" : "Час",
        dataIndex:
          groupBy === "url" ? "url" : groupBy === "date" ? "date" : "hour",
        key: "key",
        width: "100%",
        ellipsis: groupBy === "url" ? { showTitle: false } : false,
        render: (text: string) => {
          if (!text) {
            return <Text className="text-gray-400">—</Text>;
          }

          if (groupBy === "url") {
            return <TableUrlCell url={text} />;
          }

          return text;
        },
      },
      {
        title: "Посещений",
        dataIndex: "visits",
        width: 150,
        key: "visits",
        sorter: (a, b) => a.visits - b.visits,
        defaultSortOrder: "descend",
      },
      {
        title: "Уникальных сессий",
        dataIndex: "uniqueSessions",
        key: "uniqueSessions",
        width: 210,
        sorter: (a, b) => a.uniqueSessions - b.uniqueSessions,
      },
      {
        title: "Ошибок",
        dataIndex: "errors",
        key: "errors",
        width: 120,
        render: (value: number, record) => {
          const isClickable = value > 0 && groupBy === "url" && record.url;

          const handleClick = () => {
            if (isClickable) {
              const urlParams = new URLSearchParams({
                level: "error",
                url: record.url!,
              });
              if (dateRange?.[0]) {
                urlParams.set("startDate", dateRange[0].toISOString());
              }
              if (dateRange?.[1]) {
                urlParams.set("endDate", dateRange[1].toISOString());
              }
              router.push(`/project/${projectId}/logs?${urlParams.toString()}`);
            }
          };

          return (
            <span
              className={
                value > 0
                  ? isClickable
                    ? "text-red-500 font-semibold cursor-pointer hover:text-red-700 hover:underline"
                    : "text-red-500 font-semibold"
                  : ""
              }
              onClick={isClickable ? handleClick : undefined}
            >
              {value || 0}
            </span>
          );
        },
        sorter: (a, b) => (a.errors || 0) - (b.errors || 0),
        defaultSortOrder: "descend",
      },
      ...(groupBy === "url"
        ? [
            {
              title: "Среднее время",
              dataIndex: "avgDuration",
              key: "avgDuration",
              width: 150,
              render: (value: number) => formatDuration(value),
              sorter: (a, b) => (a.avgDuration || 0) - (b.avgDuration || 0),
            },
          ]
        : []),
    ],
    [groupBy, projectId, dateRange, router]
  );
}
