"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, message } from "antd";
import { LogsTable } from "@/widgets/logs-table";
import { LogsFilter } from "@/features/filter-logs";
import { getEvents } from "@/shared/api/events";
import type { Event } from "@repo/types";

export default function ProjectLogsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    level?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });

  const loadEvents = async (page = 1, pageSize = 50) => {
    try {
      setLoading(true);
      const response = await getEvents({
        projectId,
        ...filters,
        page,
        limit: pageSize,
      });
      setEvents(response.events);
      setPagination({
        current: response.page,
        pageSize: response.limit,
        total: response.total,
      });
    } catch (error) {
      message.error("Ошибка загрузки событий");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadEvents(pagination.current, pagination.pageSize);
    }
  }, [projectId, filters]);

  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, current: 1 });
  };

  const handleReset = () => {
    setFilters({});
    setPagination({ ...pagination, current: 1 });
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, current: page, pageSize });
    loadEvents(page, pageSize);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Логи проекта</h1>
      <Card>
        <LogsFilter onFilter={handleFilter} onReset={handleReset} />
        <LogsTable
          events={events}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: handlePaginationChange,
          }}
        />
      </Card>
    </div>
  );
}

