import type { Project } from "@/entities/project";
import type { CreateProjectDto } from "@repo/database";
import { apiClient } from "@/shared/lib/axios";

const API_BASE = "/api/projects";

export async function getProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>(API_BASE);
  return data;
}

export async function createProject(data: CreateProjectDto): Promise<Project> {
  const { data: result } = await apiClient.post<Project>(API_BASE, data);
  return result;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await apiClient.get<Project>(`${API_BASE}/${id}`);
  return data;
}

export async function regenerateApiKey(
  projectId: string
): Promise<{ apiKey: string }> {
  const { data } = await apiClient.post<{ apiKey: string }>(
    `${API_BASE}/${projectId}/regenerate-key`
  );
  return data;
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    maxErrors?: number;
    visitsRetentionDays?: number | null;
  }
): Promise<Project> {
  const { data: result } = await apiClient.patch<Project>(
    `${API_BASE}/${projectId}`,
    data
  );
  return result;
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiClient.delete(`${API_BASE}/${projectId}`);
}
