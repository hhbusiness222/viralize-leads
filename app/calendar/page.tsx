import Link from "next/link";
import Shell, { colorFor } from "../../components/Shell";
import { Pill } from "../../components/LeadCard";
import { getBookableLeads, getCallsBetween, getFollowUpsDue, getLead, getOverdueCalls, getSettings, hasCard } from "../../lib/data";
import { bookCall } from "../actions";
import { CALL_LENGTHS } from "../../lib/types";
import { getAvailability, fmtMin } from "../../lib/availability";
import { fmtDate, fmtDateTime, fmtTime, fromLocalInput, todayKey, zonedParts } from "../../lib/time";
import type { Lead } from "../../lib/types";

export const dynamic = "force-dynamic";

type SP = { date?: string; rep?: string; view?: string; open?: string; book?: string };

const START = 8 * 60;
const END = 22 * 60;
const HOUR_PX = 88;
const SLOT = 15;
const top = (m: number) => ((Math.max(m, START) - START) / 60) * HOUR_PX;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const addDays = (k: string, n: number) => new Date(Date.parse(k + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const dowOf = (k: string) => (new Date(k + "T00:00:00Z").getUTCDay() + 6) % 7;

function q(sp: SP, patch: Partial<SP>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  return "/calendar?" + p.toString();
}

function ListRow({ l, when, reps, href }: { l: Lead; when: string; reps: string[]; href: string }) {
  const c = colorFor(l.call_rep || l.rep, reps);
  return (
    <Link href={href} className="appt over" style={{ borderLeft: `5px solid ${c}` }}>
      <div className="time" style={{ minWidth: 110 }}>{when}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="who">{l.business || l.contact}</div>
        <div className="s">{[l.contact, l.call_rep || l.rep].filter(Boolean).join(" · ")}</div>
      </div>
      <Pill stage={l.stage} />
    </Link>
  );
}

export default async function Calendar({ searchParams }: { searchParams: SP }) {
  const today = todayKey();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date || "") ? searchParams.date! : today;
  const weekStart = addDays(date, -dowOf(date));
  const view = searchParams.view || "";

  const [settings, calls, overdue, due, avail, openLead] = await Promise.all([
    getSettings(),
    getCallsBetween(fromLocalInput(date + "T00:00")!, fromLocalInput(addDays(date, 1) + "T00:00")!),
    getOverdueCalls(),
    getFollowUpsDue(),
    getAvailability(),
    searchParams.open ? getLead(searchParams.open) : Promise.resolve(null),
  ]);
  const openCard = openLead ? await hasCard(openLead.id) : false;
  // book=HH:MM_Rep
  const bm = /^(\d{2}):(\d{2})_(.+)$/.exec(searchParams.book || "");
  const book = bm ? { min: Number(bm[1]) * 60 + Number(bm[2]), rep: bm[3] } : null;
  const bookable = book ? await getBookableLeads() : [];

  const only = searchParams.rep && settings.reps.includes(searchParams.rep) ? searchParams.rep : "";
  const hasUnassigned = calls.some((c) => !c.call_rep || !settings.reps.includes(c.call_rep));
  const lanes = only ? [only] : [...settings.reps, ...(hasUnassigned ? ["Unassigned"] : [])];
  const laneOf = (l: Lead) => (l.call_rep && settings.reps.includes(l.call_rep) ? l.call_rep : "Unassigned");
  const dow = dowOf(date);
  const hours = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START / 60 + i);
  const hourLabel = (h: number) => (h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`);
  const nowP = zonedParts(new Date());
  const nowMin = nowP.h * 60 + nowP.min;
  const dateLabel = new Intl.DateTimeFormat("en-CA", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));
  const closeHref = q(searchParams, { open: "", book: "" });
  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  return (
    <Shell
      active="cal"
      title="Calendar"
      reps={settings.reps}
      actions={<><Link href="/availability" className="btn ghost sm">Availability</Link><Link href="/new" className="btn sm">+ Book meeting</Link></>}
    >
      <div className="cal-tools">
        <div className="seg">
          <Link href={q(searchParams, { view: "", open: "" })} className={!view ? "on" : ""}>Calls</Link>
          <Link href={q(searchParams, { view: "overdue", open: "" })} className={view === "overdue" ? "on" : ""}>No outcome{overdue.length ? ` (${overdue.length})` : ""}</Link>
          <Link href={q(searchParams, { view: "followups", open: "" })} className={view === "followups" ? "on" : ""}>Follow-ups{due.length ? ` (${due.length})` : ""}</Link>
        </div>
      </div>

      {view === "overdue" ? (
        <div className="panel">
          <div className="ph">Calls that happened with no outcome logged</div>
          <div className="pb" style={{ display: "grid", gap: 8 }}>
            {overdue.length === 0 ? <div className="small">All caught up.</div> : overdue.map((l) => <ListRow key={l.id} l={l} when={fmtDateTime(l.call_at)} reps={settings.reps} href={`/lead/${l.id}`} />)}
          </div>
        </div>
      ) : view === "followups" ? (
        <div className="panel">
          <div className="ph">Follow-ups due today or overdue</div>
          <div className="pb" style={{ display: "grid", gap: 8 }}>
            {due.length === 0 ? <div className="small">Nothing due.</div> : due.map((l) => <ListRow key={l.id} l={l} when={fmtDate(l.follow_up_at)} reps={settings.reps} href={`/lead/${l.id}`} />)}
          </div>
        </div>
      ) : (
        <>
          <div className="legend">
            {settings.reps.map((r) => (
              <Link key={r} href={q(searchParams, { rep: only === r ? "" : r, open: "" })} className={"lg" + (only === r ? " on" : "")}><i style={{ background: colorFor(r, settings.reps) }} />{r}</Link>
            ))}
            {only && <Link href={q(searchParams, { rep: "", open: "" })} className="lg">Show everyone</Link>}
          </div>

          <div className="weeknav">
            <Link href={q(searchParams, { date: addDays(date, -7), open: "" })} className="btn ghost sm" aria-label="Previous week">‹</Link>
            <div className="daytabs" style={{ marginBottom: 0, flex: 1 }}>
              {DAYS.map((label, i) => {
                const k = addDays(weekStart, i);
                return (
                  <Link key={k} href={q(searchParams, { date: k, open: "" })} className={"daytab" + (k === date ? " on" : "") + (k === today ? " today" : "")}>
                    <b>{label}</b>
                    <span>{Number(k.slice(8))}</span>
                  </Link>
                );
              })}
            </div>
            <Link href={q(searchParams, { date: addDays(date, 7), open: "" })} className="btn ghost sm" aria-label="Next week">›</Link>
          </div>
          <div className="note" style={{ margin: "10px 0 0", background: "var(--blue-l)", color: "var(--blue)", border: "1px solid #ddd3fa" }}>Tap any shaded time to book a meeting with that guy.</div>
          <div className="row" style={{ justifyContent: "space-between", margin: "8px 0" }}>
            <b>{dateLabel}</b>
            <span className="small">{calls.length} call{calls.length === 1 ? "" : "s"}{date !== today && <> · <Link href={q(searchParams, { date: "", open: "" })} style={{ textDecoration: "underline" }}>Today</Link></>}</span>
          </div>

          <div className="panel wk dayview">
            <div className="wk-reps">
              <div />
              <div className="wk-reps-row">
                {lanes.map((r) => (
                  <div key={r} className="wk-rep" style={{ color: r === "Unassigned" ? "#64748b" : colorFor(r, settings.reps) }}>
                    <i style={{ background: r === "Unassigned" ? "#94a3b8" : colorFor(r, settings.reps) }} />
                    <span className="nm-full">{r}</span><span className="nm-short">{r === "Unassigned" ? "N/A" : r.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="wk-body" style={{ height: ((END - START) / 60) * HOUR_PX }}>
              <div className="wk-gutter">
                {hours.map((h) => <span key={h} style={{ top: top(h * 60) }}>{hourLabel(h)}</span>)}
              </div>
              <div className="wk-day sel">
                {hours.map((h) => <span key={h} className="wk-line" style={{ top: top(h * 60) }} />)}
                {date === today && nowMin > START && nowMin < END && <span className="wk-now" style={{ top: top(nowMin) }} />}
                {lanes.map((r, lane) => <span key={"g" + r} className="wk-lane" style={{ left: `${(lane / lanes.length) * 100}%`, width: `${100 / lanes.length}%` }} />)}
                {avail.filter((w) => w.dow === dow && lanes.includes(w.rep) && w.e > START && w.s < END).map((w, i) => {
                  const lane = lanes.indexOf(w.rep);
                  const c = colorFor(w.rep, settings.reps);
                  const pos = { left: `${(lane / lanes.length) * 100}%`, width: `${100 / lanes.length}%` };
                  const slots = [];
                  for (let m = Math.max(w.s, START); m + SLOT <= Math.min(w.e, END); m += SLOT) slots.push(m);
                  return (
                    <span key={"a" + i}>
                      <span className="cal-avail" style={{ ...pos, top: top(w.s), height: top(Math.min(w.e, END)) - top(w.s), background: c + "1f" }} />
                      {slots.map((m, si) => (
                        <Link key={m} href={q(searchParams, { book: `${hhmm(m)}_${w.rep}`, open: "" })} scroll={false} className="cal-slot"
                          style={{ ...pos, top: top(m), height: top(m + SLOT) - top(m), ["--c" as any]: c }} title={`Book ${w.rep} at ${fmtMin(m)}`}>
                          <span>+ Book {fmtMin(m)}</span>
                        </Link>
                      ))}
                    </span>
                  );
                })}
                {calls.filter((l) => lanes.includes(laneOf(l))).map((l) => {
                  const p = zonedParts(l.call_at!);
                  const m = p.h * 60 + p.min;
                  const dur = l.call_len || 30;
                  if (m + dur <= START || m >= END) return null;
                  const r = laneOf(l);
                  const lane = lanes.indexOf(r);
                  const c = r === "Unassigned" ? "#64748b" : colorFor(r, settings.reps);
                  const isOpen = openLead?.id === l.id;
                  return (
                    <Link
                      key={l.id}
                      href={q(searchParams, { open: l.id })}
                      scroll={false}
                      className={"wk-blk cal-blk" + (lanes.length > 2 ? " tight" : "") + (isOpen ? " on" : "")}
                      style={{ top: top(m) + 1, height: Math.max(top(m + dur) - top(m) - 2, 16), left: `calc(${(lane / lanes.length) * 100}% + 2px)`, width: `calc(${100 / lanes.length}% - 4px)`, background: c }}
                      title={`${l.business} · ${fmtTime(l.call_at)} · ${r}`}
                    >
                      <b>{l.business || l.contact || "Lead"}</b>
                      <span>{fmtTime(l.call_at)} · {dur}m</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="small" style={{ marginTop: 8 }}>Solid blocks are booked calls, tap one to see the contact.</div>
        </>
      )}

      {book && (() => {
        const c = colorFor(book.rep, settings.reps);
        const repWins = avail.filter((w) => w.rep === book.rep && w.dow === dow);
        const starts: number[] = [];
        for (const w of repWins) for (let m = w.s; m + 10 <= w.e; m += SLOT) starts.push(m);
        if (!starts.includes(book.min)) starts.push(book.min);
        starts.sort((a, b) => a - b);
        const newHref = `/new?date=${date}&time=${hhmm(book.min)}&rep=${encodeURIComponent(book.rep)}`;
        return (
          <>
            <Link href={closeHref} scroll={false} className="sheet-bg" aria-label="Close" />
            <aside className="sheet">
              <div className="sheet-h">
                <div>
                  <div className="sheet-t">Book meeting</div>
                  <div className="small">{dateLabel}</div>
                </div>
                <Link href={closeHref} scroll={false} className="btn ghost sm">✕</Link>
              </div>
              <form action={bookCall} className="form">
                <input type="hidden" name="call_rep" value={book.rep} />
                <div className="sheet-call" style={{ borderColor: c }}>
                  <span>With <b style={{ color: c }}>{book.rep}</b></span>
                </div>
                <div className="grid2">
                  <div>
                    <label>Start time</label>
                    <select name="call_at" defaultValue={`${date}T${hhmm(book.min)}`}>
                      {starts.map((m) => <option key={m} value={`${date}T${hhmm(m)}`}>{fmtMin(m)}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label>Meeting length</label>
                  <div className="chips">
                    {CALL_LENGTHS.map((l) => (
                      <label key={l} className="chip"><input type="radio" name="call_len" value={l} defaultChecked={l === 15} />{l} min</label>
                    ))}
                  </div>
                </div>
                <div>
                  <label>Who&apos;s the meeting with?</label>
                  <select name="id" required defaultValue="">
                    <option value="" disabled>Pick a lead</option>
                    {bookable.map((l) => <option key={l.id} value={l.id}>{l.business || l.contact}{l.contact && l.business ? ` (${l.contact})` : ""}</option>)}
                  </select>
                  {bookable.length === 0 && <div className="small" style={{ marginTop: 4 }}>No open leads to book. Add a new one below.</div>}
                </div>
                <button className="btn wide" type="submit" disabled={bookable.length === 0}>Book meeting</button>
                <Link href={newHref} className="btn ghost wide">New lead instead</Link>
              </form>
            </aside>
          </>
        );
      })()}

      {openLead && (
        <>
          <Link href={closeHref} scroll={false} className="sheet-bg" aria-label="Close" />
          <aside className="sheet">
            <div className="sheet-h">
              <div style={{ minWidth: 0 }}>
                <div className="sheet-t">{openLead.business || openLead.contact || "Lead"}</div>
                <div className="small">{openLead.contact}{openLead.trade ? " · " + openLead.trade : ""}</div>
              </div>
              <Link href={closeHref} scroll={false} className="btn ghost sm">✕</Link>
            </div>
            <div className="sheet-call" style={{ borderColor: colorFor(openLead.call_rep, settings.reps) }}>
              <b>{fmtDateTime(openLead.call_at)} · {openLead.call_len || 30} min</b>
              <span>with <b style={{ color: colorFor(openLead.call_rep, settings.reps) }}>{openLead.call_rep || "no rep set"}</b></span>
            </div>
            <div className="row" style={{ margin: "12px 0" }}>
              {openLead.phone && <a className="btn sm" href={`tel:${openLead.phone.replace(/[^\d+]/g, "")}`}>Call</a>}
              {openLead.phone && <a className="btn ghost sm" href={`sms:${openLead.phone.replace(/[^\d+]/g, "")}`}>Text</a>}
              <Link className="btn ghost sm" href={`/lead/${openLead.id}`}>Open full lead</Link>
            </div>
            <div className="kv">
              <div>Phone</div><div>{openLead.phone || "—"}</div>
              <div>Email</div><div style={{ overflowWrap: "anywhere" }}>{openLead.email || "—"}</div>
              <div>Stage</div><div><Pill stage={openLead.stage} /></div>
              <div>Source</div><div>{openLead.source || "—"}</div>
              <div>Texted by</div><div>{openLead.rep || "—"}</div>
              <div>Gets clients</div><div>{openLead.how.length ? openLead.how.join(", ") : "—"}</div>
            </div>
            {openLead.text_notes && (<><div className="h">Text convo notes</div><div className="sheet-note">{openLead.text_notes}</div></>)}
            {openLead.call_notes && (<><div className="h">Call notes</div><div className="sheet-note">{openLead.call_notes}</div></>)}
            {openLead.next_step && (<><div className="h">Next step</div><div className="sheet-note">{openLead.next_step}</div></>)}
            {openCard && (<><div className="h">Business card screenshot</div><a href={`/api/card/${openLead.id}`} target="_blank" rel="noreferrer"><img className="cardimg" src={`/api/card/${openLead.id}`} alt="Business card screenshot" /></a></>)}
          </aside>
        </>
      )}
    </Shell>
  );
}
