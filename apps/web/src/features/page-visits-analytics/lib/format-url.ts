export interface FormattedUrl {
  fullUrl: string;
  displayText: string;
  shortUrl: string;
}

export function formatUrl(url: string): FormattedUrl {
  const decodedUrl = decodeURIComponent(url);
  const shortUrl = decodedUrl.slice(8);
  const urlObj = new URL(decodedUrl);
  const displayText = `${urlObj.pathname}${urlObj.hash || ""}`;

  return {
    fullUrl: decodedUrl,
    displayText,
    shortUrl,
  };
}
