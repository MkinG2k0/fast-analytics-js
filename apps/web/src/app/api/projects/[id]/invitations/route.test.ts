import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET, POST } from "./route";
import { prisma } from "@/shared/lib/prisma";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import {
  createApiRequest,
  createApiUrl,
  expectResponse,
  mockAuthenticatedSession,
  mockProjectAccess,
  mockUnauthenticatedSession,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    projectInvitation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/shared/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/shared/lib/project-access", () => ({
  checkProjectAccess: vi.fn(),
  ProjectPermission: {
    MANAGE_MEMBERS: "MANAGE_MEMBERS",
  },
}));

describe("GET /api/projects/[id]/invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/invitations", { id: "project-1" })
    );

    await expectResponse(await GET(request, { params }), 401, "Не авторизован");
  });

  it("должен возвращать 403 если нет доступа на управление участниками", async () => {
    mockProjectAccess(false, "viewer");

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/invitations", { id: "project-1" })
    );

    await expectResponse(
      await GET(request, { params }),
      403,
      "Доступ запрещен"
    );
  });

  it("должен возвращать список приглашений", async () => {
    const mockInvitations = [
      {
        id: "invitation-1",
        projectId: "project-1",
        email: "test@example.com",
        role: "admin",
        status: "pending",
        token: "token-1",
        invitedBy: "user-1",
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        inviter: {
          id: "user-1",
          name: "Test User",
          email: "inviter@example.com",
        },
      },
    ];

    mockProjectAccess(true, "owner");
    vi.mocked(prisma.projectInvitation.findMany).mockResolvedValue(
      mockInvitations as never
    );

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/invitations", { id: "project-1" })
    );

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("invitation-1");
    expect(data[0].email).toBe("test@example.com");
    expect(prisma.projectInvitation.findMany).toHaveBeenCalledWith({
      where: {
        projectId: "project-1",
        status: "pending",
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("POST /api/projects/[id]/invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = createApiRequest("/api/projects/project-1/invitations", {
      body: { email: "test@example.com", role: "admin" },
    });
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await POST(request, { params }),
      401,
      "Не авторизован"
    );
  });

  it("должен возвращать 400 при ошибке валидации", async () => {
    mockProjectAccess(true, "owner");

    const request = createApiRequest("/api/projects/project-1/invitations", {
      body: { email: "invalid-email", role: "invalid-role" },
    });
    const params = Promise.resolve({ id: "project-1" });

    const data = await expectResponse(await POST(request, { params }), 400);
    expect(data.message).toBeDefined();
  });

  it("должен возвращать 400 если пользователь уже является участником", async () => {
    const existingUser = {
      id: "user-2",
      email: "test@example.com",
      password: "hashed",
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingMember = {
      projectId: "project-1",
      userId: "user-2",
      role: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProjectAccess(true, "owner");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as never);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(
      existingMember as never
    );

    const request = createApiRequest("/api/projects/project-1/invitations", {
      body: { email: "test@example.com", role: "admin" },
    });
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await POST(request, { params }),
      400,
      "Пользователь уже является участником проекта"
    );
  });

  it("должен возвращать 400 если приглашение уже отправлено", async () => {
    const existingInvitation = {
      id: "invitation-1",
      projectId: "project-1",
      email: "test@example.com",
      status: "pending",
      expiresAt: new Date(Date.now() + 86400000),
    };

    mockProjectAccess(true, "owner");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue(
      existingInvitation as never
    );

    const request = createApiRequest("/api/projects/project-1/invitations", {
      body: { email: "test@example.com", role: "admin" },
    });
    const params = Promise.resolve({ id: "project-1" });

    await expectResponse(
      await POST(request, { params }),
      400,
      "Приглашение уже отправлено"
    );
  });

  it("должен создавать приглашение", async () => {
    const mockInvitation = {
      id: "invitation-1",
      projectId: "project-1",
      email: "test@example.com",
      role: "admin",
      token: "generated-token",
      invitedBy: "user-1",
      status: "pending",
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProjectAccess(true, "owner");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.projectInvitation.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectInvitation.create).mockResolvedValue(
      mockInvitation as never
    );

    const request = createApiRequest("/api/projects/project-1/invitations", {
      body: { email: "test@example.com", role: "admin" },
    });
    const params = Promise.resolve({ id: "project-1" });

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(mockInvitation.id);
    expect(data.email).toBe(mockInvitation.email);
    expect(data.role).toBe(mockInvitation.role);
    expect(prisma.projectInvitation.create).toHaveBeenCalled();
  });
});
