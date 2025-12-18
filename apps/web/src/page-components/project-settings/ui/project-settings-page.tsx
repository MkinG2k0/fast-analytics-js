"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Button,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Typography,
  Skeleton,
  Form,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useSession } from "next-auth/react";

import {
  deleteProject,
  getProject,
  regenerateApiKey,
  updateProject,
} from "@/shared/api/projects";
import { getProjectRole } from "@/shared/api/invitations";
import {
  InviteMemberForm,
  MembersList,
  InvitationsList,
} from "@/features/manage-members";
import type { ProjectWithSettings } from "@/entities/project";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectWithSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data);

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
      await regenerateApiKey(projectId);
      await loadProject();
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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteProject(projectId);
      message.success("Проект успешно удален");
      router.push("/projects");
    } catch {
      message.error("Ошибка удаления проекта");
    } finally {
      setDeleting(false);
    }
  };

  const canManageMembers = userRole === "owner" || userRole === "admin";
  const canManageSettings = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  const handleEdit = () => {
    if (project) {
      form.setFieldsValue({
        name: project.name,
        description: project.description || "",
        maxErrors: project.settings?.maxErrors ?? 100,
        visitsRetentionDays:
          project.settings?.visitsRetentionDays === null ||
          project.settings?.visitsRetentionDays === undefined
            ? 7
            : project.settings.visitsRetentionDays,
      });
      setEditing(true);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const updatedProject = await updateProject(projectId, {
        name: values.name,
        description: values.description || undefined,
        maxErrors: values.maxErrors,
        visitsRetentionDays:
          values.visitsRetentionDays === 0 ? null : values.visitsRetentionDays,
      });
      setProject(updatedProject);
      setEditing(false);
      message.success("Проект успешно обновлен");
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        // Ошибки валидации формы
        return;
      }
      message.error(
        error instanceof Error ? error.message : "Ошибка обновления проекта"
      );
    } finally {
      setSaving(false);
    }
  };

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
        </Space>
      </div>
    );
  }

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

        <Space direction="vertical" size="large" className="w-full">
          <Card
            title="Информация о проекте"
            className="mb-4"
            extra={
              canManageSettings &&
              !editing && (
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  type="text"
                >
                  Редактировать
                </Button>
              )
            }
          >
            {editing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  name: project.name,
                  description: project.description || "",
                  maxErrors: project.settings?.maxErrors ?? 100,
                  visitsRetentionDays:
                    project.settings?.visitsRetentionDays === null ||
                    project.settings?.visitsRetentionDays === undefined
                      ? 7
                      : project.settings.visitsRetentionDays,
                }}
              >
                <Form.Item
                  name="name"
                  label="Название"
                  rules={[
                    { required: true, message: "Название проекта обязательно" },
                  ]}
                >
                  <Input placeholder="Введите название проекта" />
                </Form.Item>
                <Form.Item name="description" label="Описание">
                  <TextArea
                    placeholder="Введите описание проекта (необязательно)"
                    rows={4}
                  />
                </Form.Item>
                <Form.Item
                  name="maxErrors"
                  label="Максимальное количество ошибок"
                  tooltip="Максимальное количество ошибок для хранения. Старые ошибки будут автоматически удаляться. Укажите 0 для сохранения всех ошибок."
                  rules={[
                    {
                      type: "number",
                      min: 0,
                      message: "Значение должно быть не менее 0",
                    },
                  ]}
                >
                  <InputNumber
                    placeholder="100"
                    min={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item
                  name="visitsRetentionDays"
                  label="Период хранения посещений (дни)"
                  tooltip="Период хранения данных о посещениях в днях. Данные старше указанного периода будут автоматически удаляться. Укажите 0 для сохранения всех данных."
                  rules={[
                    {
                      type: "number",
                      min: 0,
                      message: "Значение должно быть не менее 0",
                    },
                  ]}
                >
                  <InputNumber
                    placeholder="0 (без ограничений)"
                    min={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSave}
                      loading={saving}
                    >
                      Сохранить
                    </Button>
                    <Button onClick={handleCancel} disabled={saving}>
                      Отмена
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <>
                <Paragraph>
                  <Text strong>Название:</Text> {project.name}
                </Paragraph>
                {project.description && (
                  <Paragraph>
                    <Text strong>Описание:</Text> {project.description}
                  </Paragraph>
                )}
                <Paragraph>
                  <Text strong>Максимальное количество ошибок:</Text>{" "}
                  {project.settings?.maxErrors === 0
                    ? "Без ограничений"
                    : (project.settings?.maxErrors ?? 100)}
                </Paragraph>
                <Paragraph>
                  <Text strong>Период хранения посещений:</Text>{" "}
                  {project.settings?.visitsRetentionDays === null ||
                  project.settings?.visitsRetentionDays === undefined
                    ? "Без ограничений"
                    : `${project.settings.visitsRetentionDays} дн.`}
                </Paragraph>
              </>
            )}
          </Card>

          {canManageMembers && (
            <Card title="Участники проекта" className="mb-4">
              <Space direction="vertical" size="large" className="w-full">
                <div>
                  <Title level={5}>Пригласить участника</Title>
                  <InviteMemberForm
                    projectId={projectId}
                    onSuccess={() => {
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

          {isOwner && (
            <Card
              title="Опасная зона"
              className="mb-4 border-red-200"
              headStyle={{ borderColor: "#ffccc7" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Paragraph type="secondary">
                  Удаление проекта приведет к безвозвратному удалению всех
                  данных, включая события, логи и настройки. Это действие нельзя
                  отменить.
                </Paragraph>
                <Popconfirm
                  title="Удалить проект?"
                  description={`Вы уверены, что хотите удалить проект "${project?.name}"? Это действие нельзя отменить. Все данные проекта будут безвозвратно удалены.`}
                  onConfirm={handleDelete}
                  okText="Удалить"
                  cancelText="Отмена"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleting}
                  >
                    Удалить проект
                  </Button>
                </Popconfirm>
              </Space>
            </Card>
          )}
        </Space>
      </Space>
    </div>
  );
}
