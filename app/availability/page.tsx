import Link from "next/link";
import Shell, { colorFor } from "../../components/Shell";
import { getSettings } from "../../lib/data";
import { currentRep } from "../../lib/auth";
import { DAYS, dateOfDow, fmtMin, getAvailability, nowInTz } from "../../lib/availability";

export const dynamic = "force-dynamic";

const START = 8 * 60;
const END = 22 * 60;
const HOUR_PX = 56;
const top = (m: number) => ((Math.max(m, START) - START) / 60) * HOUR_PX;

export default async function Availability({ searchParams }: { searchParams: { d?: string; saved?: string; view?: string; rep?: string } }) {
  const now = nowInTz();
  const sel = searchParams.d != null && /^[0-6]$/.test(searchParams.d) ? Number(searchParams.d) : now.dow;
  const [settings, allWindows] = await Promise.all([getSettings(), getAvailability()]);
  const only = searchParams.rep && settings.reps.includes(searchParams.rep) ? searchParams.rep : "";
  const windows = only ? allWindows.filter((w) => w.rep === only) : allWindows;
  const laneReps = only ? [only] : settings.reps;
  const dayView = true;
  const q = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = { d: String(sel), view: dayView ? "day" : "", rep: only };
    for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) p.set(k, v);
    return "/availability?" + p.toString();
  };
  const me = currentRep();
  const hours = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START / 60 + i);
  const hourLabel = (h: number) => (h === 12 ? "12pm" : h > 12 ? `${h - 12}pm` : `${h}am`);
  const freeNow = settings.reps.filter((r) => allWindows.some((w) => w.rep === r && w.dow === now.dow && w.s <= now.min && now.min < w.e));

  return (
    <Shell
      active="avail"
      title="Team availability"
      reps={settings.reps}
      actions={<Link href={`/availability/edit${me ? "?rep=" + encodeURIComponent(me) : ""}`} className="btn sm">Edit mine</Link>}
    >
      {searchParams.saved && <div className="note ok" style={{ marginBottom: 12 }}>Saved {searchParams.saved}&apos;s availability.</div>}
      <div className="small" style={{ marginBottom: 8 }}>When each guy is free to take calls. Book calls inside someone&apos;s block.</div>
      {freeNow.length > 0 && <div className="note ok" style={{ marginBottom: 10 }}>Free right now: <b>{freeNow.join(", ")}</b></div>}

      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div className="legend">
          {settings.reps.map((r) => (
            <Link key={r} href={q({ rep: only === r ? "" : r })} className={"lg" + (only === r ? " on" : "")}><i style={{ background: colorFor(r, settings.reps) }} />{r}</Link>
          ))}
          {only && <Link href={q({ rep: "" })} className="lg">Show everyone</Link>}
        </div>
      </div>

      <div className="daytabs wk-mobile">
        {DAYS.map((label, i) => (
          <Link key={label} href={q({ d: String(i) })} className={"daytab" + (i === sel ? " on" : "") + (i === now.dow ? " today" : "")}>
            <b>{label}</b>
            <span>{new Date(Date.parse(dateOfDow(i) + "T00:00:00Z")).getUTCDate()}</span>
          </Link>
        ))}
      </div>

      {dayView && (
        <div className="daytabs wk-desk" style={{ display: "grid", marginTop: 8 }}>
          {DAYS.map((label, i) => (
            <Link key={label} href={q({ d: String(i) })} className={"daytab" + (i === sel ? " on" : "") + (i === now.dow ? " today" : "")}>
              <b>{label}</b>
              <span>{new Date(Date.parse(dateOfDow(i) + "T00:00:00Z")).getUTCDate()}</span>
            </Link>
          ))}
        </div>
      )}
      <div className={"panel wk" + (dayView ? " dayview" : "")}>
        <div className="wk-head">
          <div className="wk-gutter" />
          {DAYS.map((label, i) => (
            <Link key={label} href={q({ d: String(i), view: "day" })} className={"wk-dh" + (i === now.dow ? " today" : "") + (i === sel ? " sel" : "")} title="Open this day">
              {label} <b>{new Date(Date.parse(dateOfDow(i) + "T00:00:00Z")).getUTCDate()}</b>
            </Link>
          ))}
        </div>
        <div className="wk-reps">
          <div />
          <div className="wk-reps-row">
            {laneReps.map((r) => (
              <div key={r} className="wk-rep" style={{ color: colorFor(r, settings.reps) }}>
                <i style={{ background: colorFor(r, settings.reps) }} />
                <span className="nm-full">{r}</span><span className="nm-short">{r.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="wk-body" style={{ height: (END - START) / 60 * HOUR_PX }}>
          <div className="wk-gutter">
            {hours.map((h) => <span key={h} style={{ top: top(h * 60) }}>{hourLabel(h)}</span>)}
          </div>
          {DAYS.map((label, d) => (
            <div key={label} className={"wk-day" + (d === sel ? " sel" : "")}>
              {hours.map((h) => <span key={h} className="wk-line" style={{ top: top(h * 60) }} />)}
              {d === now.dow && now.min > START && now.min < END && <span className="wk-now" style={{ top: top(now.min) }} />}
              {laneReps.map((r, lane) => <span key={"g" + r} className="wk-lane" style={{ left: `${(lane / laneReps.length) * 100}%`, width: `${100 / laneReps.length}%` }} />)}
              {windows.filter((w) => w.dow === d && w.e > START && w.s < END && laneReps.includes(w.rep)).map((w, i) => {
                const lane = laneReps.indexOf(w.rep);
                const lanes = laneReps.length;
                const c = colorFor(w.rep, settings.reps);
                const h = top(Math.min(w.e, END)) - top(w.s);
                return (
                  <Link
                    key={i}
                    href={`/availability/edit?rep=${encodeURIComponent(w.rep)}`}
                    className={"wk-blk" + (lanes > 2 ? " narrow" : "")}
                    style={{ top: top(w.s) + 1, height: h - 2, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)`, background: c }}
                    title={`${w.rep} ${fmtMin(w.s)} to ${fmtMin(w.e)}`}
                  >
                    <b>{w.rep}</b>
                    <span>{fmtMin(w.s)} - {fmtMin(w.e)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="small" style={{ marginTop: 8 }}>Repeats every week. Tap a name to see just that guy, tap a block to change hours.</div>
    </Shell>
  );
}
