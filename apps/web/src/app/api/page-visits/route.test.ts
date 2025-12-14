import { describe, expect, it, beforeEach, vi } from "vitest";

import { POST, GET, OPTIONS } from "./route";
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
    pageVisit: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    event: {
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

describe("POST /api/page-visits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать 401 если API ключ не предоставлен", async () => {
    const request = createApiRequest("/api/page-visits", {
      body: { url: "https://example.com" },
    });

    await expectResponse(await POST(request), 401, "API ключ не предоставлен");
  });

  it("должен возвращать 401 если API ключ неверный", async () => {
    mockInvalidProject();

    const request = createApiRequest("/api/page-visits", {
      apiKey: "invalid-key",
      body: { url: "https://example.com" },
    });

    await expectResponse(await POST(request), 401, "Неверный API ключ");
  });

  it("должен создавать посещение страницы", async () => {
    mockValidProject();
    vi.mocked(prisma.pageVisit.createMany).mockResolvedValue({
      count: 1,
    } as never);

    const request = createApiRequest("/api/page-visits", {
      apiKey: "valid-key",
      headers: {
        "user-agent": "test-agent",
        referer: "https://example.com/referer",
      },
      body: {
        url: "https://example.com/page",
        pathname: "/page",
        referrer: "https://example.com/referer",
        sessionId: "session-1",
        userId: "user-123",
        duration: 5000,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
    expect(prisma.pageVisit.createMany).toHaveBeenCalled();
    const callArgs = vi.mocked(prisma.pageVisit.createMany).mock.calls[0][0];
    expect(callArgs.data[0].projectId).toBe("project-1");
    expect(callArgs.data[0].url).toBe("https://example.com/page");
    expect(callArgs.data[0].pathname).toBe("/page");
    expect(callArgs.data[0].referrer).toBe("https://example.com/referer");
    expect(callArgs.data[0].userAgent).toBe("test-agent");
    expect(callArgs.data[0].sessionId).toBe("session-1");
    expect(callArgs.data[0].userId).toBe("user-123");
    expect(callArgs.data[0].duration).toBe(5000);
  });

  it("должен обрабатывать массив посещений", async () => {
    mockValidProject();
    vi.mocked(prisma.pageVisit.createMany).mockResolvedValue({
      count: 2,
    } as never);

    const request = createApiRequest("/api/page-visits", {
      apiKey: "valid-key",
      body: [
        { url: "https://example.com/page1" },
        { url: "https://example.com/page2" },
      ],
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(2);
  });

  it("должен возвращать 400 при ошибке валидации", async () => {
    mockValidProject();

    const request = createApiRequest("/api/page-visits", {
      apiKey: "valid-key",
      body: { url: "" },
    });

    const data = await expectResponse(await POST(request), 400);
    expect(data.message).toBeDefined();
  });

  it("должен возвращать CORS заголовки", async () => {
    mockValidProject();
    vi.mocked(prisma.pageVisit.createMany).mockResolvedValue({
      count: 1,
    } as never);

    const request = createApiRequest("/api/page-visits", {
      apiKey: "valid-key",
      body: { url: "https://example.com" },
    });

    const response = await POST(request);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("GET /api/page-visits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = new Request(
      `${createApiUrl("/page-visits")}?projectId=project-1`
    );

    await expectResponse(await GET(request), 401, "Не авторизован");
  });

  it("должен возвращать 400 если projectId не предоставлен", async () => {
    const request = new Request(createApiUrl("/page-visits"));

    await expectResponse(await GET(request), 400, "projectId обязателен");
  });

  it("должен возвращать 403 если нет доступа к проекту", async () => {
    mockProjectAccess(false);

    const request = new Request(
      `${createApiUrl("/page-visits")}?projectId=project-1`
    );

    await expectResponse(await GET(request), 403, "Доступ запрещен");
  });

  it("должен возвращать аналитику с группировкой по URL", async () => {
    const mockVisits = [
      {
        id: "visit-1",
        projectId: "project-1",
        url: "https://example.com/page1",
        pathname: "/page1",
        referrer: null,
        userAgent: "test-agent",
        sessionId: "session-1",
        userId: null,
        duration: 5000,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "visit-2",
        projectId: "project-1",
        url: "https://example.com/page1",
        pathname: "/page1",
        referrer: null,
        userAgent: "test-agent",
        sessionId: "session-2",
        userId: null,
        duration: 3000,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockErrorEvents = [
      {
        url: "https://example.com/page1",
        timestamp: new Date(),
      },
    ];

    mockProjectAccess(true, "owner");
    vi.mocked(prisma.pageVisit.findMany).mockResolvedValue(mockVisits as never);
    vi.mocked(prisma.event.findMany).mockResolvedValue(
      mockErrorEvents as never
    );

    const request = new Request(
      `${createApiUrl("/page-visits")}?projectId=project-1&groupBy=url`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analytics).toBeDefined();
    expect(data.summary).toBeDefined();
    expect(data.summary.totalVisits).toBe(2);
    expect(data.summary.uniqueSessions).toBe(2);
  });

  it("должен возвращать аналитику с группировкой по дате", async () => {
    const mockVisits = [
      {
        id: "visit-1",
        projectId: "project-1",
        url: "https://example.com/page1",
        pathname: "/page1",
        referrer: null,
        userAgent: "test-agent",
        sessionId: "session-1",
        userId: null,
        duration: null,
        timestamp: new Date("2024-01-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockAuthenticatedSession();
    mockProjectAccess(true, "owner");
    vi.mocked(prisma.pageVisit.findMany).mockResolvedValue(mockVisits as never);
    vi.mocked(prisma.event.findMany).mockResolvedValue([] as never);

    const request = new Request(
      `${createApiUrl("/page-visits")}?projectId=project-1&groupBy=date`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analytics).toBeDefined();
  });

  it("должен применять фильтры по дате", async () => {
    mockProjectAccess(true, "owner");
    vi.mocked(prisma.pageVisit.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.event.findMany).mockResolvedValue([] as never);

    const request = new Request(
      `${createApiUrl("/page-visits")}?projectId=project-1&startDate=2024-01-01&endDate=2024-12-31`
    );

    await GET(request);

    expect(prisma.pageVisit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: "project-1",
          timestamp: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });
});

describe("OPTIONS /api/page-visits", () => {
  it("должен возвращать CORS заголовки", async () => {
    const response = await OPTIONS();

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, OPTIONS"
    );
  });
});
