import Link from "next/link";
import Shell from "../../components/Shell";
import { Avatar, Pill } from "../../components/LeadCard";
import { getLeads, getSettings, getStageCounts } from "../../lib/data";
import { STAGES } from "../../lib/types";
import { fmtDate } from "../../lib/time";

export const dynamic = "force-dynamic";

type SP = { stage?: string; rep?: string; q?: string; sort?: string };

export default async function Contacts({ searchParams }: { searchParams: SP }) {
  const [leads, settings, counts] = await Promise.all([getLeads(searchParams), getSettings(), getStageCounts()]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <Shell active="contacts" title="Contacts" reps={settings.reps} actions={<Link href="/new" className="btn sm">+ Add</Link>}>
      <form className="toolbar" method="get">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input name="q" placeholder="Search name, phone, email, trade" defaultValue={searchParams.q || ""} />
        </div>
        <select name="stage" defaultValue={searchParams.stage || ""}>
          <option value="">All stages ({total})</option>
          {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label} ({counts[s.key] || 0})</option>)}
        </select>
        <select name="rep" defaultValue={searchParams.rep || ""}>
          <option value="">All reps</option>
          {settings.reps.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select name="sort" defaultValue={searchParams.sort || "updated"}>
          <option value="updated">Last activity</option>
          <option value="created">Date added</option>
          <option value="name">Name A to Z</option>
          <option value="call">Call time</option>
        </select>
        <button className="btn ghost sm" type="submit">Filter</button>
      </form>

      {leads.length === 0 ? (
        <div className="empty">{total === 0 ? "No contacts yet. Add the first lead." : "Nothing matches that filter."}</div>
      ) : (
        <>
          <div className="panel tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th><th>Business</th><th>Phone</th><th>Email</th><th>Trade</th><th>Stage</th><th>Rep</th><th>Added</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td><Link href={`/lead/${l.id}`} className="name"><Avatar name={l.contact || l.business} />{l.contact || "—"}</Link></td>
                    <td><Link href={`/lead/${l.id}`}>{l.business}</Link></td>
                    <td>{l.phone}</td>
                    <td>{l.email}</td>
                    <td>{l.trade}</td>
                    <td><Pill stage={l.stage} /></td>
                    <td>{l.rep}</td>
                    <td>{fmtDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mlist">
            {leads.map((l) => (
              <Link href={`/lead/${l.id}`} className="mrow" key={l.id}>
                <Avatar name={l.contact || l.business} />
                <div>
                  <div className="t">{l.business || l.contact || "(no name)"}</div>
                  <div className="s">{[l.contact, l.phone].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="r"><Pill stage={l.stage} /><div className="s">{l.rep}</div></div>
              </Link>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
