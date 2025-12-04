"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Button, Typography, Input, DatePicker, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Event, EventLevel } from "@repo/types";
import dayjs from "@/shared/config/dayjs";
import { useRouter } from "next/navigation";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";

interface EventPerformance {
  requestDuration?: number;
  timestamp?: number;
  [key: string]: unknown;
}

function isEventPerformance(value: unknown): value is EventPerformance {
  return (
    typeof value === "object" &&
    value !== null &&
    ("requestDuration" in value || "timestamp" in value)
  );
}

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface LogsTableProps {
  events: Event[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  filters?: {
    level?: EventLevel;
    startDate?: string;
    endDate?: string;
    search?: string;
  };
  onFilterChange?: (filters: {
    level?: EventLevel;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => void;
}

const levelColors: Record<string, { color: string; bg: string }> = {
  error: { color: "#ef4444", bg: "#fee2e2" },
  warn: { color: "#f59e0b", bg: "#fef3c7" },
  info: { color: "#3b82f6", bg: "#dbeafe" },
  debug: { color: "#6b7280", bg: "#f3f4f6" },
};

export function LogsTable({
  events,
  loading,
  pagination,
  filters = {},
  onFilterChange,
}: LogsTableProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    filters.startDate && filters.endDate
      ? [dayjs(filters.startDate), dayjs(filters.endDate)]
      : null
  );
  const [searchFilter, setSearchFilter] = useState<string | undefined>(
    filters.search
  );

  useEffect(() => {
    setDateRange(
      filters.startDate && filters.endDate
        ? [dayjs(filters.startDate), dayjs(filters.endDate)]
        : null
    );
    setSearchFilter(filters.search);
  }, [filters]);

  const handleLevelFilterChange = (level: EventLevel | null | undefined) => {
    onFilterChange?.({
      ...filters,
      level: level || undefined,
    });
  };

  const handleDateRangeFilter = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
    onFilterChange?.({
      ...filters,
      startDate: dates?.[0]?.toISOString(),
      endDate: dates?.[1]?.toISOString(),
    });
  };

  const handleSearchFilter = (value: string) => {
    setSearchFilter(value);
    onFilterChange?.({
      ...filters,
      search: value || undefined,
    });
  };

  const columns: ColumnsType<Event> = [
    {
      title: "Время",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (timestamp: Date) => (
        <Text className="text-sm font-mono text-gray-600">
          {dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss")}
        </Text>
      ),
      sorter: (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      filterDropdown: () => (
        <div className="p-2">
          <RangePicker
            showTime
            value={dateRange}
            onChange={(dates) =>
              handleDateRangeFilter(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
            className="w-full mb-2"
            placeholder={["Начальная дата", "Конечная дата"]}
          />
          <Space className="w-full justify-end">
            <Button
              size="small"
              onClick={() => {
                setDateRange(null);
                handleDateRangeFilter(null);
              }}
            >
              Сбросить
            </Button>
          </Space>
        </div>
      ),
      filterIcon: () => (
        <span className={dateRange ? "text-blue-500" : ""}>📅</span>
      ),
      filteredValue: dateRange ? [true] : null,
    },
    {
      title: "Длительность",
      key: "requestDuration",
      width: 150,
      render: (_: unknown, record: Event) => {
        const performance = isEventPerformance(record.performance)
          ? record.performance
          : null;
        const requestDuration = performance?.requestDuration;

        if (requestDuration !== undefined && requestDuration !== null) {
          const durationMs = requestDuration;
          const formattedDuration =
            durationMs >= 1000
              ? `${(durationMs / 1000).toFixed(2)} с`
              : `${durationMs.toFixed(0)} мс`;

          return (
            <Text className="text-sm font-mono text-gray-600">
              {formattedDuration}
            </Text>
          );
        }
        return <Text className="text-gray-400">—</Text>;
      },
      sorter: (a, b) => {
        const perfA = isEventPerformance(a.performance) ? a.performance : null;
        const perfB = isEventPerformance(b.performance) ? b.performance : null;
        const durationA = perfA?.requestDuration ?? 0;
        const durationB = perfB?.requestDuration ?? 0;
        return durationA - durationB;
      },
    },
    {
      title: "Уровень",
      dataIndex: "level",
      key: "level",
      width: 120,
      render: (level: string) => {
        const levelConfig = levelColors[level] ?? levelColors.debug;
        if (!levelConfig) return null;
        return (
          <Tag
            style={{
              backgroundColor: levelConfig.bg,
              color: levelConfig.color,
              border: `1px solid ${levelConfig.color}20`,
              fontWeight: 600,
              fontSize: "12px",
              padding: "2px 10px",
              borderRadius: "6px",
            }}
          >
            {level.toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: "Error", value: "error" },
        { text: "Warning", value: "warn" },
        { text: "Info", value: "info" },
        { text: "Debug", value: "debug" },
      ],
      filteredValue: filters.level ? [filters.level] : null,
      onFilter: () => true,
    },
    {
      title: "Сообщение",
      dataIndex: "message",
      key: "message",
      width: 200,
      ellipsis: { showTitle: false },
      render: (message: string) => (
        <Text
          className="text-sm font-mono w-[200px] text-ellipsis text-blue-600"
          ellipsis={{ tooltip: message }}
        >
          {message}
        </Text>
      ),
      filterDropdown: () => (
        <div className="p-2">
          <Input
            placeholder="Поиск по сообщению"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchFilter}
            onChange={(e) => handleSearchFilter(e.target.value)}
            allowClear
            className="mb-2"
            onPressEnter={() => {
              onFilterChange?.({
                ...filters,
                search: searchFilter || undefined,
              });
            }}
          />
          <Space className="w-full justify-end">
            <Button
              size="small"
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => {
                onFilterChange?.({
                  ...filters,
                  search: searchFilter || undefined,
                });
              }}
            >
              Применить
            </Button>
            <Button
              size="small"
              onClick={() => {
                setSearchFilter(undefined);
                handleSearchFilter("");
              }}
            >
              Сбросить
            </Button>
          </Space>
        </div>
      ),
      filterIcon: () => (
        <SearchOutlined className={searchFilter ? "text-blue-500" : ""} />
      ),
      filteredValue: searchFilter ? [searchFilter] : null,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 200,
      ellipsis: { showTitle: false },
      render: (url: string | null) =>
        url ? (
          <Text
            className="text-sm font-mono w-[200px] text-ellipsis text-blue-600"
            ellipsis={{ tooltip: url }}
          >
            {url}
          </Text>
        ) : (
          <Text className="text-gray-400">—</Text>
        ),
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      width: 150,
      ellipsis: { showTitle: false },
      render: (userId: string | null) =>
        userId ? (
          <Text
            className="text-sm font-mono text-gray-600"
            ellipsis={{ tooltip: userId }}
          >
            {userId}
          </Text>
        ) : (
          <Text className="text-gray-400">—</Text>
        ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: unknown, record: Event) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/event/${record.id}`)}
          className="p-0 h-auto font-medium"
        >
          Подробнее
        </Button>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
      <Table
        columns={columns}
        dataSource={events}
        loading={loading}
        rowKey="id"
        onChange={(paginationInfo, tableFilters) => {
          if (tableFilters.level) {
            const levelValue = Array.isArray(tableFilters.level)
              ? (tableFilters.level[0] as EventLevel)
              : (tableFilters.level as EventLevel);
            handleLevelFilterChange(levelValue);
          } else {
            handleLevelFilterChange(null);
          }
        }}
        pagination={
          pagination
            ? {
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} из ${total} событий`,
                onChange: pagination.onChange,
                onShowSizeChange: pagination.onChange,
                pageSizeOptions: ["10", "25", "50", "100"],
                className: "px-4 py-2",
              }
            : false
        }
        scroll={{ x: "max-content" }}
        className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-tbody>tr:hover]:bg-blue-50/50"
      />
    </div>
  );
}
