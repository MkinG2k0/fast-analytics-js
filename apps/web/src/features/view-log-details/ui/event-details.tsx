"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Tag,
  Typography,
  Button,
  Popconfirm,
  message,
  Space,
  Image,
} from "antd";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import type { Event } from "@/entities/event";

import {
  EventAdditionalInfo,
  EventHttpRequest,
  EventHttpResponse,
  EventLevelBadge,
  EventRequestGeneralInfo,
  EventRequestHeaders,
  EventResponseGeneralInfo,
  EventResponseHeaders,
  EventUrlDisplay,
  parseEventContext,
} from "@/entities/event";
import dayjs from "@/shared/config/dayjs";
import { JsonViewer } from "@/shared/ui";
import { deleteEvent } from "@/shared/api/events";

const { Text } = Typography;

interface EventDetailsProps {
  event: Event;
}

export function EventDetails({ event }: EventDetailsProps) {
  const router = useRouter();
  const parsedContext = parseEventContext(event);
  const { requestUrl, hasHttpData } = parsedContext;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteEvent(event.id);
      message.success("Событие удалено");
      router.push(`/project/${event.projectId}/logs`);
    } catch {
      message.error("Ошибка удаления события");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Детали события</span>
            <Space>
              <Popconfirm
                title="Удалить событие?"
                description="Это действие нельзя отменить"
                onConfirm={handleDelete}
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleting}
                  size="small"
                >
                  Удалить
                </Button>
              </Popconfirm>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                size="small"
              >
                Назад
              </Button>
            </Space>
          </div>
        }
        styles={{ body: { padding: "12px 16px" } }}
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="ID" span={2}>
            <Text className="font-mono text-xs">{event.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Уровень">
            <EventLevelBadge level={event.level} />
          </Descriptions.Item>
          <Descriptions.Item label="Время">
            <Text className="font-mono text-xs">
              {dayjs(event.timestamp).format("YYYY-MM-DD HH:mm:ss")}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Повторений">
            <Tag
              color={(event.occurrenceCount ?? 1) > 1 ? "orange" : "default"}
              style={{
                fontWeight: (event.occurrenceCount ?? 1) > 1 ? 600 : 400,
              }}
            >
              {event.occurrenceCount ?? 1}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Сообщение" span={2}>
            <Text className="text-sm">{event.message}</Text>
          </Descriptions.Item>
          {!hasHttpData && (
            <Descriptions.Item label="URL" span={2}>
              <EventUrlDisplay url={requestUrl || event.url || undefined} />
            </Descriptions.Item>
          )}
          {!hasHttpData && parsedContext.method && (
            <Descriptions.Item label="Метод">
              <Tag color="blue">{parsedContext.method.toUpperCase()}</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {event.stack && (
        <Card title={<span className="font-semibold">Stack Trace</span>}>
          <pre className="json-viewer overflow-auto max-h-96 whitespace-pre-wrap text-xs">
            {event.stack}
          </pre>
        </Card>
      )}

      {event.screenshotUrl && (
        <Card title={<span className="font-semibold">Скриншот экрана</span>}>
          <div className="w-full flex justify-center">
            <Image
              src={event.screenshotUrl}
              alt="Скриншот ошибки"
              className="w-full max-w-4xl"
              preview={{
                mask: "Увеличить",
              }}
            />
          </div>
        </Card>
      )}

      {event.context &&
        !parsedContext.hasRequestData &&
        !parsedContext.hasResponseData && (
          <Card title={<span className="font-semibold">Контекст</span>}>
            <JsonViewer data={event.context} />
          </Card>
        )}

      {event.metadata != null && (
        <Card title={<span className="font-semibold">Метаданные</span>}>
          <JsonViewer data={event.metadata} />
        </Card>
      )}

      {hasHttpData && (
        <>
          <div className="event-grid">
            <div className="event-grid-column">
              <EventHttpRequest context={parsedContext} />
              <EventRequestHeaders context={parsedContext} />
            </div>
            <div className="event-grid-column">
              {(parsedContext.statusCode || parsedContext.hasResponseData) && (
                <>
                  <EventHttpResponse context={parsedContext} />
                  <EventResponseHeaders context={parsedContext} />
                </>
              )}
            </div>

            <EventRequestGeneralInfo context={parsedContext} />
            <EventResponseGeneralInfo context={parsedContext} />
          </div>
          <EventAdditionalInfo context={parsedContext} event={event} />
        </>
      )}

      {!hasHttpData && (
        <EventAdditionalInfo context={parsedContext} event={event} />
      )}
    </div>
  );
}
