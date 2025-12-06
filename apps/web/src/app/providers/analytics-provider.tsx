'use client'

import { init } from 'fast-analytics-js'
import { ReactNode, useEffect } from 'react'

interface AnalyticsProviderWrapperProps {
	children: ReactNode;
}

export function AnalyticsProviderWrapper({
	children,
}: AnalyticsProviderWrapperProps) {

	useEffect(() => {
		init({
			projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
		})
	}, [])

	return <>{children}</>
}
