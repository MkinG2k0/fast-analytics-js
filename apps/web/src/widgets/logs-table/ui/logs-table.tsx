"use client";

import { useState, useMemo, useEffect } from "react";
import { App, Button, Table } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEventsQuery } from "@/features/view-project-logs/lib";
import { deleteEvent } from "@/shared/api/events";
import { createColumns } from "../lib";
import { useLogsTableStore } from "../model";
import type { LogsTableProps } from "../model";

export function LogsTable({ projectId }: LogsTableProps) {
  const { message } = App.useApp();
  const { filters, pagination, setFilter, setPagination } = useLogsTableStore();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useEventsQuery({
    projectId,
    filters,
    page: pagination.current,
    pageSize: pagination.pageSize,
  });

  const columns = useMemo(
    () => createColumns({ filters, router, setFilter }),
    [filters, router, setFilter]
  );

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize });
  };

  const handleDelete = async () => {
    if (selectedRowKeys.length === 0) {
      return;
    }

    try {
      setIsDeleting(true);
      const deletePromises = selectedRowKeys.map((id) =>
        deleteEvent(id as string)
      );
      await Promise.all(deletePromises);

      message.success(`Успешно удалено событий: ${selectedRowKeys.length}`);
      setSelectedRowKeys([]);

      await queryClient.invalidateQueries({
        queryKey: ["events", projectId],
      });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка при удалении событий"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (error) {
      message.error("Ошибка при загрузке событий");
    }
  }, [error, message]);

  useEffect(() => {
    setSelectedRowKeys([]);
  }, [pagination, filters]);

  return (
    <div className="relative h-full">
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <Table
          columns={columns}
          dataSource={data?.events}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: "max-content", y: "calc(100vh - 295px)" }}
          className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-tbody>tr:hover]:bg-blue-50/50"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Всего: ${total}`,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
            rootClassName: "!mr-2",
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </div>
      {selectedRowKeys.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-4 flex items-center gap-4">
            <span className="text-sm text-gray-600 whitespace-nowrap">
              Выбрано событий: {selectedRowKeys.length}
            </span>

            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              loading={isDeleting}
              disabled={isDeleting}
            >
              Удалить выбранные
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
