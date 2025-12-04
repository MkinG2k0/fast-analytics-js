"use client";

import { useState } from "react";
import { Button, Form, Input, Select, message, Space } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { createInvitation } from "@/shared/api/invitations";
import type { CreateInvitationDto } from "@/shared/api/invitations";

interface InviteMemberFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export function InviteMemberForm({ projectId, onSuccess }: InviteMemberFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: CreateInvitationDto) => {
    try {
      setLoading(true);
      await createInvitation(projectId, values);
      message.success("Приглашение отправлено");
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка отправки приглашения"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="inline" className="w-full">
      <Space.Compact className="w-full">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Введите email" },
            { type: "email", message: "Некорректный email" },
          ]}
          className="flex-1"
        >
          <Input placeholder="Email пользователя" />
        </Form.Item>
        <Form.Item
          name="role"
          initialValue="member"
          rules={[{ required: true }]}
        >
          <Select style={{ width: 150 }}>
            <Select.Option value="admin">Администратор</Select.Option>
            <Select.Option value="member">Участник</Select.Option>
            <Select.Option value="viewer">Наблюдатель</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            htmlType="submit"
            loading={loading}
          >
            Пригласить
          </Button>
        </Form.Item>
      </Space.Compact>
    </Form>
  );
}

