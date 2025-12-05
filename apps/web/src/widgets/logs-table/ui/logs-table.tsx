"use client";

import { useState, useEffect } from "react";
import {
  App,
  Table,
  Tag,
  Button,
  Typography,
  Input,
  DatePicker,
  Space,
  Popconfirm,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Event, EventLevel } from "@/entities/event";
import dayjs from "@/shared/config/dayjs";
import { useRouter } from "next/navigation";
import { EyeOutlined, SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { deleteEvent } from "@/shared/api/events";
import { EventUrlDisplay } from "@/entities/event";

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
    url?: string;
    userId?: string;
  };
  onFilterChange?: (filters: {
    level?: EventLevel;
    startDate?: string;
    endDate?: string;
    search?: string;
    url?: string;
    userId?: string;
  }) => void;
  onRefresh?: () => void;
  onOptimisticDelete?: (ids: string[]) => void;
  onOptimisticDeleteRollback?: () => void;
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
  onRefresh,
  onOptimisticDelete,
  onOptimisticDeleteRollback,
}: LogsTableProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    filters.startDate && filters.endDate
      ? [dayjs(filters.startDate), dayjs(filters.endDate)]
      : [dayjs().subtract(1, "month"), dayjs()]
  );
  const [searchFilter, setSearchFilter] = useState<string | undefined>(
    filters.search
  );
  const [urlFilter, setUrlFilter] = useState<string | undefined>(filters.url);
  const [userIdFilter, setUserIdFilter] = useState<string | undefined>(
    filters.userId
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDateRange(
      filters.startDate && filters.endDate
        ? [dayjs(filters.startDate), dayjs(filters.endDate)]
        : [dayjs().subtract(1, "month"), dayjs()]
    );
    setSearchFilter(filters.search);
    setUrlFilter(filters.url);
    setUserIdFilter(filters.userId);
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
      startDate: dates?.[0]?.startOf("day").toISOString(),
      endDate: dates?.[1]?.endOf("day").toISOString(),
    });
  };

  const handleSearchFilter = (value: string) => {
    setSearchFilter(value);
    onFilterChange?.({
      ...filters,
      search: value || undefined,
    });
  };

  const handleUrlFilter = (value: string) => {
    setUrlFilter(value);
    onFilterChange?.({
      ...filters,
      url: value || undefined,
    });
  };

  const handleUserIdFilter = (value: string) => {
    setUserIdFilter(value);
    onFilterChange?.({
      ...filters,
      userId: value || undefined,
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      return;
    }

    const ids = selectedRowKeys as string[];
    setDeletingIds(new Set(ids));
    setSelectedRowKeys([]);

    // Optimistic update: вызываем callback для немедленного обновления UI
    onOptimisticDelete?.(ids);

    try {
      await Promise.all(ids.map((id) => deleteEvent(id)));

      message.success(`Удалено событий: ${ids.length}`);
      onRefresh?.();
    } catch {
      // Откатываем изменения при ошибке
      setSelectedRowKeys(ids);
      onOptimisticDeleteRollback?.();
      message.error("Ошибка удаления событий");
    } finally {
      setDeletingIds(new Set());
    }
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
        <div className="flex gap-2 p-2">
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              handleDateRangeFilter(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
            className="w-full mb-2 flex-auto"
            placeholder={["Начальная дата", "Конечная дата"]}
          />
          <Space className="justify-end">
            <Button
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
        <div className="p-2 min-w-[400px]">
          <Input
            placeholder="Поиск по сообщению"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchFilter}
            onChange={(e) => handleSearchFilter(e.target.value)}
            allowClear
            onPressEnter={() => {
              onFilterChange?.({
                ...filters,
                search: searchFilter || undefined,
              });
            }}
          />
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
      render: (url: string | null) => {
        if (!url) {
          return <Text className="text-gray-400">—</Text>;
        }

        const shortUrl =
          url.startsWith("http://") || url.startsWith("https://")
            ? url.replace(/^https?:\/\//, "")
            : url;

        // Формируем читаемую строку для отображения
        let displayText = shortUrl;
        try {
          const urlObj = new URL(
            url.startsWith("http") ? url : `http://${url}`
          );
          displayText = `${urlObj.host}${urlObj.pathname}${urlObj.hash || ""}`;
        } catch {
          // Если не удалось распарсить, используем исходный URL без протокола
          displayText = shortUrl;
        }

        return (
          <Tooltip
            title={<EventUrlDisplay url={shortUrl} />}
            styles={{
              body: {
                maxWidth: "900px",
                minWidth: "300px",
                width: "500px",
                backgroundColor: "white",
              },
            }}
            placement="topLeft"
          >
            <Text
              className="text-sm font-mono text-blue-600 hover:text-blue-800 cursor-pointer w-60"
              ellipsis={{ tooltip: false }}
              style={{ display: "block", maxWidth: "100%" }}
              onClick={(e) => {
                e.stopPropagation();
                const fullUrl =
                  url.startsWith("http://") || url.startsWith("https://")
                    ? url
                    : `http://${url}`;
                window.open(fullUrl, "_blank", "noopener,noreferrer");
              }}
            >
              {displayText}
            </Text>
          </Tooltip>
        );
      },
      filterDropdown: () => (
        <div className="p-2 min-w-[400px]">
          <Input
            placeholder="Поиск по URL"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={urlFilter}
            onChange={(e) => handleUrlFilter(e.target.value)}
            allowClear
            onPressEnter={() => {
              onFilterChange?.({
                ...filters,
                url: urlFilter || undefined,
              });
            }}
          />
        </div>
      ),
      filterIcon: () => (
        <SearchOutlined className={urlFilter ? "text-blue-500" : ""} />
      ),
      filteredValue: urlFilter ? [urlFilter] : null,
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
      filterDropdown: () => (
        <div className="p-2 min-w-[400px]">
          <Input
            placeholder="Поиск по User ID"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={userIdFilter}
            onChange={(e) => handleUserIdFilter(e.target.value)}
            allowClear
            onPressEnter={() => {
              onFilterChange?.({
                ...filters,
                userId: userIdFilter || undefined,
              });
            }}
          />
        </div>
      ),
      filterIcon: () => (
        <SearchOutlined className={userIdFilter ? "text-blue-500" : ""} />
      ),
      filteredValue: userIdFilter ? [userIdFilter] : null,
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
          className="!p-0 h-auto font-medium"
        >
          Подробнее
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <Table
          columns={columns}
          dataSource={events}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          onChange={(paginationInfo, tableFilters) => {
            // Обрабатываем только изменения фильтров, не пагинацию
            // Пагинация обрабатывается через отдельный проп pagination.onChange
            if (
              tableFilters.level !== undefined &&
              tableFilters.level !== null
            ) {
              const levelValue = Array.isArray(tableFilters.level)
                ? (tableFilters.level[0] as EventLevel)
                : (tableFilters.level as EventLevel);
              // Проверяем, действительно ли изменился фильтр
              const currentLevel = filters.level;
              if (levelValue !== currentLevel) {
                handleLevelFilterChange(levelValue);
              }
            } else if (
              (tableFilters.level === null ||
                tableFilters.level === undefined) &&
              filters.level !== undefined
            ) {
              // Фильтр был сброшен, а раньше был установлен
              handleLevelFilterChange(null);
            }
            // Если tableFilters.level === undefined, это означает что фильтр не менялся
            // (например, при изменении пагинации), поэтому ничего не делаем
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
          scroll={{ x: "max-content", y: "calc(100vh - 357px)" }}
          className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-tbody>tr:hover]:bg-blue-50/50"
        />
      </div>
      {selectedRowKeys.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-4 flex items-center gap-4">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Выбрано событий: {selectedRowKeys.length}
            </span>
            <Popconfirm
              title={`Удалить ${selectedRowKeys.length} событий?`}
              description="Это действие нельзя отменить"
              onConfirm={handleBatchDelete}
              okText="Удалить"
              cancelText="Отмена"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deletingIds.size > 0}
              >
                Удалить выбранные
              </Button>
            </Popconfirm>
          </div>
        </div>
      )}
    </div>
  );
}
