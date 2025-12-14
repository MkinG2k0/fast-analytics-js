import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET } from "./route";
import {
  checkProjectAccess,
  ProjectPermission,
} from "@/shared/lib/project-access";
import { getOnlineUsersCount } from "@/shared/lib/redis";
import {
  createApiUrl,
  expectResponse,
  mockAuthenticatedSession,
  mockProjectAccess,
  mockUnauthenticatedSession,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/shared/lib/project-access", () => ({
  checkProjectAccess: vi.fn(),
  ProjectPermission: {
    VIEW: "VIEW",
  },
}));

vi.mock("@/shared/lib/redis", () => ({
  getOnlineUsersCount: vi.fn(),
}));

describe("GET /api/online-users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = new Request(
      `${createApiUrl("/online-users")}?projectId=project-1`
    );

    await expectResponse(await GET(request), 401, "Не авторизован");
  });

  it("должен возвращать 400 если projectId не предоставлен", async () => {
    const request = new Request(createApiUrl("/online-users"));

    await expectResponse(await GET(request), 400, "projectId обязателен");
  });

  it("должен возвращать 403 если нет доступа к проекту", async () => {
    mockProjectAccess(false);

    const request = new Request(
      `${createApiUrl("/online-users")}?projectId=project-1`
    );

    await expectResponse(await GET(request), 403, "Доступ запрещен");
  });

  it("должен возвращать количество онлайн пользователей", async () => {
    mockProjectAccess(true, "owner");
    vi.mocked(getOnlineUsersCount).mockResolvedValue(5);

    const request = new Request(
      `${createApiUrl("/online-users")}?projectId=project-1`
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(5);
    expect(getOnlineUsersCount).toHaveBeenCalledWith("project-1");
    expect(checkProjectAccess).toHaveBeenCalledWith(
      "project-1",
      "user-1",
      ProjectPermission.VIEW
    );
  });

  it("должен обрабатывать внутренние ошибки", async () => {
    mockProjectAccess(true, "owner");
    vi.mocked(getOnlineUsersCount).mockRejectedValue(new Error("Redis error"));

    const request = new Request(
      `${createApiUrl("/online-users")}?projectId=project-1`
    );

    await expectResponse(await GET(request), 500, "Внутренняя ошибка сервера");
  });
});
