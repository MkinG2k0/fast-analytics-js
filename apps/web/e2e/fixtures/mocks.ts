export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date().toISOString(),
};

export const mockProjects = [
  {
    id: "project-1",
    name: "Мой первый проект",
    description: "Описание проекта",
    apiKey: "api-key-123",
    userId: mockUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "project-2",
    name: "Второй проект",
    description: null,
    apiKey: "api-key-456",
    userId: mockUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockEvents = [
  {
    id: "event-1",
    projectId: "project-1",
    timestamp: new Date().toISOString(),
    level: "error",
    message: "Test error message",
    stack: null,
    context: null,
    userAgent: "Mozilla/5.0",
    url: "https://example.com",
    sessionId: "session-123",
    userId: null,
    createdAt: new Date().toISOString(),
    screenshotUrl: null,
    clickTrace: null,
    performance: null,
    metadata: null,
  },
  {
    id: "event-2",
    projectId: "project-1",
    timestamp: new Date().toISOString(),
    level: "warning",
    message: "Test warning message",
    stack: null,
    context: null,
    userAgent: "Mozilla/5.0",
    url: "https://example.com/page",
    sessionId: "session-123",
    userId: null,
    createdAt: new Date().toISOString(),
    screenshotUrl: null,
    clickTrace: null,
    performance: null,
    metadata: null,
  },
];

export const mockToken = "mock-jwt-token-123";

