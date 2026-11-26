"use client";
import { useEffect, useState } from "react";
import CopyButton from "./CopyButton";
import type { Script } from "../lib/playbook";

type Obj = { they: string; you: string[]; note?: string };
const KEY = "vz_area";

function Text({ t, area }: { t: string; area: string }) {
  const parts = t.split("{area}");
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <mark className={area ? "area" : "area empty"}>{area || "your city/state"}</mark>}
        </span>
      ))}
    </>
  );
}

export default function PlaybookBody({ flow, objections }: { flow: Script[]; objections: Obj[] }) {
  const [area, setArea] = useState("");
  useEffect(() => {
    try { setArea(localStorage.getItem(KEY) || ""); } catch {}
  }, []);
  const save = (v: string) => {
    setArea(v);
    try { localStorage.setItem(KEY, v); } catch {}
  };
  const fill = (t: string) => t.split("{area}").join(area.trim() || "[city/state]");

  return (
    <>
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="pb" style={{ padding: 14 }}>
          <label>Area you&apos;re texting (city or state)</label>
          <input value={area} onChange={(e) => save(e.target.value)} placeholder="Arizona, Ottawa, Phoenix..." />
          <div className="small" style={{ marginTop: 6 }}>Fills into the script and the Copy buttons. Saved on this phone.</div>
        </div>
      </div>

      <details className="pb" open>
        <summary>The script <span className="small">opener to booked call</span></summary>
        <div className="pb-body">
          {flow.map((s) => (
            <div className="script" key={s.title}>
              <div className="script-h">
                <div>
                  <b>{s.title}</b>
                  {s.when && <div className="small">{s.when}</div>}
                </div>
                <CopyButton text={fill(s.text)} />
              </div>
              <div className="bubble"><Text t={s.text} area={area.trim()} /></div>
            </div>
          ))}
        </div>
      </details>

      <details className="pb" open>
        <summary>Objections</summary>
        <div className="pb-body">
          {objections.map((o) => (
            <div className="script" key={o.they}>
              <div className="they">&ldquo;{o.they}&rdquo;</div>
              {o.you.map((msg, i) => (
                <div key={i} className="script-h" style={{ marginTop: 8 }}>
                  <div className="bubble" style={{ flex: 1, marginTop: 0 }}><Text t={msg} area={area.trim()} /></div>
                  <CopyButton text={fill(msg)} />
                </div>
              ))}
              {o.note && <div className="small" style={{ marginTop: 6 }}>{o.note}</div>}
            </div>
          ))}
        </div>
      </details>
    </>
  );
}
