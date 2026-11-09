import Shell from "../../components/Shell";
import { logout, saveSettings, setRep } from "../actions";
import { getSettings } from "../../lib/data";
import { currentRep } from "../../lib/auth";
import { STAGES } from "../../lib/types";

export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: { saved?: string } }) {
  const settings = await getSettings();
  const me = currentRep();
  return (
    <Shell active="settings" title="Settings">
      {searchParams.saved && <div className="note ok" style={{ marginBottom: 12 }}>Saved.</div>}
      <div className="detail">
        <div style={{ display: "grid", gap: 16 }}>
          <form className="panel" action={setRep}>
            <div className="ph">Who are you on this phone?</div>
            <div className="pb form">
              <select name="rep" defaultValue={me}>
                <option value="">Pick your name</option>
                {settings.reps.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="btn" type="submit">Set</button>
              <div className="small">Everything you log gets tagged with this name.</div>
            </div>
          </form>
          <form className="panel" action={logout}>
            <div className="pb"><button className="btn ghost" type="submit">Log out</button></div>
          </form>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <form className="panel" action={saveSettings}>
            <div className="ph">Team</div>
            <div className="pb form">
              <div><label>Reps (one per line)</label><textarea name="reps" defaultValue={settings.reps.join("\n")} /></div>
              <div className="grid2">
                <div><label>Daily goal per rep: replies logged</label><input name="goal_leads" inputMode="numeric" defaultValue={String(settings.goals.leads)} /></div>
                <div><label>Daily goal per rep: calls booked</label><input name="goal_calls" inputMode="numeric" defaultValue={String(settings.goals.calls)} /></div>
              </div>
              <div><label>&quot;How they get clients&quot; options (one per line)</label><textarea name="how" defaultValue={settings.how.join("\n")} /></div>
              <button className="btn" type="submit">Save</button>
            </div>
          </form>
          <div className="panel">
            <div className="ph">Pipeline stages</div>
            <div className="pb" style={{ display: "grid", gap: 6 }}>
              {STAGES.map((s) => (
                <div key={s.key} className="row" style={{ gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
                  <b style={{ minWidth: 100 }}>{s.label}</b>
                  <span className="small">{s.hint}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
