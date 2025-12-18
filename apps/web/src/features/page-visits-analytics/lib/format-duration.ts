export function formatDuration(milliseconds: number): string {
  if (!milliseconds || milliseconds < 0) {
    return "-";
  }

  const MS_PER_SECOND = 1000;
  const MS_PER_MINUTE = 60 * MS_PER_SECOND;
  const MS_PER_HOUR = 60 * MS_PER_MINUTE;

  if (milliseconds < MS_PER_SECOND) {
    return `${milliseconds.toLocaleString()} мс`;
  }

  if (milliseconds < MS_PER_MINUTE) {
    const seconds = Math.round(milliseconds / MS_PER_SECOND);
    return `${seconds} сек`;
  }

  if (milliseconds < MS_PER_HOUR) {
    const minutes = Math.round(milliseconds / MS_PER_MINUTE);
    return `${minutes} мин`;
  }

  const hours = Math.round(milliseconds / MS_PER_HOUR);
  return `${hours} ч`;
}
