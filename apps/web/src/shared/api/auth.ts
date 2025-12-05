import type { User } from "@/entities/user";
import type { RegisterDto } from "@repo/database";
import { apiClient } from "@/shared/lib/axios";

const API_BASE = "/api/auth";

export interface RegisterResponse {
  user: User;
  token: string;
}

export async function register(data: RegisterDto): Promise<RegisterResponse> {
  const { data: result } = await apiClient.post<RegisterResponse>(`${API_BASE}/register`, data);
  return result;
}

