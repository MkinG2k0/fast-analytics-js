"use client";

import { Form, Select, DatePicker, Input, Button, Space } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import type { EventLevel } from "@repo/types";
import dayjs from "@/shared/config/dayjs";

const { RangePicker } = DatePicker;

interface LogsFilterProps {
  onFilter: (filters: {
    level?: EventLevel;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => void;
  onReset: () => void;
}

export function LogsFilter({ onFilter, onReset }: LogsFilterProps) {
  const [form] = Form.useForm();

  const handleSubmit = (values: {
    level?: EventLevel;
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
    search?: string;
  }) => {
    onFilter({
      level: values.level,
      startDate: values.dateRange?.[0]?.toISOString(),
      endDate: values.dateRange?.[1]?.toISOString(),
      search: values.search,
    });
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      layout="inline"
      className="mb-4"
    >
      <Form.Item name="level">
        <Select
          placeholder="Уровень"
          allowClear
          style={{ width: 120 }}
          options={[
            { label: "Error", value: "error" },
            { label: "Warning", value: "warn" },
            { label: "Info", value: "info" },
            { label: "Debug", value: "debug" },
          ]}
        />
      </Form.Item>

      <Form.Item name="dateRange">
        <RangePicker showTime />
      </Form.Item>

      <Form.Item name="search">
        <Input
          placeholder="Поиск по сообщению"
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            Применить
          </Button>
          <Button onClick={handleReset} icon={<ReloadOutlined />}>
            Сбросить
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

