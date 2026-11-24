import Link from "next/link";
import { redirect } from "next/navigation";
import Shell, { colorFor } from "../../components/Shell";
import { getSettings, isAdmin } from "../../lib/data";
import { currentRep } from "../../lib/auth";
import { PERIODS, getStats, type Period, type RepStats } from "../../lib/stats";

export const dynamic = "force-dynamic";

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + "%" : "–");

export default async function Stats({ searchParams }: { searchParams: { p?: string } }) {
  const me = currentRep();
  if (!isAdmin(me)) redirect("/today");
  const p = (PERIODS.find((x) => x.key === searchParams.p)?.key || "week") as Period;
  const [settings, stats] = await Promise.all([getSettings(), getStats(p)]);
  const zero: RepStats = { added: 0, booked: 0, taken: 0, showed: 0, won: 0 };
  const rows = settings.reps.map((r) => ({ r, s: stats[r] || zero }));
  const tot = rows.reduce((a, { s }) => ({ added: a.added + s.added, booked: a.booked + s.booked, taken: a.taken + s.taken, showed: a.showed + s.showed, won: a.won + s.won }), { ...zero });
  const max = Math.max(1, ...rows.map(({ s }) => s.booked));

  return (
    <Shell active="stats" title="Stats" reps={settings.reps}>
      <div className="seg" style={{ marginBottom: 14 }}>
        {PERIODS.map((x) => <Link key={x.key} href={`/stats?p=${x.key}`} className={x.key === p ? "on" : ""}>{x.label}</Link>)}
      </div>

      <div className="kpis">
        <div className="kpi"><b>{tot.added}</b><span>Leads added</span></div>
        <div className="kpi"><b>{tot.booked}</b><span>Calls booked</span></div>
        <div className="kpi"><b>{tot.showed}<em>/{tot.taken}</em></b><span>Showed ({pct(tot.showed, tot.taken)})</span></div>
        <div className="kpi"><b>{tot.won}</b><span>Won</span></div>
      </div>

      <div className="panel tbl-wrap" style={{ display: "block" }}>
        <table className="tbl stats">
          <thead>
            <tr><th>Rep</th><th>Added</th><th>Booked</th><th className="hide-m">Calls taken</th><th>Showed</th><th>Won</th></tr>
          </thead>
          <tbody>
            {rows.map(({ r, s }) => {
              const c = colorFor(r, settings.reps);
              return (
                <tr key={r}>
                  <td><span className="row" style={{ gap: 8 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: c, display: "inline-block" }} /><b>{r}</b></span></td>
                  <td>{s.added}</td>
                  <td>
                    <div className="sbar">{s.booked > 0 && <span style={{ width: (s.booked / max) * 100 + "%", background: c }} />}<b>{s.booked}</b></div>
                  </td>
                  <td className="hide-m">{s.taken}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{s.showed} <span className="small">{s.taken ? `(${pct(s.showed, s.taken)})` : ""}</span></td>
                  <td><b>{s.won}</b></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="small" style={{ marginTop: 8, lineHeight: 1.6 }}>
        Leads added and calls booked count who did it. Calls taken and showed count who took the call. Won counts the lead&apos;s owner. Only you and Jamal see this.
      </div>
    </Shell>
  );
}
