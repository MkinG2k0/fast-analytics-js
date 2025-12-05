"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Table,
  Statistic,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Tooltip,
  Typography,
} from "antd";
import { ReloadOutlined, BarChartOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "@/shared/config/dayjs";
import { getPageVisitsAnalytics } from "@/shared/api/page-visits";
import type { PageVisitsAnalytics, PageVisit } from "@/shared/api/page-visits";
import { EventUrlDisplay } from "@/entities/event";

const { Text } = Typography;

const { RangePicker } = DatePicker;

interface PageVisitsAnalyticsProps {
  projectId: string;
}

type GroupBy = "url" | "date" | "hour";

export function PageVisitsAnalytics({ projectId }: PageVisitsAnalyticsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<PageVisitsAnalytics | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("url");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    [dayjs().subtract(1, "month"), dayjs()]
  );

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getPageVisitsAnalytics({
        projectId,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
        groupBy,
      });
      setAnalytics(data);
    } catch {
      message.error("Ошибка загрузки аналитики посещений");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, groupBy, dateRange]);

  const handleGroupByChange = (value: GroupBy) => {
    setGroupBy(value);
  };

  const handleDateRangeChange = (dates: unknown) => {
    setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
  };

  const handleRefresh = () => {
    loadAnalytics();
  };

  const analyticsColumns: ColumnsType<PageVisitsAnalytics["analytics"][0]> = [
    {
      title: groupBy === "url" ? "URL" : groupBy === "date" ? "Дата" : "Час",
      dataIndex:
        groupBy === "url" ? "url" : groupBy === "date" ? "date" : "hour",
      key: "key",
      width: 300,
      ellipsis: groupBy === "url" ? { showTitle: false } : false,
      render: (text: string, record) => {
        if (groupBy === "url") {
          if (!text) {
            return <Text className="text-gray-400">—</Text>;
          }

          const shortUrl =
            text.startsWith("http://") || text.startsWith("https://")
              ? text.replace(/^https?:\/\//, "")
              : text;

          // Формируем читаемую строку для отображения
          let displayText = record.pathname || shortUrl;
          try {
            const urlObj = new URL(
              text.startsWith("http") ? text : `http://${text}`
            );
            displayText =
              record.pathname ||
              `${urlObj.host}${urlObj.pathname}${urlObj.hash || ""}`;
          } catch {
            // Если не удалось распарсить, используем pathname или исходный URL без протокола
            displayText = record.pathname || shortUrl;
          }

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
              <div>
                <Text
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                  ellipsis={{ tooltip: false }}
                  style={{ display: "block" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const fullUrl =
                      text.startsWith("http://") || text.startsWith("https://")
                        ? text
                        : `http://${text}`;
                    window.open(fullUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  {displayText}
                </Text>
              </div>
            </Tooltip>
          );
        }
        return text;
      },
    },
    {
      title: "Посещений",
      dataIndex: "visits",
      key: "visits",
      sorter: (a, b) => a.visits - b.visits,
      defaultSortOrder: "descend",
    },
    {
      title: "Уникальных сессий",
      dataIndex: "uniqueSessions",
      key: "uniqueSessions",
      sorter: (a, b) => a.uniqueSessions - b.uniqueSessions,
    },
    {
      title: "Ошибок",
      dataIndex: "errors",
      key: "errors",
      render: (value: number, record) => {
        const isClickable = value > 0 && groupBy === "url" && record.url;

        const handleClick = () => {
          if (isClickable) {
            const urlParams = new URLSearchParams({
              level: "error",
              url: record.url!,
            });
            if (dateRange?.[0]) {
              urlParams.set("startDate", dateRange[0].toISOString());
            }
            if (dateRange?.[1]) {
              urlParams.set("endDate", dateRange[1].toISOString());
            }
            router.push(`/project/${projectId}/logs?${urlParams.toString()}`);
          }
        };

        return (
          <span
            className={
              value > 0
                ? isClickable
                  ? "text-red-500 font-semibold cursor-pointer hover:text-red-700 hover:underline"
                  : "text-red-500 font-semibold"
                : ""
            }
            onClick={isClickable ? handleClick : undefined}
          >
            {value || 0}
          </span>
        );
      },
      sorter: (a, b) => (a.errors || 0) - (b.errors || 0),
      defaultSortOrder: "descend",
    },
    ...(groupBy === "url"
      ? [
          {
            title: "Среднее время (мс)",
            dataIndex: "avgDuration",
            key: "avgDuration",
            render: (value: number) =>
              value ? `${value.toLocaleString()} мс` : "-",
            sorter: (a, b) => (a.avgDuration || 0) - (b.avgDuration || 0),
          },
        ]
      : []),
  ];

  const visitsColumns: ColumnsType<PageVisit> = [
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (text: string, record) => (
        <div>
          <div className="font-medium">{record.pathname || text}</div>
          {record.pathname && text !== record.pathname && (
            <div className="text-xs text-gray-500 truncate max-w-md">
              {text}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Время",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text: string) => dayjs(text).format("DD.MM.YYYY HH:mm:ss"),
    },
    {
      title: "Длительность",
      dataIndex: "duration",
      key: "duration",
      render: (value: number | null) =>
        value ? `${Math.round(value / 1000)} сек` : "-",
    },
    {
      title: "Сессия",
      dataIndex: "sessionId",
      key: "sessionId",
      render: (value: string | null) =>
        value ? (
          <span className="text-xs font-mono text-gray-600">
            {value.slice(0, 8)}...
          </span>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChartOutlined className="text-blue-500 text-lg" />
            <span className="font-semibold text-lg">Аналитика посещений</span>
          </div>
          <Space>
            <Select
              value={groupBy}
              onChange={handleGroupByChange}
              style={{ width: 150 }}
              options={[
                { label: "По URL", value: "url" },
                { label: "По дате", value: "date" },
                { label: "По часам", value: "hour" },
              ]}
            />
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={["Начальная дата", "Конечная дата"]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Обновить
            </Button>
          </Space>
        </div>

        {analytics && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Всего посещений"
                  value={analytics.summary.totalVisits}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Уникальных сессий"
                  value={analytics.summary.uniqueSessions}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Среднее время (мс)"
                  value={analytics.summary.avgDuration}
                  valueStyle={{ color: "#cf1322" }}
                  suffix="мс"
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Всего ошибок"
                  value={analytics.summary.totalErrors}
                  valueStyle={{ color: "#ff4d4f" }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      <Card title="Статистика по группам" loading={loading}>
        <Table
          columns={analyticsColumns}
          dataSource={analytics?.analytics || []}
          rowKey={(record, index) =>
            record.url || record.date || record.hour || String(index)
          }
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Card title="Последние посещения" loading={loading}>
        <Table
          columns={visitsColumns}
          dataSource={analytics?.visits || []}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
