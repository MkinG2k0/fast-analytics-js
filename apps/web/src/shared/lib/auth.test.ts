import { describe, expect, it, beforeEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getTokenFromRequest,
  type JWTPayload,
} from "./auth";

describe("hashPassword", () => {
  it("должен хешировать пароль", async () => {
    const password = "testPassword123";
    const hashed = await hashPassword(password);
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(0);
  });

  it("должен генерировать разные хеши для одного пароля", async () => {
    const password = "testPassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    // bcrypt генерирует разные хеши из-за соли
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("должен проверять правильный пароль", async () => {
    const password = "testPassword123";
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword(password, hashed);
    expect(isValid).toBe(true);
  });

  it("должен отклонять неправильный пароль", async () => {
    const password = "testPassword123";
    const wrongPassword = "wrongPassword";
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword(wrongPassword, hashed);
    expect(isValid).toBe(false);
  });
});

describe("generateToken", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-key";
  });

  it("должен генерировать токен", () => {
    const payload: JWTPayload = {
      userId: "user123",
      email: "test@example.com",
    };
    const token = generateToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT состоит из 3 частей
  });

  it("должен генерировать разные токены для разных payload", () => {
    const payload1: JWTPayload = {
      userId: "user123",
      email: "test1@example.com",
    };
    const payload2: JWTPayload = {
      userId: "user456",
      email: "test2@example.com",
    };
    const token1 = generateToken(payload1);
    const token2 = generateToken(payload2);
    expect(token1).not.toBe(token2);
  });
});

describe("verifyToken", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-key";
  });

  it("должен проверять валидный токен", () => {
    const payload: JWTPayload = {
      userId: "user123",
      email: "test@example.com",
    };
    const token = generateToken(payload);
    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
  });

  it("должен отклонять невалидный токен", () => {
    const invalidToken = "invalid.token.here";
    const verified = verifyToken(invalidToken);
    expect(verified).toBeNull();
  });

  it("должен обрабатывать искаженный токен", () => {
    // Создаем токен с неправильной структурой
    const invalidToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
    const verified = verifyToken(invalidToken);
    expect(verified).toBeNull();
  });

  it("должен отклонять пустой токен", () => {
    const verified = verifyToken("");
    expect(verified).toBeNull();
  });
});

describe("getTokenFromRequest", () => {
  it("должен извлекать токен из заголовка Authorization", () => {
    const token = "test-token-123";
    const request = new Request("https://example.com", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const extracted = getTokenFromRequest(request);
    expect(extracted).toBe(token);
  });

  it("должен возвращать null если заголовок отсутствует", () => {
    const request = new Request("https://example.com");
    const extracted = getTokenFromRequest(request);
    expect(extracted).toBeNull();
  });

  it("должен возвращать null если заголовок не начинается с Bearer", () => {
    const request = new Request("https://example.com", {
      headers: {
        Authorization: "Basic dGVzdDp0ZXN0",
      },
    });
    const extracted = getTokenFromRequest(request);
    expect(extracted).toBeNull();
  });

  it("должен обрабатывать токен с пробелами", () => {
    const token = "test-token-123";
    const request = new Request("https://example.com", {
      headers: {
        Authorization: `Bearer  ${token}  `,
      },
    });
    const extracted = getTokenFromRequest(request);
    expect(extracted).toBe(` ${token}  `);
  });
});
