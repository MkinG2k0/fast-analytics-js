import { NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { verifyPassword, generateToken } from '@/shared/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
	email: z.string().email('Некорректный email'),
	password: z.string().min(1, 'Пароль обязателен'),
})

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const validatedData = loginSchema.parse(body)

		const user = await prisma.user.findUnique({
			where: {email: validatedData.email},
		})

		if (!user) {
			return NextResponse.json(
				{message: 'Неверный email или пароль'},
				{status: 401},
			)
		}

		const isValidPassword = await verifyPassword(validatedData.password, user?.password || '')

		if (!isValidPassword) {
			return NextResponse.json(
				{message: 'Неверный email или пароль'},
				{status: 401},
			)
		}

		const token = generateToken({userId: user.id, email: user.email})

		return NextResponse.json({
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				createdAt: user.createdAt,
			},
			token,
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{message: error.errors[0]?.message || 'Ошибка валидации'},
				{status: 400},
			)
		}

		return NextResponse.json(
			{message: 'Внутренняя ошибка сервера'},
			{status: 500},
		)
	}
}

