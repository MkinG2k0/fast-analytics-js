"use client";

import { useState, useCallback, useRef } from "react";
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
  keyName?: string;
  isArrayItem?: boolean;
  toggleRef?: React.MutableRefObject<(() => void) | null>;
}

interface JsonLineProps {
  children: React.ReactNode;
  isCollapsible: boolean;
  toggleRef?: React.MutableRefObject<(() => void) | null>;
  index?: number;
  keyName?: string;
  isLast?: boolean;
}

function JsonLine({
  children,
  isCollapsible,
  toggleRef,
  index,
  keyName,
  isLast,
}: JsonLineProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsible && toggleRef?.current) {
        e.stopPropagation();
        toggleRef.current();
      }
    },
    [isCollapsible, toggleRef]
  );

  return (
    <div
      className={`json-line ${isCollapsible ? "json-line-clickable" : ""}`}
      onClick={handleClick}
    >
      {typeof index === "number" && (
        <>
          <span className="json-index">{index}</span>
          <span className="json-colon">:</span>
        </>
      )}
      {keyName && (
        <>
          <span className="json-key">"{keyName}"</span>
          <span className="json-colon">:</span>
        </>
      )}
      <span className="json-value-wrapper">{children}</span>
      {!isLast && <span className="json-comma">,</span>}
    </div>
  );
}

interface JsonArrayItemProps {
  item: unknown;
  index: number;
  level: number;
  defaultExpanded: boolean;
  isLast: boolean;
}

function JsonArrayItem({
  item,
  index,
  level,
  defaultExpanded,
  isLast,
}: JsonArrayItemProps) {
  const itemToggleRef = useRef<(() => void) | null>(null);
  const isCollapsible =
    Array.isArray(item) || (typeof item === "object" && item !== null);

  return (
    <JsonLine
      isCollapsible={isCollapsible}
      toggleRef={itemToggleRef}
      index={index}
      isLast={isLast}
    >
      <JsonValue
        value={item}
        level={level + 1}
        defaultExpanded={defaultExpanded}
        isArrayItem
        toggleRef={itemToggleRef}
      />
    </JsonLine>
  );
}

interface JsonObjectItemProps {
  keyName: string;
  value: unknown;
  level: number;
  defaultExpanded: boolean;
  isLast: boolean;
}

function JsonObjectItem({
  keyName,
  value,
  level,
  defaultExpanded,
  isLast,
}: JsonObjectItemProps) {
  const valToggleRef = useRef<(() => void) | null>(null);
  const isCollapsible =
    Array.isArray(value) || (typeof value === "object" && value !== null);

  return (
    <JsonLine
      isCollapsible={isCollapsible}
      toggleRef={valToggleRef}
      keyName={keyName}
      isLast={isLast}
    >
      <JsonValue
        value={value}
        level={level + 1}
        defaultExpanded={defaultExpanded}
        keyName={keyName}
        toggleRef={valToggleRef}
      />
    </JsonLine>
  );
}

function JsonValue({
  value,
  level = 0,
  defaultExpanded = false,
  keyName,
  isArrayItem = false,
  toggleRef,
}: JsonValueProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || level < 2);

  const handleToggle = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsExpanded((prev) => !prev);
  }, []);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  if (toggleRef) {
    toggleRef.current = toggle;
  }

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
        <span className="json-empty">
          <span className="json-bracket">[</span>
          <span className="json-bracket">]</span>
        </span>
      );
    }

    return (
      <span className="json-array json-collapsible-container">
        <button
          type="button"
          onClick={handleToggle}
          className="json-toggle"
          aria-label={isExpanded ? "Свернуть" : "Развернуть"}
        >
          {isExpanded ? (
            <CaretDownOutlined className="json-toggle-icon" />
          ) : (
            <CaretRightOutlined className="json-toggle-icon" />
          )}
        </button>
        <span className="json-bracket">[</span>
        {!isExpanded && (
          <span className="json-preview">
            <span className="json-preview-count">{value.length}</span>
            <span className="json-bracket">]</span>
            <span className="json-ellipsis">…</span>
          </span>
        )}
        {isExpanded && (
          <>
            <div className="json-children">
              {value.map((item, index) => (
                <JsonArrayItem
                  key={index}
                  item={item}
                  index={index}
                  level={level}
                  defaultExpanded={defaultExpanded}
                  isLast={index === value.length - 1}
                />
              ))}
            </div>
            <span className="json-bracket">]</span>
          </>
        )}
      </span>
    );
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return (
        <span className="json-empty">
          <span className="json-bracket">{"{"}</span>
          <span className="json-bracket">{"}"}</span>
        </span>
      );
    }

    return (
      <span className="json-object json-collapsible-container">
        <button
          type="button"
          onClick={handleToggle}
          className="json-toggle"
          aria-label={isExpanded ? "Свернуть" : "Развернуть"}
        >
          {isExpanded ? (
            <CaretDownOutlined className="json-toggle-icon" />
          ) : (
            <CaretRightOutlined className="json-toggle-icon" />
          )}
        </button>
        <span className="json-bracket">{"{"}</span>
        {!isExpanded && (
          <span className="json-preview">
            <span className="json-preview-count">{entries.length}</span>
            <span className="json-bracket">{"}"}</span>
            <span className="json-ellipsis">…</span>
          </span>
        )}
        {isExpanded && (
          <>
            <div className="json-children">
              {entries.map(([key, val], index) => (
                <JsonObjectItem
                  key={key}
                  keyName={key}
                  value={val}
                  level={level}
                  defaultExpanded={defaultExpanded}
                  isLast={index === entries.length - 1}
                />
              ))}
            </div>
            <span className="json-bracket">
              <br />
              {"}"}
            </span>
          </>
        )}
      </span>
    );
  }

  return <span className="json-unknown">{String(value)}</span>;
}

export function JsonViewer({
  data,
  title,
  defaultExpanded = false,
  maxHeight = 400,
}: JsonViewerProps) {
  return (
    <div className="json-viewer-container">
      {title && (
        <div className="json-viewer-title mb-2 font-semibold text-sm">
          {title}
        </div>
      )}
      <div
        className="json-viewer-wrapper"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        <JsonValue value={data} level={0} defaultExpanded={defaultExpanded} />
      </div>
    </div>
  );
}
