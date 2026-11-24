import { sql, ensureSchema } from "./db";
import { fromLocalInput, todayKey } from "./time";

export type Period = "week" | "lastweek" | "month" | "all";
export const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "lastweek", label: "Last week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

export function range(p: Period): { from: Date; to: Date } {
  const today = todayKey();
  const d = new Date(today + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7;
  const day = (n: number) => new Date(d.getTime() + n * 86400000).toISOString().slice(0, 10);
  const at = (k: string) => fromLocalInput(k + "T00:00")!;
  if (p === "week") return { from: at(day(-dow)), to: at(day(7 - dow)) };
  if (p === "lastweek") return { from: at(day(-dow - 7)), to: at(day(-dow)) };
  if (p === "month") {
    const first = today.slice(0, 8) + "01";
    const nm = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
    return { from: at(first), to: at(nm) };
  }
  return { from: new Date(0), to: new Date(Date.now() + 365 * 86400000) };
}

export type RepStats = { added: number; booked: number; taken: number; showed: number; won: number };

export async function getStats(p: Period): Promise<Record<string, RepStats>> {
  await ensureSchema();
  const { from, to } = range(p);
  const out: Record<string, RepStats> = {};
  const get = (r: string) => (out[r] ||= { added: 0, booked: 0, taken: 0, showed: 0, won: 0 });
  const [added, booked, taken, won] = await Promise.all([
    sql`select created_by as r, count(*)::int n from leads where created_at >= ${from} and created_at < ${to} and created_by <> '' group by 1`,
    sql`select by_rep as r, count(*)::int n from activity
        where at >= ${from} and at < ${to} and by_rep <> '' and (text like 'Call booked%' or text ilike '%· call booked%') group by 1`,
    sql`select call_rep as r, count(*)::int n, count(*) filter (where outcome like 'Showed%')::int s
        from leads where call_rep <> '' and call_at >= ${from} and call_at < ${to} and call_at < now() group by 1`,
    sql`select l.rep as r, count(*)::int n from leads l
        where l.stage = 'won' and l.rep <> '' and coalesce(
          (select max(a.at) from activity a where a.lead_id = l.id and a.text = 'Moved to Won'), l.updated_at
        ) >= ${from} and coalesce(
          (select max(a.at) from activity a where a.lead_id = l.id and a.text = 'Moved to Won'), l.updated_at
        ) < ${to} group by 1`,
  ]);
  for (const x of added) get(x.r).added = x.n;
  for (const x of booked) get(x.r).booked = x.n;
  for (const x of taken) { get(x.r).taken = x.n; get(x.r).showed = x.s; }
  for (const x of won) get(x.r).won = x.n;
  return out;
}
