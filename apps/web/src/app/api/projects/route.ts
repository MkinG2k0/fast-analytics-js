import { Prisma } from "@repo/database";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionFromRequest } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { generateApiKey } from "@/shared/lib/utils";

const createProjectSchema = z.object({
  name: z.string().min(1, "Название проекта обязательно"),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    // Получаем проекты, где пользователь owner
    const ownedProjects = await prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        settings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Получаем проекты, где пользователь member
    const memberProjects = await prisma.projectMember.findMany({
      where: { userId: session.user.id },
      include: {
        project: {
          include: {
            settings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Объединяем и убираем дубликаты
    const projectsMap = new Map<string, (typeof ownedProjects)[0]>();

    // Добавляем проекты, где пользователь owner
    ownedProjects.forEach((project) => {
      projectsMap.set(project.id, project);
    });

    // Добавляем проекты, где пользователь member (если еще не добавлены)
    memberProjects.forEach((member) => {
      if (!projectsMap.has(member.project.id)) {
        projectsMap.set(member.project.id, member.project);
      }
    });

    const allProjects = Array.from(projectsMap.values());

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("Ошибка получения проектов:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const apiKey = generateApiKey();

    // Сначала создаем ProjectSettings
    const settings = await prisma.projectSettings.create({
      data: {
        maxErrors: 100,
        visitsRetentionDays: 7,
      },
    });

    // Затем создаем Project со ссылкой на settings
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        apiKey,
        userId: session.user.id,
        settingsId: settings.id,
      },
      include: {
        settings: true,
      },
    });

    // Создаем запись ProjectMember для владельца
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: session.user.id,
        role: "owner",
      },
    });

    return NextResponse.json(project, { status: 201 });
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
    }

    console.error("Ошибка создания проекта:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
