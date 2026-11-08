import Link from "next/link";
import Shell from "../../components/Shell";
import { Avatar, Pill } from "../../components/LeadCard";
import { getCallsBetween, getOverdueCalls, getSettings } from "../../lib/data";
import { dayKey, fmtDateTime, fmtTime, fromLocalInput, monthKey, todayKey } from "../../lib/time";
import type { Lead } from "../../lib/types";

export const dynamic = "force-dynamic";

type SP = { m?: string; day?: string; rep?: string; view?: string };

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function daysIn(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo, 0)).getUTCDate();
}
function q(sp: SP, patch: Partial<SP>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  return "/calendar?" + p.toString();
}

function Appt({ l, over }: { l: Lead; over?: boolean }) {
  return (
    <Link href={`/lead/${l.id}`} className={"appt" + (over ? " over" : "")}>
      <div className="time">{over ? fmtDateTime(l.call_at) : fmtTime(l.call_at)}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="who">{l.business || l.contact}</div>
        <div className="s">{[l.contact, l.trade, l.phone].filter(Boolean).join(" · ")}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <Pill stage={l.stage} />
        <div className="row" style={{ justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
          <span className="small">{l.call_rep || "no rep"}</span>
          <Avatar name={l.call_rep} sm />
        </div>
      </div>
    </Link>
  );
}

export default async function Calendar({ searchParams }: { searchParams: SP }) {
  const today = todayKey();
  const m = /^\d{4}-\d{2}$/.test(searchParams.m || "") ? searchParams.m! : monthKey(new Date());
  const sel = searchParams.day || (today.startsWith(m) ? today : "");
  const rep = searchParams.rep || "";

  const start = fromLocalInput(`${m}-01T00:00`)!;
  const end = fromLocalInput(`${shiftMonth(m, 1)}-01T00:00`)!;
  const [calls, settings, overdue, upcoming] = await Promise.all([
    getCallsBetween(start, end, rep),
    getSettings(),
    getOverdueCalls(),
    getCallsBetween(new Date(), new Date(Date.now() + 14 * 86400000), rep),
  ]);
  const byDay: Record<string, Lead[]> = {};
  for (const c of calls) (byDay[dayKey(c.call_at!)] ||= []).push(c);

  const n = daysIn(m);
  const [Y, MO] = m.split("-").map(Number);
  const firstDow = new Date(Date.UTC(Y, MO - 1, 1)).getUTCDay(); // 0 = Sun
  const monthLabel = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Y, MO - 1, 1)));
  const dayLabel = sel ? new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(sel + "T00:00:00Z")) : "";
  const selList = sel ? byDay[sel] || [] : [];
  const showOverdue = searchParams.view === "overdue";

  return (
    <Shell active="cal" title="Calendar" actions={<Link href="/new" className="btn sm">+ Book</Link>}>
      <div className="toolbar" style={{ marginBottom: 10 }}>
        <div className="seg">
          <Link href={q(searchParams, { view: "" })} className={!showOverdue ? "on" : ""}>Month</Link>
          <Link href={q(searchParams, { view: "overdue" })} className={showOverdue ? "on" : ""}>Needs outcome{overdue.length ? ` (${overdue.length})` : ""}</Link>
        </div>
        <form method="get" className="row" style={{ marginLeft: "auto" }}>
          <input type="hidden" name="m" value={m} />
          {sel && <input type="hidden" name="day" value={sel} />}
          <select name="rep" defaultValue={rep} style={{ width: "auto" }}>
            <option value="">All reps</option>
            {settings.reps.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn ghost sm" type="submit">Filter</button>
        </form>
      </div>

      {showOverdue ? (
        <div className="panel">
          <div className="ph">Calls that happened with no outcome logged</div>
          <div className="pb" style={{ display: "grid", gap: 8 }}>
            {overdue.length === 0 ? <div className="small">All caught up.</div> : overdue.map((l) => <Appt key={l.id} l={l} over />)}
          </div>
        </div>
      ) : (
        <div className="detail" style={{ gridTemplateColumns: "minmax(0,1fr) 380px" }}>
          <div className="panel">
            <div className="pb">
              <div className="cal-head">
                <Link className="btn ghost sm" href={q(searchParams, { m: shiftMonth(m, -1), day: "" })}>‹</Link>
                <b>{monthLabel}</b>
                <Link className="btn ghost sm" href={q(searchParams, { m: shiftMonth(m, 1), day: "" })}>›</Link>
              </div>
              <div className="cal">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div className="dow" key={i}>{d}</div>)}
                {Array.from({ length: firstDow }).map((_, i) => <div className="blank" key={"b" + i} />)}
                {Array.from({ length: n }).map((_, i) => {
                  const d = i + 1;
                  const key = `${m}-${String(d).padStart(2, "0")}`;
                  const c = byDay[key]?.length || 0;
                  return (
                    <Link key={key} href={q(searchParams, { day: key })} className={(key === today ? "today " : "") + (key === sel ? "sel" : "")}>
                      {d}
                      {c > 0 && <span className="cnt">{c}</span>}
                    </Link>
                  );
                })}
              </div>
              <div className="small" style={{ marginTop: 8 }}>Today: {today}. Tap a day to see its calls.</div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <div className="panel">
              <div className="ph">{sel ? dayLabel : "Pick a day"} <span className="small">{sel ? `${selList.length} call${selList.length === 1 ? "" : "s"}` : ""}</span></div>
              <div className="pb" style={{ display: "grid", gap: 8 }}>
                {sel && selList.length === 0 && <div className="small">Nothing booked.</div>}
                {selList.map((l) => <Appt key={l.id} l={l} />)}
              </div>
            </div>
            <div className="panel">
              <div className="ph">Next 14 days</div>
              <div className="pb" style={{ display: "grid", gap: 8 }}>
                {upcoming.length === 0 ? <div className="small">No upcoming calls.</div> : upcoming.map((l) => (
                  <Link href={`/lead/${l.id}`} className="appt" key={l.id}>
                    <div className="time" style={{ minWidth: 120 }}>{fmtDateTime(l.call_at)}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="who">{l.business || l.contact}</div>
                      <div className="s">{l.call_rep || "no rep set"}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
