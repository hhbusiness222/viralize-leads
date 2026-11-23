"use client";

import { useMemo, useState } from "react";

type Win = { rep: string; dow: number; s: number; e: number };
type Booked = { rep: string; date: string; min: number; len: number; name: string };

const START = 8 * 60;
const END = 22 * 60;
const STEP = 15;
const LENGTHS = [10, 15, 20, 30, 45, 60];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const addDays = (k: string, n: number) => new Date(Date.parse(k + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const dowOf = (k: string) => (new Date(k + "T00:00:00Z").getUTCDay() + 6) % 7;
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const label = (m: number) => {
  const h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am", h12 = h % 12 || 12;
  return mm ? `${h12}:${String(mm).padStart(2, "0")}${ap}` : `${h12}${ap}`;
};

export default function BookingPicker({
  reps, colors, windows, booked, today, initial, initialLen,
}: {
  reps: string[];
  colors: Record<string, string>;
  windows: Win[];
  booked: Booked[];
  today: string;
  initial?: { date: string; min: number; rep: string } | null;
  initialLen?: number;
}) {
  const [len, setLen] = useState(initialLen || 15);
  const [date, setDate] = useState(initial?.date || today);
  const [pick, setPick] = useState<{ date: string; min: number; rep: string } | null>(initial || null);
  const [manual, setManual] = useState(false);

  const firstDay = initial && initial.date < today ? initial.date : today;
  const days = Array.from({ length: 14 }, (_, i) => addDays(firstDay, i));
  const dow = dowOf(date);
  const slots = Array.from({ length: (END - START) / STEP }, (_, i) => START + i * STEP);

  const free = (rep: string, m: number) => windows.some((w) => w.rep === rep && w.dow === dow && w.s <= m && m + STEP <= w.e);
  const takenBy = (rep: string, m: number) => booked.find((b) => b.rep === rep && b.date === date && b.min < m + STEP && m < b.min + b.len);
  const clash = pick ? booked.find((b) => b.rep === pick.rep && b.date === pick.date && b.min < pick.min + len && pick.min < b.min + b.len) : undefined;
  const fits = pick ? windows.some((w) => w.rep === pick.rep && w.dow === dowOf(pick.date) && w.s <= pick.min && pick.min + len <= w.e) : true;
  const freeCount = useMemo(
    () => reps.filter((r) => windows.some((w) => w.rep === r && w.dow === dow)).length,
    [reps, windows, dow]
  );

  const value = pick ? `${pick.date}T${hhmm(pick.min)}` : "";
  const nice = pick
    ? `${new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(pick.date + "T00:00:00Z"))}, ${label(pick.min)}`
    : "";

  return (
    <div className="bp">
      <input type="hidden" name="call_at" value={value} />
      <input type="hidden" name="call_rep" value={pick?.rep || ""} />
      <input type="hidden" name="call_len" value={String(len)} />

      <div className="bp-len">
        <span className="small" style={{ fontWeight: 700 }}>Meeting length</span>
        <div className="seg">
          {LENGTHS.map((l) => (
            <button type="button" key={l} className={l === len ? "on" : ""} onClick={() => setLen(l)}>{l}m</button>
          ))}
        </div>
      </div>

      <div className={"bp-sel" + (pick ? " on" : "")} style={pick ? { borderColor: colors[pick.rep] } : undefined}>
        {pick ? (
          <>
            <div>
              <b>{nice} - {label(pick.min + len)}</b> ({len} min) with <b style={{ color: colors[pick.rep] }}>{pick.rep || "nobody yet"}</b>
              {clash && <div className="bp-warn">Overlaps {pick.rep}&apos;s call with {clash.name}</div>}
              {!clash && pick.rep && !fits && <div className="bp-warn">Outside {pick.rep}&apos;s availability</div>}
            </div>
            <button type="button" className="btn ghost sm" onClick={() => setPick(null)}>Clear</button>
          </>
        ) : (
          <span className="small">Tap a shaded slot below to book. Shaded = that guy is free.</span>
        )}
      </div>

      <div className="bp-days">
        {days.map((k) => (
          <button type="button" key={k} onClick={() => setDate(k)} className={"daytab" + (k === date ? " on" : "") + (k === today ? " today" : "")}>
            <b>{DAYS[dowOf(k)]}</b>
            <span>{Number(k.slice(8))}</span>
          </button>
        ))}
      </div>
      <div className="small" style={{ margin: "6px 0 8px" }}>{freeCount ? `${freeCount} guy${freeCount === 1 ? "" : "s"} available this day` : "Nobody has availability this day"}</div>

      <div className="bp-grid" style={{ gridTemplateColumns: `48px repeat(${reps.length}, minmax(0,1fr))` }}>
        <div className="bp-corner" />
        {reps.map((r) => (
          <div key={r} className="bp-rep" style={{ color: colors[r] }}>
            <i style={{ background: colors[r] }} />
            <span className="nm-full">{r}</span><span className="nm-short">{r.slice(0, 3)}</span>
          </div>
        ))}
        {slots.map((m) => (
          <div key={m} style={{ display: "contents" }}>
            <div className={"bp-time" + (m % 60 ? " half" : "")}>{m % 60 ? "" : label(m)}</div>
            {reps.map((r) => {
              const t = takenBy(r, m);
              const f = free(r, m);
              const sel = !!pick && pick.date === date && pick.rep === r && m >= pick.min && m < pick.min + len;
              const selStart = sel && m === pick!.min;
              return (
                <button
                  type="button"
                  key={r}
                  disabled={!!t}
                  onClick={() => setPick({ date, min: m, rep: r })}
                  className={"bp-cell" + (m % 60 ? " half" : "") + (f ? " free" : "") + (t ? " taken" : "") + (sel ? " sel" : "")}
                  style={sel ? { background: colors[r] } : f ? { background: colors[r] + "2e" } : undefined}
                  title={t ? `${r} has ${t.name} at ${label(t.min)}` : `${r} ${label(m)}${f ? "" : " (not in his availability)"}`}
                >
                  {t ? (t.min >= m && t.min < m + STEP ? <span>{t.name}</span> : null) : selStart ? <span>{label(m)}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <button type="button" className="linkbtn" onClick={() => setManual((v) => !v)}>{manual ? "Hide" : "Need a time outside 8am-10pm? Enter it manually"}</button>
      {manual && (
        <div className="grid2" style={{ marginTop: 8 }}>
          <div>
            <label>Date and time</label>
            <input
              type="datetime-local"
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return setPick(null);
                const [d, t] = v.split("T");
                const [h, mi] = t.split(":").map(Number);
                setPick({ date: d, min: h * 60 + mi, rep: pick?.rep || "" });
                setDate(d);
              }}
            />
          </div>
          <div>
            <label>Who&apos;s taking it</label>
            <select value={pick?.rep || ""} onChange={(e) => pick && setPick({ ...pick, rep: e.target.value })}>
              <option value="">Not set</option>
              {reps.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
