"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Button, Input, message, Space, Typography } from "antd";
import { CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { getProject, regenerateApiKey } from "@/shared/api/projects";
import type { Project } from "@repo/types";

const { Title, Paragraph, Text } = Typography;

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

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
      const { apiKey } = await regenerateApiKey(projectId);
      setProject(project ? { ...project, apiKey } : null);
      message.success("Ключ обновлен");
    } catch (error) {
      message.error("Ошибка обновления ключа");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Скопировано в буфер обмена");
  };

  if (!project) {
    return <div>Загрузка...</div>;
  }

  const sdkCode = `import { init, logError, logWarning } from '@fast-analytics/sdk';

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

  return (
    <div className="p-6">
      <Title level={2}>Настройки проекта</Title>
      
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
          <code>npm install @fast-analytics/sdk</code>
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
    </div>
  );
}

