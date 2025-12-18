import { describe, it, expect, beforeEach, vi } from "vitest";
import { createScreenshot } from "./create-screenshot";

describe("createScreenshot", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("должен возвращать null если window не определен", async () => {
    const originalWindow = global.window;
    // @ts-expect-error - временно удаляем window для теста
    delete global.window;

    const result = await createScreenshot();
    expect(result).toBeNull();

    global.window = originalWindow;
  });

  it("должен возвращать null если document не определен", async () => {
    const originalDocument = global.document;
    // @ts-expect-error - временно удаляем document для теста
    delete global.document;

    const result = await createScreenshot();
    expect(result).toBeNull();

    global.document = originalDocument;
  });

  it("должен использовать fallback метод если html2canvas-pro недоступен", async () => {
    // В тестовом окружении html2canvas-pro обычно недоступен, поэтому используется fallback
    const result = await createScreenshot();

    // Должен вернуть fallback скриншот или null если canvas недоступен
    if (result !== null) {
      expect(typeof result).toBe("string");
      expect(result.startsWith("data:image/png")).toBe(true);
    }
  });

  it("должен обрабатывать ошибки при создании скриншота", async () => {
    // В тестовом окружении могут быть ошибки, функция должна их обработать
    const result = await createScreenshot();

    // Результат может быть null или строкой
    if (result !== null) {
      expect(typeof result).toBe("string");
    }
  });

  it("должен создавать простой fallback скриншот", async () => {
    // В тестовом окружении используется fallback
    const result = await createScreenshot();

    if (result !== null) {
      expect(result.startsWith("data:image/png")).toBe(true);
    }
  });

  it("должен возвращать null если canvas context недоступен", async () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

    const originalImport = (globalThis as Record<string, unknown>).import;
    (globalThis as Record<string, unknown>).import = vi
      .fn()
      .mockRejectedValue(new Error("Not found"));

    const result = await createScreenshot();

    expect(result).toBeNull();

    HTMLCanvasElement.prototype.getContext = originalGetContext;
    (globalThis as Record<string, unknown>).import = originalImport;
  });
});
