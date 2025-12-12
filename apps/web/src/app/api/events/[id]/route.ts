import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getSessionFromRequest } from "@/shared/lib/auth";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";

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
      select: {
        id: true,
        projectId: true,
        timestamp: true,
        level: true,
        message: true,
        stack: true,
        context: true,
        userAgent: true,
        url: true,
        sessionId: true,
        userId: true,
        createdAt: true,
        screenshotUrl: true,
        clickTrace: true,
        performance: true,
        metadata: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Событие не найдено" },
        { status: 404 }
      );
    }

    // Проверяем доступ к проекту
    const { hasAccess } = await checkProjectAccess(
      event.projectId,
      session.user.id,
      ProjectPermission.VIEW
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Событие не найдено" },
        { status: 404 }
      );
    }

    // Проверяем доступ на удаление (только для участников с правом EDIT)
    const { hasAccess } = await checkProjectAccess(
      event.projectId,
      session.user.id,
      ProjectPermission.EDIT
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
