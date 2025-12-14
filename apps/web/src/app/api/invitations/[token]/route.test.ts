import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET, POST } from "./route";
import { prisma } from "@/shared/lib/prisma";
import {
  createApiUrl,
  createRequest,
  expectResponse,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    projectInvitation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    projectMember: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/shared/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("GET /api/invitations/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать информацию о приглашении", async () => {
    const mockInvitation = {
      id: "invitation-1",
      token: "test-token",
      email: "test@example.com",
      role: "member" as const,
      status: "pending" as const,
      projectId: "project-1",
      inviterId: "user-1",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
      project: {
        id: "project-1",
        name: "Test Project",
        description: "Test Description",
      },
      inviter: {
        name: "Test User",
        email: "inviter@example.com",
      },
    };

    vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue(
      mockInvitation as never
    );

    const params = Promise.resolve({ token: "test-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "test-token" })
    );

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(mockInvitation.id);
    expect(data.token).toBe(mockInvitation.token);
    expect(data.email).toBe(mockInvitation.email);
    expect(data.role).toBe(mockInvitation.role);
    expect(data.status).toBe(mockInvitation.status);
    expect(data.project).toEqual(mockInvitation.project);
    expect(data.inviter).toEqual(mockInvitation.inviter);
    expect(prisma.projectInvitation.findUnique).toHaveBeenCalledWith({
      where: { token: "test-token" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  });

  it("должен возвращать 404 если приглашение не найдено", async () => {
    vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue(null);

    const params = Promise.resolve({ token: "invalid-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "invalid-token" })
    );

    await expectResponse(
      await GET(request, { params }),
      404,
      "Приглашение не найдено"
    );
  });

  it("должен возвращать 500 при ошибке БД", async () => {
    vi.mocked(prisma.projectInvitation.findUnique).mockRejectedValue(
      new Error("Database error")
    );

    const params = Promise.resolve({ token: "test-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "test-token" })
    );

    await expectResponse(
      await GET(request, { params }),
      500,
      "Внутренняя ошибка сервера"
    );
  });
});

describe("POST /api/invitations/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен успешно принять приглашение", async () => {
    mockAuthenticatedSession();
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      password: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockInvitation = {
      id: "invitation-1",
      token: "test-token",
      email: "test@example.com",
      role: "member" as const,
      status: "pending" as const,
      projectId: "project-1",
      inviterId: "user-2",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue(
      mockInvitation as never
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as never);

    const params = Promise.resolve({ token: "test-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "test-token" }),
      {
        method: "POST",
      }
    );

    const response = await POST(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const params = Promise.resolve({ token: "test-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "test-token" }),
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

  it("должен возвращать 404 если приглашение не найдено", async () => {
    mockAuthenticatedSession();
    vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue(null);

    const params = Promise.resolve({ token: "invalid-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "invalid-token" }),
      {
        method: "POST",
      }
    );

    await expectResponse(
      await POST(request, { params }),
      404,
      "Приглашение не найдено"
    );
  });

  it("должен возвращать 400 если приглашение уже использовано", async () => {
    mockAuthenticatedSession();
    const mockInvitation = {
      id: "invitation-1",
      token: "test-token",
      email: "test@example.com",
      role: "member" as const,
      status: "accepted" as const,
      projectId: "project-1",
      inviterId: "user-2",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue(
      mockInvitation as never
    );

    const params = Promise.resolve({ token: "test-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "test-token" }),
      {
        method: "POST",
      }
    );

    await expectResponse(
      await POST(request, { params }),
      400,
      "Приглашение уже использовано"
    );
  });

  it("должен возвращать 400 если приглашение истекло", async () => {
    mockAuthenticatedSession();
    const mockInvitation = {
      id: "invitation-1",
      token: "test-token",
      email: "test@example.com",
      role: "member" as const,
      status: "pending" as const,
      projectId: "project-1",
      inviterId: "user-2",
      expiresAt: new Date(Date.now() - 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue(
      mockInvitation as never
    );

    const params = Promise.resolve({ token: "test-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "test-token" }),
      {
        method: "POST",
      }
    );

    await expectResponse(
      await POST(request, { params }),
      400,
      "Приглашение истекло"
    );
  });

  it("должен возвращать 403 если email не совпадает", async () => {
    mockAuthenticatedSession();
    const mockUser = {
      id: "user-1",
      email: "different@example.com",
      name: "Test User",
      password: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockInvitation = {
      id: "invitation-1",
      token: "test-token",
      email: "test@example.com",
      role: "member" as const,
      status: "pending" as const,
      projectId: "project-1",
      inviterId: "user-2",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.projectInvitation.findUnique).mockResolvedValue(
      mockInvitation as never
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as never);

    const params = Promise.resolve({ token: "test-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "test-token" }),
      {
        method: "POST",
      }
    );

    await expectResponse(
      await POST(request, { params }),
      403,
      "Приглашение предназначено для другого пользователя"
    );
  });

  it("должен возвращать 500 при ошибке БД", async () => {
    mockAuthenticatedSession();
    vi.mocked(prisma.projectInvitation.findUnique).mockRejectedValue(
      new Error("Database error")
    );

    const params = Promise.resolve({ token: "test-token" });
    const request = createRequest(
      createApiUrl("/invitations/[token]", { token: "test-token" }),
      {
        method: "POST",
      }
    );

    await expectResponse(
      await POST(request, { params }),
      500,
      "Внутренняя ошибка сервера"
    );
  });
});
