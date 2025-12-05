"use client";

import { Form, Select, DatePicker, Input, Button, Space, Row, Col } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import type { EventLevel } from "@/entities/event";
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
    <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <FilterOutlined className="text-gray-500" />
        <span className="font-semibold text-gray-700">Фильтры</span>
      </div>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item
              name="level"
              label={
                <span className="text-sm font-medium text-gray-600">
                  Уровень
                </span>
              }
            >
              <Select
                placeholder="Выберите уровень"
                allowClear
                options={[
                  { label: "Error", value: "error" },
                  { label: "Warning", value: "warn" },
                  { label: "Info", value: "info" },
                  { label: "Debug", value: "debug" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={10}>
            <Form.Item
              name="dateRange"
              label={
                <span className="text-sm font-medium text-gray-600">
                  Период
                </span>
              }
            >
              <RangePicker
                showTime
                className="w-full"
                placeholder={["Начальная дата", "Конечная дата"]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="search"
              label={
                <span className="text-sm font-medium text-gray-600">Поиск</span>
              }
            >
              <Input
                placeholder="Поиск по сообщению"
                prefix={<SearchOutlined className="text-gray-400" />}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item className="mb-0">
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SearchOutlined />}
              className="shadow-sm"
            >
              Применить
            </Button>
            <Button onClick={handleReset} icon={<ReloadOutlined />}>
              Сбросить
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
