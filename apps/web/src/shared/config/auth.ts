import { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
import Google from "next-auth/providers/google";
import { redis } from "@/shared/lib/redis";
import { getServerSession } from "next-auth";
import { prisma } from "@/shared/lib/prisma";

export const authConfig: NextAuthOptions = {
  adapter: UpstashRedisAdapter(redis),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/",
  },
  callbacks: {
    async signIn({ account, user, profile }) {
      // Разрешаем вход для всех пользователей Google
      if (account?.provider === "google" && user && account.providerAccountId) {
        // Синхронизируем пользователя с PostgreSQL используя providerAccountId
        try {
          const googleProfile = profile as
            | { name?: string; picture?: string; email_verified?: boolean }
            | undefined;

          // Используем upsert для атомарного updateOrCreate
          // После миграции можно будет использовать where: { providerAccountId: account.providerAccountId }
          await prisma.user.upsert({
            where: { email: user.email! },
            update: {
              name: user.name || googleProfile?.name || null,
              image: user.image || googleProfile?.picture || null,
              emailVerified: googleProfile?.email_verified ? new Date() : null,
              // После миграции добавить: providerAccountId: account.providerAccountId
            },
            create: {
              id: user.id,
              email: user.email!,
              name: user.name || googleProfile?.name || null,
              image: user.image || googleProfile?.picture || null,
              emailVerified: googleProfile?.email_verified ? new Date() : null,
              // После миграции добавить: providerAccountId: account.providerAccountId
            },
          });
        } catch (error) {
          console.error("Ошибка синхронизации пользователя:", error);
          // Не блокируем вход, если ошибка синхронизации
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // Сохраняем providerAccountId в токене для использования в сессии
        if (account?.providerAccountId) {
          token.providerAccountId = account.providerAccountId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // Добавляем providerAccountId в сессию для безопасного поиска
        if (token.providerAccountId) {
          session.user.providerAccountId = token.providerAccountId;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export async function auth() {
  return getServerSession(authConfig);
}
