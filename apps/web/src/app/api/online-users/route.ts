import { NextResponse } from "next/server";
import { getOnlineUsersCount } from "@/shared/lib/redis";
import { getSessionFromRequest } from "@/shared/lib/auth";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { message: "projectId обязателен" },
        { status: 400 }
      );
    }

    // Проверяем доступ к проекту
    const { hasAccess } = await checkProjectAccess(
      projectId,
      session.user.id,
      ProjectPermission.VIEW
    );

    if (!hasAccess) {
      return NextResponse.json({ message: "Доступ запрещен" }, { status: 403 });
    }

    const count = await getOnlineUsersCount(projectId);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching online users count:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
