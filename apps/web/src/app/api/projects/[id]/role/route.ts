import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { getUserProjectRole } from "@/shared/lib/project-access";

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
    const role = await getUserProjectRole(projectId, session.user.id);

    return NextResponse.json({ role });
  } catch (error) {
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

