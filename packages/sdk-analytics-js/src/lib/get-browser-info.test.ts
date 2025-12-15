import { describe, it, expect } from "vitest";
import { getBrowserUrl, getBrowserUserAgent } from "./get-browser-info";

describe("getBrowserUrl", () => {
  it("должен возвращать URL из window.location.href", () => {
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/test" },
      writable: true,
      configurable: true,
    });

    const result = getBrowserUrl();
    expect(result).toBe("https://example.com/test");
  });

  it("должен возвращать undefined если window не определен", () => {
    const originalWindow = global.window;
    // @ts-expect-error - временно удаляем window для теста
    delete global.window;

    const result = getBrowserUrl();
    expect(result).toBeUndefined();

    global.window = originalWindow;
  });
});

describe("getBrowserUserAgent", () => {
  it("должен возвращать userAgent из navigator", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 Test",
      writable: true,
      configurable: true,
    });

    const result = getBrowserUserAgent();
    expect(result).toBe("Mozilla/5.0 Test");
  });

  it("должен возвращать undefined если navigator не определен", () => {
    const originalNavigator = global.navigator;
    // @ts-expect-error - временно удаляем navigator для теста
    delete global.navigator;

    const result = getBrowserUserAgent();
    expect(result).toBeUndefined();

    global.navigator = originalNavigator;
  });
});
