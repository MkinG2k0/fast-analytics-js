import { prisma } from "./prisma";
import type { ProjectRole } from "@repo/types";

export enum ProjectPermission {
  VIEW = "view",
  EDIT = "edit",
  DELETE = "delete",
  MANAGE_MEMBERS = "manage_members",
  MANAGE_SETTINGS = "manage_settings",
}

const rolePermissions: Record<ProjectRole, ProjectPermission[]> = {
  owner: [
    ProjectPermission.VIEW,
    ProjectPermission.EDIT,
    ProjectPermission.DELETE,
    ProjectPermission.MANAGE_MEMBERS,
    ProjectPermission.MANAGE_SETTINGS,
  ],
  admin: [
    ProjectPermission.VIEW,
    ProjectPermission.EDIT,
    ProjectPermission.MANAGE_MEMBERS,
  ],
  member: [ProjectPermission.VIEW, ProjectPermission.EDIT],
  viewer: [ProjectPermission.VIEW],
};

export async function getUserProjectRole(
  projectId: string,
  userId: string
): Promise<ProjectRole | null> {
  // Проверяем, является ли пользователь владельцем
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (project) {
    return "owner";
  }

  // Проверяем участие в проекте
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return (member?.role as ProjectRole) || null;
}

export async function hasProjectPermission(
  projectId: string,
  userId: string,
  permission: ProjectPermission
): Promise<boolean> {
  const role = await getUserProjectRole(projectId, userId);
  if (!role) return false;

  return rolePermissions[role].includes(permission);
}

export async function checkProjectAccess(
  projectId: string,
  userId: string,
  permission: ProjectPermission
): Promise<{ hasAccess: boolean; role: ProjectRole | null }> {
  const role = await getUserProjectRole(projectId, userId);
  const hasAccess = role ? rolePermissions[role].includes(permission) : false;

  return { hasAccess, role };
}

