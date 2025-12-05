"use client";

import { useParams, useRouter } from "next/navigation";
import { Space, Tabs, Typography } from "antd";
import {
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import { PageVisitsAnalytics } from "@/features/page-visits-analytics";

const { Title } = Typography;

export function PageVisitsAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const tabItems = [
    {
      key: "logs",
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          Логи
        </span>
      ),
      children: null,
    },
    {
      key: "analytics",
      label: (
        <span className="flex items-center gap-2">
          <BarChartOutlined />
          Аналитика
        </span>
      ),
      children: <PageVisitsAnalytics projectId={projectId} />,
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
    if (key === "logs") {
      router.push(`/project/${projectId}/logs`);
    } else if (key === "settings") {
      router.push(`/project/${projectId}/settings`);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
            <BarChartOutlined className="!text-white text-lg" />
          </div>
          <Title level={2} className="!mb-0">
            Аналитика посещений
          </Title>
        </div>

        <Tabs
          activeKey="analytics"
          items={tabItems}
          onChange={handleTabChange}
          className="[&_.ant-tabs-nav]:mb-6"
        />
      </Space>
    </div>
  );
}

