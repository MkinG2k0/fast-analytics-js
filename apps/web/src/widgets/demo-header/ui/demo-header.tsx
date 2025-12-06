"use client";

import { Space } from "antd";
import {
	LoginOutlined,
	LogoutOutlined,
	DashboardOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Typography } from "antd";
import { Button } from "@/shared/ui";

const { Title, Paragraph } = Typography;

export function DemoHeader() {
	const router = useRouter();
	const { data: session, status } = useSession();

	const handleLogin = () => {
		router.push("/login");
	};

	const handleLogout = async () => {
		await signOut({ redirect: false });
		router.refresh();
	};

	const handleGoToProjects = () => {
		router.push("/projects");
	};

	return (
		<div className="text-center mb-10 sm:mb-12">
			<div className="flex justify-end mb-4">
				{status === "authenticated" && session ? (
					<Space size="small">
						<Button
							type="default"
							size="small"
							icon={<DashboardOutlined />}
							onClick={handleGoToProjects}
							className="font-medium"
						>
							Проекты
						</Button>
						<Button
							type="default"
							danger
							size="small"
							icon={<LogoutOutlined />}
							onClick={handleLogout}
							className="font-medium"
						>
							Выйти
						</Button>
					</Space>
				) : (
					<Button
						type="primary"
						icon={<LoginOutlined />}
						onClick={handleLogin}
						className="font-medium shadow-md hover:shadow-lg transition-shadow"
					>
						Войти
					</Button>
				)}
			</div>

			<div className="hidden sm:flex items-center justify-between mb-6">
				<div className="flex-1 flex justify-center">
					<div className="inline-block">
						<Title
							level={1}
							className="!mb-0 !text-3xl sm:!text-4xl lg:!text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
						>
							🚀 Fast Analytics SDK
						</Title>
					</div>
				</div>
			</div>

			<div className="sm:hidden mb-4">
				<Title
					level={1}
					className="!mb-0 !text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
				>
					🚀 Fast Analytics SDK
				</Title>
			</div>
			<Paragraph className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mt-4 mb-6 max-w-2xl mx-auto">
				Интерактивная демонстрация всех ключевых возможностей SDK
			</Paragraph>
		</div>
	);
}

