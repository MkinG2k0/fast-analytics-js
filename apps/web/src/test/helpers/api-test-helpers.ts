import { vi } from "vitest";

import { prisma } from "@/shared/lib/prisma";
import { getSessionFromRequest } from "@/shared/lib/auth";
import { checkProjectAccess } from "@/shared/lib/project-access";

export const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  password: "hashed-password",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockProject = {
  id: "project-1",
  name: "Test Project",
  apiKey: "valid-key",
  userId: "user-1",
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockSession = {
  user: { id: mockUser.id, email: mockUser.email },
};

export function createRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }
): Request {
  const { method = "GET", headers = {}, body } = options || {};
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function createApiRequest(
  endpoint: string,
  options?: {
    method?: string;
    apiKey?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Request {
  const { method = "POST", apiKey, body, headers = {} } = options || {};
  return createRequest(`https://example.com${endpoint}`, {
    method,
    headers: { ...(apiKey && { "x-api-key": apiKey }), ...headers },
    body,
  });
}

export async function expectResponse(
  response: Response,
  expectedStatus: number,
  expectedMessage?: string
) {
  const data = await response.json();
  expect(response.status).toBe(expectedStatus);
  if (expectedMessage) {
    expect(data.message).toBe(expectedMessage);
  }
  return data;
}

export function mockAuthenticatedSession(session = mockSession) {
  vi.mocked(getSessionFromRequest).mockResolvedValue(session as never);
}

export function mockUnauthenticatedSession() {
  vi.mocked(getSessionFromRequest).mockResolvedValue(null);
}

export function mockProjectAccess(
  hasAccess: boolean,
  role: string | null = null
) {
  vi.mocked(checkProjectAccess).mockResolvedValue({
    hasAccess,
    role: role as never,
  });
}

export function mockValidProject(project = mockProject) {
  vi.mocked(prisma.project.findUnique).mockResolvedValue(project as never);
}

export function mockInvalidProject() {
  vi.mocked(prisma.project.findUnique).mockResolvedValue(null);
}

export function mockUserFound(user = mockUser) {
  vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never);
}

export function mockUserNotFound() {
  vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
}
