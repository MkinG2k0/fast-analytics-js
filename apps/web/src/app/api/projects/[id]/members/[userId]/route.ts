import { NextResponse } from "next/server";

import { getSessionFromRequest } from "@/shared/lib/auth";
import {
  checkProjectAccess,
  getUserProjectRole,
  ProjectPermission,
} from "@/shared/lib/project-access";
import { prisma } from "@/shared/lib/prisma";

// DELETE - удалить участника из проекта
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const { id: projectId, userId: targetUserId } = await params;

    // Проверяем права на управление участниками
    const { hasAccess } = await checkProjectAccess(
      projectId,
      session.user.id,
      ProjectPermission.MANAGE_MEMBERS
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    // Нельзя удалить владельца проекта
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (project?.userId === targetUserId) {
      return NextResponse.json(
        { message: "Нельзя удалить владельца проекта" },
        { status: 400 }
      );
    }

    // Нельзя удалить самого себя (если не owner)
    if (targetUserId === session.user.id) {
      const currentUserRole = await getUserProjectRole(
        projectId,
        session.user.id
      );
      if (currentUserRole !== "owner") {
        return NextResponse.json(
          { message: "Нельзя удалить самого себя" },
          { status: 400 }
        );
      }
    }

    // Удаляем участника
    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId: targetUserId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления участника:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
