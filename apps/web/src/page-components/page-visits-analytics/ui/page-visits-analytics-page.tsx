'use client'

import { useParams } from 'next/navigation'
import { Space, Typography } from 'antd'
import { BarChartOutlined } from '@ant-design/icons'

import { PageVisitsAnalytics } from '@/features/page-visits-analytics'

const {Title} = Typography

export function PageVisitsAnalyticsPage() {
	const params = useParams()
	const projectId = params.id as string

	return (
		<div className="p-6 max-w-[1600px] mx-auto">
			<Space direction="vertical" size="large" className="w-full">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
						<BarChartOutlined className="!text-white text-lg"/>
					</div>
					<Title level={2} className="!mb-0">
						Аналитика посещений
					</Title>
				</div>

				<PageVisitsAnalytics projectId={projectId}/>
			</Space>
		</div>
	)
}

