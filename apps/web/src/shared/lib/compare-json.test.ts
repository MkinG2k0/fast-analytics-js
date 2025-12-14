import { describe, expect, it } from "vitest";
import { Prisma } from "@repo/database";

import { compareJson } from "./compare-json";

describe("compareJson", () => {
  it("должен возвращать true для одинаковых простых объектов", () => {
    const obj1 = { a: 1, b: "test" };
    const obj2 = { a: 1, b: "test" };
    expect(compareJson(obj1, obj2)).toBe(true);
  });

  it("должен возвращать false для разных объектов", () => {
    const obj1 = { a: 1, b: "test" };
    const obj2 = { a: 2, b: "test" };
    expect(compareJson(obj1, obj2)).toBe(false);
  });

  it("должен возвращать true для объектов с разным порядком ключей", () => {
    const obj1 = { a: 1, b: "test", c: true };
    const obj2 = { c: true, a: 1, b: "test" };
    expect(compareJson(obj1, obj2)).toBe(true);
  });

  it("должен возвращать true для одинаковых массивов", () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];
    expect(compareJson(arr1, arr2)).toBe(true);
  });

  it("должен возвращать false для разных массивов", () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 4];
    expect(compareJson(arr1, arr2)).toBe(false);
  });

  it("должен возвращать true для одинаковых вложенных объектов", () => {
    const obj1 = { a: { b: { c: 1 } } };
    const obj2 = { a: { b: { c: 1 } } };
    expect(compareJson(obj1, obj2)).toBe(true);
  });

  it("должен возвращать false для разных вложенных объектов", () => {
    const obj1 = { a: { b: { c: 1 } } };
    const obj2 = { a: { b: { c: 2 } } };
    expect(compareJson(obj1, obj2)).toBe(false);
  });

  it("должен возвращать true для null значений", () => {
    expect(compareJson(null, null)).toBe(true);
    expect(compareJson(undefined, undefined)).toBe(true);
  });

  it("должен возвращать true для Prisma.JsonNull", () => {
    expect(compareJson(Prisma.JsonNull, Prisma.JsonNull)).toBe(true);
    expect(compareJson(Prisma.JsonNull, null)).toBe(true);
    expect(compareJson(null, Prisma.JsonNull)).toBe(true);
  });

  it("должен возвращать true для Prisma.DbNull", () => {
    expect(compareJson(Prisma.DbNull, Prisma.DbNull)).toBe(true);
    expect(compareJson(Prisma.DbNull, null)).toBe(true);
    expect(compareJson(null, Prisma.DbNull)).toBe(true);
  });

  it("должен возвращать false при сравнении null и объекта", () => {
    expect(compareJson(null, { a: 1 })).toBe(false);
    expect(compareJson({ a: 1 }, null)).toBe(false);
  });

  it("должен фильтровать null значения из массивов", () => {
    const arr1 = [1, null, 3];
    const arr2 = [1, 3];
    expect(compareJson(arr1, arr2)).toBe(true);
  });

  it("должен фильтровать null значения из объектов", () => {
    const obj1 = { a: 1, b: null, c: 3 };
    const obj2 = { a: 1, c: 3 };
    expect(compareJson(obj1, obj2)).toBe(true);
  });

  it("должен сортировать ключи объектов", () => {
    const obj1 = { z: 1, a: 2, m: 3 };
    const obj2 = { a: 2, m: 3, z: 1 };
    expect(compareJson(obj1, obj2)).toBe(true);
  });

  it("должен обрабатывать смешанные типы", () => {
    const obj1 = {
      string: "test",
      number: 123,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      nested: { a: 1 },
    };
    const obj2 = {
      boolean: true,
      number: 123,
      string: "test",
      array: [1, 2, 3],
      nested: { a: 1 },
    };
    expect(compareJson(obj1, obj2)).toBe(true);
  });

  it("должен обрабатывать пустые объекты", () => {
    expect(compareJson({}, {})).toBe(true);
  });

  it("должен обрабатывать пустые массивы", () => {
    expect(compareJson([], [])).toBe(true);
  });

  it("должен обрабатывать массивы с объектами", () => {
    const arr1 = [{ a: 1 }, { b: 2 }];
    const arr2 = [{ a: 1 }, { b: 2 }];
    expect(compareJson(arr1, arr2)).toBe(true);
  });

  it("должен обрабатывать массивы с объектами в разном порядке ключей", () => {
    const arr1 = [{ a: 1, b: 2 }];
    const arr2 = [{ b: 2, a: 1 }];
    expect(compareJson(arr1, arr2)).toBe(true);
  });

  it("должен возвращать false для массивов с разным порядком элементов", () => {
    const arr1 = [{ a: 1 }, { b: 2 }];
    const arr2 = [{ b: 2 }, { a: 1 }];
    expect(compareJson(arr1, arr2)).toBe(false);
  });

  it("должен обрабатывать сложные вложенные структуры", () => {
    const obj1 = {
      users: [
        { id: 1, name: "Alice", tags: ["admin", "user"] },
        { id: 2, name: "Bob", tags: ["user"] },
      ],
      settings: { theme: "dark", notifications: true },
    };
    const obj2 = {
      settings: { notifications: true, theme: "dark" },
      users: [
        { name: "Alice", id: 1, tags: ["admin", "user"] },
        { id: 2, name: "Bob", tags: ["user"] },
      ],
    };
    expect(compareJson(obj1, obj2)).toBe(true);
  });
});
