import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  getUserProjectRole,
  hasProjectPermission,
  checkProjectAccess,
  ProjectPermission,
} from "./project-access";
import { prisma } from "./prisma";
import type { ProjectRole } from "@repo/database";

vi.mock("./prisma", () => ({
  prisma: {
    project: {
      findFirst: vi.fn(),
    },
    projectMember: {
      findUnique: vi.fn(),
    },
  },
}));

describe("getUserProjectRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать owner если пользователь владелец проекта", async () => {
    const projectId = "project1";
    const userId = "user1";

    vi.mocked(prisma.project.findFirst).mockResolvedValue({
      id: projectId,
      userId,
      name: "Test Project",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const role = await getUserProjectRole(projectId, userId);
    expect(role).toBe("owner");
    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: projectId, userId },
    });
  });

  it("должен возвращать роль из projectMember если пользователь не владелец", async () => {
    const projectId = "project1";
    const userId = "user2";

    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
      projectId,
      userId,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const role = await getUserProjectRole(projectId, userId);
    expect(role).toBe("admin");
    expect(prisma.projectMember.findUnique).toHaveBeenCalledWith({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  });

  it("должен возвращать null если пользователь не имеет доступа", async () => {
    const projectId = "project1";
    const userId = "user3";

    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    const role = await getUserProjectRole(projectId, userId);
    expect(role).toBeNull();
  });
});

describe("hasProjectPermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать true для owner с любым разрешением", async () => {
    const projectId = "project1";
    const userId = "user1";

    vi.mocked(prisma.project.findFirst).mockResolvedValue({
      id: projectId,
      userId,
      name: "Test Project",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const hasView = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.VIEW
    );
    const hasEdit = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.EDIT
    );
    const hasDelete = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.DELETE
    );
    const hasManageMembers = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.MANAGE_MEMBERS
    );
    const hasManageSettings = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.MANAGE_SETTINGS
    );

    expect(hasView).toBe(true);
    expect(hasEdit).toBe(true);
    expect(hasDelete).toBe(true);
    expect(hasManageMembers).toBe(true);
    expect(hasManageSettings).toBe(true);
  });

  it("должен возвращать правильные разрешения для admin", async () => {
    const projectId = "project1";
    const userId = "user2";

    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
      projectId,
      userId,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const hasView = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.VIEW
    );
    const hasEdit = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.EDIT
    );
    const hasDelete = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.DELETE
    );
    const hasManageMembers = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.MANAGE_MEMBERS
    );
    const hasManageSettings = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.MANAGE_SETTINGS
    );

    expect(hasView).toBe(true);
    expect(hasEdit).toBe(true);
    expect(hasDelete).toBe(false);
    expect(hasManageMembers).toBe(true);
    expect(hasManageSettings).toBe(true);
  });

  it("должен возвращать правильные разрешения для member", async () => {
    const projectId = "project1";
    const userId = "user3";

    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
      projectId,
      userId,
      role: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const hasView = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.VIEW
    );
    const hasEdit = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.EDIT
    );
    const hasDelete = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.DELETE
    );
    const hasManageMembers = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.MANAGE_MEMBERS
    );

    expect(hasView).toBe(true);
    expect(hasEdit).toBe(true);
    expect(hasDelete).toBe(false);
    expect(hasManageMembers).toBe(false);
  });

  it("должен возвращать правильные разрешения для viewer", async () => {
    const projectId = "project1";
    const userId = "user4";

    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
      projectId,
      userId,
      role: "viewer",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const hasView = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.VIEW
    );
    const hasEdit = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.EDIT
    );
    const hasDelete = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.DELETE
    );

    expect(hasView).toBe(true);
    expect(hasEdit).toBe(false);
    expect(hasDelete).toBe(false);
  });

  it("должен возвращать false если пользователь не имеет доступа", async () => {
    const projectId = "project1";
    const userId = "user5";

    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    const hasView = await hasProjectPermission(
      projectId,
      userId,
      ProjectPermission.VIEW
    );
    expect(hasView).toBe(false);
  });
});

describe("checkProjectAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен возвращать hasAccess: true и role для owner", async () => {
    const projectId = "project1";
    const userId = "user1";

    vi.mocked(prisma.project.findFirst).mockResolvedValue({
      id: projectId,
      userId,
      name: "Test Project",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await checkProjectAccess(
      projectId,
      userId,
      ProjectPermission.VIEW
    );

    expect(result.hasAccess).toBe(true);
    expect(result.role).toBe("owner");
  });

  it("должен возвращать hasAccess: true и role для admin с разрешением", async () => {
    const projectId = "project1";
    const userId = "user2";

    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
      projectId,
      userId,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await checkProjectAccess(
      projectId,
      userId,
      ProjectPermission.EDIT
    );

    expect(result.hasAccess).toBe(true);
    expect(result.role).toBe("admin");
  });

  it("должен возвращать hasAccess: false для admin без разрешения", async () => {
    const projectId = "project1";
    const userId = "user2";

    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
      projectId,
      userId,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await checkProjectAccess(
      projectId,
      userId,
      ProjectPermission.DELETE
    );

    expect(result.hasAccess).toBe(false);
    expect(result.role).toBe("admin");
  });

  it("должен возвращать hasAccess: false и role: null для пользователя без доступа", async () => {
    const projectId = "project1";
    const userId = "user5";

    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null);

    const result = await checkProjectAccess(
      projectId,
      userId,
      ProjectPermission.VIEW
    );

    expect(result.hasAccess).toBe(false);
    expect(result.role).toBeNull();
  });
});
