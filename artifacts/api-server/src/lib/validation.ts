const MAX_TEXT_LENGTH = 500;
const MAX_LONG_TEXT_LENGTH = 10_000;

export function isBoundedText(value: unknown, maxLength = MAX_TEXT_LENGTH): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export function isOptionalText(value: unknown, maxLength = MAX_TEXT_LENGTH): value is string | undefined {
  return value === undefined || (typeof value === "string" && value.length <= maxLength);
}

export function isStringArray(value: unknown, maxItems = 20): value is string[] {
  return value === undefined ||
    (Array.isArray(value) && value.length <= maxItems && value.every((item) => isBoundedText(item, 80)));
}

export function isValidId(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isValidHours(value: unknown): value is Array<{
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}> {
  if (!Array.isArray(value) || value.length > 7) return false;
  const days = new Set<number>();
  return value.every((hour) => {
    if (!hour || typeof hour !== "object") return false;
    const candidate = hour as Record<string, unknown>;
    const day = candidate.dayOfWeek;
    if (typeof day !== "number" || !Number.isInteger(day) || day < 0 || day > 6 || days.has(day)) return false;
    if (!isValidTime(candidate.openTime) || !isValidTime(candidate.closeTime)) return false;
    if (typeof candidate.isClosed !== "boolean") return false;
    days.add(day);
    return true;
  });
}

export function isValidBookingBody(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  const required = ["service", "price", "duration", "barber", "barberLabel", "date", "time", "startIso", "endIso"];
  if (!required.every((key) => isBoundedText(body[key]))) return false;
  if (!/^[a-z0-9-]{1,40}$/i.test(body.barber as string)) return false;
  if (!/^[a-z0-9 .,'+$-]{1,80}$/i.test(body.price as string)) return false;
  if (!/^[a-z0-9 .,'-]{1,80}$/i.test(body.duration as string)) return false;
  const start = Date.parse(body.startIso as string);
  const end = Date.parse(body.endIso as string);
  return Number.isFinite(start) && Number.isFinite(end) && start >= Date.now() &&
    end > start && end - start <= 4 * 60 * 60 * 1000;
}

export const MAX_LONG_TEXT = MAX_LONG_TEXT_LENGTH;