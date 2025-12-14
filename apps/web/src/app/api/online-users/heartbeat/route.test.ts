import { describe, expect, it, beforeEach, vi } from "vitest";

import { POST, OPTIONS } from "./route";
import { prisma } from "@/shared/lib/prisma";
import { markUserOnline } from "@/shared/lib/redis";
import {
  createApiRequest,
  expectResponse,
  mockInvalidProject,
  mockValidProject,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/shared/lib/redis", () => ({
  redis: {
    set: vi.fn(),
    scan: vi.fn(),
  },
  markUserOnline: vi.fn(),
}));

describe("POST /api/online-users/heartbeat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать 401 если API ключ не предоставлен", async () => {
    const request = createApiRequest("/api/online-users/heartbeat", {
      body: { sessionId: "session-1" },
    });

    await expectResponse(await POST(request), 401, "API ключ не предоставлен");
  });

  it("должен возвращать 401 если API ключ неверный", async () => {
    mockInvalidProject();

    const request = createApiRequest("/api/online-users/heartbeat", {
      apiKey: "invalid-key",
      body: { sessionId: "session-1" },
    });

    await expectResponse(await POST(request), 401, "Неверный API ключ");
  });

  it("должен отмечать пользователя как онлайн", async () => {
    mockValidProject();
    vi.mocked(markUserOnline).mockResolvedValue(undefined);

    const request = createApiRequest("/api/online-users/heartbeat", {
      apiKey: "valid-key",
      body: { sessionId: "session-1" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(markUserOnline).toHaveBeenCalledWith("project-1", "session-1");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("должен возвращать 400 при ошибке валидации", async () => {
    mockValidProject();

    const request = createApiRequest("/api/online-users/heartbeat", {
      apiKey: "valid-key",
      body: { sessionId: "" },
    });

    await expectResponse(await POST(request), 400, "Неверные данные");
  });

  it("должен обрабатывать внутренние ошибки", async () => {
    mockValidProject();
    vi.mocked(markUserOnline).mockRejectedValue(new Error("Redis error"));

    const request = createApiRequest("/api/online-users/heartbeat", {
      apiKey: "valid-key",
      body: { sessionId: "session-1" },
    });

    await expectResponse(await POST(request), 500, "Внутренняя ошибка сервера");
  });
});

describe("OPTIONS /api/online-users/heartbeat", () => {
  it("должен возвращать CORS заголовки", async () => {
    const response = await OPTIONS();

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "POST, OPTIONS"
    );
  });
});
