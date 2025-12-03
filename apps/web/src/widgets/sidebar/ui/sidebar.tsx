"use client";

import { Layout, Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { ProjectOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems: MenuProps["items"] = [
    {
      key: "/projects",
      icon: <ProjectOutlined />,
      label: "Проекты",
      onClick: () => router.push("/projects"),
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      width={240}
      className="min-h-screen !bg-white !border-r !border-gray-200"
      theme="light"
      trigger={null}
    >
      <div className="h-full flex flex-col">
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          className="h-full border-r-0 pt-4"
          style={{
            backgroundColor: "transparent",
          }}
        />
      </div>
    </Sider>
  );
}

