import { describe, expect, it, beforeEach, vi } from "vitest";

import { POST, GET, OPTIONS } from "./route";
import { prisma } from "@/shared/lib/prisma";
import { findEventDuplicate } from "@/shared/lib/check-event-duplicate";
import {
  createApiRequest,
  createApiUrl,
  expectResponse,
  mockAuthenticatedSession,
  mockInvalidProject,
  mockProjectAccess,
  mockUnauthenticatedSession,
  mockValidProject,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    event: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
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
    VIEW: "VIEW",
  },
}));

vi.mock("@/shared/lib/check-event-duplicate", () => ({
  findEventDuplicate: vi.fn(),
}));

describe("POST /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать 401 если API ключ не предоставлен", async () => {
    const request = createApiRequest("/api/events", {
      body: { level: "error", message: "Test error" },
    });

    await expectResponse(await POST(request), 401, "API ключ не предоставлен");
  });

  it("должен возвращать 401 если API ключ неверный", async () => {
    mockInvalidProject();

    const request = createApiRequest("/api/events", {
      apiKey: "invalid-key",
      body: { level: "error", message: "Test error" },
    });

    await expectResponse(await POST(request), 401, "Неверный API ключ");
  });

  it("должен создавать событие с валидными данными", async () => {
    mockValidProject();
    vi.mocked(findEventDuplicate).mockResolvedValue(null);
    vi.mocked(prisma.event.createMany).mockResolvedValue({ count: 1 } as never);

    const request = createApiRequest("/api/events", {
      apiKey: "valid-key",
      headers: {
        "user-agent": "test-agent",
        referer: "https://example.com/page",
      },
      body: {
        level: "error",
        message: "Test error",
        stack: "Error stack",
        context: { userId: "user-123" },
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
    expect(data.duplicates).toBe(0);
    expect(prisma.event.createMany).toHaveBeenCalled();
  });

  it("должен обрабатывать массив событий", async () => {
    mockValidProject();
    vi.mocked(findEventDuplicate).mockResolvedValue(null);
    vi.mocked(prisma.event.createMany).mockResolvedValue({ count: 2 } as never);

    const request = createApiRequest("/api/events", {
      apiKey: "valid-key",
      body: [
        { level: "error", message: "Error 1" },
        { level: "warn", message: "Warning 1" },
      ],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(2);
  });

  it("должен обрабатывать дубликаты событий", async () => {
    const duplicateEvent = { id: "event-1", occurrenceCount: 5 };

    mockValidProject();
    vi.mocked(findEventDuplicate).mockResolvedValue(duplicateEvent);
    vi.mocked(prisma.event.update).mockResolvedValue({} as never);
    vi.mocked(prisma.event.createMany).mockResolvedValue({ count: 0 } as never);

    const request = createApiRequest("/api/events", {
      apiKey: "valid-key",
      body: {
        level: "error",
        message: "Test error",
        url: "https://example.com",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.duplicates).toBe(1);
    expect(data.count).toBe(0);
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: duplicateEvent.id },
      data: { occurrenceCount: 6 },
    });
  });

  it("должен возвращать 400 при ошибке валидации", async () => {
    mockValidProject();

    const request = createApiRequest("/api/events", {
      apiKey: "valid-key",
      body: { level: "invalid-level", message: "" },
    });

    const data = await expectResponse(await POST(request), 400);
    expect(data.message).toBeDefined();
  });

  it("должен возвращать CORS заголовки", async () => {
    mockValidProject();
    vi.mocked(findEventDuplicate).mockResolvedValue(null);
    vi.mocked(prisma.event.createMany).mockResolvedValue({ count: 1 } as never);

    const request = createApiRequest("/api/events", {
      apiKey: "valid-key",
      body: { level: "error", message: "Test error" },
    });

    const response = await POST(request);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("GET /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = new Request(
      `${createApiUrl("/events")}?projectId=project-1`
    );

    await expectResponse(await GET(request), 401, "Не авторизован");
  });

  it("должен возвращать 400 если projectId не предоставлен", async () => {
    const request = new Request(createApiUrl("/events"));

    await expectResponse(await GET(request), 400, "projectId обязателен");
  });

  it("должен возвращать 403 если нет доступа к проекту", async () => {
    mockProjectAccess(false);

    const request = new Request(
      `${createApiUrl("/events")}?projectId=project-1`
    );

    await expectResponse(await GET(request), 403, "Доступ запрещен");
  });

  it("должен возвращать список событий с фильтрацией", async () => {
    const mockEvents = [
      {
        id: "event-1",
        projectId: "project-1",
        level: "error",
        message: "Test error",
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockProjectAccess(true, "owner");
    vi.mocked(prisma.event.findMany).mockResolvedValue(mockEvents as never);
    vi.mocked(prisma.event.count).mockResolvedValue(1);

    const request = new Request(
      `${createApiUrl("/events")}?projectId=project-1&level=error&page=1&limit=50`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.events).toHaveLength(1);
    expect(data.events[0].id).toBe("event-1");
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(50);
  });

  it("должен применять фильтры по дате, поиску и URL", async () => {
    mockProjectAccess(true, "owner");
    vi.mocked(prisma.event.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.event.count).mockResolvedValue(0);

    const request = new Request(
      `${createApiUrl("/events")}?projectId=project-1&startDate=2024-01-01&endDate=2024-12-31&search=test&url=example.com&userId=user-123`
    );

    await GET(request);

    expect(prisma.event.findMany).toHaveBeenCalled();
    const callArgs = vi.mocked(prisma.event.findMany).mock.calls[0]?.[0] as {
      where: {
        projectId: string;
        message?: { contains: string };
        url?: { contains: string } | null;
        userId?: string;
        timestamp?: { gte: Date; lte: Date };
      };
    };
    expect(callArgs).toBeDefined();
    expect(callArgs.where).toBeDefined();
    expect(callArgs.where.projectId).toBe("project-1");
    expect(callArgs.where.message?.contains).toBe("test");
    expect(callArgs.where.url?.contains).toBe("example.com");
    expect(callArgs.where.userId).toBe("user-123");
    expect(callArgs.where.timestamp?.gte).toBeInstanceOf(Date);
    expect(callArgs.where.timestamp?.lte).toBeInstanceOf(Date);
  });
});

describe("OPTIONS /api/events", () => {
  it("должен возвращать CORS заголовки", async () => {
    const response = await OPTIONS();

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, OPTIONS"
    );
  });
});
