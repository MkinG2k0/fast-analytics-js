"use client";

import { useCallback } from "react";
import { Card, Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { JsonViewer } from "@/shared/ui";
import type { ParsedEventContext } from "../lib";
import { EventUrlDisplay } from "./event-url-display";

interface EventHttpRequestProps {
  context: ParsedEventContext;
}

function getRequestDataToCopy(context: ParsedEventContext): string | null {
  const { requestData, requestBody, requestUrl } = context;

  if (requestData) {
    try {
      return JSON.stringify(requestData, null, 2);
    } catch {
      return String(requestData);
    }
  }

  if (requestBody) {
    return String(requestBody);
  }

  if (requestUrl) {
    return requestUrl;
  }

  return null;
}

export function EventHttpRequest({ context }: EventHttpRequestProps) {
  const { requestData, requestBody, hasRequestData, requestUrl } = context;

  const handleCopy = useCallback(() => {
    const dataToCopy = getRequestDataToCopy(context);
    if (dataToCopy) {
      navigator.clipboard.writeText(dataToCopy);
      message.success("Запрос скопирован в буфер обмена");
    }
  }, [context]);

  if (!hasRequestData) {
    if (!requestUrl) {
      return null;
    }

    return (
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="font-semibold">HTTP Запрос</span>
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={handleCopy}
              type="text"
            />
          </div>
        }
      >
        <EventUrlDisplay url={requestUrl} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span className="font-semibold">HTTP Запрос</span>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={handleCopy}
            type="text"
          />
        </div>
      }
      styles={{ body: { padding: 0 } }}
    >
      {requestData ? (
        <JsonViewer data={requestData} defaultExpanded />
      ) : requestBody ? (
        (() => {
          try {
            const parsed = JSON.parse(String(requestBody));
            return <JsonViewer data={parsed} defaultExpanded />;
          } catch {
            return (
              <pre className="json-viewer overflow-auto max-h-96 whitespace-pre-wrap text-xs bg-gray-50 rounded border">
                {String(requestBody)}
              </pre>
            );
          }
        })()
      ) : null}
    </Card>
  );
}
