import { describe, expect, it, beforeEach, vi } from "vitest";

import { POST } from "./route";
import { prisma } from "@/shared/lib/prisma";
import { verifyPassword, generateToken } from "@/shared/lib/auth";
import {
  createApiRequest,
  expectResponse,
  mockUser,
  mockUserFound,
  mockUserNotFound,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/shared/lib/auth", () => ({
  verifyPassword: vi.fn(),
  generateToken: vi.fn(),
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать 400 при ошибке валидации", async () => {
    const request = createApiRequest("/api/auth/login", {
      body: { email: "invalid-email", password: "" },
    });

    const data = await expectResponse(await POST(request), 400);
    expect(data.message).toBeDefined();
  });

  it("должен возвращать 401 если пользователь не найден", async () => {
    mockUserNotFound();

    const request = createApiRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "password123" },
    });

    await expectResponse(await POST(request), 401, "Неверный email или пароль");
  });

  it("должен возвращать 401 если пароль неверный", async () => {
    mockUserFound();
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const request = createApiRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "wrong-password" },
    });

    await expectResponse(await POST(request), 401, "Неверный email или пароль");
  });

  it("должен возвращать токен и данные пользователя при успешном входе", async () => {
    const mockToken = "jwt-token-123";

    mockUserFound();
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(generateToken).mockReturnValue(mockToken);

    const request = createApiRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "password123" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe(mockToken);
    expect(data.user.id).toBe(mockUser.id);
    expect(data.user.email).toBe(mockUser.email);
    expect(data.user.name).toBe(mockUser.name);
    expect(verifyPassword).toHaveBeenCalledWith(
      "password123",
      "hashed-password"
    );
    expect(generateToken).toHaveBeenCalledWith({
      userId: mockUser.id,
      email: mockUser.email,
    });
  });

  it("должен обрабатывать внутренние ошибки", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(
      new Error("Database error")
    );

    const request = createApiRequest("/api/auth/login", {
      body: { email: "test@example.com", password: "password123" },
    });

    await expectResponse(await POST(request), 500, "Внутренняя ошибка сервера");
  });
});
