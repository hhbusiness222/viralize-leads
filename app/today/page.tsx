import Link from "next/link";
import Shell, { colorFor } from "../../components/Shell";
import { Pill } from "../../components/LeadCard";
import { getSettings, isAdmin } from "../../lib/data";
import { currentRep } from "../../lib/auth";
import { getToday } from "../../lib/today";
import { fmtDate, fmtDateTime, fmtTime } from "../../lib/time";
import type { Lead } from "../../lib/types";

export const dynamic = "force-dynamic";

function Row({ l, when, tone }: { l: Lead; when: string; tone?: "red" | "pink" | "grey" }) {
  const color = tone === "red" ? "var(--red)" : tone === "pink" ? "#d946ef" : tone === "grey" ? "var(--muted)" : "var(--blue)";
  const tel = (l.phone || "").replace(/[^\d+]/g, "");
  return (
    <div className="today-row" style={{ borderLeftColor: color }}>
      <Link href={`/lead/${l.id}`} className="tr-main">
        <div className="tr-when" style={{ color }}>{when}</div>
        <div className="tr-who">{l.business || l.contact || "Lead"}</div>
        <div className="small">{[l.contact, l.next_step].filter(Boolean).join(" · ")}</div>
      </Link>
      <div className="tr-act">
        <Pill stage={l.stage} />
        {tel && <a className="btn ghost sm" href={`sms:${tel}`}>Text</a>}
      </div>
    </div>
  );
}

function Section({ title, hint, children, n }: { title: string; hint: string; n: number; children: React.ReactNode }) {
  return (
    <div className="panel" style={{ marginBottom: 14 }}>
      <div className="ph">{title} <span className="count">{n}</span></div>
      <div className="pb" style={{ display: "grid", gap: 8 }}>
        {n === 0 ? <div className="small">{hint}</div> : children}
      </div>
    </div>
  );
}

export default async function Today({ searchParams }: { searchParams: { rep?: string } }) {
  const me = currentRep();
  const settings = await getSettings();
  const admin = isAdmin(me);
  const rep = admin && searchParams.rep && settings.reps.includes(searchParams.rep) ? searchParams.rep : me;
  const t = await getToday(rep);
  const total = t.calls.length + t.noOutcome.length + t.followUps.length + t.quiet.length;
  const hello = new Intl.DateTimeFormat("en-CA", { timeZone: process.env.APP_TZ || "America/Toronto", weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <Shell active="today" title="Today" reps={settings.reps} actions={admin ? <Link href="/stats" className="btn ghost sm">Stats</Link> : undefined}>
      <div className="today-head">
        <div>
          <div className="small">{hello}</div>
          <div className="title" style={{ margin: 0 }}>{rep === me ? `Hey ${me}` : `${rep}'s day`}</div>
          <div className="small">{total ? `${total} thing${total === 1 ? "" : "s"} on ${rep === me ? "your" : "his"} plate` : rep === me ? "Nothing on your plate. Go text some leads." : "Nothing on his plate."}</div>
        </div>
        {admin && (
          <form method="get" className="row">
            <select name="rep" defaultValue={rep} style={{ width: "auto" }}>
              {settings.reps.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn ghost sm" type="submit">View</button>
          </form>
        )}
      </div>

      <Section title="My calls today" hint="No calls today." n={t.calls.length}>
        {t.calls.map((l) => <Row key={l.id} l={l} when={`${fmtTime(l.call_at)} · ${l.call_len || 30} min`} />)}
      </Section>

      <Section title="Calls with no outcome" hint="All caught up." n={t.noOutcome.length}>
        {t.noOutcome.map((l) => <Row key={l.id} l={l} when={`Was ${fmtDateTime(l.call_at)} · log what happened`} tone="red" />)}
      </Section>

      <Section title="Follow-ups due" hint="Nothing due." n={t.followUps.length}>
        {t.followUps.map((l) => <Row key={l.id} l={l} when={`Follow up ${fmtDate(l.follow_up_at)}`} tone="pink" />)}
      </Section>

      <Section title="Gone quiet (2+ days)" hint="Nobody's gone quiet." n={t.quiet.length}>
        {t.quiet.map((l) => {
          const days = Math.floor((Date.now() - l.updated_at.getTime()) / 86400000);
          return <Row key={l.id} l={l} when={`No activity in ${days} days`} tone="grey" />;
        })}
      </Section>

      <div className="small">Gone quiet = still in Texting with nothing logged for 2 days. Text them again or move them to Lost.</div>
      <span style={{ display: "none" }}>{colorFor(rep, settings.reps)}</span>
    </Shell>
  );
}
