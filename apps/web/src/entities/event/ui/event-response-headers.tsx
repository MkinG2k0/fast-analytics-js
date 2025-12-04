"use client";

import { Card, Typography } from "antd";
import type { ParsedEventContext } from "../lib";

const { Text } = Typography;

interface EventResponseHeadersProps {
  context: ParsedEventContext;
}

interface HeaderRowProps {
  name: string;
  value: string;
}

function HeaderRow({ name, value }: HeaderRowProps) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      <Text className="font-mono text-xs text-gray-600 min-w-[180px] font-medium">
        {name}:
      </Text>
      <Text className="font-mono text-xs text-gray-900 break-all flex-1">
        {value}
      </Text>
    </div>
  );
}

export function EventResponseHeaders({ context }: EventResponseHeadersProps) {
  const { responseHeaders } = context;

  if (!responseHeaders || Object.keys(responseHeaders).length === 0) {
    return null;
  }

  return (
    <Card title={<span className="font-semibold">Заголовки ответа</span>}>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {Object.entries(responseHeaders).map(([key, value]) => (
          <HeaderRow key={key} name={key} value={value} />
        ))}
      </div>
    </Card>
  );
}

