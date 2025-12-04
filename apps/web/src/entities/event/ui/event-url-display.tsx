"use client";

import { Typography } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { parseUrl } from "@/shared/lib/utils";
import { JsonViewer } from "@/shared/ui";

const { Text } = Typography;

interface EventUrlDisplayProps {
  url?: string | null;
  compact?: boolean;
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

function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function EventUrlDisplay({
  url,
  compact = false,
}: EventUrlDisplayProps) {
  if (!url) {
    return <Text type="secondary">Не указан</Text>;
  }

  const parsed = parseUrl(url);
  const urlParts = parseUrlParts(url);

  if (compact) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 bg-white rounded-md p-2">
        {urlParts ? (
          <>
            <Text className="font-mono text-xs text-gray-500">
              {urlParts.protocol}
            </Text>
            <Text className="font-mono text-xs font-semibold text-blue-600">
              {urlParts.host}
            </Text>
            {urlParts.pathname && (
              <Text className="font-mono text-xs text-gray-700 break-all">
                {urlParts.pathname}
              </Text>
            )}
            {parsed.hash && (
              <Text className="font-mono text-xs text-purple-600 break-all">
                #{parsed.hash}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text className="font-mono text-xs text-blue-600 break-all">
              {parsed.baseUrl}
            </Text>
            {parsed.hash && (
              <Text className="font-mono text-xs text-purple-600 break-all">
                #{parsed.hash}
              </Text>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className=" bg-white rounded-md overflow-hidden p-2 w-full">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          {urlParts ? (
            <div className="flex flex-wrap items-baseline ">
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
              {parsed.hash && (
                <Text className="font-mono text-sm text-purple-600 break-all">
                  #{parsed.hash}
                </Text>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
              <Text className="font-mono text-sm text-blue-600 break-all">
                {parsed.baseUrl}
              </Text>
              {parsed.hash && (
                <Text className="font-mono text-sm text-purple-600 break-all">
                  #{parsed.hash}
                </Text>
              )}
            </div>
          )}
        </div>
      </div>
      {parsed.hasParams && (
        <div className="space-y-1">
          <Text className="text-xs text-gray-500 font-semibold">
            GET параметры:
          </Text>
          <div className="bg-gray-50 rounded p-2 space-y-2 border">
            {Object.entries(parsed.params).map(([key, value]) => {
              const jsonValue = tryParseJson(value);
              return (
                <div key={key} className="flex gap-2 items-start">
                  <Text className="font-mono text-xs font-semibold text-gray-700 min-w-[80px] flex-shrink-0">
                    {key}:
                  </Text>
                  <div className="flex-1 min-w-0">
                    {jsonValue ? (
                      <div className="bg-white rounded border p-2">
                        <JsonViewer data={jsonValue} />
                      </div>
                    ) : (
                      <Text className="font-mono text-xs text-gray-900 break-all">
                        {value}
                      </Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
