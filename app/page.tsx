import Link from "next/link";
import Shell from "../components/Shell";
import OppCard, { money } from "../components/LeadCard";
import { getLeads, getOverdueCalls, getSettings } from "../lib/data";
import { STAGES } from "../lib/types";

export const dynamic = "force-dynamic";

type SP = { rep?: string; q?: string; deleted?: string };

function qs(sp: SP, patch: Partial<SP>) {
  const p = new URLSearchParams();
  const merged = { ...sp, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v && k !== "deleted") p.set(k, v);
  const s = p.toString();
  return s ? `/?${s}` : "/";
}

export default async function Opportunities({ searchParams }: { searchParams: SP }) {
  const [leads, settings, overdue] = await Promise.all([
    getLeads({ rep: searchParams.rep, q: searchParams.q, sort: "updated" }),
    getSettings(),
    getOverdueCalls(),
  ]);
  const byStage: Record<string, typeof leads> = {};
  for (const s of STAGES) byStage[s.key] = [];
  for (const l of leads) (byStage[l.stage] ||= []).push(l);

  return (
    <Shell
      active="opp"
      title="Opportunities"
      actions={<Link href="/new" className="btn sm">+ Add</Link>}
    >
      {searchParams.deleted && <div className="note ok" style={{ marginBottom: 10 }}>Lead deleted.</div>}
      {overdue.length > 0 && (
        <div className="note warn" style={{ marginBottom: 12 }}>
          {overdue.length} call{overdue.length > 1 ? "s" : ""} already happened with no outcome logged.{" "}
          <Link href="/calendar?view=overdue" style={{ textDecoration: "underline" }}>Log them</Link>
        </div>
      )}

      <form className="toolbar" method="get">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input name="q" placeholder="Search opportunities" defaultValue={searchParams.q || ""} />
        </div>
        <select name="rep" defaultValue={searchParams.rep || ""}>
          <option value="">All reps</option>
          {settings.reps.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn ghost sm" type="submit">Filter</button>
        {(searchParams.q || searchParams.rep) && <Link className="btn ghost sm" href="/">Clear</Link>}
      </form>

      <div className="board">
        {STAGES.map((s) => {
          const items = byStage[s.key] || [];
          const total = items.reduce((a, l) => a + (l.value || 0), 0);
          return (
            <div className="col" key={s.key} style={{ ["--c" as any]: s.color }}>
              <div className="ch">
                <b>{s.label}</b>
                <span className="meta">{items.length} · {money(total) || "$0"}</span>
              </div>
              <div className="cards">
                {items.length === 0 ? (
                  <div className="small" style={{ textAlign: "center", padding: "18px 6px" }}>Empty</div>
                ) : (
                  items.map((l) => <OppCard key={l.id} lead={l} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="small" style={{ marginTop: 6 }}>Swipe sideways to move between stages. Tap a card to open it and change its stage.</div>
    </Shell>
  );
}
