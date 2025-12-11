import { NextResponse } from "next/server";
import { z } from "zod";
import { markUserOnline } from "@/shared/lib/redis";
import { prisma } from "@/shared/lib/prisma";

const heartbeatSchema = z.object({
  sessionId: z.string().min(1),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Публичный endpoint для SDK
export async function POST(request: Request) {
  try {
    const apiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return NextResponse.json(
        { message: "API ключ не предоставлен" },
        { status: 401, headers: corsHeaders }
      );
    }

    const project = await prisma.project.findUnique({
      where: { apiKey },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Неверный API ключ" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { sessionId } = heartbeatSchema.parse(body);

    // Отмечаем пользователя как онлайн
    await markUserOnline(project.id, sessionId);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Неверные данные", errors: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    console.error("Error in heartbeat:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500, headers: corsHeaders }
    );
  }
}
