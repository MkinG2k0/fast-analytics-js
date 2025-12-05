"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button, message, Space, Tabs, Typography } from "antd";
import {
  BarChartOutlined,
  ClearOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useDebounce } from "react-use";

import { LogsTable } from "@/widgets/logs-table";
import { getEvents } from "@/shared/api/events";
import type { Event } from "@/entities/event";
import type { EventLevel } from "@/entities/event";
import dayjs from "@/shared/config/dayjs";

const { Title } = Typography;

interface LogsFilters {
  level?: EventLevel;
  startDate?: string;
  endDate?: string;
  search?: string;
  url?: string;
  userId?: string;
}

export function ProjectLogsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LogsFilters>(() => {
    const level = searchParams.get("level") as EventLevel | null;
    const url = searchParams.get("url");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const userId = searchParams.get("userId");
    return {
      level: level || undefined,
      url: url || undefined,
      startDate:
        startDate ||
        (startDate === null && endDate === null
          ? dayjs().subtract(1, "month").toISOString()
          : undefined),
      endDate:
        endDate ||
        (startDate === null && endDate === null
          ? dayjs().endOf("day").toISOString()
          : undefined),
      search: search || undefined,
      userId: userId || undefined,
    };
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [previousEvents, setPreviousEvents] = useState<Event[]>([]);
  const paginationRef = useRef({ current: 1, pageSize: 50 });
  const filtersRef = useRef(filters);
  const isPaginationChangingRef = useRef(false);
  const [debouncedFilters, setDebouncedFilters] =
    useState<LogsFilters>(filters);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useDebounce(
    () => {
      setDebouncedFilters(filters);
    },
    500,
    [filters]
  );

  useEffect(() => {
    const level = searchParams.get("level") as EventLevel | null;
    const url = searchParams.get("url");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const userId = searchParams.get("userId");
    const newFilters: LogsFilters = {
      level: level || undefined,
      url: url || undefined,
      startDate:
        startDate ||
        (startDate === null && endDate === null
          ? dayjs().subtract(1, "month").toISOString()
          : undefined),
      endDate:
        endDate ||
        (startDate === null && endDate === null
          ? dayjs().endOf("day").toISOString()
          : undefined),
      search: search || undefined,
      userId: userId || undefined,
    };
    setFilters(newFilters);
  }, [searchParams]);

  const loadEvents = async (
    page = 1,
    pageSize = 50,
    customFilters?: LogsFilters
  ) => {
    try {
      setLoading(true);
      const filtersToUse = customFilters ?? filtersRef.current;
      const response = await getEvents({
        projectId,
        ...filtersToUse,
        page,
        limit: pageSize,
      });
      setEvents(response.events);
      setPagination({
        current: response.page,
        pageSize: response.limit,
        total: response.total,
      });
    } catch {
      message.error("Ошибка загрузки событий");
    } finally {
      setLoading(false);
      isPaginationChangingRef.current = false;
    }
  };

  useEffect(() => {
    if (projectId && !isPaginationChangingRef.current) {
      loadEvents(1, paginationRef.current.pageSize, debouncedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, debouncedFilters]);

  const handleFilter = (newFilters: LogsFilters) => {
    const filtersChanged =
      newFilters.level !== filters.level ||
      newFilters.startDate !== filters.startDate ||
      newFilters.endDate !== filters.endDate ||
      newFilters.search !== filters.search ||
      newFilters.url !== filters.url ||
      newFilters.userId !== filters.userId;

    if (filtersChanged) {
      setFilters(newFilters);
      setPagination((prev) => ({ ...prev, current: 1 }));

      // Обновляем URL параметры
      const params = new URLSearchParams();
      if (newFilters.level) {
        params.set("level", newFilters.level);
      }
      if (newFilters.startDate) {
        params.set("startDate", newFilters.startDate);
      }
      if (newFilters.endDate) {
        params.set("endDate", newFilters.endDate);
      }
      if (newFilters.search) {
        params.set("search", newFilters.search);
      }
      if (newFilters.url) {
        params.set("url", newFilters.url);
      }
      if (newFilters.userId) {
        params.set("userId", newFilters.userId);
      }

      const queryString = params.toString();
      const newUrl = queryString
        ? `/project/${projectId}/logs?${queryString}`
        : `/project/${projectId}/logs`;
      router.replace(newUrl, { scroll: false });
    }
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    isPaginationChangingRef.current = true;
    setPagination((prev) => ({ ...prev, current: page, pageSize }));
    loadEvents(page, pageSize);
  };

  const handleRefresh = () => {
    loadEvents(paginationRef.current.current, paginationRef.current.pageSize);
  };

  const handleResetFilters = () => {
    const emptyFilters: LogsFilters = {};
    setFilters(emptyFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    router.replace(`/project/${projectId}/logs`, { scroll: false });
  };

  const handleOptimisticDelete = (ids: string[]) => {
    setPreviousEvents(events);
    const filteredEvents = events.filter((event) => !ids.includes(event.id));
    setEvents(filteredEvents);
    setPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - ids.length),
    }));
  };

  const handleOptimisticDeleteRollback = () => {
    if (previousEvents.length > 0) {
      setEvents(previousEvents);
      setPreviousEvents([]);
    }
  };

  const tabItems = [
    {
      key: "logs",
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          Логи
        </span>
      ),
      children: (
        <LogsTable
          events={events}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: handlePaginationChange,
          }}
          filters={filters}
          onFilterChange={handleFilter}
          onRefresh={handleRefresh}
          onOptimisticDelete={handleOptimisticDelete}
          onOptimisticDeleteRollback={handleOptimisticDeleteRollback}
        />
      ),
    },
    {
      key: "analytics",
      label: (
        <span className="flex items-center gap-2">
          <BarChartOutlined />
          Аналитика
        </span>
      ),
      children: null,
    },
    {
      key: "settings",
      label: (
        <span className="flex items-center gap-2">
          <SettingOutlined />
          Настройки
        </span>
      ),
      children: null,
    },
  ];

  const handleTabChange = (key: string) => {
    if (key === "settings") {
      router.push(`/project/${projectId}/settings`);
    } else if (key === "analytics") {
      router.push(`/project/${projectId}/analytics`);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileTextOutlined className="!text-white text-lg" />
            </div>
            <Title level={2} className="!mb-0">
              Логи проекта
            </Title>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
              type="default"
            >
              Обновить
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={handleResetFilters}
              type="default"
            >
              Сбросить фильтры
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey="logs"
          items={tabItems}
          onChange={handleTabChange}
          className="[&_.ant-tabs-nav]:mb-6"
        />
      </Space>
    </div>
  );
}
