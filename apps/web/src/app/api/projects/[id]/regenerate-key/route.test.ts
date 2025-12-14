import { describe, expect, it, beforeEach, vi } from "vitest";

import { POST } from "./route";
import { prisma } from "@/shared/lib/prisma";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import { generateApiKey } from "@/shared/lib/utils";
import {
  createApiUrl,
  expectResponse,
  mockAuthenticatedSession,
  mockInvalidProject,
  mockProject,
  mockProjectAccess,
  mockUnauthenticatedSession,
  mockValidProject,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/shared/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/shared/lib/project-access", () => ({
  checkProjectAccess: vi.fn(),
  ProjectPermission: {
    MANAGE_SETTINGS: "MANAGE_SETTINGS",
  },
}));

vi.mock("@/shared/lib/utils", () => ({
  generateApiKey: vi.fn(),
}));

describe("POST /api/projects/[id]/regenerate-key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/regenerate-key", { id: "project-1" }),
      {
        method: "POST",
      }
    );

    await expectResponse(
      await POST(request, { params }),
      401,
      "Не авторизован"
    );
  });

  it("должен возвращать 403 если нет доступа на управление настройками", async () => {
    mockProjectAccess(false, "viewer");

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/regenerate-key", { id: "project-1" }),
      {
        method: "POST",
      }
    );

    await expectResponse(
      await POST(request, { params }),
      403,
      "Доступ запрещен"
    );
  });

  it("должен возвращать 404 если проект не найден", async () => {
    mockProjectAccess(true, "owner");
    mockInvalidProject();

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/regenerate-key", { id: "project-1" }),
      {
        method: "POST",
      }
    );

    await expectResponse(
      await POST(request, { params }),
      404,
      "Проект не найден"
    );
  });

  it("должен регенерировать API ключ", async () => {
    const testProject = { ...mockProject, apiKey: "old-key" };
    const newApiKey = "new-generated-key";
    const updatedProject = { ...testProject, apiKey: newApiKey };

    mockProjectAccess(true, "owner");
    mockValidProject(testProject);
    vi.mocked(generateApiKey).mockReturnValue(newApiKey);
    vi.mocked(prisma.project.update).mockResolvedValue(updatedProject as never);

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/regenerate-key", { id: "project-1" }),
      {
        method: "POST",
      }
    );

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.apiKey).toBe(newApiKey);
    expect(generateApiKey).toHaveBeenCalled();
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: { apiKey: newApiKey },
    });
  });
});
