import { Prisma } from "@repo/database";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

function normalizeJsonValue(value: unknown): JsonValue | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value === Prisma.JsonNull || value === Prisma.DbNull) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map(normalizeJsonValue)
      .filter((v) => v !== null) as JsonValue[];
  }

  if (typeof value === "object") {
    const normalized: Record<string, JsonValue> = {};
    const sortedKeys = Object.keys(value).sort();

    for (const key of sortedKeys) {
      const normalizedValue = normalizeJsonValue(
        (value as Record<string, unknown>)[key]
      );
      if (normalizedValue !== null) {
        normalized[key] = normalizedValue;
      }
    }

    return normalized;
  }

  return null;
}

export function compareJson(
  a:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | null
    | undefined,
  b:
    | Prisma.InputJsonValue
    | Prisma.NullableJsonNullValueInput
    | null
    | undefined
): boolean {
  const normalizedA = normalizeJsonValue(a);
  const normalizedB = normalizeJsonValue(b);

  return JSON.stringify(normalizedA) === JSON.stringify(normalizedB);
}
