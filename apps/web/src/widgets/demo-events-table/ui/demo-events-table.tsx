"use client";

import { useState, useMemo } from "react";
import { Table, Button, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { createColumns } from "@/widgets/logs-table/lib";
import type { Event, EventLevel } from "@/entities/event";
import { mockEvents } from "@/features/demo-sdk";
import { Card } from "@/shared/ui";

const { Title } = Typography;

interface DemoEventsTableProps {
	filters: {
		level: EventLevel | undefined;
		search: string | undefined;
		url: string | undefined;
		userId: string | undefined;
		startDate: string | undefined;
		endDate: string | undefined;
	};
	setFilter: (
		filterName: keyof DemoEventsTableProps["filters"],
		value: string | EventLevel | undefined
	) => void;
}

export function DemoEventsTable({ filters, setFilter }: DemoEventsTableProps) {
	const router = useRouter();
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

	const columns = useMemo(
		() => createColumns({ filters, router, setFilter }),
		[filters, router, setFilter]
	);

	return (
		<div className="relative h-full mb-8">
			<Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
				<Title level={4} className="!mb-4">
					📊 События и логи
				</Title>
				<div className="bg-white rounded-lg overflow-hidden border border-gray-200">
					<Table
						columns={columns}
						dataSource={mockEvents}
						rowKey="id"
						scroll={{ x: "max-content", y: "calc(100vh - 295px)" }}
						className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-tbody>tr:hover]:bg-blue-50/50"
						pagination={{
							current: pagination.current,
							pageSize: pagination.pageSize,
							total: mockEvents.length,
							showSizeChanger: true,
							showTotal: (total) => `Всего: ${total}`,
							onChange: (page, pageSize) => {
								setPagination({ current: page, pageSize });
							},
							onShowSizeChange: (current, size) => {
								setPagination({ current: 1, pageSize: size });
							},
							rootClassName: "!mr-2",
						}}
						rowSelection={{
							selectedRowKeys,
							onChange: setSelectedRowKeys,
						}}
					/>
				</div>
			</Card>
			{selectedRowKeys.length > 0 && (
				<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
					<div className="bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-4 flex items-center gap-4">
						<span className="text-sm text-gray-600 whitespace-nowrap">
							Выбрано событий: {selectedRowKeys.length}
						</span>
						<Button
							danger
							icon={<DeleteOutlined />}
							onClick={() => {
								setSelectedRowKeys([]);
							}}
						>
							Удалить выбранные
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

