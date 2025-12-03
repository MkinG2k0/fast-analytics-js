"use client";

import { Layout, Menu } from "antd";
import { ProjectOutlined, HomeOutlined } from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";

const { Sider } = Layout;

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: "/projects",
      icon: <HomeOutlined />,
      label: "Проекты",
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  return (
    <Sider width={200} className="min-h-screen">
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        className="h-full"
      />
    </Sider>
  );
}

