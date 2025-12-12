import { Prisma } from "@repo/database";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";

import { getSessionFromRequest } from "@/shared/lib/auth";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import { prisma } from "@/shared/lib/prisma";

const createInvitationSchema = z.object({
  email: z.string().email("Некорректный email"),
  role: z.enum(["admin", "member", "viewer"]),
});

// GET - список приглашений проекта
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
      ProjectPermission.MANAGE_MEMBERS
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    const invitations = await prisma.projectInvitation.findMany({
      where: {
        projectId,
        status: "pending",
      },
      include: {
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
    console.error("Ошибка получения приглашений:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// POST - создать приглашение
export async function POST(
  request: Request,
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
      ProjectPermission.MANAGE_MEMBERS
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = createInvitationSchema.parse(body);

    // Проверяем, существует ли пользователь с таким email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Проверяем, не является ли пользователь уже участником
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { message: "Пользователь уже является участником проекта" },
          { status: 400 }
        );
      }
    }

    // Проверяем, нет ли активного приглашения
    const existingInvitation = await prisma.projectInvitation.findFirst({
      where: {
        projectId,
        email,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { message: "Приглашение уже отправлено" },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

    const invitation = await prisma.projectInvitation.create({
      data: {
        projectId,
        email,
        role,
        token,
        invitedBy: session.user.id,
        expiresAt,
      },
    });

    // TODO: Отправить email с приглашением
    // const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message || "Ошибка валидации" },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Пользователь не найден в базе данных" },
          { status: 404 }
        );
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Приглашение с таким токеном уже существует" },
          { status: 400 }
        );
      }
    }

    console.error("Ошибка создания приглашения:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
