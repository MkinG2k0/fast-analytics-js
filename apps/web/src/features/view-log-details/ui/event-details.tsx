"use client";

import { Card, Descriptions, Tag, Typography, Space } from "antd";
import { JsonViewer } from "@/shared/ui";
import type { Event } from "@repo/types";
import dayjs from "@/shared/config/dayjs";

const { Title, Text } = Typography;

interface EventDetailsProps {
  event: Event;
}

const levelColors: Record<string, { color: string; bg: string }> = {
  error: { color: "#ef4444", bg: "#fee2e2" },
  warn: { color: "#f59e0b", bg: "#fef3c7" },
  info: { color: "#3b82f6", bg: "#dbeafe" },
  debug: { color: "#6b7280", bg: "#f3f4f6" },
};

export function EventDetails({ event }: EventDetailsProps) {
  const levelConfig = levelColors[event.level] || levelColors.debug;

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Card>
        <Title level={3} className="mb-4">Детали события</Title>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="ID">
            <Text className="font-mono text-sm">{event.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Уровень">
            <Tag
              style={{
                backgroundColor: levelConfig.bg,
                color: levelConfig.color,
                border: `1px solid ${levelConfig.color}20`,
                fontWeight: 600,
                fontSize: "12px",
                padding: "2px 10px",
                borderRadius: "6px",
              }}
            >
              {event.level.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Сообщение">
            <Text className="font-medium">{event.message}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Время">
            <Text className="font-mono text-sm">
              {dayjs(event.timestamp).format("YYYY-MM-DD HH:mm:ss")}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="URL">
            {event.url ? (
              <Text className="font-mono text-sm text-blue-600 break-all">
                {event.url}
              </Text>
            ) : (
              <Text type="secondary">Не указан</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="User Agent">
            {event.userAgent ? (
              <Text className="text-sm break-all">{event.userAgent}</Text>
            ) : (
              <Text type="secondary">Не указан</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="User ID">
            {event.userId ? (
              <Text className="font-mono text-sm">{event.userId}</Text>
            ) : (
              <Text type="secondary">Не указан</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {event.stack && (
        <Card title={<span className="font-semibold">Stack Trace</span>}>
          <pre className="json-viewer overflow-auto max-h-96 whitespace-pre-wrap text-xs">
            {event.stack}
          </pre>
        </Card>
      )}

      {event.context && (
        <Card title={<span className="font-semibold">Контекст</span>}>
          <JsonViewer data={event.context} />
        </Card>
      )}

      {event.metadata && (
        <Card title={<span className="font-semibold">Метаданные</span>}>
          <JsonViewer data={event.metadata} />
        </Card>
      )}
    </Space>
  );
}

