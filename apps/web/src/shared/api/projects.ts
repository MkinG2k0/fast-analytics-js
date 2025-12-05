import type { Project } from "@repo/database";
import type { CreateProjectDto } from "@repo/database";

const API_BASE = "/api/projects";

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(API_BASE, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Ошибка загрузки проектов");
  }

  return response.json();
}

export async function createProject(data: CreateProjectDto): Promise<Project> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка создания проекта");
  }

  return response.json();
}

export async function getProject(id: string): Promise<Project> {
  const response = await fetch(`${API_BASE}/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Ошибка загрузки проекта");
  }

  return response.json();
}

export async function regenerateApiKey(projectId: string): Promise<{ apiKey: string }> {
  const response = await fetch(`${API_BASE}/${projectId}/regenerate-key`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка обновления ключа");
  }

  return response.json();
}

