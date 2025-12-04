"use client";

import { Typography } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { parseUrl } from "@/shared/lib/utils";

const { Text } = Typography;

interface EventUrlDisplayProps {
  url?: string | null;
}

function parseUrlParts(url: string): {
  protocol: string;
  host: string;
  pathname: string;
} | null {
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      host: urlObj.host,
      pathname: urlObj.pathname,
    };
  } catch {
    return null;
  }
}

export function EventUrlDisplay({ url }: EventUrlDisplayProps) {
  if (!url) {
    return <Text type="secondary">Не указан</Text>;
  }

  const parsed = parseUrl(url);
  const urlParts = parseUrlParts(url);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <LinkOutlined className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {urlParts ? (
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
              <Text className="font-mono text-xs text-gray-500">
                {urlParts.protocol}
              </Text>
              <Text className="font-mono text-sm font-semibold text-blue-600">
                {urlParts.host}
              </Text>
              {urlParts.pathname && (
                <Text className="font-mono text-sm text-gray-700 break-all">
                  {urlParts.pathname}
                </Text>
              )}
            </div>
          ) : (
            <Text className="font-mono text-sm text-blue-600 break-all">
              {parsed.baseUrl}
            </Text>
          )}
        </div>
      </div>
      {parsed.hasParams && (
        <div className="space-y-1">
          <Text className="text-xs text-gray-500 font-semibold">
            GET параметры:
          </Text>
          <div className="bg-gray-50 rounded p-2 space-y-1 border">
            {Object.entries(parsed.params).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-start">
                <Text className="font-mono text-xs font-semibold text-gray-700 min-w-[100px]">
                  {key}:
                </Text>
                <Text className="font-mono text-xs text-gray-900 break-all">
                  {value}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
