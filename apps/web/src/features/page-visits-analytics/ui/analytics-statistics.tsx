"use client";

import { Card, Row, Col, Statistic } from "antd";
import type { PageVisitsAnalytics } from "@/shared/api/page-visits";

interface AnalyticsStatisticsProps {
  onlineUsersCount: number;
  analytics: PageVisitsAnalytics | undefined;
  loading: boolean;
}

export function AnalyticsStatistics({
  onlineUsersCount,
  analytics,
  loading,
}: AnalyticsStatisticsProps) {
  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={24} sm={6}>
        <Card>
          <Statistic
            title="Онлайн пользователей"
            value={onlineUsersCount}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={6}>
        <Card>
          <Statistic
            title="Всего посещений"
            value={analytics?.summary.totalVisits}
            valueStyle={{ color: "#3f8600" }}
            loading={loading || !analytics}
          />
        </Card>
      </Col>
      <Col xs={24} sm={6}>
        <Card>
          <Statistic
            title="Уникальных сессий"
            value={analytics?.summary.uniqueSessions}
            valueStyle={{ color: "#1890ff" }}
            loading={loading || !analytics}
          />
        </Card>
      </Col>
      <Col xs={24} sm={6}>
        <Card>
          <Statistic
            title="Среднее время (мс)"
            value={analytics?.summary.avgDuration}
            suffix="мс"
            loading={loading || !analytics}
          />
        </Card>
      </Col>
      <Col xs={24} sm={6}>
        <Card>
          <Statistic
            title="Всего ошибок"
            value={analytics?.summary.totalErrors}
            valueStyle={{ color: "#ff4d4f" }}
            loading={loading || !analytics}
          />
        </Card>
      </Col>
    </Row>
  );
}
