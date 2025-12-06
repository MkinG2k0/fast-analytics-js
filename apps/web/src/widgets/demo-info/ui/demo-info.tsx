"use client";

import { Space, Typography, Divider } from "antd";
import { Card } from "@/shared/ui";

const { Title, Paragraph, Text } = Typography;

export function DemoInfo() {
	return (
		<Card className="!mt-8 lg:mt-10 shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
			<Title level={4} className="!mb-0">
				📚 Дополнительная информация
			</Title>
			<Divider className="my-4" />
			<Space direction="vertical" className="w-full" size="middle">
				<div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
					<Paragraph className="!mb-0">
						<Text strong className="text-blue-700 dark:text-blue-300">
							Автоматический перехват:
						</Text>{" "}
						<span className="">
							SDK автоматически перехватывает все ошибки JavaScript,
							необработанные промисы, ошибки загрузки ресурсов и HTTP-запросы.
						</span>
					</Paragraph>
				</div>
				<div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
					<Paragraph className="!mb-0">
						<Text strong className="text-purple-700 dark:text-purple-300">
							Батчинг:
						</Text>{" "}
						<span className="">
							События собираются в батчи для эффективной отправки. Настройте
							batchSize и batchTimeout при инициализации.
						</span>
					</Paragraph>
				</div>
				<div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
					<Paragraph className="!mb-0">
						<Text strong className="text-green-700 dark:text-green-300">
							TypeScript:
						</Text>{" "}
						<span className="">
							SDK полностью типизирован и включает все определения типов.
						</span>
					</Paragraph>
				</div>
				<div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
					<Paragraph className="!mb-0">
						<Text strong className="text-orange-700 dark:text-orange-300">
							Панель управления:
						</Text>{" "}
						<span className="">
							Просматривайте все события в реальном времени на{" "}
							<a
								href="https://fast-analytics.vercel.app/projects"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
							>
								https://fast-analytics.vercel.app/projects
							</a>
						</span>
					</Paragraph>
				</div>
			</Space>
		</Card>
	);
}

