'use client'

import { init } from 'fast-analytics-js'
import { ReactNode } from 'react'
import { useMount } from 'react-use'

interface AnalyticsProviderWrapperProps {
	children: ReactNode;
}

export function AnalyticsProviderWrapper({
	children,
}: AnalyticsProviderWrapperProps) {

	useMount(() => {
		init({
			projectKey: process.env.NEXT_PUBLIC_FAST_ANALYTICS_KEY!,
		})
	})

	return <>{children}</>
}
