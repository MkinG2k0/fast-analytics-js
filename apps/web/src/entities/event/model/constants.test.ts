import { describe, expect, it } from "vitest";

import { getLevelColorConfig, levelColors } from "./constants";

describe("getLevelColorConfig", () => {
  it("должен возвращать правильные цвета для уровня error", () => {
    const config = getLevelColorConfig("error");
    expect(config).toEqual(levelColors.error);
    expect(config.color).toBe("#ef4444");
    expect(config.bg).toBe("#fee2e2");
  });

  it("должен возвращать правильные цвета для уровня warn", () => {
    const config = getLevelColorConfig("warn");
    expect(config).toEqual(levelColors.warn);
    expect(config.color).toBe("#f59e0b");
    expect(config.bg).toBe("#fef3c7");
  });

  it("должен возвращать правильные цвета для уровня info", () => {
    const config = getLevelColorConfig("info");
    expect(config).toEqual(levelColors.info);
    expect(config.color).toBe("#3b82f6");
    expect(config.bg).toBe("#dbeafe");
  });

  it("должен возвращать правильные цвета для уровня debug", () => {
    const config = getLevelColorConfig("debug");
    expect(config).toEqual(levelColors.debug);
    expect(config.color).toBe("#6b7280");
    expect(config.bg).toBe("#f3f4f6");
  });

  it("должен возвращать дефолтный цвет для неизвестного уровня", () => {
    const config = getLevelColorConfig("unknown");
    expect(config).toEqual(levelColors.debug);
    expect(config.color).toBe("#6b7280");
    expect(config.bg).toBe("#f3f4f6");
  });

  it("должен возвращать дефолтный цвет для пустой строки", () => {
    const config = getLevelColorConfig("");
    expect(config).toEqual(levelColors.debug);
  });

  it("должен возвращать объект с полями color и bg", () => {
    const config = getLevelColorConfig("error");
    expect(config).toHaveProperty("color");
    expect(config).toHaveProperty("bg");
    expect(typeof config.color).toBe("string");
    expect(typeof config.bg).toBe("string");
  });

  it("должен возвращать дефолтный цвет для null", () => {
    const config = getLevelColorConfig(null as unknown as string);
    expect(config).toEqual(levelColors.debug);
  });

  it("должен возвращать дефолтный цвет для undefined", () => {
    const config = getLevelColorConfig(undefined as unknown as string);
    expect(config).toEqual(levelColors.debug);
  });
});
