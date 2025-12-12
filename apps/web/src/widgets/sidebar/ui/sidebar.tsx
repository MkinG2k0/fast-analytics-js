"use client";

import { Layout, Menu } from "antd";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { useMemo } from "react";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string | undefined;
  const menuItems: MenuProps["items"] = useMemo(() => {
    if (!projectId) {
      return [];
    }

    return [
      {
        key: `/project/${projectId}/logs`,
        icon: <FileTextOutlined />,
        label: "Логи",
        onClick: () => {
          router.push(`/project/${projectId}/logs`);
        },
      },
      {
        key: `/project/${projectId}/analytics`,
        icon: <BarChartOutlined />,
        label: "Аналитика",
        onClick: () => {
          router.push(`/project/${projectId}/analytics`);
        },
      },
      {
        key: `/project/${projectId}/settings`,
        icon: <SettingOutlined />,
        label: "Настройки",
        onClick: () => {
          router.push(`/project/${projectId}/settings`);
        },
      },
    ];
  }, [projectId, router]);

  if (!projectId || menuItems.length === 0) {
    return (
      <Sider
        collapsible
        collapsed={collapsed}
        width={240}
        className=" !bg-white !border-r !border-gray-200"
        theme="light"
        trigger={null}
      />
    );
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      width={240}
      className=" !bg-white !border-r !border-gray-200"
      theme="light"
      trigger={null}
    >
      <Menu
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[pathname]}
        items={menuItems}
        className="border-r-0 pt-4"
        style={{
          backgroundColor: "transparent",
        }}
      />
    </Sider>
  );
}
