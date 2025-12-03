"use client";

import { Card, Descriptions, Tag, Typography } from "antd";
import { JsonViewer } from "@/shared/ui";
import type { Event } from "@repo/types";
import dayjs from "@/shared/config/dayjs";

const { Title, Text } = Typography;

interface EventDetailsProps {
  event: Event;
}

const levelColors: Record<string, string> = {
  error: "red",
  warn: "orange",
  info: "blue",
  debug: "default",
};

export function EventDetails({ event }: EventDetailsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <Title level={3}>Детали события</Title>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="ID">{event.id}</Descriptions.Item>
          <Descriptions.Item label="Уровень">
            <Tag color={levelColors[event.level]}>{event.level.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Сообщение">
            <Text code>{event.message}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Время">
            {dayjs(event.timestamp).format("YYYY-MM-DD HH:mm:ss")}
          </Descriptions.Item>
          <Descriptions.Item label="URL">
            {event.url || <Text type="secondary">Не указан</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="User Agent">
            {event.userAgent || <Text type="secondary">Не указан</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Session ID">
            {event.sessionId || <Text type="secondary">Не указан</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="User ID">
            {event.userId || <Text type="secondary">Не указан</Text>}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {event.stack && (
        <Card title="Stack Trace">
          <pre className="json-viewer overflow-auto max-h-96 whitespace-pre-wrap">
            {event.stack}
          </pre>
        </Card>
      )}

      {event.context && (
        <Card title="Контекст">
          <JsonViewer data={event.context} />
        </Card>
      )}

      {event.metadata && (
        <Card title="Метаданные">
          <JsonViewer data={event.metadata} />
        </Card>
      )}
    </div>
  );
}

