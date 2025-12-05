import { vi } from "vitest";

// Мокаем переменные окружения
process.env.JWT_SECRET = "test-secret-key";

// Мокаем next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

