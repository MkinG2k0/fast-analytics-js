import { NextResponse } from "next/server";
import { Prisma } from "@repo/database";

import { prisma } from "@/shared/lib/prisma";
import { getSessionFromRequest } from "@/shared/lib/auth";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import { z } from "zod";
import type { EventLevel } from "@repo/database";

const createEventSchema = z.object({
  level: z.enum(["error", "warn", "info", "debug"]),
  message: z.string().min(1),
  stack: z.string().optional(),
  context: z.record(z.unknown()).nullable().optional(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  performance: z
    .object({
      requestDuration: z.number().optional(),
      timestamp: z.number().optional(),
    })
    .passthrough()
    .optional(),
});

const createEventsSchema = z.array(createEventSchema);

async function getProjectByApiKey(apiKey: string | null) {
  if (!apiKey) {
    return null;
  }

  return prisma.project.findUnique({
    where: { apiKey },
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

// Обработка preflight запросов
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

    const project = await getProjectByApiKey(apiKey);
    if (!project) {
      return NextResponse.json(
        { message: "Неверный API ключ" },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();

    // Поддержка как одиночного события, так и массива событий
    const eventsData = Array.isArray(body) ? body : [body];
    const validatedData = createEventsSchema.parse(eventsData);

    // Получаем контекст из запроса
    const userAgent = request.headers.get("user-agent") || undefined;
    const url = request.headers.get("referer") || undefined;

    const events = await prisma.event.createMany({
      data: validatedData.map((event) => {
        // Извлекаем userId из context, если он не передан напрямую
        const userIdFromContext =
          event.context &&
          typeof event.context === "object" &&
          "userId" in event.context
            ? (event.context.userId as string | undefined)
            : undefined;

        // Сохраняем context как есть, если он есть, иначе используем Prisma.JsonNull
        const contextToSave:
          | Prisma.InputJsonValue
          | Prisma.NullableJsonNullValueInput
          | undefined =
          event.context && typeof event.context === "object"
            ? (event.context as Prisma.InputJsonValue)
            : Prisma.JsonNull;

        // Сохраняем performance как есть, если он есть
        const performanceToSave:
          | Prisma.InputJsonValue
          | Prisma.NullableJsonNullValueInput
          | undefined =
          event.performance && typeof event.performance === "object"
            ? (event.performance as Prisma.InputJsonValue)
            : Prisma.JsonNull;

        const eventData = {
          projectId: project.id,
          level: event.level as EventLevel,
          message: event.message,
          stack: event.stack || null,
          context: contextToSave,
          userAgent: event.userAgent || userAgent || null,
          url: event.url || url || null,
          sessionId: event.sessionId || null,
          userId: event.userId || userIdFromContext || null,
          performance: performanceToSave,
        };

        return eventData;
      }),
    });

    return NextResponse.json(
      { success: true, count: events.count },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0]?.message || "Ошибка валидации" },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Endpoint для получения событий (для авторизованных пользователей)
export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const level = searchParams.get("level");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const url = searchParams.get("url");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

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

    const where: {
      projectId: string;
      level?: string;
      timestamp?: { gte?: Date; lte?: Date };
      message?: { contains: string; mode?: "insensitive" };
      url?: { contains: string; mode?: "insensitive" };
      userId?: string;
    } = {
      projectId,
    };

    if (level) {
      where.level = level;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    if (search) {
      where.message = { contains: search, mode: "insensitive" };
    }

    if (url) {
      where.url = { contains: url, mode: "insensitive" };
    }

    if (userId) {
      where.userId = userId;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      total,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
