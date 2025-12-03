"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, message, Space, Tabs, Typography } from "antd";
import { FileTextOutlined, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { LogsTable } from "@/widgets/logs-table";
import { getEvents } from "@/shared/api/events";
import type { Event } from "@repo/types";

const { Title } = Typography;

export default function ProjectLogsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    level?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

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

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, current: page, pageSize });
    loadEvents(page, pageSize);
  };

  const handleRefresh = () => {
    loadEvents(pagination.current, pagination.pageSize);
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
