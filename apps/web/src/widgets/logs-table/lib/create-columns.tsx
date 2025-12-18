import { memo } from "react";
import * as React from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Button,
  DatePicker,
  Input,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import type { Event, EventLevel } from "@/entities/event";
import { TableUrlCell } from "@/entities/event";
import dayjs from "@/shared/config/dayjs";
import { levelColors } from "../config";
import type { LogsTableActions, LogsTableFilters } from "../model";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface CreateColumnsParams {
  filters: LogsTableFilters;
  setFilter: LogsTableActions["setFilter"];
  router: AppRouterInstance;
  projectId: string;
}

export function createColumns({
  filters,
  router,
  setFilter,
  projectId,
}: CreateColumnsParams): ColumnsType<Event> {
  const { endDate, level, search, startDate, url, userId } = filters;

  const dateRange = [
    startDate ? dayjs(startDate) : dayjs().subtract(1, "month"),
    endDate ? dayjs(endDate) : endDate ? dayjs().endOf("day") : dayjs(endDate),
  ] as [dayjs.Dayjs, dayjs.Dayjs];

  return [
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
      filterDropdown: () => (
        <DateRangeFilterDropdown
          value={dateRange}
          onChange={(dates) => {
            setFilter("startDate", dates?.[0]?.toISOString());
            setFilter("endDate", dates?.[1]?.toISOString());
          }}
        />
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
      filterDropdown: () => (
        <LevelFilterDropdown value={level} setFilter={setFilter} />
      ),
      filteredValue: filters.level ? [filters.level] : null,
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
        <SearchFilterDropdown
          value={search}
          setFilter={setFilter}
          filterKey="search"
          placeholder="Поиск по сообщению"
        />
      ),
      filterIcon: () => (
        <SearchOutlined className={search ? "text-blue-500" : ""} />
      ),
      filteredValue: search ? [search] : null,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 200,
      ellipsis: { showTitle: false },
      render: (url: string | null) => (
        <TableUrlCell url={url} className="w-60" showHost />
      ),
      filterDropdown: () => (
        <SearchFilterDropdown
          value={url}
          setFilter={setFilter}
          filterKey="url"
          placeholder="Поиск по URL"
        />
      ),
      filterIcon: () => (
        <SearchOutlined className={url ? "text-blue-500" : ""} />
      ),
      filteredValue: url ? [url] : null,
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
        <SearchFilterDropdown
          value={userId}
          setFilter={setFilter}
          filterKey="userId"
          placeholder="Поиск по User ID"
        />
      ),
      filterIcon: () => (
        <SearchOutlined className={userId ? "text-blue-500" : ""} />
      ),
      filteredValue: userId ? [userId] : null,
    },
    {
      title: "Повторений",
      dataIndex: "occurrenceCount",
      key: "occurrenceCount",
      width: 120,
      align: "center",
      render: (count: number | null | undefined) => {
        const occurrenceCount = count ?? 1;
        return (
          <Tag
            color={occurrenceCount > 1 ? "orange" : "default"}
            style={{
              fontWeight: occurrenceCount > 1 ? 600 : 400,
            }}
          >
            {occurrenceCount}
          </Tag>
        );
      },
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
          onClick={() => {
            // navigate to event details page
            router.push(`/project/${projectId}/event?eventId=${record.id}`);
          }}
          className="!p-0 h-auto font-medium"
        >
          Подробнее
        </Button>
      ),
    },
  ];
}

interface SearchFilterDropdownProps {
  value: string | undefined;
  setFilter: LogsTableActions["setFilter"];
  filterKey: "search" | "url" | "userId";
  placeholder: string;
}

const SearchFilterDropdown = memo<SearchFilterDropdownProps>(
  ({ value, setFilter, filterKey, placeholder }) => {
    const [localValue, setLocalValue] = React.useState(value || "");

    React.useEffect(() => {
      setLocalValue(value || "");
    }, [value]);

    const handleApply = () => {
      setFilter(filterKey, localValue || undefined);
    };

    const handleClear = () => {
      setLocalValue("");
      setFilter(filterKey, undefined);
    };

    return (
      <div className="p-2 min-w-[400px]">
        <Input
          placeholder={placeholder}
          prefix={<SearchOutlined className="text-gray-400" />}
          value={localValue}
          allowClear
          onChange={(e) => setLocalValue(e.target.value)}
          onPressEnter={handleApply}
          onClear={handleClear}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button size="small" onClick={handleClear}>
            Сбросить
          </Button>
          <Button type="primary" size="small" onClick={handleApply}>
            Применить
          </Button>
        </div>
      </div>
    );
  }
);

SearchFilterDropdown.displayName = "SearchFilterDropdown";

interface LevelFilterDropdownProps {
  value: string | undefined;
  setFilter: LogsTableActions["setFilter"];
}

const LevelFilterDropdown = memo<LevelFilterDropdownProps>(
  ({ value, setFilter }) => {
    const levels = [
      { text: "Error", value: "error" },
      { text: "Warning", value: "warn" },
      { text: "Info", value: "info" },
      { text: "Debug", value: "debug" },
    ];

    const handleSelect = (levelValue: string) => {
      setFilter(
        "level",
        levelValue === value ? undefined : (levelValue as EventLevel)
      );
    };

    const handleClear = () => {
      setFilter("level", undefined);
    };

    return (
      <div className="p-2 min-w-[200px]">
        <Space direction="vertical" className="w-full">
          {levels.map((level) => (
            <Button
              key={level.value}
              type={value === level.value ? "primary" : "default"}
              block
              onClick={() => handleSelect(level.value)}
              className="text-left"
            >
              {level.text}
            </Button>
          ))}
        </Space>
        <div className="mt-2 flex justify-end">
          <Button size="small" onClick={handleClear}>
            Сбросить
          </Button>
        </div>
      </div>
    );
  }
);

LevelFilterDropdown.displayName = "LevelFilterDropdown";

interface DateRangeFilterDropdownProps {
  value: [dayjs.Dayjs, dayjs.Dayjs];
  onChange: (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
}

const DateRangeFilterDropdown = memo<DateRangeFilterDropdownProps>(
  ({ value, onChange }) => {
    return (
      <div className="flex gap-2 p-2">
        <RangePicker
          value={value}
          onChange={(dates) =>
            onChange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
          }
          className="w-full mb-2 flex-auto"
          placeholder={["Начальная дата", "Конечная дата"]}
        />
        <Space className="justify-end">
          <Button onClick={() => onChange(null)}>Сбросить</Button>
        </Space>
      </div>
    );
  }
);

DateRangeFilterDropdown.displayName = "DateRangeFilterDropdown";
