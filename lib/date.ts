export function formatDateUtcMinus6(
  dateLike: string | number | Date | null | undefined
): string {
  if (!dateLike) return "";
  const date = new Date(dateLike as unknown as string);
  if (Number.isNaN(date.getTime())) return "";

  // Apply fixed UTC-06:00 offset (no DST) by shifting the timestamp
  const shifted = new Date(date.getTime() - 6 * 60 * 60 * 1000);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(shifted);
}


