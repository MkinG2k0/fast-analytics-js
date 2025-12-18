"use client";

import { Button, Space, Typography } from "antd";
import { FileTextOutlined, SettingOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { ColumnsType } from "antd/es/table";
import type { Project } from "@/entities/project";

const { Text } = Typography;

export function useProjectsTableColumns(): ColumnsType<Project> {
  const router = useRouter();

  return useMemo(
    () => [
      {
        title: "Название",
        dataIndex: "name",
        key: "name",
        width: 200,
        render: (text: string) => (
          <Text strong className="text-gray-900 text-[15px]">
            {text}
          </Text>
        ),
      },
      {
        title: "Описание",
        dataIndex: "description",
        key: "description",
        render: (text: string | null) =>
          text ? (
            <Text className="text-gray-600 text-sm">{text}</Text>
          ) : (
            <Text className="text-gray-400 italic text-sm">Нет описания</Text>
          ),
      },
      {
        title: "Действия",
        key: "actions",
        width: 200,
        render: (_: unknown, record: Project) => (
          <Space size="small">
            <Button
              type="default"
              icon={<FileTextOutlined />}
              onClick={() => router.push(`/project/${record.id}/logs`)}
              className="flex items-center gap-1.5 hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              Логи
            </Button>
            <Button
              type="default"
              icon={<SettingOutlined />}
              onClick={() => router.push(`/project/${record.id}/settings`)}
              className="flex items-center gap-1.5 hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              Настройки
            </Button>
          </Space>
        ),
      },
    ],
    [router]
  );
}
