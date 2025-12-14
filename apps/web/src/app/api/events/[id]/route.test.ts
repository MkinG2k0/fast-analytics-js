import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET, DELETE } from "./route";
import { prisma } from "@/shared/lib/prisma";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import {
  expectResponse,
  mockAuthenticatedSession,
  mockProjectAccess,
  mockUnauthenticatedSession,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
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
    EDIT: "EDIT",
  },
}));

describe("GET /api/events/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = new Request("https://example.com/api/events/event-1");
    const params = Promise.resolve({ id: "event-1" });

    await expectResponse(await GET(request, { params }), 401, "Не авторизован");
  });

  it("должен возвращать 404 если событие не найдено", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null);

    const request = new Request("https://example.com/api/events/event-1");
    const params = Promise.resolve({ id: "event-1" });

    await expectResponse(
      await GET(request, { params }),
      404,
      "Событие не найдено"
    );
  });

  it("должен возвращать 403 если нет доступа к проекту", async () => {
    const mockEvent = {
      id: "event-1",
      projectId: "project-1",
      timestamp: new Date(),
      level: "error",
      message: "Test error",
      stack: null,
      context: null,
      userAgent: null,
      url: null,
      sessionId: null,
      userId: null,
      createdAt: new Date(),
      screenshotUrl: null,
      clickTrace: null,
      performance: null,
      metadata: null,
      occurrenceCount: 1,
    };

    vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as never);
    mockProjectAccess(false);

    const request = new Request("https://example.com/api/events/event-1");
    const params = Promise.resolve({ id: "event-1" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.message).toBe("Доступ запрещен");
  });

  it("должен возвращать событие при успешном запросе", async () => {
    const mockEvent = {
      id: "event-1",
      projectId: "project-1",
      timestamp: new Date(),
      level: "error",
      message: "Test error",
      stack: "Error stack",
      context: { userId: "user-123" },
      userAgent: "test-agent",
      url: "https://example.com",
      sessionId: "session-1",
      userId: "user-123",
      createdAt: new Date(),
      screenshotUrl: null,
      clickTrace: null,
      performance: null,
      metadata: null,
      occurrenceCount: 1,
    };

    vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as never);
    mockProjectAccess(true, "owner");

    const request = new Request("https://example.com/api/events/event-1");
    const params = Promise.resolve({ id: "event-1" });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(mockEvent.id);
    expect(data.message).toBe(mockEvent.message);
    expect(data.level).toBe(mockEvent.level);
    expect(checkProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      ProjectPermission.VIEW
    );
  });
});

describe("DELETE /api/events/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = new Request("https://example.com/api/events/event-1", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "event-1" });

    await expectResponse(
      await DELETE(request, { params }),
      401,
      "Не авторизован"
    );
  });

  it("должен возвращать 404 если событие не найдено", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValue(null);

    const request = new Request("https://example.com/api/events/event-1", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "event-1" });

    await expectResponse(
      await DELETE(request, { params }),
      404,
      "Событие не найдено"
    );
  });

  it("должен возвращать 403 если нет доступа на редактирование", async () => {
    const mockEvent = {
      id: "event-1",
      projectId: "project-1",
    };

    vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as never);
    mockProjectAccess(false, "viewer");

    const request = new Request("https://example.com/api/events/event-1", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "event-1" });

    await expectResponse(
      await DELETE(request, { params }),
      403,
      "Доступ запрещен"
    );
  });

  it("должен удалять событие при успешном запросе", async () => {
    const mockEvent = {
      id: "event-1",
      projectId: "project-1",
    };

    vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as never);
    mockProjectAccess(true, "admin");
    vi.mocked(prisma.event.delete).mockResolvedValue({} as never);

    const request = new Request("https://example.com/api/events/event-1", {
      method: "DELETE",
    });
    const params = Promise.resolve({ id: "event-1" });

    const response = await DELETE(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.event.delete).toHaveBeenCalledWith({
      where: { id: "event-1" },
    });
    expect(checkProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      ProjectPermission.EDIT
    );
  });
});
