"use client";

import { Card, Descriptions, Tag, Typography } from "antd";
import type { Event } from "@repo/database";
import type { ParsedEventContext } from "../lib";
import dayjs from "@/shared/config/dayjs";

const { Text } = Typography;

interface EventAdditionalInfoProps {
  context: ParsedEventContext;
  event: Event;
}

const EXCLUDED_CUSTOM_TAG_KEYS = [
  "method",
  "url",
  "statusCode",
  "statusText",
  "requestContentType",
  "contentType",
  "requestBody",
  "responseBody",
  "errorType",
];

interface EventPerformance {
  requestDuration?: number;
  timestamp?: number;
  [key: string]: unknown;
}

function isEventPerformance(value: unknown): value is EventPerformance {
  return (
    typeof value === "object" &&
    value !== null &&
    ("requestDuration" in value || "timestamp" in value)
  );
}

export function EventAdditionalInfo({
  context,
  event,
}: EventAdditionalInfoProps) {
  const { customTags, errorType } = context;

  const additionalTags = customTags
    ? Object.entries(customTags).filter(
        ([key]) => !EXCLUDED_CUSTOM_TAG_KEYS.includes(key)
      )
    : [];

  const performance = isEventPerformance(event.performance)
    ? event.performance
    : null;

  const hasUserAgent = Boolean(event.userAgent);
  const hasUserId = Boolean(event.userId);
  const hasErrorType = Boolean(errorType);
  const hasAdditionalTags = additionalTags.length > 0;
  const hasPerformance = Boolean(
    performance &&
      (performance.requestDuration !== undefined ||
        performance.timestamp !== undefined)
  );

  if (
    !hasUserAgent &&
    !hasUserId &&
    !hasErrorType &&
    !hasAdditionalTags &&
    !hasPerformance
  ) {
    return null;
  }

  return (
    <Card
      title={<span className="font-semibold">Дополнительная информация</span>}
    >
      <Descriptions bordered size="small" column={1}>
        {hasUserAgent && (
          <Descriptions.Item label="User Agent">
            {event.userAgent ? (
              <Text className="text-sm break-all">{event.userAgent}</Text>
            ) : (
              <Text type="secondary">Не указан</Text>
            )}
          </Descriptions.Item>
        )}
        {hasUserId && (
          <Descriptions.Item label="User ID">
            {event.userId ? (
              <Text className="font-mono text-sm">{event.userId}</Text>
            ) : (
              <Text type="secondary">Не указан</Text>
            )}
          </Descriptions.Item>
        )}
        {hasErrorType && (
          <Descriptions.Item label="Тип ошибки">
            <Tag>{errorType}</Tag>
          </Descriptions.Item>
        )}
        {hasPerformance && performance && (
          <>
            {performance.requestDuration !== undefined && (
              <Descriptions.Item label="Время выполнения запроса">
                <Text className="font-mono text-sm">
                  {performance.requestDuration.toFixed(2)} мс
                </Text>
              </Descriptions.Item>
            )}
            {performance.timestamp !== undefined && (
              <Descriptions.Item label="Время начала запроса">
                <Text className="font-mono text-xs">
                  {dayjs(performance.timestamp).format("YYYY-MM-DD HH:mm:ss")}
                </Text>
              </Descriptions.Item>
            )}
          </>
        )}
        {additionalTags.map(([key, value]) => (
          <Descriptions.Item key={key} label={key}>
            <Text className="font-mono text-xs break-all">{value}</Text>
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Card>
  );
}
