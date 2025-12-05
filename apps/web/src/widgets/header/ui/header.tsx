"use client";

import { useEffect, useState } from "react";
import {
  Layout,
  Button,
  Dropdown,
  Space,
  Avatar,
  Typography,
  Select,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  ProjectOutlined,
} from "@ant-design/icons";
import { NotificationsDropdown } from "./notifications-dropdown";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import type { MenuProps } from "antd";
import { getProjects, createProject } from "@/shared/api/projects";
import type { Project } from "@repo/database";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

export function Header({ sidebarCollapsed, onSidebarToggle }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
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
    if (session) {
      loadProjects();
    }
  }, [session]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  const handleProjectChange = (projectId: string) => {
    router.push(`/project/${projectId}/logs`);
  };

  const handleCreate = async (values: {
    name: string;
    description?: string;
  }) => {
    try {
      const newProject = await createProject(values);
      message.success("Проект успешно создан");
      setModalOpen(false);
      form.resetFields();
      await loadProjects();
      router.push(`/project/${newProject.id}/logs`);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка создания проекта"
      );
    }
  };

  const getCurrentProjectId = () => {
    const match = pathname?.match(/\/project\/([^/]+)/);
    return match ? match[1] : undefined;
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "logout",
      label: "Выйти",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const userName = session?.user?.name || session?.user?.email;
  const userInitials =
    userName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const currentProjectId = getCurrentProjectId();
  const currentProjectExists = projects.some(
    (project) => project.id === currentProjectId
  );
  const selectValue = currentProjectExists ? currentProjectId : undefined;

  return (
    <>
      <AntHeader className="!bg-white !border-b !border-gray-200 flex items-center justify-between !pl-6 h-16 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={
              sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
            }
            onClick={onSidebarToggle}
            className="flex items-center justify-center"
          />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FA</span>
            </div>
            <Text className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fast Analytics
            </Text>
          </div>
          <Select
            placeholder="Выберите проект"
            value={selectValue}
            onChange={handleProjectChange}
            loading={loading}
            className="min-w-[200px]"
            suffixIcon={<ProjectOutlined />}
            popupRender={(menu) => (
              <>
                {menu}
                <div className="border-t border-gray-200 p-2">
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setModalOpen(true);
                    }}
                    className="w-full justify-start"
                  >
                    Создать проект
                  </Button>
                </div>
              </>
            )}
            options={projects.map((project) => ({
              label: project.name,
              value: project.id,
            }))}
          />
        </div>
        <Space size="middle">
          <NotificationsDropdown />
          {userName && (
            <Text className="text-gray-600 hidden sm:inline-block">
              {userName}
            </Text>
          )}
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Button
              type="text"
              className="flex items-center gap-2 h-auto px-3 py-1.5 hover:bg-gray-50 rounded-lg"
            >
              <Avatar
                size="small"
                style={{
                  backgroundColor: "#1890ff",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {userInitials}
              </Avatar>
              <span className="hidden md:inline-block">Профиль</span>
            </Button>
          </Dropdown>
        </Space>
      </AntHeader>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <PlusOutlined className="text-white text-lg" />
            </div>
            <Typography.Title level={4} className="!mb-0">
              Создать новый проект
            </Typography.Title>
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
    </>
  );
}
