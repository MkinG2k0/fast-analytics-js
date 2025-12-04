"use client";

import { Typography } from "antd";
import type { ParsedEventContext } from "../lib";

const { Text } = Typography;

interface EventHeadersProps {
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
      <Text className="font-mono text-xs text-gray-900 break-all flex-1">{value}</Text>
    </div>
  );
}

interface HeadersSectionProps {
  title: string;
  headers?: Record<string, string>;
}

function HeadersSection({ title, headers }: HeadersSectionProps) {
  if (!headers || Object.keys(headers).length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <Text strong className="text-sm text-gray-700 block mb-2">
        {title}
      </Text>
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {Object.entries(headers).map(([key, value]) => (
          <HeaderRow key={key} name={key} value={value} />
        ))}
      </div>
    </div>
  );
}

export function EventHeaders({ context }: EventHeadersProps) {
  const {
    requestUrl,
    method,
    statusCode,
    statusText,
    requestHeaders,
    responseHeaders,
  } = context;

  const hasGeneralInfo = Boolean(requestUrl || method || statusCode);
  const hasRequestHeaders = Boolean(requestHeaders && Object.keys(requestHeaders).length > 0);
  const hasResponseHeaders = Boolean(responseHeaders && Object.keys(responseHeaders).length > 0);

  if (!hasGeneralInfo && !hasRequestHeaders && !hasResponseHeaders) {
    return null;
  }

  const statusCodeNum = statusCode ? parseInt(statusCode, 10) : null;
  const isErrorStatus = statusCodeNum !== null && statusCodeNum >= 400;

  return (
    <div className="space-y-4">
      {hasGeneralInfo && (
        <div>
          <Text strong className="text-sm text-gray-700 block mb-2">
            Общие
          </Text>
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            {requestUrl && (
              <div className="flex items-start gap-2 py-1.5 border-b border-gray-100">
                <Text className="font-mono text-xs text-gray-600 min-w-[180px] font-medium">
                  URL Запроса:
                </Text>
                <Text className="font-mono text-xs text-gray-900 break-all flex-1">
                  {requestUrl}
                </Text>
              </div>
            )}
            {method && (
              <div className="flex items-start gap-2 py-1.5 border-b border-gray-100">
                <Text className="font-mono text-xs text-gray-600 min-w-[180px] font-medium">
                  Метод Запроса:
                </Text>
                <Text className="font-mono text-xs text-gray-900 break-all flex-1">
                  {method.toUpperCase()}
                </Text>
              </div>
            )}
            {statusCode && (
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
            )}
          </div>
        </div>
      )}

      {hasResponseHeaders && (
        <HeadersSection title="Заголовки ответов" headers={responseHeaders} />
      )}
      {hasRequestHeaders && (
        <HeadersSection title="Заголовки запросов" headers={requestHeaders} />
      )}
    </div>
  );
}

