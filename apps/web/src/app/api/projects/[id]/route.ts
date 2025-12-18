import { Prisma } from "@repo/database";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionFromRequest } from "@/shared/lib/auth";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import { prisma } from "@/shared/lib/prisma";

const updateProjectSchema = z.object({
  name: z.string().min(1, "Название проекта обязательно").optional(),
  description: z.string().optional(),
  maxErrors: z.number().int().min(0).optional(),
  visitsRetentionDays: z.number().int().min(0).nullable().optional(),
});

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

    const { hasAccess } = await checkProjectAccess(
      id,
      session.user.id,
      ProjectPermission.VIEW
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        settings: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Проект не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Ошибка получения проекта:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Проект не найден" },
        { status: 404 }
      );
    }

    // Проверяем доступ на управление настройками (только owner и admin)
    const { hasAccess } = await checkProjectAccess(
      id,
      session.user.id,
      ProjectPermission.MANAGE_SETTINGS
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // Обновляем проект
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description || null,
        }),
      },
      include: {
        settings: true,
      },
    });

    // Обновляем или создаем настройки проекта
    if (
      validatedData.maxErrors !== undefined ||
      validatedData.visitsRetentionDays !== undefined
    ) {
      const settingsData: {
        maxErrors?: number;
        visitsRetentionDays?: number | null;
      } = {};

      if (validatedData.maxErrors !== undefined) {
        settingsData.maxErrors = validatedData.maxErrors;
      }

      if (validatedData.visitsRetentionDays !== undefined) {
        settingsData.visitsRetentionDays =
          validatedData.visitsRetentionDays === 0
            ? null
            : validatedData.visitsRetentionDays;
      }

      await prisma.projectSettings.upsert({
        where: { projectId: id },
        update: settingsData,
        create: {
          projectId: id,
          maxErrors: settingsData.maxErrors ?? 100,
          visitsRetentionDays: settingsData.visitsRetentionDays ?? null,
        },
      });
    }

    // Получаем обновленный проект с настройками
    const projectWithSettings = await prisma.project.findUnique({
      where: { id },
      include: {
        settings: true,
      },
    });

    return NextResponse.json(projectWithSettings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message || "Ошибка валидации" },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Проект не найден" },
          { status: 404 }
        );
      }
    }

    console.error("Ошибка обновления проекта:", error);
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

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Проект не найден" },
        { status: 404 }
      );
    }

    // Проверяем доступ на удаление (только для owner)
    const { hasAccess } = await checkProjectAccess(
      id,
      session.user.id,
      ProjectPermission.DELETE
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    // Удаляем проект (каскадное удаление связанных записей настроено в Prisma)
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { message: "Проект не найден" },
          { status: 404 }
        );
      }
    }

    console.error("Ошибка удаления проекта:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
