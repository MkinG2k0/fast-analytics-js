"use client";

import { Card, Descriptions, Tag, Typography, Space, Row, Col } from "antd";
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
  const levelConfig = (levelColors[event.level] ?? levelColors.debug) as {
    color: string;
    bg: string;
  };

  // Извлекаем данные запроса и ответа из контекста
  const context = event.context as
    | (Record<string, unknown> & {
        customTags?: Record<string, string>;
        requestData?: unknown;
        responseData?: unknown;
        requestHeaders?: Record<string, string>;
        responseHeaders?: Record<string, string>;
      })
    | null;

  const customTags = context?.customTags;
  // Также проверяем данные напрямую в context на случай, если структура отличается
  const requestBody =
    (customTags?.requestBody as string | undefined) ||
    (context?.requestBody as string | undefined);
  const responseBody =
    (customTags?.responseBody as string | undefined) ||
    (context?.responseBody as string | undefined);
  const requestData = context?.requestData;
  const responseData = context?.responseData;
  const requestHeaders = context?.requestHeaders as
    | Record<string, string>
    | undefined;
  const responseHeaders = context?.responseHeaders as
    | Record<string, string>
    | undefined;
  const method = customTags?.method || (context?.method as string | undefined);
  const statusCode =
    customTags?.statusCode || (context?.statusCode as string | undefined);
  const statusText =
    customTags?.statusText || (context?.statusText as string | undefined);
  const requestUrl = customTags?.url || (context?.url as string | undefined);
  const requestContentType =
    customTags?.requestContentType ||
    (context?.requestContentType as string | undefined);
  const contentType =
    customTags?.contentType || (context?.contentType as string | undefined);
  const errorType =
    customTags?.errorType || (context?.errorType as string | undefined);
  const hasRequestData = Boolean(requestBody || requestData);
  const hasResponseData = Boolean(responseBody || responseData);
  const hasHttpData = Boolean(
    method || requestUrl || hasRequestData || statusCode || hasResponseData
  );
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Card>
        <Title level={3} className="mb-4">
          Детали события
        </Title>
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
            {requestUrl || event.url ? (
              <Text className="font-mono text-sm text-blue-600 break-all">
                {requestUrl || event.url}
              </Text>
            ) : (
              <Text type="secondary">Не указан</Text>
            )}
          </Descriptions.Item>
          {method && (
            <Descriptions.Item label="Метод">
              <Tag color="blue">{method.toUpperCase()}</Tag>
            </Descriptions.Item>
          )}

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

      {hasHttpData && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              {/* Секция HTTP запроса */}
              <Card title={<span className="font-semibold">HTTP Запрос</span>}>
                {(requestContentType ||
                  (requestHeaders &&
                    Object.keys(requestHeaders).length > 0)) && (
                  <Descriptions
                    column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
                    bordered
                    size="small"
                  >
                    {requestContentType && (
                      <Descriptions.Item label="Content-Type">
                        <Text className="font-mono text-xs">
                          {requestContentType}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {requestHeaders &&
                      Object.keys(requestHeaders).length > 0 && (
                        <Descriptions.Item label="Заголовки">
                          <div className="space-y-1">
                            {Object.entries(requestHeaders).map(
                              ([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <Text className="font-mono text-xs font-semibold text-gray-600">
                                    {key}:
                                  </Text>
                                  <Text className="font-mono text-xs break-all">
                                    {value}
                                  </Text>
                                </div>
                              )
                            )}
                          </div>
                        </Descriptions.Item>
                      )}
                  </Descriptions>
                )}
                {hasRequestData && (
                  <div className="mt-2">
                    <Text strong className="block mb-2">
                      Тело запроса:
                    </Text>
                    {requestData ? (
                      <JsonViewer data={requestData} />
                    ) : requestBody ? (
                      (() => {
                        try {
                          const parsed = JSON.parse(String(requestBody));
                          return <JsonViewer data={parsed} />;
                        } catch {
                          return (
                            <pre className="json-viewer overflow-auto max-h-96 whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded border">
                              {String(requestBody)}
                            </pre>
                          );
                        }
                      })()
                    ) : null}
                  </div>
                )}
              </Card>
            </Col>

            {/* Секция HTTP ответа */}
            {(statusCode || hasResponseData) && (
              <Col xs={24} lg={12}>
                <Card title={<span className="font-semibold">HTTP Ответ</span>}>
                  <Descriptions
                    column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
                    bordered
                    size="small"
                  >
                    {statusCode && (
                      <Descriptions.Item label="Статус">
                        <div className="flex items-center gap-2">
                          <Tag
                            color={
                              parseInt(statusCode) >= 400 ? "red" : "green"
                            }
                          >
                            {statusCode}
                          </Tag>
                          {statusText && (
                            <Text type="secondary" className="text-xs">
                              {statusText}
                            </Text>
                          )}
                        </div>
                      </Descriptions.Item>
                    )}
                    {contentType && (
                      <Descriptions.Item label="Content-Type">
                        <Text className="font-mono text-xs">{contentType}</Text>
                      </Descriptions.Item>
                    )}
                    {responseHeaders &&
                      Object.keys(responseHeaders).length > 0 && (
                        <Descriptions.Item label="Заголовки">
                          <div className="space-y-1">
                            {Object.entries(responseHeaders).map(
                              ([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <Text className="font-mono text-xs font-semibold text-gray-600">
                                    {key}:
                                  </Text>
                                  <Text className="font-mono text-xs break-all">
                                    {value}
                                  </Text>
                                </div>
                              )
                            )}
                          </div>
                        </Descriptions.Item>
                      )}
                  </Descriptions>
                  {hasResponseData && (
                    <div className="mt-4">
                      <Text strong className="block mb-2">
                        Тело ответа:
                      </Text>
                      {responseData ? (
                        <JsonViewer data={responseData} />
                      ) : responseBody ? (
                        (() => {
                          try {
                            const parsed = JSON.parse(String(responseBody));
                            return <JsonViewer data={parsed} />;
                          } catch {
                            return (
                              <pre className="json-viewer overflow-auto max-h-96 whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded border">
                                {String(responseBody)}
                              </pre>
                            );
                          }
                        })()
                      ) : null}
                    </div>
                  )}
                </Card>
              </Col>
            )}
          </Row>

          {/* Дополнительная информация из customTags */}
          {customTags &&
            Object.keys(customTags).length > 0 &&
            (errorType ||
              Object.keys(customTags).some(
                (key) =>
                  ![
                    "method",
                    "url",
                    "statusCode",
                    "statusText",
                    "requestContentType",
                    "contentType",
                    "requestBody",
                    "responseBody",
                    "errorType",
                  ].includes(key)
              )) && (
              <Card
                title={
                  <span className="font-semibold">
                    Дополнительная информация
                  </span>
                }
              >
                <Descriptions
                  column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
                  bordered
                  size="small"
                >
                  {errorType && (
                    <Descriptions.Item label="Тип ошибки">
                      <Tag>{errorType}</Tag>
                    </Descriptions.Item>
                  )}
                  {Object.entries(customTags)
                    .filter(
                      ([key]) =>
                        ![
                          "method",
                          "url",
                          "statusCode",
                          "statusText",
                          "requestContentType",
                          "contentType",
                          "requestBody",
                          "responseBody",
                          "errorType",
                        ].includes(key)
                    )
                    .map(([key, value]) => (
                      <Descriptions.Item key={key} label={key}>
                        <Text className="font-mono text-xs break-all">
                          {value}
                        </Text>
                      </Descriptions.Item>
                    ))}
                </Descriptions>
              </Card>
            )}
        </>
      )}

      {event.stack && (
        <Card title={<span className="font-semibold">Stack Trace</span>}>
          <pre className="json-viewer overflow-auto max-h-96 whitespace-pre-wrap text-xs">
            {event.stack}
          </pre>
        </Card>
      )}

      {event.context && !hasRequestData && !hasResponseData && (
        <Card title={<span className="font-semibold">Контекст</span>}>
          <JsonViewer data={event.context} />
        </Card>
      )}

      {event.metadata ? (
        <Card title={<span className="font-semibold">Метаданные</span>}>
          <JsonViewer data={event.metadata} />
        </Card>
      ) : null}
    </Space>
  );
}
