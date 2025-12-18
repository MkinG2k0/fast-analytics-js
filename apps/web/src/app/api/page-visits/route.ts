import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/shared/lib/prisma'
import { getSessionFromRequest } from '@/shared/lib/auth'
import {
	checkProjectAccess,
	ProjectPermission,
} from '@/shared/lib/project-access'

const createPageVisitSchema = z.object({
	url: z.string().min(1),
	pathname: z.string().optional(),
	referrer: z.string().optional(),
	userAgent: z.string().optional(),
	sessionId: z.string().optional(),
	userId: z.string().optional(),
	duration: z.number().optional(),
})

const createPageVisitsSchema = z.array(createPageVisitSchema)

async function getProjectByApiKey(apiKey: string | null) {
	if (!apiKey) {
		return null
	}

	return prisma.project.findUnique({
		where: {apiKey},
	})
}

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
}

// Обработка preflight запросов
export async function OPTIONS() {
	return NextResponse.json({}, {headers: corsHeaders})
}

// Публичный endpoint для SDK
export async function POST(request: Request) {
	try {
		const apiKey = request.headers.get('x-api-key')

		if (!apiKey) {
			return NextResponse.json(
				{message: 'API ключ не предоставлен'},
				{status: 401, headers: corsHeaders},
			)
		}

		const project = await getProjectByApiKey(apiKey)
		if (!project) {
			return NextResponse.json(
				{message: 'Неверный API ключ'},
				{status: 401, headers: corsHeaders},
			)
		}

		const body = await request.json()

		// Поддержка как одиночного посещения, так и массива посещений
		const visitsData = Array.isArray(body) ? body : [body]
		const validatedData = createPageVisitsSchema.parse(visitsData)

		// Получаем контекст из запроса
		const userAgent = request.headers.get('user-agent') || undefined
		const referrer = request.headers.get('referer') || undefined

		console.log('ssss')
		const visits = await prisma.pageVisit.createMany({
			data: validatedData.map((visit) => ({
				projectId: project.id,
				url: visit.url,
				pathname: visit.pathname || null,
				referrer: visit.referrer || referrer || null,
				userAgent: visit.userAgent || userAgent || null,
				sessionId: visit.sessionId || null,
				userId: visit.userId || null,
				duration: visit.duration || null,
			})),
		})
		console.log('eee')

		return NextResponse.json(
			{success: true, count: visits.count},
			{headers: corsHeaders},
		)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{message: error.errors[0]?.message || 'Ошибка валидации'},
				{status: 400, headers: corsHeaders},
			)
		}

		return NextResponse.json(
			{message: 'Внутренняя ошибка сервера'},
			{status: 500, headers: corsHeaders},
		)
	}
}

