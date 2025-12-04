"use client";

import { useCallback } from "react";
import { Card, Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { JsonViewer } from "@/shared/ui";
import type { ParsedEventContext } from "../lib";

interface EventHttpResponseProps {
  context: ParsedEventContext;
}

function getResponseDataToCopy(context: ParsedEventContext): string | null {
  const { responseData, responseBody } = context;

  if (responseData) {
    try {
      return JSON.stringify(responseData, null, 2);
    } catch {
      return String(responseData);
    }
  }

  if (responseBody) {
    return String(responseBody);
  }

  return null;
}

export function EventHttpResponse({ context }: EventHttpResponseProps) {
  const { responseData, responseBody, hasResponseData } = context;

  const handleCopy = useCallback(() => {
    const dataToCopy = getResponseDataToCopy(context);
    if (dataToCopy) {
      navigator.clipboard.writeText(dataToCopy);
      message.success("Ответ скопирован в буфер обмена");
    }
  }, [context]);

  if (!hasResponseData) {
    return null;
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span className="font-semibold">HTTP Ответ</span>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={handleCopy}
            type="text"
          />
        </div>
      }
      bodyStyle={{ padding: 0 }}
    >
      {responseData ? (
        <JsonViewer data={responseData} defaultExpanded />
      ) : responseBody ? (
        (() => {
          try {
            const parsed = JSON.parse(String(responseBody));
            return <JsonViewer data={parsed} defaultExpanded />;
          } catch {
            return (
              <pre className="json-viewer overflow-auto max-h-96 whitespace-pre-wrap text-xs bg-gray-50 rounded border">
                {String(responseBody)}
              </pre>
            );
          }
        })()
      ) : null}
    </Card>
  );
}
