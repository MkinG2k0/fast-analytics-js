import { Prisma } from "@repo/database";

import { prisma } from "./prisma";
import { compareJson } from "./compare-json";

export async function checkEventDuplicate(
  projectId: string,
  url: string | null,
  context:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | null
    | undefined
): Promise<boolean> {
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
      context: true,
    },
  });

  for (const event of existingEvents) {
    if (compareJson(event.context, context)) {
      return true;
    }
  }

  return false;
}
