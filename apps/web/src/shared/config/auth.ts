import { NextAuthOptions } from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/shared/lib/prisma'

export const authConfig: NextAuthOptions = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	adapter: PrismaAdapter(prisma as any),
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],
	pages: {
		signIn: '/login',
		error: '/login',
	},
	callbacks: {

		// authorized({auth, request: {nextUrl}}) {
		// 	const isLoggedIn = !!auth?.user
		// 	const isOnLogin = nextUrl.pathname.startsWith('/login')
		// 	const isOnApiAuth = nextUrl.pathname.startsWith('/api/auth')
		//
		// 	// Разрешаем доступ к API роутам NextAuth
		// 	if (isOnApiAuth) {
		// 		return true
		// 	}
		//
		// 	if (isOnLogin) {
		// 		if (isLoggedIn) return Response.redirect(new URL('/projects', nextUrl))
		// 		return true
		// 	}
		//
		// 	if (!isLoggedIn) {
		// 		return Response.redirect(new URL('/login', nextUrl))
		// 	}
		//
		// 	return true
		// },
		async signIn({account}) {
			// Разрешаем вход для всех пользователей Google
			if (account?.provider === 'google') {
				return true
			}
			return true
		},
		async session({session, user}) {
			if (session.user && user) {
				session.user.id = user.id
			}
			return session
		},
	},
	session: {
		strategy: 'database',
	},
	secret: process.env.NEXTAUTH_SECRET,
	debug: process.env.NODE_ENV === 'development',
}
