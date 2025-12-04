import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { checkProjectAccess, ProjectPermission } from "@/shared/lib/project-access";
import { generateApiKey } from "@/shared/lib/utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const { id } = await params;

    // Проверяем доступ на управление настройками (только owner и admin)
    const { hasAccess } = await checkProjectAccess(
      id,
      session.user.id,
      ProjectPermission.MANAGE_SETTINGS
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ message: "Проект не найден" }, { status: 404 });
    }

    const newApiKey = generateApiKey();

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { apiKey: newApiKey },
    });

    return NextResponse.json({ apiKey: updatedProject.apiKey });
  } catch (error) {
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

