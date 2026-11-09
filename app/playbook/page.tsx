import Shell from "../../components/Shell";
import CopyButton from "../../components/CopyButton";
import { getSettings } from "../../lib/data";
import { EXAMPLE, FLOW, GHOSTED, OBJECTIONS, RULES, type Script } from "../../lib/playbook";

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
        <summary>The flow <span className="small">opener to booked call</span></summary>
        <div className="pb-body">
          <div className="small" style={{ marginBottom: 8 }}>[Name] = their name. [trade] = what they do. [jobs] = their word for it (contracts, jobs, installs).</div>
          {FLOW.map((s) => <ScriptCard key={s.title} s={s} />)}
        </div>
      </details>

      <details className="pb">
        <summary>Objections <span className="small">{OBJECTIONS.length} common ones</span></summary>
        <div className="pb-body">
          {OBJECTIONS.map((o) => (
            <div className="script" key={o.they}>
              <div className="they">&ldquo;{o.they}&rdquo;</div>
              <div className="script-h" style={{ marginTop: 6 }}>
                <div className="bubble" style={{ flex: 1 }}>{o.you}</div>
              </div>
              <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
                <span className="small">{o.note || ""}</span>
                <CopyButton text={o.you} />
              </div>
            </div>
          ))}
        </div>
      </details>

      <details className="pb">
        <summary>Rules <span className="small">read these once</span></summary>
        <div className="pb-body">
          <ol className="rules">{RULES.map((r) => <li key={r}>{r}</li>)}</ol>
        </div>
      </details>


      <details className="pb">
        <summary>They went quiet</summary>
        <div className="pb-body">{GHOSTED.map((s) => <ScriptCard key={s.title} s={s} />)}</div>
      </details>

      <details className="pb">
        <summary>{EXAMPLE.title}</summary>
        <div className="pb-body">
          <ol className="rules">{EXAMPLE.lines.map((l) => <li key={l}>{l}</li>)}</ol>
          <div className="note ok" style={{ marginTop: 10 }}>Why it worked: {EXAMPLE.why}</div>
        </div>
      </details>
    </Shell>
  );
}
