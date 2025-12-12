import { Prisma } from "@repo/database";

import { prisma } from "./prisma";
import { compareJson } from "./compare-json";

export async function findEventDuplicate(
  projectId: string,
  url: string | null,
  context:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | null
    | undefined
): Promise<{ id: string; occurrenceCount: number } | null> {
  const where: {
    projectId: string;
    url: string | null;
  } = {
    projectId,
    url: url || null,
  };

  const existingEvents = await prisma.event.findMany({
    where,
    select: {
      id: true,
      context: true,
      occurrenceCount: true,
    },
  });

  for (const event of existingEvents) {
    if (compareJson(event.context, context)) {
      return {
        id: event.id,
        occurrenceCount: event.occurrenceCount,
      };
    }
  }

  return null;
}
