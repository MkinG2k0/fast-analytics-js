"use client";

import { useParams } from "next/navigation";
import { App, Space, Typography } from "antd";
import {
  ClearOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/shared";
import { LogsTable } from "@/widgets/logs-table";
import { useLogsTableStore } from "@/widgets/logs-table/model";

const { Title } = Typography;

export function ProjectLogsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { resetFilters } = useLogsTableStore();

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ["events", projectId],
      });
      message.success("Данные обновлены");
    } catch {
      message.error("Ошибка при обновлении данных");
    }
  };

  const handleResetFilters = () => {
    resetFilters();
    message.success("Фильтры сброшены");
  };

  return (
    <div className="p-6 mx-auto">
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

          <div className="flex items-center justify-end gap-2">
            <Button
              icon={<ReloadOutlined />}
              type="default"
              onClick={handleRefresh}
            >
              Обновить
            </Button>
            <Button
              icon={<ClearOutlined />}
              type="default"
              onClick={handleResetFilters}
            >
              Сбросить фильтры
            </Button>
          </div>
        </div>

        <LogsTable projectId={projectId} />
      </Space>
    </div>
  );
}
