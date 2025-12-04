import { Event } from "@repo/types";

const API_BASE = "/api/events";

export interface GetEventsParams {
  projectId: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
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
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(`${API_BASE}?${queryParams.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Ошибка загрузки событий");
  }

  return response.json();
}

export async function getEvent(id: string): Promise<Event> {
  const response = await fetch(`${API_BASE}/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Ошибка загрузки события");
  }

  return response.json();
}

export async function deleteEvent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Ошибка удаления события");
  }
}

