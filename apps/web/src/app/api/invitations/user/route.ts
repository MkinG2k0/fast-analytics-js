import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getSessionFromRequest } from "@/shared/lib/auth";

// GET - получить приглашения текущего пользователя
export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    // Получаем активные приглашения для email пользователя
    const invitations = await prisma.projectInvitation.findMany({
      where: {
        email: session.user.email,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Ошибка загрузки приглашений:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
