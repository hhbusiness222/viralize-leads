import { sql, ensureSchema, hasDb } from "./db";
import { DEFAULT_HOW, DEFAULT_REPS, type Activity, type Lead } from "./types";

function rowToLead(r: any): Lead {
  return {
    ...r,
    how: Array.isArray(r.how) ? r.how : [],
    value: Number(r.value || 0),
    call_at: r.call_at ? new Date(r.call_at) : null,
    follow_up_at: r.follow_up_at ? new Date(r.follow_up_at) : null,
    created_at: new Date(r.created_at),
    updated_at: new Date(r.updated_at),
  };
}

export async function getSettings(): Promise<{ reps: string[]; how: string[] }> {
  if (!hasDb()) return { reps: DEFAULT_REPS, how: DEFAULT_HOW };
  await ensureSchema();
  const rows = await sql`select key, value from settings where key in ('reps','how')`;
  const out = { reps: DEFAULT_REPS as string[], how: DEFAULT_HOW as string[] };
  for (const r of rows) {
    if (r.key === "reps" && Array.isArray(r.value) && r.value.length) out.reps = r.value;
    if (r.key === "how" && Array.isArray(r.value) && r.value.length) out.how = r.value;
  }
  return out;
}

export async function getLeads(opts: { stage?: string; rep?: string; q?: string; sort?: string } = {}): Promise<Lead[]> {
  await ensureSchema();
  const q = (opts.q || "").trim();
  const like = `%${q}%`;
  const rows = await sql`
    select * from leads
    where (${opts.stage || ""} = '' or stage = ${opts.stage || ""})
      and (${opts.rep || ""} = '' or rep = ${opts.rep || ""} or call_rep = ${opts.rep || ""})
      and (${q} = '' or business ilike ${like} or contact ilike ${like} or phone ilike ${like} or trade ilike ${like} or source ilike ${like} or text_notes ilike ${like})
    order by
      case when ${opts.sort || "updated"} = 'created' then created_at end desc,
      case when ${opts.sort || "updated"} = 'name' then business end asc,
      case when ${opts.sort || "updated"} = 'call' then call_at end asc nulls last,
      updated_at desc
  `;
  return rows.map(rowToLead);
}

export async function getStageCounts(): Promise<Record<string, number>> {
  await ensureSchema();
  const rows = await sql`select stage, count(*)::int as n from leads group by stage`;
  const out: Record<string, number> = {};
  for (const r of rows) out[r.stage] = r.n;
  return out;
}

export async function getLead(id: string): Promise<Lead | null> {
  await ensureSchema();
  const rows = await sql`select * from leads where id = ${id}`;
  return rows[0] ? rowToLead(rows[0]) : null;
}

export async function getActivity(leadId: string): Promise<Activity[]> {
  const rows = await sql`select * from activity where lead_id = ${leadId} order by at desc limit 200`;
  return rows.map((r: any) => ({ ...r, at: new Date(r.at) }));
}

export async function getCallsBetween(from: Date, to: Date, rep?: string): Promise<Lead[]> {
  await ensureSchema();
  const rows = await sql`
    select * from leads
    where call_at is not null and call_at >= ${from} and call_at < ${to}
      and (${rep || ""} = '' or call_rep = ${rep || ""})
    order by call_at asc
  `;
  return rows.map(rowToLead);
}

export async function getOverdueCalls(): Promise<Lead[]> {
  await ensureSchema();
  const rows = await sql`
    select * from leads
    where stage = 'booked' and call_at is not null and call_at < now() - interval '15 minutes'
    order by call_at asc
  `;
  return rows.map(rowToLead);
}

export async function getDistinct(col: "trade" | "source"): Promise<string[]> {
  await ensureSchema();
  const rows =
    col === "trade"
      ? await sql`select distinct trade as v from leads where trade <> '' order by 1 limit 50`
      : await sql`select distinct source as v from leads where source <> '' order by 1 limit 50`;
  return rows.map((r: any) => r.v);
}

export async function getFollowUpsDue(): Promise<Lead[]> {
  await ensureSchema();
  const rows = await sql`
    select * from leads
    where follow_up_at is not null and follow_up_at <= now() + interval '12 hours'
      and stage not in ('won','lost')
    order by follow_up_at asc
  `;
  return rows.map(rowToLead);
}

export async function getFollowUpsBetween(from: Date, to: Date, rep?: string): Promise<Lead[]> {
  await ensureSchema();
  const rows = await sql`
    select * from leads
    where follow_up_at is not null and follow_up_at >= ${from} and follow_up_at < ${to}
      and stage not in ('won','lost')
      and (${rep || ""} = '' or rep = ${rep || ""})
    order by follow_up_at asc
  `;
  return rows.map(rowToLead);
}
