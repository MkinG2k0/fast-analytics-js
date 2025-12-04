"use client";

import { Card, Typography } from "antd";
import type { ParsedEventContext } from "../lib";

const { Text } = Typography;

interface EventResponseGeneralInfoProps {
  context: ParsedEventContext;
}

export function EventResponseGeneralInfo({
  context,
}: EventResponseGeneralInfoProps) {
  const { statusCode, statusText } = context;

  if (!statusCode) {
    return null;
  }

  const statusCodeNum = parseInt(statusCode, 10);
  const isErrorStatus = statusCodeNum >= 400;

  return (
    <Card title={<span className="font-semibold">Заголовки Ответа</span>}>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-b-0">
          <Text className="font-mono text-xs text-gray-600 min-w-[180px] font-medium">
            Код Статуса:
          </Text>
          <div className="flex items-center gap-2 flex-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isErrorStatus ? "bg-red-500" : "bg-green-500"
              }`}
            />
            <Text className="font-mono text-xs text-gray-900">
              {statusCode} {statusText || ""}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
}
