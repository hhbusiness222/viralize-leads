import Link from "next/link";
import Shell from "../components/Shell";
import OppCard from "../components/LeadCard";
import Board from "../components/Board";
import { getFollowUpsDue, getLeads, getOverdueCalls, getSettings } from "../lib/data";
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
  const [leads, settings, overdue, due] = await Promise.all([
    getLeads({ rep: searchParams.rep, q: searchParams.q, sort: "updated" }),
    getSettings(),
    getOverdueCalls(),
    getFollowUpsDue(),
  ]);

  return (
    <Shell
      active="opp"
      title="Opportunities"
      reps={settings.reps}
      actions={<Link href="/new" className="btn sm">+ Add</Link>}
    >
      {searchParams.deleted && <div className="note ok" style={{ marginBottom: 10 }}>Lead deleted.</div>}
      {overdue.length > 0 && (
        <div className="note warn" style={{ marginBottom: 12 }}>
          {overdue.length} call{overdue.length > 1 ? "s" : ""} already happened with no outcome logged.{" "}
          <Link href="/calendar?view=overdue" style={{ textDecoration: "underline" }}>Log them</Link>
        </div>
      )}

      {due.length > 0 && (
        <div className="note warn" style={{ marginBottom: 12, borderColor: "#e9b3f5", background: "#fbeafe", color: "#86198f" }}>
          {due.length} follow-up{due.length > 1 ? "s" : ""} due: {due.slice(0, 3).map((l) => l.business).join(", ")}{due.length > 3 ? "..." : ""}.{" "}
          <Link href="/calendar?view=followups" style={{ textDecoration: "underline" }}>See them</Link>
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

      <Board
        cols={STAGES.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
        cards={leads.map((l) => ({ id: l.id, stage: l.stage, value: l.value || 0, node: <OppCard lead={l} reps={settings.reps} /> }))}
      />
      <div className="small" style={{ marginTop: 6 }}>Drag a card to another column to change its stage. On phone: tap and hold, then drag. Tap to open.</div>
    </Shell>
  );
}
