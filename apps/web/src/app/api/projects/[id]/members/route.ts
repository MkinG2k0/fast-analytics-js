import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/shared/lib/auth";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import { prisma } from "@/shared/lib/prisma";

// GET - список участников проекта
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { hasAccess } = await checkProjectAccess(
      projectId,
      session.user.id,
      ProjectPermission.VIEW
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    // Получаем владельца проекта
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Проект не найден" },
        { status: 404 }
      );
    }

    // Получаем участников проекта (исключая владельца)
    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
        userId: { not: project.userId },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Формируем список всех участников (включая владельца)
    const allMembers = [
      {
        id: `owner-${project.userId}`,
        projectId,
        userId: project.userId,
        role: "owner" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: project.user,
      },
      ...members,
    ];

    return NextResponse.json(allMembers);
  } catch (error) {
    console.error("Ошибка получения участников проекта:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
