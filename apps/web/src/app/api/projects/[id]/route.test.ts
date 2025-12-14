import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET, PATCH, DELETE } from "./route";
import { prisma } from "@/shared/lib/prisma";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import {
  createApiRequest,
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
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/shared/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/shared/lib/project-access", () => ({
  checkProjectAccess: vi.fn(),
  ProjectPermission: {
    VIEW: "VIEW",
    MANAGE_SETTINGS: "MANAGE_SETTINGS",
    DELETE: "DELETE",
  },
}));

describe("GET /api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = new Request("https://example.com/api/projects/project-1");
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(await GET(request, { params }), 401, "Не авторизован");
  });

  it("должен возвращать 403 если нет доступа к проекту", async () => {
    mockProjectAccess(false);

    const request = new Request("https://example.com/api/projects/project-1");
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await GET(request, { params }),
      403,
      "Доступ запрещен"
    );
  });

  it("должен возвращать 404 если проект не найден", async () => {
    mockProjectAccess(true, "owner");
    mockInvalidProject();

    const request = new Request("https://example.com/api/projects/project-1");
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await GET(request, { params }),
      404,
      "Проект не найден"
    );
  });

  it("должен возвращать проект при успешном запросе", async () => {
    const testProject = {
      ...mockProject,
      description: "Description",
      apiKey: "api-key",
    };

    mockProjectAccess(true, "owner");
    mockValidProject(testProject);

    const request = new Request("https://example.com/api/projects/project-1");
    const params = Promise.resolve({ id: "project-1" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(testProject.id);
    expect(data.name).toBe(testProject.name);
    expect(checkProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      ProjectPermission.VIEW
    );
  });
});

describe("PATCH /api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = createApiRequest("/api/projects/project-1", {
      method: "PATCH",
      body: { name: "Updated Project" },
    });
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await PATCH(request, { params }),
      401,
      "Не авторизован"
    );
  });

  it("должен возвращать 404 если проект не найден", async () => {
    mockAuthenticatedSession();
    mockInvalidProject();

    const request = createApiRequest("/api/projects/project-1", {
      method: "PATCH",
      body: { name: "Updated Project" },
    });
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await PATCH(request, { params }),
      404,
      "Проект не найден"
    );
  });

  it("должен возвращать 403 если нет доступа на управление настройками", async () => {
    const testProject = { ...mockProject, userId: "user-2" };

    mockValidProject(testProject);
    mockProjectAccess(false, "viewer");

    const request = createApiRequest("/api/projects/project-1", {
      method: "PATCH",
      body: { name: "Updated Project" },
    });
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await PATCH(request, { params }),
      403,
      "Доступ запрещен"
    );
  });

  it("должен обновлять проект", async () => {
    const testProject = {
      ...mockProject,
      description: "Old description",
      apiKey: "api-key",
    };
    const updatedProject = {
      ...testProject,
      name: "Updated Project",
      description: "New description",
    };

    mockValidProject(testProject);
    mockProjectAccess(true, "owner");
    vi.mocked(prisma.project.update).mockResolvedValue(updatedProject as never);

    const request = createApiRequest("/api/projects/project-1", {
      method: "PATCH",
      body: { name: "Updated Project", description: "New description" },
    });
    const params = Promise.resolve({ id: "project-1" });

    const response = await PATCH(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(updatedProject.id);
    expect(data.name).toBe(updatedProject.name);
    expect(data.description).toBe(updatedProject.description);
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: {
        name: "Updated Project",
        description: "New description",
      },
    });
  });

  it("должен обновлять только переданные поля", async () => {
    const testProject = {
      ...mockProject,
      description: "Old description",
      apiKey: "api-key",
    };

    mockAuthenticatedSession();
    mockValidProject(testProject);
    mockProjectAccess(true, "owner");
    vi.mocked(prisma.project.update).mockResolvedValue(testProject as never);

    const request = createApiRequest("/api/projects/project-1", {
      method: "PATCH",
      body: { name: "Updated Project" },
    });
    const params = Promise.resolve({ id: "project-1" });

    await PATCH(request, { params });

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: "project-1" },
      data: {
        name: "Updated Project",
      },
    });
  });

  it("должен возвращать 400 при ошибке валидации", async () => {
    mockValidProject();
    mockProjectAccess(true, "owner");

    const request = createApiRequest("/api/projects/project-1", {
      method: "PATCH",
      body: { name: "" },
    });
    const params = Promise.resolve({ id: "project-1" });

    const data = await expectResponse(await PATCH(request, { params }), 400);
    expect(data.message).toBeDefined();
  });
});

describe("DELETE /api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = new Request("https://example.com/api/projects/project-1", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await DELETE(request, { params }),
      401,
      "Не авторизован"
    );
  });

  it("должен возвращать 404 если проект не найден", async () => {
    mockAuthenticatedSession();
    mockInvalidProject();

    const request = new Request("https://example.com/api/projects/project-1", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await DELETE(request, { params }),
      404,
      "Проект не найден"
    );
  });

  it("должен возвращать 403 если нет доступа на удаление", async () => {
    const testProject = { ...mockProject, userId: "user-2" };

    mockValidProject(testProject);
    mockProjectAccess(false, "admin");

    const request = new Request("https://example.com/api/projects/project-1", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await DELETE(request, { params }),
      403,
      "Доступ запрещен"
    );
  });

  it("должен удалять проект при успешном запросе", async () => {
    mockValidProject();
    mockProjectAccess(true, "owner");
    vi.mocked(prisma.project.delete).mockResolvedValue({} as never);

    const request = new Request("https://example.com/api/projects/project-1", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "project-1" });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.project.delete).toHaveBeenCalledWith({
      where: { id: "project-1" },
    });
    expect(checkProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      ProjectPermission.DELETE
    );
  });
});
