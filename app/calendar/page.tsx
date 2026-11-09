import Link from "next/link";
import Shell from "../../components/Shell";
import { Avatar, Pill } from "../../components/LeadCard";
import { colorFor } from "../../components/Shell";
import { getCallsBetween, getFollowUpsBetween, getFollowUpsDue, getOverdueCalls, getSettings } from "../../lib/data";
import { dayKey, fmtDate, fmtDateTime, fmtTime, fromLocalInput, monthKey, todayKey } from "../../lib/time";
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

function Appt({ l, over, reps }: { l: Lead; over?: boolean; reps: string[] }) {
  return (
    <Link href={`/lead/${l.id}`} className={"appt" + (over ? " over" : "")} style={{ borderLeft: `5px solid ${colorFor(l.call_rep, reps)}` }}>
      <div className="time" style={over ? undefined : { color: colorFor(l.call_rep, reps) }}>{over ? fmtDateTime(l.call_at) : fmtTime(l.call_at)}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="who">{l.business || l.contact}</div>
        <div className="s">{[l.contact, l.trade, l.phone].filter(Boolean).join(" · ")}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <Pill stage={l.stage} />
        <div className="row" style={{ justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
          <span className="small">{l.call_rep || "no rep"}</span>
          <Avatar name={l.call_rep} sm reps={reps} />
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
  const [calls, settings, overdue, upcoming, fups, due] = await Promise.all([
    getCallsBetween(start, end, rep),
    getSettings(),
    getOverdueCalls(),
    getCallsBetween(new Date(), new Date(Date.now() + 14 * 86400000), rep),
    getFollowUpsBetween(start, end, rep),
    getFollowUpsDue(),
  ]);
  const byDay: Record<string, Lead[]> = {};
  for (const c of calls) (byDay[dayKey(c.call_at!)] ||= []).push(c);
  const fuByDay: Record<string, Lead[]> = {};
  for (const f of fups) (fuByDay[dayKey(f.follow_up_at!)] ||= []).push(f);

  const n = daysIn(m);
  const [Y, MO] = m.split("-").map(Number);
  const firstDow = new Date(Date.UTC(Y, MO - 1, 1)).getUTCDay(); // 0 = Sun
  const monthLabel = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Y, MO - 1, 1)));
  const dayLabel = sel ? new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(sel + "T00:00:00Z")) : "";
  const selList = sel ? byDay[sel] || [] : [];
  const selFu = sel ? fuByDay[sel] || [] : [];
  const showOverdue = searchParams.view === "overdue";
  const showFu = searchParams.view === "followups";

  return (
    <Shell active="cal" title="Calendar" reps={settings.reps} actions={<Link href="/new" className="btn sm">+ Book</Link>}>
      <div className="cal-tools">
        <div className="seg">
          <Link href={q(searchParams, { view: "" })} className={!showOverdue ? "on" : ""}>Month</Link>
          <Link href={q(searchParams, { view: "overdue" })} className={showOverdue ? "on" : ""}>No outcome{overdue.length ? ` (${overdue.length})` : ""}</Link>
          <Link href={q(searchParams, { view: "followups" })} className={showFu ? "on" : ""}>Follow-ups{due.length ? ` (${due.length})` : ""}</Link>
        </div>
        <form method="get" className="repform">
          <input type="hidden" name="m" value={m} />
          {sel && <input type="hidden" name="day" value={sel} />}
          {searchParams.view && <input type="hidden" name="view" value={searchParams.view} />}
          <select name="rep" defaultValue={rep}>
            <option value="">All reps</option>
            {settings.reps.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn ghost sm" type="submit">Go</button>
        </form>
      </div>

      {showFu ? (
        <div className="panel">
          <div className="ph">Follow-ups due today or overdue</div>
          <div className="pb" style={{ display: "grid", gap: 8 }}>
            {due.length === 0 ? <div className="small">Nothing due.</div> : due.map((l) => (
              <Link href={`/lead/${l.id}`} className="appt over" key={l.id} style={{ borderLeft: "5px solid #d946ef" }}>
                <div className="time" style={{ minWidth: 110 }}>{fmtDate(l.follow_up_at)}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="who">{l.business || l.contact}</div>
                  <div className="s">{[l.next_step, l.rep].filter(Boolean).join(" · ")}</div>
                </div>
                <Pill stage={l.stage} />
              </Link>
            ))}
          </div>
        </div>
      ) : showOverdue ? (
        <div className="panel">
          <div className="ph">Calls that happened with no outcome logged</div>
          <div className="pb" style={{ display: "grid", gap: 8 }}>
            {overdue.length === 0 ? <div className="small">All caught up.</div> : overdue.map((l) => <Appt key={l.id} l={l} over reps={settings.reps} />)}
          </div>
        </div>
      ) : (
        <div className="cal-layout">
          <div className="panel">
            <div className="pb">
              <div className="cal-head">
                <Link className="btn ghost sm" href={q(searchParams, { m: shiftMonth(m, -1), day: "" })}>‹</Link>
                <b>{monthLabel}</b>
                <Link className="btn ghost sm" href={q(searchParams, { m: shiftMonth(m, 1), day: "" })}>›</Link>
              </div>
              <div className="legend">
                {settings.reps.map((r) => (
                  <Link key={r} href={q(searchParams, { rep: rep === r ? "" : r })} className={"lg" + (rep === r ? " on" : "")}>
                    <i style={{ background: colorFor(r, settings.reps) }} />{r}
                  </Link>
                ))}
                <span className="lg"><i style={{ background: "#d946ef", borderRadius: "50%" }} />Follow-up</span>
              </div>
              <div className="cal">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div className="dow" key={i}>{d}</div>)}
                {Array.from({ length: firstDow }).map((_, i) => <div className="blank" key={"b" + i} />)}
                {Array.from({ length: n }).map((_, i) => {
                  const d = i + 1;
                  const key = `${m}-${String(d).padStart(2, "0")}`;
                  const dayCalls = byDay[key] || [];
                  const dayFu = fuByDay[key] || [];
                  const blocks = [...dayCalls.map((l) => colorFor(l.call_rep, settings.reps)), ...dayFu.map(() => "#d946ef")];
                  return (
                    <Link key={key} href={q(searchParams, { day: key })} className={(key === today ? "today " : "") + (key === sel ? "sel" : "")}>
                      {d}
                      {blocks.length > 0 && (
                        <span className="blocks">
                          {blocks.slice(0, 4).map((c, i) => <i key={i} style={{ background: c }} />)}
                          {blocks.length > 4 && <em>+{blocks.length - 4}</em>}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

            </div>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <div className="panel">
              <div className="ph">{sel ? dayLabel : "Pick a day"} <span className="small">{sel ? `${selList.length} call${selList.length === 1 ? "" : "s"}` : ""}</span></div>
              <div className="pb" style={{ display: "grid", gap: 8 }}>
                {sel && selList.length === 0 && selFu.length === 0 && <div className="small">Nothing booked.</div>}
                {selList.map((l) => <Appt key={l.id} l={l} reps={settings.reps} />)}
                {selFu.map((l) => (
                  <Link href={`/lead/${l.id}`} className="appt" key={"f" + l.id} style={{ borderLeft: "5px solid #d946ef" }}>
                    <div className="time" style={{ color: "#d946ef", minWidth: 70 }}>Follow up</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="who">{l.business || l.contact}</div>
                      <div className="s">{[l.next_step, l.rep].filter(Boolean).join(" · ")}</div>
                    </div>
                    <Pill stage={l.stage} />
                  </Link>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="ph">Next 14 days</div>
              <div className="pb" style={{ display: "grid", gap: 8 }}>
                {upcoming.length === 0 ? <div className="small">No upcoming calls.</div> : upcoming.map((l) => (
                  <Link href={`/lead/${l.id}`} className="appt" key={l.id} style={{ borderLeft: `5px solid ${colorFor(l.call_rep, settings.reps)}` }}>
                    <div className="time" style={{ minWidth: 120, color: colorFor(l.call_rep, settings.reps) }}>{fmtDateTime(l.call_at)}</div>
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
