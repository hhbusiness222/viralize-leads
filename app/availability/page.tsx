import Link from "next/link";
import Shell, { colorFor } from "../../components/Shell";
import { getCallsBetween, getSettings } from "../../lib/data";
import { currentRep } from "../../lib/auth";
import { fromLocalInput, zonedParts } from "../../lib/time";
import { DAYS, DAYS_LONG, dateOfDow, fmtMin, getAvailability, nowInTz } from "../../lib/availability";

export const dynamic = "force-dynamic";

const START = 7 * 60;
const END = 22 * 60;
const pct = (m: number) => ((Math.min(Math.max(m, START), END) - START) / (END - START)) * 100;

export default async function Availability({ searchParams }: { searchParams: { d?: string; saved?: string } }) {
  const now = nowInTz();
  const d = searchParams.d != null && /^[0-6]$/.test(searchParams.d) ? Number(searchParams.d) : now.dow;
  const date = dateOfDow(d);
  const nextDate = new Date(Date.parse(date + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
  const [settings, windows, calls] = await Promise.all([
    getSettings(),
    getAvailability(),
    getCallsBetween(fromLocalInput(date + "T00:00")!, fromLocalInput(nextDate + "T00:00")!),
  ]);
  const me = currentRep();
  const isToday = d === now.dow;
  const dayWins = windows.filter((w) => w.dow === d);
  const freeNow = isToday ? settings.reps.filter((r) => dayWins.some((w) => w.rep === r && w.s <= now.min && now.min < w.e)) : [];
  const dateLabel = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));
  const ticks = [8, 10, 12, 14, 16, 18, 20];

  return (
    <Shell
      active="avail"
      title="Availability"
      reps={settings.reps}
      actions={<Link href={`/availability/edit${me ? "?rep=" + encodeURIComponent(me) : ""}`} className="btn sm">Edit mine</Link>}
    >
      {searchParams.saved && <div className="note ok" style={{ marginBottom: 12 }}>Saved {searchParams.saved}&apos;s availability.</div>}

      <div className="daytabs">
        {DAYS.map((label, i) => (
          <Link key={label} href={`/availability?d=${i}`} className={"daytab" + (i === d ? " on" : "") + (i === now.dow ? " today" : "")}>
            <b>{label}</b>
            <span>{new Date(Date.parse(dateOfDow(i) + "T00:00:00Z")).getUTCDate()}</span>
          </Link>
        ))}
      </div>

      {isToday && (
        <div className={"note " + (freeNow.length ? "ok" : "warn")} style={{ marginBottom: 12 }}>
          {freeNow.length ? <>Free right now: <b>{freeNow.join(", ")}</b></> : "Nobody's marked free right now."}
        </div>
      )}

      <div className="panel">
        <div className="ph">{DAYS_LONG[d]}, {dateLabel} <span className="small">black = call booked</span></div>
        <div className="pb">
          <div className="av-scale">
            {ticks.map((t) => (
              <span key={t} style={{ left: pct(t * 60) + "%" }}>{t === 12 ? "12p" : t > 12 ? t - 12 + "p" : t + "a"}</span>
            ))}
          </div>
          {settings.reps.map((r) => {
            const c = colorFor(r, settings.reps);
            const ws = dayWins.filter((w) => w.rep === r);
            const rc = calls.filter((l) => l.call_rep === r && l.call_at);
            return (
              <div className="av-row" key={r}>
                <div className="av-name"><i style={{ background: c }} />{r}</div>
                <div className="av-track">
                  {ticks.map((t) => <span key={t} className="av-grid" style={{ left: pct(t * 60) + "%" }} />)}
                  {isToday && now.min >= START && now.min <= END && <span className="av-now" style={{ left: pct(now.min) + "%" }} />}
                  {ws.map((w, i) => (
                    <span key={i} className="av-win" style={{ left: pct(w.s) + "%", width: pct(w.e) - pct(w.s) + "%", background: c }} title={`${fmtMin(w.s)} to ${fmtMin(w.e)}`} />
                  ))}
                  {rc.map((l) => {
                    const p = zonedParts(l.call_at!);
                    const m = p.h * 60 + p.min;
                    return <Link key={l.id} href={`/lead/${l.id}`} className="av-call" style={{ left: pct(m) + "%", width: pct(m + 30) - pct(m) + "%" }} title={l.business} />;
                  })}
                </div>
                <div className="av-txt">{ws.length ? ws.map((w) => `${fmtMin(w.s)}-${fmtMin(w.e)}`).join(", ") : "Off"}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="small" style={{ marginTop: 8 }}>
        Same every week until someone changes it. <Link href="/availability/edit" style={{ textDecoration: "underline" }}>Edit anyone&apos;s availability</Link>
      </div>
    </Shell>
  );
}
