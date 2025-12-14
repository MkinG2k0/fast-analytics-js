import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET } from "./route";
import { prisma } from "@/shared/lib/prisma";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import {
  createApiUrl,
  expectResponse,
  mockAuthenticatedSession,
  mockInvalidProject,
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
      findMany: vi.fn(),
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
  },
}));

describe("GET /api/projects/[id]/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать список участников включая owner", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "member");

    const mockProject = {
      id: "project-1",
      userId: "owner-1",
      user: {
        id: "owner-1",
        email: "owner@example.com",
        name: "Owner",
        image: null,
      },
    };

    const mockMembers = [
      {
        id: "member-1",
        projectId: "project-1",
        userId: "user-1",
        role: "member" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user-1",
          email: "member@example.com",
          name: "Member",
          image: null,
        },
      },
    ];

    vi.mocked(prisma.project.findUnique).mockResolvedValue(
      mockProject as never
    );
    vi.mocked(prisma.projectMember.findMany).mockResolvedValue(
      mockMembers as never
    );

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/members", { id: "project-1" })
    );

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].role).toBe("owner");
    expect(data[0].userId).toBe("owner-1");
    expect(data[1].role).toBe("member");
    expect(data[1].userId).toBe("user-1");
    expect(checkProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      ProjectPermission.VIEW
    );
  });

  it("должен возвращать только owner если других участников нет", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "owner");

    const mockProject = {
      id: "project-1",
      userId: "owner-1",
      user: {
        id: "owner-1",
        email: "owner@example.com",
        name: "Owner",
        image: null,
      },
    };

    vi.mocked(prisma.project.findUnique).mockResolvedValue(
      mockProject as never
    );
    vi.mocked(prisma.projectMember.findMany).mockResolvedValue([] as never);

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/members", { id: "project-1" })
    );

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].role).toBe("owner");
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/members", { id: "project-1" })
    );

    await expectResponse(await GET(request, { params }), 401, "Не авторизован");
  });

  it("должен возвращать 403 если нет доступа", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(false);

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/members", { id: "project-1" })
    );

    await expectResponse(
      await GET(request, { params }),
      403,
      "Доступ запрещен"
    );
  });

  it("должен возвращать 404 если проект не найден", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "member");
    mockInvalidProject();

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/members", { id: "project-1" })
    );

    await expectResponse(
      await GET(request, { params }),
      404,
      "Проект не найден"
    );
  });

  it("должен возвращать 500 при ошибке БД", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "member");
    vi.mocked(prisma.project.findUnique).mockRejectedValue(
      new Error("Database error")
    );

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/members", { id: "project-1" })
    );

    await expectResponse(
      await GET(request, { params }),
      500,
      "Внутренняя ошибка сервера"
    );
  });
});
