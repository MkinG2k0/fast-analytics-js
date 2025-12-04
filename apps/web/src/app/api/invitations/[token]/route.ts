import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getSessionFromRequest } from "@/shared/lib/auth";

// GET - получить информацию о приглашении
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
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
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { message: "Приглашение не найдено" },
        { status: 404 }
      );
    }

    // Возвращаем информацию о приглашении даже если оно использовано или истекло
    // для отображения на странице принятия
    return NextResponse.json(invitation);
  } catch (error) {
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// POST - принять приглашение
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const { token } = await params;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { message: "Приглашение не найдено" },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { message: "Приглашение уже использовано" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { message: "Приглашение истекло" },
        { status: 400 }
      );
    }

    // Проверяем, что email совпадает
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.email !== invitation.email) {
      return NextResponse.json(
        { message: "Приглашение предназначено для другого пользователя" },
        { status: 403 }
      );
    }

    // Создаем участника проекта
    await prisma.$transaction([
      prisma.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: session.user.id,
          role: invitation.role,
        },
      }),
      prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

