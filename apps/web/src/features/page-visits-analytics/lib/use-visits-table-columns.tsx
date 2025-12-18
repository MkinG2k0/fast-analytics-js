"use client";

import { useMemo } from "react";
import { Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { PageVisit } from "@/shared/api/page-visits";
import { TableUrlCell } from "@/entities/event";
import dayjs from "@/shared/config/dayjs";
import { formatDuration } from "./format-duration";

const { Text } = Typography;

export function useVisitsTableColumns(): ColumnsType<PageVisit> {
  return useMemo(
    () => [
      {
        title: "URL",
        dataIndex: "url",
        key: "url",
        width: "100%",
        ellipsis: { showTitle: false },
        render: (text: string) => <TableUrlCell url={text} />,
      },
      {
        title: "Время",
        dataIndex: "timestamp",
        key: "timestamp",
        width: 180,
        render: (text: string) => dayjs(text).format("DD.MM.YYYY HH:mm:ss"),
      },
      {
        title: "Длительность",
        dataIndex: "duration",
        key: "duration",
        width: 150,
        render: (value: number) => formatDuration(value),
      },
    ],
    []
  );
}
