export const getBrowserUrl = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.location.href;
};

export const getBrowserUserAgent = (): string | undefined => {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return navigator.userAgent;
};

