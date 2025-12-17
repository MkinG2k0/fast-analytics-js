const matchesPattern = (pathname: string, pattern: string): boolean => {
  if (pattern === pathname) {
    return true;
  }

  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return pathname.startsWith(prefix);
  }

  if (pattern.includes("*")) {
    const regexPattern = pattern
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pathname);
  }

  return false;
};

const groupPathnameByPattern = (pathname: string, pattern: string): string => {
  if (!matchesPattern(pathname, pattern)) {
    return pathname;
  }

  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    if (prefix.endsWith("/")) {
      return prefix.slice(0, -1);
    }
    return prefix || "/";
  }

  if (pattern.includes("*")) {
    const pathParts = pathname.split("/").filter(Boolean);
    const patternParts = pattern.split("/").filter(Boolean);

    if (pathParts.length !== patternParts.length) {
      return pathname;
    }

    const result: string[] = [];

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart === "*") {
        result.push("*");
      } else {
        result.push(patternPart);
      }
    }

    return "/" + result.join("/");
  }

  return pattern;
};

export const groupPageVisitPathname = (
  pathname: string,
  patterns?: string[]
): string => {
  if (!patterns || patterns.length === 0) {
    return pathname;
  }

  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : "/" + pathname;

  for (const pattern of patterns) {
    const normalizedPattern = pattern.startsWith("/") ? pattern : "/" + pattern;

    if (matchesPattern(normalizedPathname, normalizedPattern)) {
      return groupPathnameByPattern(normalizedPathname, normalizedPattern);
    }
  }

  return pathname;
};
