import { sql, ensureSchema } from "./db";
import { zonedParts } from "./time";

// dow: 0 = Monday ... 6 = Sunday. Minutes from midnight, Toronto wall clock.
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAYS_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export type Window = { rep: string; dow: number; s: number; e: number };

const h = (x: number) => x * 60;
function weekly(rep: string, days: number[], s: number, e: number): Window[] {
  return days.map((dow) => ({ rep, dow, s: h(s), e: h(e) }));
}
// Placeholder availability so the page has something to show. Everyone can overwrite theirs.
export const SAMPLE_AVAILABILITY: Window[] = [
  ...weekly("Hunter", [0, 1, 2, 3, 4], 9, 12), ...weekly("Hunter", [0, 1, 2, 3, 4], 14, 18), ...weekly("Hunter", [5], 10, 14),
  ...weekly("Jamal", [0, 1, 2, 3], 12, 20), ...weekly("Jamal", [5], 9, 13),
  ...weekly("Jaxson", [0, 2, 4], 10, 16), ...weekly("Jaxson", [1, 3], 17, 21), ...weekly("Jaxson", [5], 11, 15),
  ...weekly("Cameron", [1, 2, 3, 4, 5], 9, 13), ...weekly("Cameron", [1, 2, 3, 4], 15, 17.5),
  ...weekly("Marcus", [0, 1, 2, 3, 4], 18, 21), ...weekly("Marcus", [6], 12, 16),
  ...weekly("Headsick", [0, 1, 2, 3, 4], 17, 20), ...weekly("Headsick", [5], 9, 14),
  ...weekly("Sebastian", [0, 2, 3], 9, 15), ...weekly("Sebastian", [6], 10, 14),
];

export async function getAvailability(): Promise<Window[]> {
  await ensureSchema();
  const rows = await sql`select rep, dow, start_min, end_min from availability order by rep, dow, start_min`;
  return rows.map((r: any) => ({ rep: r.rep, dow: r.dow, s: r.start_min, e: r.end_min }));
}

/** Today's day of week (0 = Mon) and minutes since midnight, in the app's time zone. */
export function nowInTz() {
  const p = zonedParts(new Date());
  const sun0 = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
  return { dow: (sun0 + 6) % 7, min: p.h * 60 + p.min, y: p.y, m: p.m, d: p.d };
}

/** YYYY-MM-DD of the given weekday in the current week (week starts Monday). */
export function dateOfDow(dow: number) {
  const n = nowInTz();
  const base = Date.UTC(n.y, n.m - 1, n.d) + (dow - n.dow) * 86400000;
  return new Date(base).toISOString().slice(0, 10);
}

export function fmtMin(m: number) {
  const hh = Math.floor(m / 60), mm = m % 60;
  const ap = hh >= 12 ? "pm" : "am";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm ? `${h12}:${String(mm).padStart(2, "0")}${ap}` : `${h12}${ap}`;
}
export function toHHMM(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export function fromHHMM(v: string): number | null {
  const x = /^(\d{1,2}):(\d{2})$/.exec(v || "");
  if (!x) return null;
  const n = Number(x[1]) * 60 + Number(x[2]);
  return n >= 0 && n <= 1440 ? n : null;
}
