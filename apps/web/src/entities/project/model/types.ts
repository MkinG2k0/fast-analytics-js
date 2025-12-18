import type { Project, ProjectSettings } from "@repo/database";
import type { Prisma } from "@repo/database";

export type { Project, ProjectSettings };

export type ProjectWithSettings = Prisma.ProjectGetPayload<{
  include: {
    settings: true;
  };
}>;
