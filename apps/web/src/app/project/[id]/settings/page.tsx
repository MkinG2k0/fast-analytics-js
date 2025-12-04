"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  message,
  Space,
  Typography,
  Tabs,
  Spin,
  Skeleton,
} from "antd";
import {
  CopyOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SettingOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { getProject, regenerateApiKey } from "@/shared/api/projects";
import type { Project } from "@repo/types";

const { Title, Paragraph, Text } = Typography;

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data);
    } catch (error) {
      message.error("Ошибка загрузки проекта");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleRegenerateKey = async () => {
    try {
      setRegeneratingKey(true);
      const { apiKey } = await regenerateApiKey(projectId);
      setProject(project ? { ...project, apiKey } : null);
      message.success("Ключ обновлен");
    } catch (error) {
      message.error("Ошибка обновления ключа");
    } finally {
      setRegeneratingKey(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Скопировано в буфер обмена");
  };

  const handleTabChange = (key: string) => {
    if (key === "logs") {
      router.push(`/project/${projectId}/logs`);
    }
  };

  const loadingIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  if (loading || !project) {
    return (
      <div className="p-6 max-w-[1600px] mx-auto">
        <Space direction="vertical" size="large" className="w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <SettingOutlined className="text-white text-lg" />
            </div>
            <Title level={2} className="!mb-0">
              Настройки проекта
            </Title>
          </div>

          <Tabs
            activeKey="settings"
            items={[
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
                key: "settings",
                label: (
                  <span className="flex items-center gap-2">
                    <SettingOutlined />
                    Настройки
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="large" className="w-full">
                    <Card>
                      <Skeleton active paragraph={{ rows: 2 }} />
                    </Card>
                    <Card>
                      <Skeleton active paragraph={{ rows: 3 }} />
                    </Card>
                    <Card>
                      <Skeleton active paragraph={{ rows: 4 }} />
                    </Card>
                  </Space>
                ),
              },
            ]}
            onChange={handleTabChange}
            className="[&_.ant-tabs-nav]:mb-6"
          />
        </Space>
      </div>
    );
  }

  const sdkCode = `import { init, logError, logWarning } from 'fast-analytics-js';

init({
  projectKey: '${project.apiKey}',
  endpoint: 'http://localhost:3000/api/events'
});

// Автоматический перехват ошибок
// window.onerror и window.onunhandledrejection уже обрабатываются

// Ручная отправка ошибки
try {
  // ваш код
} catch (error) {
  logError(error, {
    customTags: { section: 'checkout' }
  });
}

// Отправка предупреждения
logWarning('Пользователь выполнил необычное действие', {
  userId: 'user123',
  customTags: { action: 'unusual_behavior' }
});`;

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
      key: "settings",
      label: (
        <span className="flex items-center gap-2">
          <SettingOutlined />
          Настройки
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" className="w-full">
          <Card title="Информация о проекте" className="mb-4">
            <Paragraph>
              <Text strong>Название:</Text> {project.name}
            </Paragraph>
            {project.description && (
              <Paragraph>
                <Text strong>Описание:</Text> {project.description}
              </Paragraph>
            )}
          </Card>

          <Card title="API Key" className="mb-4">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space>
                <Input
                  value={project.apiKey}
                  readOnly
                  style={{ fontFamily: "monospace", width: 400 }}
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(project.apiKey)}
                >
                  Копировать
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRegenerateKey}
                  danger
                  loading={regeneratingKey}
                >
                  Обновить ключ
                </Button>
              </Space>
              <Text type="secondary">
                Используйте этот ключ для инициализации SDK в вашем приложении
              </Text>
            </Space>
          </Card>

          <Card title="Инструкция по интеграции SDK">
            <Paragraph>
              <Text strong>1. Установите SDK:</Text>
            </Paragraph>
            <pre className="bg-gray-100 p-4 rounded mb-4">
              <code>npm install fast-analytics-js</code>
            </pre>

            <Paragraph>
              <Text strong>2. Инициализируйте SDK в вашем приложении:</Text>
            </Paragraph>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              <code>{sdkCode}</code>
            </pre>
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(sdkCode)}
              className="mt-4"
            >
              Копировать код
            </Button>
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <SettingOutlined className="!text-white text-lg" />
          </div>
          <Title level={2} className="!mb-0">
            Настройки проекта
          </Title>
        </div>

        <Tabs
          activeKey="settings"
          items={tabItems}
          onChange={handleTabChange}
          className="[&_.ant-tabs-nav]:mb-6"
        />
      </Space>
    </div>
  );
}
