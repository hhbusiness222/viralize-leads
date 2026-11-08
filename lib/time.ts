export const TZ = process.env.APP_TZ || "America/Toronto";

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function fmtTime(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(date);
}

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(date);
}

/** Parts of a UTC instant as seen in TZ. */
export function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour") % 24, min: get("minute") };
}

/** YYYY-MM-DD of an instant in TZ. */
export function dayKey(date: Date) {
  const p = zonedParts(date);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Value for <input type="datetime-local"> from an instant, in TZ. */
export function toLocalInput(date: Date | null | undefined) {
  if (!date) return "";
  const p = zonedParts(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}

/** Interpret "YYYY-MM-DDTHH:mm" as wall-clock time in TZ and return the UTC instant. */
export function fromLocalInput(v: string | null | undefined): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  if (!m) return null;
  const [_, Y, M, D, h, mi] = m.map(Number) as unknown as number[];
  // first guess: treat as UTC, then correct by the zone offset at that instant (two passes handles DST edges)
  let guess = Date.UTC(Y, M - 1, D, h, mi);
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(guess));
    const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
    guess += Date.UTC(Y, M - 1, D, h, mi) - asUtc;
  }
  return new Date(guess);
}

export function todayKey() {
  return dayKey(new Date());
}

export function monthKey(date: Date) {
  const p = zonedParts(date);
  return `${p.y}-${String(p.m).padStart(2, "0")}`;
}
