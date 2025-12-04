"use client";

import { useEffect, useState } from "react";
import { Table, Tag, Button, Popconfirm, Avatar, message, Space } from "antd";
import { DeleteOutlined, UserOutlined } from "@ant-design/icons";
import { getMembers, removeMember } from "@/shared/api/invitations";
import { PROJECT_ROLE_LABELS } from "@/entities/project-member";
import type { ProjectMember } from "@repo/types";

interface MembersListProps {
  projectId: string;
  currentUserId: string;
  currentUserRole: string;
}

interface MemberWithUser extends ProjectMember {
  user?: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function MembersList({
  projectId,
  currentUserId,
  currentUserRole,
}: MembersListProps) {
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getMembers(projectId);
      setMembers(data as MemberWithUser[]);
    } catch (error) {
      message.error("Ошибка загрузки участников");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const handleRemove = async (userId: string) => {
    try {
      await removeMember(projectId, userId);
      message.success("Участник удален");
      loadMembers();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка удаления участника"
      );
    }
  };

  const columns = [
    {
      title: "Пользователь",
      key: "user",
      render: (_: unknown, record: MemberWithUser) => (
        <Space>
          <Avatar src={record.user?.image || undefined} icon={<UserOutlined />} />
          <div>
            <div>{record.user?.name || record.user?.email}</div>
            {record.user?.name && (
              <div style={{ fontSize: 12, color: "#999" }}>{record.user.email}</div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Роль",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "owner" ? "red" : role === "admin" ? "blue" : "default"}>
          {PROJECT_ROLE_LABELS[role as keyof typeof PROJECT_ROLE_LABELS]}
        </Tag>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_: unknown, record: MemberWithUser) => {
        const canRemove =
          (currentUserRole === "owner" || currentUserRole === "admin") &&
          record.userId !== currentUserId &&
          record.role !== "owner";

        if (!canRemove) return null;

        return (
          <Popconfirm
            title="Удалить участника?"
            description="Участник потеряет доступ к проекту"
            onConfirm={() => handleRemove(record.userId)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Удалить
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={members}
      loading={loading}
      rowKey={(record) => record.userId}
      pagination={false}
    />
  );
}

