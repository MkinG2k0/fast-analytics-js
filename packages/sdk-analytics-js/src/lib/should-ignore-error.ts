import type { EventPayload } from "../model";

const matchesUrlPattern = (url: string, pattern: string): boolean => {
  if (pattern === url) {
    return true;
  }

  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return url.startsWith(prefix);
  }

  if (pattern.startsWith("*")) {
    const suffix = pattern.slice(1);
    return url.endsWith(suffix);
  }

  if (pattern.includes("*")) {
    const regexPattern = pattern
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  }

  return false;
};

const getUrlFromPayload = (payload: EventPayload): string | undefined => {
  const url =
    payload.url || payload.context?.url || payload.context?.customTags?.url;

  if (!url) {
    return undefined;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    if (url.startsWith("/")) {
      return url;
    }
    return url;
  }
};

export const shouldIgnoreError = (
  payload: EventPayload,
  ignoreError?: { codes?: (string | number)[]; urls?: string[] }
): boolean => {
  if (!ignoreError) {
    return false;
  }

  const checkCodes = (): boolean => {
    if (!ignoreError.codes || ignoreError.codes.length === 0) {
      return false;
    }

    const statusCode = payload.context?.customTags?.statusCode;

    if (!statusCode) {
      return false;
    }

    const statusCodeNumber = Number(statusCode);
    const statusCodeString = String(statusCode);

    return (
      ignoreError.codes.includes(statusCodeNumber) ||
      ignoreError.codes.includes(statusCodeString)
    );
  };

  const checkUrls = (): boolean => {
    if (!ignoreError.urls || ignoreError.urls.length === 0) {
      return false;
    }

    const pathname = getUrlFromPayload(payload);

    if (!pathname) {
      return false;
    }

    return ignoreError.urls.some((pattern) =>
      matchesUrlPattern(pathname, pattern)
    );
  };

  return checkCodes() || checkUrls();
};
