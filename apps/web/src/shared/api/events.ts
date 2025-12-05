import type { Event } from "@/entities/event";
import { apiClient } from "@/shared/lib/axios";

const API_BASE = "/api/events";

export interface GetEventsParams {
  projectId: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  url?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface GetEventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
}

export async function getEvents(params: GetEventsParams): Promise<GetEventsResponse> {
  const { data } = await apiClient.get<GetEventsResponse>(API_BASE, {
    params,
  });
  return data;
}

export async function getEvent(id: string): Promise<Event> {
  const { data } = await apiClient.get<Event>(`${API_BASE}/${id}`);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`${API_BASE}/${id}`);
}

