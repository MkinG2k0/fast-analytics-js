import { describe, expect, it, beforeEach, vi } from "vitest";

import { GET, POST } from "./route";
import { prisma } from "@/shared/lib/prisma";
import { generateApiKey } from "@/shared/lib/utils";
import {
  createApiRequest,
  createApiUrl,
  expectResponse,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from "@/test/helpers/api-test-helpers";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    projectMember: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/shared/lib/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/shared/lib/utils", () => ({
  generateApiKey: vi.fn(),
}));

describe("GET /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = new Request(createApiUrl("/projects"));

    await expectResponse(await GET(request), 401, "Не авторизован");
  });

  it("должен возвращать список проектов пользователя", async () => {
    const mockOwnedProjects = [
      {
        id: "project-1",
        name: "Owned Project",
        userId: "user-1",
        description: null,
        apiKey: "key-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockMemberProjects = [
      {
        projectId: "project-2",
        userId: "user-1",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        project: {
          id: "project-2",
          name: "Member Project",
          userId: "user-2",
          description: null,
          apiKey: "key-2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    vi.mocked(prisma.project.findMany).mockResolvedValue(
      mockOwnedProjects as never
    );
    vi.mocked(prisma.projectMember.findMany).mockResolvedValue(
      mockMemberProjects as never
    );

    const request = new Request(createApiUrl("/projects"));

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe("project-1");
    expect(data[1].id).toBe("project-2");
  });

  it("должен убирать дубликаты проектов", async () => {
    const mockOwnedProjects = [
      {
        id: "project-1",
        name: "Project",
        userId: "user-1",
        description: null,
        apiKey: "key-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockMemberProjects = [
      {
        projectId: "project-1",
        userId: "user-1",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        project: {
          id: "project-1",
          name: "Project",
          userId: "user-1",
          description: null,
          apiKey: "key-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    vi.mocked(prisma.project.findMany).mockResolvedValue(
      mockOwnedProjects as never
    );
    vi.mocked(prisma.projectMember.findMany).mockResolvedValue(
      mockMemberProjects as never
    );

    const request = new Request(createApiUrl("/projects"));

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
  });

  it("должен обрабатывать внутренние ошибки", async () => {
    vi.mocked(prisma.project.findMany).mockRejectedValue(
      new Error("Database error")
    );

    const request = new Request(createApiUrl("/projects"));

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Внутренняя ошибка сервера");
  });
});

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedSession();
  });

  it("должен возвращать 401 если пользователь не авторизован", async () => {
    mockUnauthenticatedSession();

    const request = createApiRequest("/api/projects", {
      body: { name: "New Project" },
    });

    await expectResponse(await POST(request), 401, "Не авторизован");
  });

  it("должен возвращать 400 при ошибке валидации", async () => {
    const request = createApiRequest("/api/projects", {
      body: { name: "" },
    });

    const data = await expectResponse(await POST(request), 400);
    expect(data.message).toBeDefined();
  });

  it("должен создавать проект и ProjectMember", async () => {
    const mockApiKey = "generated-api-key";
    const mockProject = {
      id: "project-1",
      name: "New Project",
      description: "Project description",
      apiKey: mockApiKey,
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(generateApiKey).mockReturnValue(mockApiKey);
    vi.mocked(prisma.project.create).mockResolvedValue(mockProject as never);
    vi.mocked(prisma.projectMember.create).mockResolvedValue({
      projectId: "project-1",
      userId: "user-1",
      role: "owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const request = createApiRequest("/api/projects", {
      body: { name: "New Project", description: "Project description" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe(mockProject.id);
    expect(data.name).toBe(mockProject.name);
    expect(data.apiKey).toBe(mockProject.apiKey);
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        name: "New Project",
        description: "Project description",
        apiKey: mockApiKey,
        userId: "user-1",
      },
    });
    expect(prisma.projectMember.create).toHaveBeenCalledWith({
      data: {
        projectId: "project-1",
        userId: "user-1",
        role: "owner",
      },
    });
  });

  it("должен создавать проект без описания", async () => {
    const mockApiKey = "generated-api-key";
    const mockProject = {
      id: "project-1",
      name: "New Project",
      description: null,
      apiKey: mockApiKey,
      userId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(generateApiKey).mockReturnValue(mockApiKey);
    vi.mocked(prisma.project.create).mockResolvedValue(mockProject as never);
    vi.mocked(prisma.projectMember.create).mockResolvedValue({} as never);

    const request = createApiRequest("/api/projects", {
      body: { name: "New Project" },
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        name: "New Project",
        description: null,
        apiKey: mockApiKey,
        userId: "user-1",
      },
    });
  });

  it("должен обрабатывать внутренние ошибки", async () => {
    vi.mocked(generateApiKey).mockReturnValue("key");
    vi.mocked(prisma.project.create).mockRejectedValue(
      new Error("Database error")
    );

    const request = createApiRequest("/api/projects", {
      body: { name: "New Project" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe("Внутренняя ошибка сервера");
  });
});
