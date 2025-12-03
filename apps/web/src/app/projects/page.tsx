"use client";

import { useEffect, useState } from "react";
import { Card, Button, Table, Space, Tag, message, Modal, Input, Form } from "antd";
import { PlusOutlined, CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { getProjects, createProject, regenerateApiKey } from "@/shared/api/projects";
import type { Project } from "@repo/types";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
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
    } catch (error) {
      message.error("Ошибка загрузки проектов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (values: { name: string; description?: string }) => {
    try {
      await createProject(values);
      message.success("Проект создан");
      setModalOpen(false);
      form.resetFields();
      loadProjects();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Ошибка создания проекта");
    }
  };

  const handleRegenerateKey = async (projectId: string) => {
    try {
      const { apiKey } = await regenerateApiKey(projectId);
      message.success("Ключ обновлен");
      loadProjects();
      return apiKey;
    } catch (error) {
      message.error("Ошибка обновления ключа");
      return null;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Скопировано в буфер обмена");
  };

  const columns = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
      render: (text: string | null) => text || <span className="text-gray-400">—</span>,
    },
    {
      title: "API Key",
      dataIndex: "apiKey",
      key: "apiKey",
      render: (apiKey: string) => (
        <Space>
          <code className="text-xs">{apiKey}</code>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(apiKey)}
          />
        </Space>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_: unknown, record: Project) => (
        <Space>
          <Button onClick={() => router.push(`/project/${record.id}/logs`)}>
            Логи
          </Button>
          <Button
            onClick={() => router.push(`/project/${record.id}/settings`)}
          >
            Настройки
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Проекты</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Создать проект
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={projects}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title="Создать проект"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: "Введите название проекта" }]}
          >
            <Input placeholder="Мой проект" />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} placeholder="Описание проекта" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Создать
              </Button>
              <Button onClick={() => setModalOpen(false)}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

