import type { ProjectRole } from "@repo/types";

export const PROJECT_ROLES: ProjectRole[] = ["owner", "admin", "member", "viewer"];

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

