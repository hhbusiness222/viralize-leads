import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "../../../components/Shell";
import { Avatar, Pill, money } from "../../../components/LeadCard";
import { addNote, deleteLead, setStage, updateLead } from "../../actions";
import { getActivity, getLead, getSettings } from "../../../lib/data";
import { OUTCOMES, STAGES } from "../../../lib/types";
import { fmtDate, fmtDateTime, toDateInput, toLocalInput } from "../../../lib/time";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params, searchParams }: { params: { id: string }; searchParams: { saved?: string; del?: string } }) {
  const [lead, acts, settings] = await Promise.all([getLead(params.id), getActivity(params.id), getSettings()]);
  if (!lead) notFound();
  const tel = lead.phone.replace(/[^\d+]/g, "");
  const howOpts = Array.from(new Set([...settings.how, ...lead.how]));
  const repOpts = (v: string) => Array.from(new Set([...settings.reps, ...(v ? [v] : [])]));
  const over = lead.call_at && lead.stage === "booked" && lead.call_at.getTime() < Date.now() - 15 * 60000;

  return (
    <Shell active="none" title={lead.business || "Lead"} actions={<Link href="/" className="btn ghost sm">← Pipeline</Link>}>
      {searchParams.saved && <div className="note ok" style={{ marginBottom: 12 }}>Saved.</div>}
      {over && <div className="note warn" style={{ marginBottom: 12 }}>This call already happened. Log the outcome below.</div>}
      {lead.follow_up_at && !["won", "lost"].includes(lead.stage) && lead.follow_up_at.getTime() < Date.now() + 12 * 3600000 && (
        <div className="note warn" style={{ marginBottom: 12 }}>Follow-up due {fmtDate(lead.follow_up_at)}. Text him, log it, set the next date or move the stage.</div>
      )}

      <div className="detail">
        {/* LEFT: contact card */}
        <div className="panel">
          <div className="pb" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar name={lead.contact || lead.business} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{lead.contact || lead.business || "(no name)"}</div>
              <div className="small">{[lead.business, lead.trade].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
          <div className="pb" style={{ paddingTop: 0 }}>
            <div className="row" style={{ marginBottom: 12 }}>
              {tel && <a className="btn sm" href={`sms:${tel}`}>Text</a>}
              {tel && <a className="btn ghost sm" href={`tel:${tel}`}>Call</a>}
              {lead.email && <a className="btn ghost sm" href={`mailto:${lead.email}`}>Email</a>}
            </div>
            <div className="kv">
              <div>Phone</div><div>{lead.phone || "—"}</div>
              <div>Email</div><div style={{ overflowWrap: "anywhere" }}>{lead.email || "—"}</div>
              <div>Source</div><div>{lead.source || "—"}</div>
              <div>Owner</div><div>{lead.rep || "—"}</div>
              <div>Stage</div><div><Pill stage={lead.stage} /></div>
              <div>Value</div><div>{money(lead.value) || "—"}</div>
              <div>Call</div><div>{lead.call_at ? fmtDateTime(lead.call_at) + (lead.call_rep ? " · " + lead.call_rep : "") : "Not booked"}</div>
              <div>Follow up</div><div>{lead.follow_up_at ? fmtDate(lead.follow_up_at) : "—"}</div>
              <div>Added</div><div>{fmtDateTime(lead.created_at)}{lead.created_by ? " by " + lead.created_by : ""}</div>
            </div>
          </div>
          <div className="ph">Move stage</div>
          <div className="pb">
            <div className="chips">
              {STAGES.map((s) => (
                <form key={s.key} action={setStage}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="stage" value={s.key} />
                  <button type="submit" className={"stage-btn" + (lead.stage === s.key ? " on" : "")} style={lead.stage === s.key ? { background: s.color, borderColor: s.color } : undefined}>
                    {s.label}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: details + activity */}
        <div style={{ display: "grid", gap: 16 }}>
          <form className="panel" action={updateLead}>
            <input type="hidden" name="id" value={lead.id} />
            <div className="ph">Details</div>
            <div className="pb form">
              <div className="grid2">
                <div><label>Business</label><input name="business" defaultValue={lead.business} /></div>
                <div><label>Contact</label><input name="contact" defaultValue={lead.contact} /></div>
              </div>
              <div className="grid2">
                <div><label>Phone</label><input name="phone" inputMode="tel" defaultValue={lead.phone} /></div>
                <div><label>Email</label><input name="email" type="email" defaultValue={lead.email} /></div>
              </div>
              <div className="grid2">
                <div><label>Trade / niche</label><input name="trade" defaultValue={lead.trade} /></div>
                <div><label>Source (FB group)</label><input name="source" defaultValue={lead.source} /></div>
              </div>
              <div className="grid2">
                <div>
                  <label>Owner</label>
                  <select name="rep" defaultValue={lead.rep}>
                    <option value="">Pick</option>
                    {repOpts(lead.rep).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div><label>Deal value ($)</label><input name="value" inputMode="numeric" defaultValue={lead.value ? String(lead.value) : ""} /></div>
              </div>
              <div>
                <label>How they get clients now</label>
                <div className="chips">
                  {howOpts.map((h) => (
                    <label key={h} className="chip">
                      <input type="checkbox" name="how" value={h} defaultChecked={lead.how.includes(h)} />
                      {h}
                    </label>
                  ))}
                </div>
              </div>
              <div><label>Text convo notes</label><textarea name="text_notes" defaultValue={lead.text_notes} /></div>
            </div>
            <div className="ph">Call</div>
            <div className="pb form">
              <div className="grid2">
                <div><label>Date and time</label><input name="call_at" type="datetime-local" defaultValue={toLocalInput(lead.call_at)} /></div>
                <div>
                  <label>Who&apos;s taking it</label>
                  <select name="call_rep" defaultValue={lead.call_rep}>
                    <option value="">Not set</option>
                    {repOpts(lead.call_rep).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid2">
                <div><label>Follow up on</label><input name="follow_up_at" type="date" defaultValue={toDateInput(lead.follow_up_at)} /></div>
                <div>
                  <label>Outcome</label>
                  <select name="outcome" defaultValue={lead.outcome}>
                    <option value="">Not logged yet</option>
                    {OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div><label>Next step</label><input name="next_step" defaultValue={lead.next_step} placeholder="Send plan Monday / he's calling us back" /></div>
              <div><label>Call notes (what they said, budget, objections, what we pitched)</label><textarea name="call_notes" defaultValue={lead.call_notes} /></div>
              <div><label>Lost reason (if lost)</label><input name="lost_reason" defaultValue={lead.lost_reason} /></div>
              <div className="sticky-save"><button className="btn wide" type="submit">Save changes</button></div>
            </div>
          </form>

          <div className="panel">
            <div className="ph">Activity</div>
            <div className="pb">
              <form action={addNote} className="row" style={{ marginBottom: 10, flexWrap: "nowrap" }}>
                <input type="hidden" name="id" value={lead.id} />
                <input name="text" placeholder="Texted again, left VM, asked about pricing..." style={{ flex: 1 }} required />
                <button className="btn sm" type="submit">Log</button>
              </form>
              {acts.length === 0 ? (
                <div className="small">No activity yet.</div>
              ) : (
                acts.map((a) => (
                  <div className="act" key={a.id}>
                    <span className="dot" />
                    <div>
                      <div>{a.text}</div>
                      <div className="m">{fmtDateTime(a.at)}{a.by_rep ? " · " + a.by_rep : ""}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            {searchParams.del ? (
              <form action={deleteLead} className="row">
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="confirm" value="yes" />
                <span className="small">Delete {lead.business || "this lead"} for good?</span>
                <button className="btn danger sm" type="submit">Yes, delete</button>
                <Link className="btn ghost sm" href={`/lead/${lead.id}`}>Cancel</Link>
              </form>
            ) : (
              <Link className="btn danger sm" href={`/lead/${lead.id}?del=1`}>Delete lead</Link>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
