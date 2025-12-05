"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, message, Space, Tabs, Typography } from "antd";
import {
  FileTextOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { LogsTable } from "@/widgets/logs-table";
import { getEvents } from "@/shared/api/events";
import type { Event } from "@repo/database";
import type { EventLevel } from "@repo/database";

const { Title } = Typography;

export default function ProjectLogsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    level?: EventLevel;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [previousEvents, setPreviousEvents] = useState<Event[]>([]);
  const paginationRef = useRef({ current: 1, pageSize: 50 });
  const filtersRef = useRef(filters);
  const isPaginationChangingRef = useRef(false);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadEvents = async (
    page = 1,
    pageSize = 50,
    customFilters?: typeof filters
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
      loadEvents(1, paginationRef.current.pageSize, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filters]);

  const handleFilter = (newFilters: typeof filters) => {
    // Проверяем, действительно ли изменились фильтры
    const filtersChanged =
      newFilters.level !== filters.level ||
      newFilters.startDate !== filters.startDate ||
      newFilters.endDate !== filters.endDate ||
      newFilters.search !== filters.search;

    if (filtersChanged) {
      setFilters(newFilters);
      setPagination((prev) => ({ ...prev, current: 1 }));
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
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
            type="default"
          >
            Обновить
          </Button>
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
