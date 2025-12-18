import { auth } from "@/shared/config/auth";
import { prisma } from "@/shared/lib/prisma";
import type { Project } from "@/entities/project";

export async function getProjects(): Promise<Project[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
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

  return Array.from(projectsMap.values());
}
