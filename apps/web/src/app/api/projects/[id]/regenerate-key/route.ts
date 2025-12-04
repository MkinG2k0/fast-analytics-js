import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/prisma";
import { getSessionFromRequest } from "@/shared/lib/auth";
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

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
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

