import type { ProjectInvitation } from "@/entities/project-invitation";
import type { ProjectMember } from "@/entities/project-member";
import { apiClient } from "@/shared/lib/axios";

const API_BASE = "/api/projects";

export interface CreateInvitationDto {
  email: string;
  role: "admin" | "member" | "viewer";
}

export async function getInvitations(
  projectId: string
): Promise<ProjectInvitation[]> {
  const { data } = await apiClient.get<ProjectInvitation[]>(
    `${API_BASE}/${projectId}/invitations`
  );
  return data;
}

export async function createInvitation(
  projectId: string,
  data: CreateInvitationDto
): Promise<ProjectInvitation> {
  const { data: result } = await apiClient.post<ProjectInvitation>(
    `${API_BASE}/${projectId}/invitations`,
    data
  );
  return result;
}

export async function cancelInvitation(
  projectId: string,
  invitationId: string
): Promise<void> {
  await apiClient.delete(
    `${API_BASE}/${projectId}/invitations/${invitationId}`
  );
}

export async function getMembers(projectId: string): Promise<ProjectMember[]> {
  const { data } = await apiClient.get<ProjectMember[]>(
    `${API_BASE}/${projectId}/members`
  );
  return data;
}

export async function removeMember(
  projectId: string,
  userId: string
): Promise<void> {
  await apiClient.delete(`${API_BASE}/${projectId}/members/${userId}`);
}

export async function getProjectRole(
  projectId: string
): Promise<{ role: string | null }> {
  const { data } = await apiClient.get<{ role: string | null }>(
    `${API_BASE}/${projectId}/role`
  );
  return data;
}

export interface InvitationWithRelations extends ProjectInvitation {
  project?: { id: string; name: string; description: string | null };
  inviter?: { name: string | null; email: string };
}

export async function getInvitationByToken(
  token: string
): Promise<InvitationWithRelations> {
  const { data } = await apiClient.get<InvitationWithRelations>(
    `/api/invitations/${token}`
  );
  return data;
}

export async function acceptInvitation(
  token: string
): Promise<{ success: boolean }> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/api/invitations/${token}`
  );
  return data;
}

export interface UserInvitationWithRelations extends ProjectInvitation {
  project?: { id: string; name: string; description: string | null };
  inviter?: { id: string; name: string | null; email: string };
}

export async function getUserInvitations(): Promise<
  UserInvitationWithRelations[]
> {
  const { data } = await apiClient.get<UserInvitationWithRelations[]>(
    "/api/invitations/user"
  );
  return data;
}
