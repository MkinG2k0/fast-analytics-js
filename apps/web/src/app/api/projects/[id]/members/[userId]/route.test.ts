import { describe, expect, it, beforeEach, vi } from "vitest";

import { DELETE } from "./route";
import { prisma } from "@/shared/lib/prisma";
import {
  checkProjectAccess,
  getUserProjectRole,
  ProjectPermission,
} from "@/shared/lib/project-access";
import {
  createApiUrl,
  expectResponse,
  mockAuthenticatedSession,
  mockProject,
  mockProjectAccess,
  mockUnauthenticatedSession,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    projectMember: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/shared/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/shared/lib/project-access", () => ({
  checkProjectAccess: vi.fn(),
  getUserProjectRole: vi.fn(),
  ProjectPermission: {
    MANAGE_MEMBERS: "MANAGE_MEMBERS",
  },
}));

describe("DELETE /api/projects/[id]/members/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен успешно удалить участника", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "admin");

    const mockProject = {
      id: "project-1",
      userId: "owner-1",
    };

    vi.mocked(prisma.project.findUnique).mockResolvedValue(
      mockProject as never
    );
    vi.mocked(prisma.projectMember.deleteMany).mockResolvedValue({
      count: 1,
    } as never);

    const params = Promise.resolve({ id: "project-1", userId: "user-2" });
    const request = new Request(
      createApiUrl("/projects/[id]/members/[userId]", {
        id: "project-1",
        userId: "user-2",
      }),
      { method: "DELETE" }
    );

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.projectMember.deleteMany).toHaveBeenCalledWith({
      where: {
        projectId: "project-1",
        userId: "user-2",
      },
    });
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const params = Promise.resolve({ id: "project-1", userId: "user-2" });
    const request = new Request(
      createApiUrl("/projects/[id]/members/[userId]", {
        id: "project-1",
        userId: "user-2",
      }),
      { method: "DELETE" }
    );

    await expectResponse(
      await DELETE(request, { params }),
      401,
      "Не авторизован"
    );
  });

  it("должен возвращать 403 если нет доступа", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(false);

    const params = Promise.resolve({ id: "project-1", userId: "user-2" });
    const request = new Request(
      createApiUrl("/projects/[id]/members/[userId]", {
        id: "project-1",
        userId: "user-2",
      }),
      { method: "DELETE" }
    );

    await expectResponse(
      await DELETE(request, { params }),
      403,
      "Доступ запрещен"
    );
  });

  it("должен возвращать 400 при попытке удалить owner", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "admin");

    const mockProject = {
      id: "project-1",
      userId: "owner-1",
    };

    vi.mocked(prisma.project.findUnique).mockResolvedValue(
      mockProject as never
    );

    const params = Promise.resolve({ id: "project-1", userId: "owner-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/members/[userId]", {
        id: "project-1",
        userId: "owner-1",
      }),
      { method: "DELETE" }
    );

    await expectResponse(
      await DELETE(request, { params }),
      400,
      "Нельзя удалить владельца проекта"
    );
  });

  it("должен возвращать 400 при попытке удалить самого себя (не owner)", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "member");
    vi.mocked(getUserProjectRole).mockResolvedValue("member");

    const mockProject = {
      id: "project-1",
      userId: "owner-1",
    };

    vi.mocked(prisma.project.findUnique).mockResolvedValue(
      mockProject as never
    );

    const params = Promise.resolve({ id: "project-1", userId: "user-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/members/[userId]", {
        id: "project-1",
        userId: "user-1",
      }),
      { method: "DELETE" }
    );

    await expectResponse(
      await DELETE(request, { params }),
      400,
      "Нельзя удалить самого себя"
    );
  });

  it("должен возвращать 400 при попытке owner удалить самого себя (owner не является projectMember)", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "owner");
    vi.mocked(getUserProjectRole).mockResolvedValue("owner");

    const mockProject = {
      id: "project-1",
      userId: "user-1",
    };

    vi.mocked(prisma.project.findUnique).mockResolvedValue(
      mockProject as never
    );

    const params = Promise.resolve({ id: "project-1", userId: "user-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/members/[userId]", {
        id: "project-1",
        userId: "user-1",
      }),
      { method: "DELETE" }
    );

    await expectResponse(
      await DELETE(request, { params }),
      400,
      "Нельзя удалить владельца проекта"
    );
  });

  it("должен возвращать 500 при ошибке БД", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "admin");

    const mockProject = {
      id: "project-1",
      userId: "owner-1",
    };

    vi.mocked(prisma.project.findUnique).mockResolvedValue(
      mockProject as never
    );
    vi.mocked(prisma.projectMember.deleteMany).mockRejectedValue(
      new Error("Database error")
    );

    const params = Promise.resolve({ id: "project-1", userId: "user-2" });
    const request = new Request(
      createApiUrl("/projects/[id]/members/[userId]", {
        id: "project-1",
        userId: "user-2",
      }),
      { method: "DELETE" }
    );

    await expectResponse(
      await DELETE(request, { params }),
      500,
      "Внутренняя ошибка сервера"
    );
  });
});
