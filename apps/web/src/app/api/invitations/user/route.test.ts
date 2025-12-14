import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET } from "./route";
import { prisma } from "@/shared/lib/prisma";
import {
  expectResponse,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    projectInvitation: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/shared/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

describe("GET /api/invitations/user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать список активных приглашений пользователя", async () => {
    const mockSession = {
      user: {
        id: "user-1",
        email: "test@example.com",
      },
    };

    mockAuthenticatedSession(mockSession);

    const mockInvitations = [
      {
        id: "invitation-1",
        token: "token-1",
        email: "test@example.com",
        role: "member" as const,
        status: "pending" as const,
        projectId: "project-1",
        inviterId: "user-2",
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
        project: {
          id: "project-1",
          name: "Test Project",
          description: "Test Description",
        },
        inviter: {
          id: "user-2",
          name: "Inviter",
          email: "inviter@example.com",
        },
      },
    ];

    vi.mocked(prisma.projectInvitation.findMany).mockResolvedValue(
      mockInvitations as never
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(mockInvitations[0].id);
    expect(data[0].email).toBe(mockInvitations[0].email);
    expect(data[0].role).toBe(mockInvitations[0].role);
    expect(data[0].status).toBe(mockInvitations[0].status);
    expect(data[0].project).toEqual(mockInvitations[0].project);
    expect(data[0].inviter).toEqual(mockInvitations[0].inviter);
    expect(prisma.projectInvitation.findMany).toHaveBeenCalledWith({
      where: {
        email: "test@example.com",
        status: "pending",
        expiresAt: { gt: expect.any(Date) },
      },
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
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    await expectResponse(await GET(), 401, "Не авторизован");
  });

  it("должен возвращать 401 если нет email в сессии", async () => {
    const mockSession = {
      user: {
        id: "user-1",
      },
    };

    mockAuthenticatedSession(mockSession);

    await expectResponse(await GET(), 401, "Не авторизован");
  });

  it("должен возвращать пустой массив если приглашений нет", async () => {
    const mockSession = {
      user: {
        id: "user-1",
        email: "test@example.com",
      },
    };

    mockAuthenticatedSession(mockSession);
    vi.mocked(prisma.projectInvitation.findMany).mockResolvedValue([] as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("должен возвращать 500 при ошибке БД", async () => {
    const mockSession = {
      user: {
        id: "user-1",
        email: "test@example.com",
      },
    };

    mockAuthenticatedSession(mockSession);
    vi.mocked(prisma.projectInvitation.findMany).mockRejectedValue(
      new Error("Database error")
    );

    await expectResponse(await GET(), 500, "Внутренняя ошибка сервера");
  });
});
