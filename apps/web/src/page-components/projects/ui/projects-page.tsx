"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Table,
  Space,
  message,
  Modal,
  Input,
  Form,
  Empty,
  Typography,
} from "antd";
import {
  PlusOutlined,
  FileTextOutlined,
  SettingOutlined,
  ProjectOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

import { getProjects, createProject } from "@/shared/api/projects";
import type { Project } from "@/entities/project";

const { Text, Title } = Typography;

interface CreateProjectFormValues {
  name: string;
  description?: string;
}

export function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch {
      message.error("Ошибка загрузки проектов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (values: CreateProjectFormValues) => {
    try {
      await createProject(values);
      message.success("Проект успешно создан");
      setModalOpen(false);
      form.resetFields();
      loadProjects();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка создания проекта"
      );
    }
  };

  const columns = [
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
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ProjectOutlined className="!text-white text-xl" />
          </div>
          <div>
            <Title level={2} className="!mb-0 !text-white-900">
              Проекты
            </Title>
            <Text className="text-gray-500 text-sm">
              Управление вашими проектами аналитики
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          size="large"
          className="shadow-md hover:shadow-lg transition-all duration-200 h-11 px-6 font-semibold"
        >
          Создать проект
        </Button>
      </div>

      <Card
        className="shadow-sm border-gray-200 hover:shadow-md transition-shadow duration-200"
        styles={{ body: { padding: 0 } }}
      >
        {projects.length === 0 && !loading ? (
          <div className="py-16">
            <Empty
              image={<InboxOutlined className="text-6xl text-gray-300" />}
              description={
                <div className="mt-4">
                  <Text className="text-gray-500 text-base">
                    У вас пока нет проектов
                  </Text>
                  <br />
                  <Text className="text-gray-400 text-sm">
                    Создайте первый проект, чтобы начать отслеживать события
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalOpen(true)}
                size="large"
                className="mt-4"
              >
                Создать проект
              </Button>
            </Empty>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={projects}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Всего проектов: ${total}`,
              pageSizeOptions: ["10", "25", "50"],
              className: "px-4 py-3",
            }}
            className="[&_.ant-table-thead>tr>th]:bg-gradient-to-r [&_.ant-table-thead>tr>th]:from-gray-50 [&_.ant-table-thead>tr>th]:to-gray-50/50 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:border-b-2 [&_.ant-table-thead>tr>th]:border-gray-200 [&_.ant-table-tbody>tr:hover]:bg-blue-50/30 [&_.ant-table-tbody>tr]:transition-colors [&_.ant-table-tbody>tr>td]:py-4"
          />
        )}
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <PlusOutlined className="text-white text-lg" />
            </div>
            <Title level={4} className="!mb-0">
              Создать новый проект
            </Title>
          </div>
        }
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={520}
        className="[&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-header]:pb-4"
      >
        <Form
          form={form}
          onFinish={handleCreate}
          layout="vertical"
          className="mt-6"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={
              <Text strong className="text-gray-700">
                Название проекта
              </Text>
            }
            rules={[
              {
                required: true,
                message: "Пожалуйста, введите название проекта",
              },
              {
                min: 2,
                message: "Название должно содержать минимум 2 символа",
              },
            ]}
          >
            <Input
              placeholder="Например: Мой веб-сайт"
              size="large"
              className="rounded-lg"
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={
              <Text strong className="text-gray-700">
                Описание
              </Text>
            }
            extra={
              <Text className="text-gray-400 text-xs">Необязательное поле</Text>
            }
          >
            <Input.TextArea
              rows={4}
              placeholder="Краткое описание проекта..."
              className="rounded-lg"
              showCount
              maxLength={200}
            />
          </Form.Item>
          <Form.Item className="!mb-0 mt-6">
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setModalOpen(false);
                  form.resetFields();
                }}
                size="large"
                className="px-6"
              >
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="px-6 font-semibold shadow-sm hover:shadow-md transition-all"
              >
                Создать проект
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

