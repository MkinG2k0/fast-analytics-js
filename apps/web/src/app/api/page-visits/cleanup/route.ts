import { NextResponse } from "next/server";

import { prisma } from "@/shared/lib/prisma";

// Защита через секретный ключ из переменных окружения
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  try {
    // Проверка секретного ключа для защиты от несанкционированного доступа
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ message: "Не авторизован" }, { status: 401 });
    }

    // Получаем все проекты с установленным visitsRetentionDays
    const projects = await prisma.project.findMany({
      where: {
        settings: {
          visitsRetentionDays: {
            not: null,
          },
        },
      },
      include: {
        settings: {
          select: {
            visitsRetentionDays: true,
          },
        },
      },
    });

    let totalDeleted = 0;

    // Обрабатываем каждый проект
    for (const project of projects) {
      const retentionDays = project.settings?.visitsRetentionDays;

      if (!retentionDays || retentionDays <= 0) {
        continue;
      }

      // Вычисляем дату отсечки
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Удаляем посещения старше установленного периода
      const result = await prisma.pageVisit.deleteMany({
        where: {
          projectId: project.id,
          timestamp: {
            lt: cutoffDate,
          },
        },
      });

      totalDeleted += result.count;
    }

    return NextResponse.json({
      success: true,
      projectsProcessed: projects.length,
      visitsDeleted: totalDeleted,
    });
  } catch (error) {
    console.error("Ошибка очистки старых посещений:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
