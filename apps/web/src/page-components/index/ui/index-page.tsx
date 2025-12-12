"use client";

import { useState, useMemo } from "react";
import { Typography } from "antd";
import { BarChartOutlined } from "@ant-design/icons";
import { Card } from "@/shared/ui";
import { DemoHeader } from "@/widgets/demo-header";
import { DemoEventsTable } from "@/widgets/demo-events-table";
import { DemoInfo } from "@/widgets/demo-info";
import { EventDetails } from "@/features/view-log-details";
import { PageVisitsAnalytics } from "@/features/page-visits-analytics";
import { mockEvents } from "@/features/demo-sdk";
import type { EventLevel } from "@/entities/event";

const { Title, Paragraph } = Typography;

export function IndexPage() {
  const [filters, setFiltersState] = useState({
    level: undefined as EventLevel | undefined,
    search: undefined as string | undefined,
    url: undefined as string | undefined,
    userId: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  const setFilter = useMemo(
    () =>
      (
        filterName: keyof typeof filters,
        value: string | EventLevel | undefined
      ) => {
        setFiltersState((prev) => ({ ...prev, [filterName]: value }));
      },
    []
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-200">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <DemoHeader />

        <DemoEventsTable filters={filters} setFilter={setFilter} />

        {mockEvents[0] && (
          <div className="mt-8 lg:mt-10">
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <Title level={4} className="!mb-4">
                📋 Демонстрация деталей события
              </Title>
              <Paragraph className="text-gray-600 dark:text-gray-300 mb-6">
                Пример отображения детальной информации о событии с полным
                контекстом, стеком ошибки и метаданными.
              </Paragraph>
              <EventDetails event={mockEvents[0]} />
            </Card>
          </div>
        )}

        <div className="mt-8 lg:mt-10">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <BarChartOutlined className="!text-white text-lg" />
              </div>
              <div>
                <Title level={4} className="!mb-0">
                  📊 Демонстрация аналитики посещений
                </Title>
                <Paragraph className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  Пример аналитики посещений страниц с группировкой по URL, дате
                  и часам
                </Paragraph>
              </div>
            </div>
            {/* <PageVisitsAnalytics projectId="demo-project" /> */}
          </Card>
        </div>

        <DemoInfo />
      </div>
    </div>
  );
}
