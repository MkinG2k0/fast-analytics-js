"use client";

import { Card, Typography } from "antd";
import type { ParsedEventContext } from "../lib";
import { EventUrlDisplay } from "./event-url-display";

const { Text } = Typography;

interface EventRequestGeneralInfoProps {
  context: ParsedEventContext;
}

export function EventRequestGeneralInfo({
  context,
}: EventRequestGeneralInfoProps) {
  const { requestUrl, method } = context;

  const hasGeneralInfo = Boolean(requestUrl || method);

  if (!hasGeneralInfo) {
    return null;
  }

  return (
    <Card title={<span className="font-semibold">Заголовки Запроса</span>}>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {requestUrl && (
          <div className="flex items-start gap-2 py-1.5 border-b border-gray-100">
            <Text className="font-mono text-xs text-gray-600 min-w-[180px] font-medium">
              URL Запроса:
            </Text>
            <div className="flex-1 min-w-0">
              <EventUrlDisplay url={requestUrl} compact />
            </div>
          </div>
        )}
        {method && (
          <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-b-0">
            <Text className="font-mono text-xs text-gray-600 min-w-[180px] font-medium">
              Метод Запроса:
            </Text>
            <Text className="font-mono text-xs text-gray-900 break-all flex-1">
              {method.toUpperCase()}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
}
