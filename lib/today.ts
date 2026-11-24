import { sql, ensureSchema } from "./db";
import { fromLocalInput, todayKey } from "./time";
import { getLeads } from "./data";
import type { Lead } from "./types";

const map = (rows: any[]): Lead[] =>
  rows.map((r) => ({
    ...r,
    how: Array.isArray(r.how) ? r.how : [],
    value: Number(r.value || 0),
    call_len: Number(r.call_len) || 30,
    call_at: r.call_at ? new Date(r.call_at) : null,
    follow_up_at: r.follow_up_at ? new Date(r.follow_up_at) : null,
    created_at: new Date(r.created_at),
    updated_at: new Date(r.updated_at),
  }));

export async function getToday(rep: string) {
  await ensureSchema();
  void getLeads; // keep data module warm
  const start = fromLocalInput(todayKey() + "T00:00")!;
  const end = new Date(start.getTime() + 86400000);
  const [calls, noOutcome, followUps, quiet] = await Promise.all([
    sql`select * from leads where call_rep = ${rep} and call_at >= ${start} and call_at < ${end} order by call_at`,
    sql`select * from leads where call_rep = ${rep} and stage = 'booked' and call_at < now() - interval '15 minutes' and call_at < ${start} order by call_at`,
    sql`select * from leads where rep = ${rep} and follow_up_at is not null and follow_up_at < ${end} and stage not in ('won','lost') order by follow_up_at`,
    sql`select * from leads where rep = ${rep} and stage = 'texting' and updated_at < now() - interval '2 days' order by updated_at`,
  ]);
  return { calls: map(calls), noOutcome: map(noOutcome), followUps: map(followUps), quiet: map(quiet) };
}
