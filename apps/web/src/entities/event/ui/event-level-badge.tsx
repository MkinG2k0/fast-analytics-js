"use client";

import { Tag } from "antd";
import { getLevelColorConfig } from "../model/constants";

interface EventLevelBadgeProps {
  level: string;
}

export function EventLevelBadge({ level }: EventLevelBadgeProps) {
  const levelConfig = getLevelColorConfig(level);

  return (
    <Tag
      style={{
        backgroundColor: levelConfig.bg,
        color: levelConfig.color,
        border: `1px solid ${levelConfig.color}20`,
        fontWeight: 600,
        fontSize: "12px",
        padding: "2px 10px",
        borderRadius: "6px",
      }}
    >
      {level.toUpperCase()}
    </Tag>
  );
}

