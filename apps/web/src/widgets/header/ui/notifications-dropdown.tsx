"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Dropdown,
  Empty,
  Spin,
  Typography,
  Button,
  Space,
  Avatar,
} from "antd";
import { BellOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { getUserInvitations, acceptInvitation } from "@/shared/api/invitations";
import { message } from "antd";
import type { ProjectInvitation } from "@repo/types";
import dayjs from "@/shared/config/dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface InvitationWithDetails extends ProjectInvitation {
  project?: {
    id: string;
    name: string;
    description: string | null;
  };
  inviter?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function NotificationsDropdown() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await getUserInvitations();
      setInvitations(data);
    } catch (error) {
      console.error("Ошибка загрузки приглашений:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();

    // Обновляем список каждые 30 секунд
    const interval = setInterval(loadInvitations, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (
    invitation: InvitationWithDetails,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      setAcceptingIds((prev) => new Set(prev).add(invitation.id));
      await acceptInvitation(invitation.token);
      message.success("Приглашение принято!");
      await loadInvitations();

      // Редирект на проект
      if (invitation.projectId) {
        router.push(`/project/${invitation.projectId}/logs`);
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка принятия приглашения"
      );
    } finally {
      setAcceptingIds((prev) => {
        const next = new Set(prev);
        next.delete(invitation.id);
        return next;
      });
    }
  };

  const handleViewInvitation = (invitation: InvitationWithDetails) => {
    router.push(`/invite/${invitation.token}`);
  };

  const roleLabels: Record<string, string> = {
    admin: "Администратор",
    member: "Участник",
    viewer: "Наблюдатель",
  };

  const dropdownContent = (
    <div className="w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <Typography.Text strong>Приглашения</Typography.Text>
        {invitations.length > 0 && (
          <Typography.Text type="secondary" className="text-xs">
            {invitations.length} {invitations.length === 1 ? "новое" : "новых"}
          </Typography.Text>
        )}
      </div>

      {loading && invitations.length === 0 ? (
        <div className="p-8 text-center">
          <Spin />
        </div>
      ) : invitations.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Нет новых приглашений"
          className="py-8"
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleViewInvitation(invitation)}
            >
              <Space direction="vertical" size="small" className="w-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar
                        size="small"
                        icon={<UserOutlined />}
                        className="bg-blue-500"
                      />
                      <Typography.Text
                        strong
                        className="text-sm block truncate"
                      >
                        {invitation.inviter?.name ||
                          invitation.inviter?.email ||
                          "Неизвестный"}
                      </Typography.Text>
                    </div>
                    <Typography.Text className="text-sm block truncate">
                      пригласил вас в проект
                    </Typography.Text>
                    <Typography.Text
                      strong
                      className="text-sm block truncate text-blue-600"
                    >
                      {invitation.project?.name || "Неизвестный проект"}
                    </Typography.Text>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Typography.Text type="secondary" className="text-xs">
                      {roleLabels[invitation.role] || invitation.role}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                      •
                    </Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                      {dayjs(invitation.createdAt).fromNow()}
                    </Typography.Text>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    onClick={(e) => handleAccept(invitation, e)}
                    loading={acceptingIds.has(invitation.id)}
                    className="ml-2"
                  >
                    Принять
                  </Button>
                </div>
              </Space>
            </div>
          ))}
        </div>
      )}

      {invitations.length > 0 && (
        <div className="p-2 border-t border-gray-200 text-center">
          <Button
            type="link"
            size="small"
            onClick={() => router.push("/projects")}
          >
            Посмотреть все проекты
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={["click"]}
      placement="bottomRight"
      overlayClassName="notification-dropdown"
    >
      <Button
        type="text"
        icon={
          <Badge count={invitations.length} size="small" offset={[-2, 2]}>
            <BellOutlined className="text-lg" />
          </Badge>
        }
        className="flex items-center justify-center h-9 w-9 hover:bg-gray-50 rounded-lg"
        onClick={loadInvitations}
      />
    </Dropdown>
  );
}
