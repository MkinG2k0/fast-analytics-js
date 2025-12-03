"use client";

import { useState } from "react";
import { CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";

interface JsonViewerProps {
  data: unknown;
  title?: string;
  defaultExpanded?: boolean;
  maxHeight?: number;
}

interface JsonValueProps {
  value: unknown;
  level?: number;
  defaultExpanded?: boolean;
}

function JsonValue({ value, level = 0, defaultExpanded = false }: JsonValueProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || level < 2);

  if (value === null) {
    return <span className="json-null">null</span>;
  }

  if (value === undefined) {
    return <span className="json-undefined">undefined</span>;
  }

  if (typeof value === "string") {
    return <span className="json-string">"{value}"</span>;
  }

  if (typeof value === "number") {
    return <span className="json-number">{value}</span>;
  }

  if (typeof value === "boolean") {
    return <span className="json-boolean">{value ? "true" : "false"}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span>
          <span className="json-bracket">[</span>
          <span className="json-bracket">]</span>
        </span>
      );
    }

    return (
      <div className="json-array">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="json-toggle inline-flex items-center gap-1 hover:bg-gray-100 rounded px-1 -ml-1 transition-colors"
          aria-label={isExpanded ? "Свернуть" : "Развернуть"}
        >
          {isExpanded ? (
            <CaretDownOutlined className="text-gray-500 text-xs" />
          ) : (
            <CaretRightOutlined className="text-gray-500 text-xs" />
          )}
          <span className="json-bracket">[</span>
          <span className="text-gray-500 text-xs">{value.length}</span>
          <span className="json-bracket">]</span>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1">
            {value.map((item, index) => (
              <div key={index} className="json-item">
                <span className="json-key text-gray-500">{index}:</span>
                <span className="ml-2">
                  <JsonValue value={item} level={level + 1} defaultExpanded={defaultExpanded} />
                </span>
                {index < value.length - 1 && <span className="json-comma">,</span>}
              </div>
            ))}
          </div>
        )}
        {!isExpanded && <span className="json-bracket ml-1">...</span>}
      </div>
    );
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return (
        <span>
          <span className="json-bracket">{"{"}</span>
          <span className="json-bracket">{"}"}</span>
        </span>
      );
    }

    return (
      <div className="json-object">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="json-toggle inline-flex items-center gap-1 hover:bg-gray-100 rounded px-1 -ml-1 transition-colors"
          aria-label={isExpanded ? "Свернуть" : "Развернуть"}
        >
          {isExpanded ? (
            <CaretDownOutlined className="text-gray-500 text-xs" />
          ) : (
            <CaretRightOutlined className="text-gray-500 text-xs" />
          )}
          <span className="json-bracket">{"{"}</span>
          <span className="text-gray-500 text-xs">{entries.length}</span>
          <span className="json-bracket">{"}"}</span>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1">
            {entries.map(([key, val], index) => (
              <div key={key} className="json-item">
                <span className="json-key">"{key}"</span>
                <span className="json-colon">:</span>
                <span className="ml-2">
                  <JsonValue value={val} level={level + 1} defaultExpanded={defaultExpanded} />
                </span>
                {index < entries.length - 1 && <span className="json-comma">,</span>}
              </div>
            ))}
          </div>
        )}
        {!isExpanded && <span className="json-bracket ml-1">...</span>}
      </div>
    );
  }

  return <span className="json-unknown">{String(value)}</span>;
}

export function JsonViewer({ data, title, defaultExpanded = false, maxHeight = 400 }: JsonViewerProps) {
  return (
    <div className="json-viewer-container">
      {title && <div className="json-viewer-title mb-2 font-semibold text-sm">{title}</div>}
      <div
        className="json-viewer-wrapper overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-sm"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <JsonValue value={data} level={0} defaultExpanded={defaultExpanded} />
      </div>
    </div>
  );
}

