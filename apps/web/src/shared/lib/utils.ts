import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateApiKey(): string {
  const prefix = "fa_";
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}${randomBytes}`;
}

export interface ParsedUrl {
  baseUrl: string;
  params: Record<string, string>;
  hasParams: boolean;
}

export function parseUrl(url: string): ParsedUrl {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const baseUrl = urlObj.origin + urlObj.pathname;

    return {
      baseUrl,
      params,
      hasParams: Object.keys(params).length > 0,
    };
  } catch {
    // Если URL невалидный, просто возвращаем исходный URL
    return {
      baseUrl: url,
      params: {},
      hasParams: false,
    };
  }
}

