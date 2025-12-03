"use client";

import { Layout, Button, Dropdown, Space } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import type { MenuProps } from "antd";

const { Header: AntHeader } = Layout;

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "logout",
      label: "Выйти",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const userName = session?.user?.name || session?.user?.email;

  return (
    <AntHeader className="!bg-white shadow-sm flex items-center justify-between px-6">
      <div className="text-xl font-bold">Fast Analytics</div>
      <Space>
        {userName && <span>{userName}</span>}
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />}>
            Профиль
          </Button>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
