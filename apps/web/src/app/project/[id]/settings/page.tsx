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
  Skeleton,
} from "antd";
import {
  CopyOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";
import { getProject, regenerateApiKey } from "@/shared/api/projects";
import { getProjectRole } from "@/shared/api/invitations";
import {
  InviteMemberForm,
  MembersList,
  InvitationsList,
} from "@/features/manage-members";
import type { Project } from "@repo/database";

const { Title, Paragraph, Text } = Typography;

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data);

      // Загружаем роль пользователя
      if (session?.user?.id) {
        try {
          const { role } = await getProjectRole(projectId);
          setUserRole(role);
        } catch {
          // Игнорируем ошибку загрузки роли
        }
      }
    } catch {
      message.error("Ошибка загрузки проекта");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && session?.user?.id) {
      loadProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, session?.user?.id]);

  const handleRegenerateKey = async () => {
    try {
      setRegeneratingKey(true);
      const { apiKey } = await regenerateApiKey(projectId);
      setProject(project ? { ...project, apiKey } : null);
      message.success("Ключ обновлен");
    } catch {
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

  const canManageMembers = userRole === "owner" || userRole === "admin";

  if (loading || !project) {
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

          {canManageMembers && (
            <Card title="Участники проекта" className="mb-4">
              <Space direction="vertical" size="large" className="w-full">
                <div>
                  <Title level={5}>Пригласить участника</Title>
                  <InviteMemberForm
                    projectId={projectId}
                    onSuccess={() => {
                      // Перезагружаем страницу для обновления списков
                      loadProject();
                    }}
                  />
                </div>
                <div>
                  <Title level={5}>Активные приглашения</Title>
                  <InvitationsList projectId={projectId} />
                </div>
                <div>
                  <Title level={5}>Участники</Title>
                  <MembersList
                    projectId={projectId}
                    currentUserId={session?.user?.id || ""}
                    currentUserRole={userRole || ""}
                  />
                </div>
              </Space>
            </Card>
          )}
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
