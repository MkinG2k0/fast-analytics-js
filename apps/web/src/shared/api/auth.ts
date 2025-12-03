import { RegisterDto, User } from "@repo/types";

const API_BASE = "/api/auth";

export async function register(data: RegisterDto): Promise<{ user: User; token: string }> {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Ошибка регистрации");
  }

  return response.json();
}

