import { describe, expect, it, beforeEach, vi } from "vitest";
import { Prisma } from "@repo/database";

import { findEventDuplicate } from "./check-event-duplicate";
import { prisma } from "./prisma";
import { compareJson } from "./compare-json";

vi.mock("./prisma", () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("./compare-json", () => ({
  compareJson: vi.fn(),
}));

describe("findEventDuplicate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен находить дубликат по URL и context", async () => {
    const projectId = "project-1";
    const url = "https://example.com/page";
    const context = { error: "Test error" };

    const existingEvents = [
      {
        id: "event-1",
        context: { error: "Test error" },
        occurrenceCount: 5,
      },
      {
        id: "event-2",
        context: { error: "Different error" },
        occurrenceCount: 2,
      },
    ];

    vi.mocked(prisma.event.findMany).mockResolvedValue(existingEvents as never);
    vi.mocked(compareJson).mockReturnValueOnce(true).mockReturnValueOnce(false);

    const result = await findEventDuplicate(projectId, url, context);

    expect(result).toEqual({ id: "event-1", occurrenceCount: 5 });
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        projectId,
        url,
      },
      select: {
        id: true,
        context: true,
        occurrenceCount: true,
      },
    });
  });

  it("должен возвращать null если дубликат не найден", async () => {
    const projectId = "project-1";
    const url = "https://example.com/page";
    const context = { error: "Test error" };

    const existingEvents = [
      {
        id: "event-1",
        context: { error: "Different error" },
        occurrenceCount: 5,
      },
    ];

    vi.mocked(prisma.event.findMany).mockResolvedValue(existingEvents as never);
    vi.mocked(compareJson).mockReturnValue(false);

    const result = await findEventDuplicate(projectId, url, context);

    expect(result).toBeNull();
  });

  it("должен возвращать null если событий с таким URL нет", async () => {
    const projectId = "project-1";
    const url = "https://example.com/page";
    const context = { error: "Test error" };

    vi.mocked(prisma.event.findMany).mockResolvedValue([] as never);

    const result = await findEventDuplicate(projectId, url, context);

    expect(result).toBeNull();
  });

  it("должен обрабатывать null URL", async () => {
    const projectId = "project-1";
    const url = null;
    const context = { error: "Test error" };

    const existingEvents = [
      {
        id: "event-1",
        context: { error: "Test error" },
        occurrenceCount: 3,
      },
    ];

    vi.mocked(prisma.event.findMany).mockResolvedValue(existingEvents as never);
    vi.mocked(compareJson).mockReturnValue(true);

    const result = await findEventDuplicate(projectId, url, context);

    expect(result).toEqual({ id: "event-1", occurrenceCount: 3 });
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        projectId,
        url: null,
      },
      select: {
        id: true,
        context: true,
        occurrenceCount: true,
      },
    });
  });

  it("должен обрабатывать пустую строку URL как null", async () => {
    const projectId = "project-1";
    const url = "";
    const context = { error: "Test error" };

    vi.mocked(prisma.event.findMany).mockResolvedValue([] as never);

    await findEventDuplicate(projectId, url, context);

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        projectId,
        url: null,
      },
      select: {
        id: true,
        context: true,
        occurrenceCount: true,
      },
    });
  });

  it("должен сравнивать context используя compareJson", async () => {
    const projectId = "project-1";
    const url = "https://example.com/page";
    const context1 = { a: 1, b: 2 };
    const context2 = { b: 2, a: 1 };

    const existingEvents = [
      {
        id: "event-1",
        context: context2,
        occurrenceCount: 1,
      },
    ];

    vi.mocked(prisma.event.findMany).mockResolvedValue(existingEvents as never);
    vi.mocked(compareJson).mockReturnValue(true);

    const result = await findEventDuplicate(projectId, url, context1);

    expect(result).toEqual({ id: "event-1", occurrenceCount: 1 });
    expect(compareJson).toHaveBeenCalledWith(context2, context1);
  });

  it("должен возвращать первое найденное совпадение", async () => {
    const projectId = "project-1";
    const url = "https://example.com/page";
    const context = { error: "Test error" };

    const existingEvents = [
      {
        id: "event-1",
        context: { error: "Test error" },
        occurrenceCount: 5,
      },
      {
        id: "event-2",
        context: { error: "Test error" },
        occurrenceCount: 10,
      },
    ];

    vi.mocked(prisma.event.findMany).mockResolvedValue(existingEvents as never);
    vi.mocked(compareJson).mockReturnValue(true);

    const result = await findEventDuplicate(projectId, url, context);

    expect(result).toEqual({ id: "event-1", occurrenceCount: 5 });
    expect(compareJson).toHaveBeenCalledTimes(1);
  });

  it("должен обрабатывать Prisma JsonNull в context", async () => {
    const projectId = "project-1";
    const url = "https://example.com/page";
    const context = Prisma.JsonNull;

    const existingEvents = [
      {
        id: "event-1",
        context: null,
        occurrenceCount: 1,
      },
    ];

    vi.mocked(prisma.event.findMany).mockResolvedValue(existingEvents as never);
    vi.mocked(compareJson).mockReturnValue(true);

    const result = await findEventDuplicate(projectId, url, context);

    expect(result).toEqual({ id: "event-1", occurrenceCount: 1 });
  });

  it("должен обрабатывать сложные вложенные context", async () => {
    const projectId = "project-1";
    const url = "https://example.com/page";
    const context = {
      request: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { userId: 123 },
      },
      response: {
        status: 200,
        data: { success: true },
      },
    };

    const existingEvents = [
      {
        id: "event-1",
        context: {
          request: {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: { userId: 123 },
          },
          response: {
            data: { success: true },
            status: 200,
          },
        },
        occurrenceCount: 3,
      },
    ];

    vi.mocked(prisma.event.findMany).mockResolvedValue(existingEvents as never);
    vi.mocked(compareJson).mockReturnValue(true);

    const result = await findEventDuplicate(projectId, url, context);

    expect(result).toEqual({ id: "event-1", occurrenceCount: 3 });
  });
});