export async function GET(request: Request) {
	try {
		const session = await getSessionFromRequest()
		if (!session?.user?.id) {
			return NextResponse.json({message: 'Не авторизован'}, {status: 401})
		}

		const {searchParams} = new URL(request.url)
		const projectId = searchParams.get('projectId')
		const startDate = searchParams.get('startDate')
		const endDate = searchParams.get('endDate')
		const groupBy = searchParams.get('groupBy') || 'url' // url, date, hour

		if (!projectId) {
			return NextResponse.json(
				{message: 'projectId обязателен'},
				{status: 400},
			)
		}

		// Проверяем доступ к проекту
		const {hasAccess} = await checkProjectAccess(
			projectId,
			session.user.id,
			ProjectPermission.VIEW,
		)

		if (!hasAccess) {
			return NextResponse.json({message: 'Доступ запрещен'}, {status: 403})
		}

		const where: {
			projectId: string;
			timestamp?: { gte?: Date; lte?: Date };
		} = {
			projectId,
		}

		if (startDate || endDate) {
			where.timestamp = {}
			if (startDate) {
				where.timestamp.gte = new Date(startDate)
			}
			if (endDate) {
				where.timestamp.lte = new Date(endDate)
			}
		}

		// Получаем все посещения
		const visits = await prisma.pageVisit.findMany({
			where,
			orderBy: {timestamp: 'desc'},
		})

		// Получаем ошибки за тот же период
		const errorEventsWhere: {
			projectId: string;
			level: string;
			timestamp?: { gte?: Date; lte?: Date };
		} = {
			projectId,
			level: 'error',
		}

		if (startDate || endDate) {
			errorEventsWhere.timestamp = {}
			if (startDate) {
				errorEventsWhere.timestamp.gte = new Date(startDate)
			}
			if (endDate) {
				errorEventsWhere.timestamp.lte = new Date(endDate)
			}
		}

		const errorEvents = await prisma.event.findMany({
			where: errorEventsWhere,
			select: {
				url: true,
				timestamp: true,
			},
		})

		// Группируем данные в зависимости от параметра groupBy
		let analytics: Array<Record<string, unknown>> = []

		if (groupBy === 'url') {
			// Группировка по URL
			const urlStats: Record<
				string,
				{
					url: string;
					pathname: string | null;
					visits: number;
					uniqueSessions: Set<string>;
					avgDuration: number;
					totalDuration: number;
					errors: number;
				}
			> = {}

			visits.forEach((visit) => {
				const key = visit.url
				if (!urlStats[key]) {
					urlStats[key] = {
						url: visit.url,
						pathname: visit.pathname,
						visits: 0,
						uniqueSessions: new Set(),
						avgDuration: 0,
						totalDuration: 0,
						errors: 0,
					}
				}
				urlStats[key].visits += 1
				if (visit.sessionId) {
					urlStats[key].uniqueSessions.add(visit.sessionId)
				}
				if (visit.duration) {
					urlStats[key].totalDuration += visit.duration
				}
			})

			// Подсчитываем ошибки по URL
			errorEvents.forEach((event) => {
				if (event.url) {
					const key = event.url
					if (urlStats[key]) {
						urlStats[key].errors += 1
					} else {
						// Если есть ошибка на странице, которой нет в посещениях, добавляем её
						urlStats[key] = {
							url: event.url,
							pathname: null,
							visits: 0,
							uniqueSessions: new Set(),
							avgDuration: 0,
							totalDuration: 0,
							errors: 1,
						}
					}
				}
			})

			analytics = Object.values(urlStats).map((stat) => ({
				...stat,
				uniqueSessions: stat.uniqueSessions.size,
				avgDuration:
					stat.visits > 0 ? Math.round(stat.totalDuration / stat.visits) : 0,
			}))
		} else if (groupBy === 'date') {
			// Группировка по дате
			const dateStats: Record<
				string,
				{
					date: string;
					visits: number;
					uniqueSessions: Set<string>;
					errors: number;
				}
			> = {}

			visits.forEach((visit) => {
				const date = visit.timestamp.toISOString().split('T')[0]
				if (!date) return

				if (!dateStats[date]) {
					dateStats[date] = {
						date,
						visits: 0,
						uniqueSessions: new Set(),
						errors: 0,
					}
				}
				dateStats[date].visits += 1
				if (visit.sessionId) {
					dateStats[date].uniqueSessions.add(visit.sessionId)
				}
			})

			// Подсчитываем ошибки по дате
			errorEvents.forEach((event) => {
				const date = event.timestamp.toISOString().split('T')[0]
				if (!date) return

				if (!dateStats[date]) {
					dateStats[date] = {
						date,
						visits: 0,
						uniqueSessions: new Set(),
						errors: 0,
					}
				}
				dateStats[date].errors += 1
			})

			analytics = Object.values(dateStats).map((stat) => ({
				...stat,
				uniqueSessions: stat.uniqueSessions.size,
			}))
		} else if (groupBy === 'hour') {
			// Группировка по часам
			const hourStats: Record<
				string,
				{
					hour: string;
					visits: number;
					uniqueSessions: Set<string>;
					errors: number;
				}
			> = {}

			visits.forEach((visit) => {
				const hour = visit.timestamp.toISOString().slice(0, 13) + ':00'
				if (!hourStats[hour]) {
					hourStats[hour] = {
						hour,
						visits: 0,
						uniqueSessions: new Set(),
						errors: 0,
					}
				}
				hourStats[hour].visits += 1
				if (visit.sessionId) {
					hourStats[hour].uniqueSessions.add(visit.sessionId)
				}
			})

			// Подсчитываем ошибки по часам
			errorEvents.forEach((event) => {
				const hour = event.timestamp.toISOString().slice(0, 13) + ':00'
				if (!hourStats[hour]) {
					hourStats[hour] = {
						hour,
						visits: 0,
						uniqueSessions: new Set(),
						errors: 0,
					}
				}
				hourStats[hour].errors += 1
			})

			analytics = Object.values(hourStats).map((stat) => ({
				...stat,
				uniqueSessions: stat.uniqueSessions.size,
			}))
		}

		// Общая статистика
		const totalVisits = visits.length
		const uniqueSessions = new Set(
			visits.filter((v) => v.sessionId).map((v) => v.sessionId),
		).size
		const avgDuration =
			visits.length > 0
				? Math.round(
					visits
						.filter((v) => v.duration)
						.reduce((sum, v) => sum + (v.duration || 0), 0) /
					visits.filter((v) => v.duration).length,
				)
				: 0
		const totalErrors = errorEvents.length

		return NextResponse.json({
			analytics,
			summary: {
				totalVisits,
				uniqueSessions,
				avgDuration,
				totalErrors,
			},
			visits: visits.slice(0, 100), // Последние 100 посещений
		})
	} catch (error) {
		console.error('Error fetching page visits analytics:', error)
		return NextResponse.json(
			{message: 'Внутренняя ошибка сервера'},
			{status: 500},
		)
	}
}
