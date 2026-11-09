import postgres from "postgres";

function findUrl(): string {
  const direct = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
  if (direct) return direct;
  // Vercel marketplace integrations may add a custom prefix, e.g. STORAGE_DATABASE_URL
  for (const [k, v] of Object.entries(process.env)) {
    if (v && /(^|_)(DATABASE_URL|POSTGRES_URL)$/.test(k) && !/UNPOOLED|NO_SSL|PRISMA/.test(k)) return v;
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (v && /(^|_)(DATABASE_URL|POSTGRES_URL)/.test(k)) return v;
  }
  return "";
}
const url = findUrl();

declare global {
  // eslint-disable-next-line no-var
  var __vz_sql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __vz_schema_ready: Promise<void> | undefined;
}

export function hasDb() {
  return Boolean(url);
}

export const sql =
  globalThis.__vz_sql ??
  postgres(url || "postgres://invalid", {
    ssl: url && !url.includes("localhost") ? "require" : undefined,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
if (process.env.NODE_ENV !== "production") globalThis.__vz_sql = sql;

export async function ensureSchema() {
  if (!globalThis.__vz_schema_ready) {
    globalThis.__vz_schema_ready = (async () => {
      await sql`
        create table if not exists leads (
          id text primary key,
          business text not null default '',
          contact text not null default '',
          phone text not null default '',
          email text not null default '',
          trade text not null default '',
          source text not null default '',
          rep text not null default '',
          stage text not null default 'texting',
          how jsonb not null default '[]',
          text_notes text not null default '',
          call_at timestamptz,
          call_rep text not null default '',
          outcome text not null default '',
          call_notes text not null default '',
          next_step text not null default '',
          lost_reason text not null default '',
          created_by text not null default '',
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )`;
      await sql`
        create table if not exists activity (
          id bigserial primary key,
          lead_id text not null references leads(id) on delete cascade,
          at timestamptz not null default now(),
          text text not null,
          by_rep text not null default ''
        )`;
      await sql`alter table leads add column if not exists value numeric not null default 0`;
      await sql`alter table leads add column if not exists follow_up_at timestamptz`;
      await sql`create index if not exists leads_followup_idx on leads(follow_up_at)`;
      await sql`update leads set stage = 'texting' where stage = 'interested'`;
      await sql`update leads set stage = 'calldone' where stage = 'plansent'`;
      await sql`update leads set stage = 'lost' where stage = 'ghosted'`;
      await sql`create index if not exists activity_lead_idx on activity(lead_id, at desc)`;
      await sql`create index if not exists leads_stage_idx on leads(stage)`;
      await sql`create index if not exists leads_call_idx on leads(call_at)`;
      await sql`
        create table if not exists settings (
          key text primary key,
          value jsonb not null
        )`;
    })().catch((e) => {
      globalThis.__vz_schema_ready = undefined;
      throw e;
    });
  }
  return globalThis.__vz_schema_ready;
}
