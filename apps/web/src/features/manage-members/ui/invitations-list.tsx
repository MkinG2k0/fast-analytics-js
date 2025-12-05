"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { getInvitations, cancelInvitation } from "@/shared/api/invitations";
import { INVITATION_STATUS_LABELS } from "@/entities/project-invitation";
import type { ProjectInvitation } from "@repo/database";

interface InvitationsListProps {
  projectId: string;
}

export function InvitationsList({ projectId }: InvitationsListProps) {
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await getInvitations(projectId);
      setInvitations(data);
    } catch (error) {
      message.error("Ошибка загрузки приглашений");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const handleCancel = async (invitationId: string) => {
    try {
      await cancelInvitation(projectId, invitationId);
      message.success("Приглашение отменено");
      loadInvitations();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка отмены приглашения"
      );
    }
  };

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Роль",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "blue" : "default"}>
          {role === "admin" ? "Администратор" : role === "member" ? "Участник" : "Наблюдатель"}
        </Tag>
      ),
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "pending" ? "orange" : "green"}>
          {INVITATION_STATUS_LABELS[status as keyof typeof INVITATION_STATUS_LABELS]}
        </Tag>
      ),
    },
    {
      title: "Отправлено",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("ru-RU"),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_: unknown, record: ProjectInvitation) => {
        if (record.status !== "pending") return null;

        return (
          <Popconfirm
            title="Отменить приглашение?"
            onConfirm={() => handleCancel(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<CloseOutlined />} size="small">
              Отменить
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={invitations}
      loading={loading}
      rowKey="id"
      pagination={false}
    />
  );
}

