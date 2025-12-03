"use client";

import { Collapse } from "antd";
import { useState } from "react";

interface JsonViewerProps {
  data: unknown;
  title?: string;
}

export function JsonViewer({ data, title }: JsonViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <Collapse
      items={[
        {
          key: "1",
          label: title || "JSON данные",
          children: (
            <pre className="json-viewer overflow-auto max-h-96">
              {jsonString}
            </pre>
          ),
        },
      ]}
      onChange={() => setIsOpen(!isOpen)}
    />
  );
}

