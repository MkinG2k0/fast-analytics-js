import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET } from "./route";
import { getUserProjectRole } from "@/shared/lib/project-access";
import {
  createApiUrl,
  expectResponse,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/shared/lib/project-access", () => ({
  getUserProjectRole: vi.fn(),
}));

describe("GET /api/projects/[id]/role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать роль пользователя в проекте", async () => {
    mockAuthenticatedSession();
    vi.mocked(getUserProjectRole).mockResolvedValue("owner");

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/role", { id: "project-1" })
    );

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.role).toBe("owner");
    expect(getUserProjectRole).toHaveBeenCalledWith("project-1", "user-1");
  });

  it("должен возвращать роль member", async () => {
    mockAuthenticatedSession();
    vi.mocked(getUserProjectRole).mockResolvedValue("member");

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/role", { id: "project-1" })
    );

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.role).toBe("member");
  });

  it("должен возвращать null если пользователь не участник", async () => {
    mockAuthenticatedSession();
    vi.mocked(getUserProjectRole).mockResolvedValue(null);

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/role", { id: "project-1" })
    );

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.role).toBeNull();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/role", { id: "project-1" })
    );

    await expectResponse(await GET(request, { params }), 401, "Не авторизован");
  });

  it("должен возвращать 500 при ошибке БД", async () => {
    mockAuthenticatedSession();
    vi.mocked(getUserProjectRole).mockRejectedValue(
      new Error("Database error")
    );

    const params = Promise.resolve({ id: "project-1" });
    const request = new Request(
      createApiUrl("/projects/[id]/role", { id: "project-1" })
    );

    await expectResponse(
      await GET(request, { params }),
      500,
      "Внутренняя ошибка сервера"
    );
  });
});
