import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getSessionFromRequest } from "@/shared/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Событие не найдено" }, { status: 404 });
    }

    // Проверяем, что проект принадлежит пользователю
    if (event.project.userId !== session.user.id) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    // Убираем project из ответа
    const { project, ...eventData } = event;

    return NextResponse.json(eventData);
  } catch (error) {
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

