import Shell from "../../components/Shell";
import CopyButton from "../../components/CopyButton";
import { getSettings } from "../../lib/data";
import { FLOW, OBJECTIONS, type Script } from "../../lib/playbook";

export const dynamic = "force-dynamic";

function ScriptCard({ s }: { s: Script }) {
  return (
    <div className="script">
      <div className="script-h">
        <div>
          <b>{s.title}</b>
          {s.when && <div className="small">{s.when}</div>}
        </div>
        <CopyButton text={s.text} />
      </div>
      <div className="bubble">{s.text}</div>
    </div>
  );
}


export default async function Playbook() {
  const settings = await getSettings();
  return (
    <Shell active="playbook" title="Playbook" reps={settings.reps}>
      <div className="goal-banner">
        <div className="gb-k">The goal</div>
        <div className="gb-v">Book the call. That&apos;s it.</div>
        <div className="small" style={{ color: "#e6defc" }}>We don&apos;t sell in text. Every message is a step toward a 15 min call.</div>
      </div>


      <details className="pb" open>
        <summary>The script <span className="small">opener to booked call</span></summary>
        <div className="pb-body">
          {FLOW.map((s) => <ScriptCard key={s.title} s={s} />)}
        </div>
      </details>

      <details className="pb" open>
        <summary>Objections</summary>
        <div className="pb-body">
          {OBJECTIONS.map((o) => (
            <div className="script" key={o.they}>
              <div className="they">&ldquo;{o.they}&rdquo;</div>
              {o.you.map((msg, i) => (
                <div key={i} className="script-h" style={{ marginTop: 8 }}>
                  <div className="bubble" style={{ flex: 1, marginTop: 0 }}>{msg}</div>
                  <CopyButton text={msg} />
                </div>
              ))}
              {o.note && <div className="small" style={{ marginTop: 6 }}>{o.note}</div>}
            </div>
          ))}
        </div>
      </details>




    </Shell>
  );
}
