import type { ProjectInvitation, ProjectMember } from "@repo/types";

const API_BASE = "/api/projects";

export interface CreateInvitationDto {
  email: string;
  role: "admin" | "member" | "viewer";
}

export async function getInvitations(projectId: string): Promise<ProjectInvitation[]> {
  const response = await fetch(`${API_BASE}/${projectId}/invitations`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка загрузки приглашений");
  }

  return response.json();
}

export async function createInvitation(
  projectId: string,
  data: CreateInvitationDto
): Promise<ProjectInvitation> {
  const response = await fetch(`${API_BASE}/${projectId}/invitations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка создания приглашения");
  }

  return response.json();
}

export async function cancelInvitation(
  projectId: string,
  invitationId: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/${projectId}/invitations/${invitationId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка отмены приглашения");
  }
}

export async function getMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await fetch(`${API_BASE}/${projectId}/members`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка загрузки участников");
  }

  return response.json();
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${projectId}/members/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка удаления участника");
  }
}

export async function getProjectRole(projectId: string): Promise<{ role: string | null }> {
  const response = await fetch(`${API_BASE}/${projectId}/role`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка загрузки роли");
  }

  return response.json();
}

export async function getInvitationByToken(token: string): Promise<ProjectInvitation & {
  project?: { id: string; name: string; description: string | null };
  inviter?: { name: string | null; email: string };
}> {
  const response = await fetch(`/api/invitations/${token}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка загрузки приглашения");
  }

  return response.json();
}

export async function acceptInvitation(token: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/invitations/${token}`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка принятия приглашения");
  }

  return response.json();
}

export async function getUserInvitations(): Promise<(ProjectInvitation & {
  project?: { id: string; name: string; description: string | null };
  inviter?: { id: string; name: string | null; email: string };
})[]> {
  const response = await fetch("/api/invitations/user", {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка загрузки приглашений");
  }

  return response.json();
}

