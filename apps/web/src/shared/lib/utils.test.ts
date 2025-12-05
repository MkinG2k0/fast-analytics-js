import { describe, expect, it } from "vitest";
import { cn, generateApiKey, parseUrl, type ParsedUrl } from "./utils";

describe("cn", () => {
  it("должен объединять классы", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("должен обрабатывать условные классы", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("должен обрабатывать объекты", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("должен обрабатывать массивы", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("должен игнорировать undefined и null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("generateApiKey", () => {
  it("должен генерировать API ключ с префиксом fa_", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^fa_[a-f0-9]{64}$/);
  });

  it("должен генерировать уникальные ключи", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1).not.toBe(key2);
  });

  it("должен генерировать ключ правильной длины", () => {
    const key = generateApiKey();
    expect(key.length).toBe(67); // "fa_" + 64 hex chars
  });
});

describe("parseUrl", () => {
  it("должен парсить простой URL", () => {
    const result = parseUrl("https://example.com/path");
    expect(result).toEqual({
      baseUrl: "https://example.com/path",
      hash: null,
      params: {},
      hasParams: false,
    });
  });

  it("должен парсить URL с query параметрами", () => {
    const result = parseUrl("https://example.com/path?foo=bar&baz=qux");
    expect(result).toEqual({
      baseUrl: "https://example.com/path",
      hash: null,
      params: { foo: "bar", baz: "qux" },
      hasParams: true,
    });
  });

  it("должен парсить URL с хешем", () => {
    const result = parseUrl("https://example.com/path#section");
    expect(result).toEqual({
      baseUrl: "https://example.com/path",
      hash: "section",
      params: {},
      hasParams: false,
    });
  });

  it("должен парсить URL с хешем и query параметрами", () => {
    const result = parseUrl("https://example.com/path?foo=bar#section?baz=qux");
    expect(result).toEqual({
      baseUrl: "https://example.com/path",
      hash: "section",
      params: { foo: "bar", baz: "qux" },
      hasParams: true,
    });
  });

  it("должен декодировать URL-encoded параметры", () => {
    const result = parseUrl("https://example.com/path?foo=hello%20world");
    expect(result.params.foo).toBe("hello world");
  });

  it("должен обрабатывать параметры без значений", () => {
    const result = parseUrl("https://example.com/path?foo=&bar=baz");
    expect(result.params.foo).toBe("");
    expect(result.params.bar).toBe("baz");
  });

  it("должен обрабатывать невалидный URL", () => {
    const result = parseUrl("not-a-valid-url");
    expect(result.baseUrl).toBe("not-a-valid-url");
    expect(result.hash).toBeNull();
    expect(result.params).toEqual({});
    expect(result.hasParams).toBe(false);
  });

  it("должен обрабатывать сложный URL с несколькими параметрами", () => {
    const result = parseUrl(
      "https://example.com/path?param1=value1&param2=value2&param3=value3"
    );
    expect(result.params).toEqual({
      param1: "value1",
      param2: "value2",
      param3: "value3",
    });
    expect(result.hasParams).toBe(true);
  });

  it("должен обрабатывать параметры с специальными символами", () => {
    const result = parseUrl("https://example.com/path?foo=bar%2Fbaz");
    expect(result.params.foo).toBe("bar/baz");
  });
});
