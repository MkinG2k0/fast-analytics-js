"use client";

import * as React from "react";
import { Typography, Tooltip } from "antd";
import { EventUrlDisplay } from "./event-url-display";

const { Text } = Typography;

interface TableUrlCellProps {
  url: string | null | undefined;
  className?: string;
  showHost?: boolean;
}

export function TableUrlCell({
  url,
  className,
  showHost = false,
}: TableUrlCellProps) {
  if (!url) {
    return <Text className="text-gray-400">—</Text>;
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const shortUrl = decodedUrl.slice(8);
    const urlObj = new URL(decodedUrl);
    const displayText = showHost
      ? `${urlObj.host}${urlObj.pathname}${urlObj.hash || ""}`
      : `${urlObj.pathname}${urlObj.hash || ""}`;

    return (
      <Tooltip
        title={<EventUrlDisplay url={shortUrl} />}
        styles={{
          body: {
            maxWidth: "900px",
            minWidth: "300px",
            width: "500px",
            backgroundColor: "white",
          },
        }}
        placement="topLeft"
      >
        <Text
          className={`text-sm font-mono text-blue-600 hover:text-blue-800 cursor-pointer ${
            className || ""
          }`}
          ellipsis={{ tooltip: false }}
          style={{ display: "block", maxWidth: "100%" }}
          onClick={() => {
            window.open(decodedUrl, "_blank", "noopener,noreferrer");
          }}
        >
          {displayText}
        </Text>
      </Tooltip>
    );
  } catch {
    return <Text className="text-gray-400">{url}</Text>;
  }
}
