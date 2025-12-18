"use client";

import { Select, DatePicker, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "@/shared/config/dayjs";

const { RangePicker } = DatePicker;

type GroupBy = "url" | "date" | "hour";

interface AnalyticsFiltersProps {
  groupBy: GroupBy;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  loading: boolean;
  onGroupByChange: (value: GroupBy) => void;
  onDateRangeChange: (dates: unknown) => void;
  onRefresh: () => void;
}

export function AnalyticsFilters({
  groupBy,
  dateRange,
  loading,
  onGroupByChange,
  onDateRangeChange,
  onRefresh,
}: AnalyticsFiltersProps) {
  return (
    <Space>
      <Select
        value={groupBy}
        onChange={onGroupByChange}
        style={{ width: 150 }}
        options={[
          { label: "По URL", value: "url" },
          { label: "По дате", value: "date" },
          { label: "По часам", value: "hour" },
        ]}
      />
      <RangePicker
        value={dateRange}
        onChange={onDateRangeChange}
        placeholder={["Начальная дата", "Конечная дата"]}
      />
      <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
        Обновить
      </Button>
    </Space>
  );
}
