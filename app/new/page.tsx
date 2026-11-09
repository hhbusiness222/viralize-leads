import Shell from "../../components/Shell";
import { createLead } from "../actions";
import { getDistinct, getSettings } from "../../lib/data";
import { currentRep } from "../../lib/auth";
import { STAGES } from "../../lib/types";

export const dynamic = "force-dynamic";

export default async function NewLead() {
  const [settings, trades, sources] = await Promise.all([getSettings(), getDistinct("trade"), getDistinct("source")]);
  const me = currentRep();
  return (
    <Shell active="add" title="Add lead">
      <form action={createLead} className="panel" style={{ maxWidth: 760 }} encType="multipart/form-data">
        <div className="ph">Contact info <span className="small">Someone dropped their info on the post</span></div>
        <div className="pb form">
          <div className="grid2">
            <div><label>Business name *</label><input name="business" required placeholder="Mike's Plumbing" autoFocus /></div>
            <div><label>Contact name</label><input name="contact" placeholder="Mike" /></div>
          </div>
          <div className="grid2">
            <div><label>Phone *</label><input name="phone" required inputMode="tel" placeholder="613 555 0199" /></div>
            <div><label>Email</label><input name="email" type="email" placeholder="mike@..." /></div>
          </div>
          <div className="grid2">
            <div><label>Trade / niche</label><input name="trade" list="trades" placeholder="Plumber, roofer, snow removal..." /></div>
            <div><label>Source (FB group)</label><input name="source" list="sources" placeholder="Ottawa Contractors Network" /></div>
          </div>
          <div>
            <label>Business card screenshot</label>
            <input name="card" type="file" accept="image/*" className="file" />
            <div className="small" style={{ marginTop: 4 }}>Screenshot of their comment / business card from the post. Optional.</div>
          </div>
        </div>
        <div className="ph">Opportunity</div>
        <div className="pb form">
          <div className="grid2">
            <div>
              <label>Owner (who&apos;s texting them)</label>
              <select name="rep" defaultValue={me}>
                <option value="">Pick</option>
                {settings.reps.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label>Stage</label>
              <select name="stage" defaultValue="texting">
                {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid2">
            <div><label>Deal value (optional, $)</label><input name="value" inputMode="numeric" placeholder="1500" /></div>
          </div>
          <div>
            <label>How do they get clients right now?</label>
            <div className="chips">
              {settings.how.map((h) => (
                <label key={h} className="chip">
                  <input type="checkbox" name="how" value={h} />
                  {h}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label>Text convo notes</label>
            <textarea name="text_notes" placeholder="Slow in winter, mostly word of mouth. Asked if it's free. Open to a call." />
          </div>
        </div>
        <div className="ph">Book the call <span className="small">optional</span></div>
        <div className="pb form">
          <div className="grid2">
            <div><label>Date and time</label><input name="call_at" type="datetime-local" /></div>
            <div>
              <label>Who&apos;s taking the call</label>
              <select name="call_rep" defaultValue="">
                <option value="">Not set</option>
                {settings.reps.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <button className="btn wide" type="submit">Save lead</button>
        </div>
      </form>
      <datalist id="trades">{trades.map((t) => <option key={t} value={t} />)}</datalist>
      <datalist id="sources">{sources.map((t) => <option key={t} value={t} />)}</datalist>
    </Shell>
  );
}
