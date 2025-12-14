import { describe, expect, it, beforeEach, vi } from "vitest";

import { POST } from "./route";
import { prisma } from "@/shared/lib/prisma";
import { hashPassword, generateToken } from "@/shared/lib/auth";
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
      create: vi.fn(),
    },
  },
}));

vi.mock("@/shared/lib/auth", () => ({
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать 400 при ошибке валидации", async () => {
    const request = createApiRequest("/api/auth/register", {
      body: { email: "invalid-email", password: "123" },
    });

    const data = await expectResponse(await POST(request), 400);
    expect(data.message).toBeDefined();
  });

  it("должен возвращать 400 если пользователь уже существует", async () => {
    mockUserFound();

    const request = createApiRequest("/api/auth/register", {
      body: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    });

    await expectResponse(
      await POST(request),
      400,
      "Пользователь с таким email уже существует"
    );
  });

  it("должен создавать пользователя и возвращать токен", async () => {
    const hashedPassword = "hashed-password-123";
    const mockToken = "jwt-token-123";
    const newUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      createdAt: new Date(),
    };

    mockUserNotFound();
    vi.mocked(hashPassword).mockResolvedValue(hashedPassword);
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...newUser,
      password: hashedPassword,
      updatedAt: new Date(),
    } as never);
    vi.mocked(generateToken).mockReturnValue(mockToken);

    const request = createApiRequest("/api/auth/register", {
      body: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe(newUser.id);
    expect(data.user.email).toBe(newUser.email);
    expect(data.user.name).toBe(newUser.name);
    expect(data.token).toBe(mockToken);
    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
    expect(generateToken).toHaveBeenCalledWith({
      userId: newUser.id,
      email: newUser.email,
    });
  });

  it("должен создавать пользователя без имени если оно не предоставлено", async () => {
    const hashedPassword = "hashed-password-123";
    const mockToken = "jwt-token-123";
    const newUser = {
      id: "user-1",
      email: "test@example.com",
      name: null,
      createdAt: new Date(),
    };

    mockUserNotFound();
    vi.mocked(hashPassword).mockResolvedValue(hashedPassword);
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...newUser,
      password: hashedPassword,
      updatedAt: new Date(),
    } as never);
    vi.mocked(generateToken).mockReturnValue(mockToken);

    const request = createApiRequest("/api/auth/register", {
      body: { email: "test@example.com", password: "password123" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.name).toBeNull();
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "test@example.com",
        password: hashedPassword,
        name: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  });

  it("должен обрабатывать внутренние ошибки", async () => {
    mockUserNotFound();
    vi.mocked(hashPassword).mockResolvedValue("hashed");
    vi.mocked(prisma.user.create).mockRejectedValue(
      new Error("Database error")
    );

    const request = createApiRequest("/api/auth/register", {
      body: { email: "test@example.com", password: "password123" },
    });

    await expectResponse(await POST(request), 500, "Внутренняя ошибка сервера");
  });
});
