import { getCallsBetween, getSettings } from "./data";
import { getAvailability } from "./availability";
import { colorFor } from "../components/Shell";
import { dayKey, todayKey, zonedParts } from "./time";

/** Everything the booking picker needs, computed on the server. */
export async function getBookingData(excludeLeadId?: string) {
  const [settings, windows, calls] = await Promise.all([
    getSettings(),
    getAvailability(),
    getCallsBetween(new Date(Date.now() - 2 * 86400000), new Date(Date.now() + 30 * 86400000)),
  ]);
  const colors: Record<string, string> = {};
  for (const r of settings.reps) colors[r] = colorFor(r, settings.reps);
  const booked = calls
    .filter((c) => c.id !== excludeLeadId && c.call_at && c.call_rep)
    .map((c) => {
      const p = zonedParts(c.call_at!);
      return { rep: c.call_rep, date: dayKey(c.call_at!), min: p.h * 60 + p.min, name: c.business || c.contact || "Call" };
    });
  return { reps: settings.reps, colors, windows, booked, today: todayKey() };
}

export function initialPick(callAt: Date | null, rep: string) {
  if (!callAt) return null;
  const p = zonedParts(callAt);
  return { date: dayKey(callAt), min: p.h * 60 + p.min, rep };
}
