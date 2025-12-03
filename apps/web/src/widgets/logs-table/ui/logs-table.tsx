"use client";

import { Table, Tag, Button, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Event } from "@repo/types";
import dayjs from "@/shared/config/dayjs";
import { useRouter } from "next/navigation";

interface LogsTableProps {
  events: Event[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

const levelColors: Record<string, string> = {
  error: "red",
  warn: "orange",
  info: "blue",
  debug: "default",
};

export function LogsTable({ events, loading, pagination }: LogsTableProps) {
  const router = useRouter();

  const columns: ColumnsType<Event> = [
    {
      title: "Время",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (timestamp: Date) => dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss"),
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "Уровень",
      dataIndex: "level",
      key: "level",
      width: 100,
      render: (level: string) => (
        <Tag color={levelColors[level]}>{level.toUpperCase()}</Tag>
      ),
      filters: [
        { text: "Error", value: "error" },
        { text: "Warning", value: "warn" },
        { text: "Info", value: "info" },
        { text: "Debug", value: "debug" },
      ],
    },
    {
      title: "Сообщение",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 200,
      ellipsis: true,
      render: (url: string | null) => url || <span className="text-gray-400">—</span>,
    },
    {
      title: "Session ID",
      dataIndex: "sessionId",
      key: "sessionId",
      width: 150,
      ellipsis: true,
      render: (sessionId: string | null) => sessionId || <span className="text-gray-400">—</span>,
    },
    {
      title: "Действия",
      key: "actions",
      width: 100,
      render: (_: unknown, record: Event) => (
        <Button
          type="link"
          onClick={() => router.push(`/event/${record.id}`)}
        >
          Подробнее
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={events}
      loading={loading}
      rowKey="id"
      pagination={
        pagination
          ? {
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Всего ${total} событий`,
              onChange: pagination.onChange,
              onShowSizeChange: pagination.onChange,
            }
          : false
      }
    />
  );
}

