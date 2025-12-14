import { describe, expect, it, beforeEach, vi } from "vitest";

import { DELETE } from "./route";
import { prisma } from "@/shared/lib/prisma";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import {
  createApiUrl,
  expectResponse,
  mockAuthenticatedSession,
  mockProjectAccess,
  mockUnauthenticatedSession,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    projectInvitation: {
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
    MANAGE_MEMBERS: "MANAGE_MEMBERS",
  },
}));

describe("DELETE /api/projects/[id]/invitations/[invitationId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен успешно отменить приглашение", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "admin");

    const mockUpdatedInvitation = {
      id: "invitation-1",
      token: "test-token",
      email: "test@example.com",
      role: "member" as const,
      status: "cancelled" as const,
      projectId: "project-1",
      inviterId: "user-1",
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.projectInvitation.update).mockResolvedValue(
      mockUpdatedInvitation as never
    );

    const params = Promise.resolve({
      id: "project-1",
      invitationId: "invitation-1",
    });
    const request = new Request(
      createApiUrl("/projects/[id]/invitations/[invitationId]", {
        id: "project-1",
        invitationId: "invitation-1",
      }),
      { method: "DELETE" }
    );

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(checkProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      ProjectPermission.MANAGE_MEMBERS
    );
    expect(prisma.projectInvitation.update).toHaveBeenCalledWith({
      where: { id: "invitation-1" },
      data: { status: "cancelled" },
    });
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const params = Promise.resolve({
      id: "project-1",
      invitationId: "invitation-1",
    });
    const request = new Request(
      createApiUrl("/projects/[id]/invitations/[invitationId]", {
        id: "project-1",
        invitationId: "invitation-1",
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

    const params = Promise.resolve({
      id: "project-1",
      invitationId: "invitation-1",
    });
    const request = new Request(
      createApiUrl("/projects/[id]/invitations/[invitationId]", {
        id: "project-1",
        invitationId: "invitation-1",
      }),
      { method: "DELETE" }
    );

    await expectResponse(
      await DELETE(request, { params }),
      403,
      "Доступ запрещен"
    );
  });

  it("должен возвращать 500 при ошибке БД", async () => {
    mockAuthenticatedSession();
    mockProjectAccess(true, "admin");
    vi.mocked(prisma.projectInvitation.update).mockRejectedValue(
      new Error("Database error")
    );

    const params = Promise.resolve({
      id: "project-1",
      invitationId: "invitation-1",
    });
    const request = new Request(
      createApiUrl("/projects/[id]/invitations/[invitationId]", {
        id: "project-1",
        invitationId: "invitation-1",
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
