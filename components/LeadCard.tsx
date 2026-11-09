import Link from "next/link";
import { STAGE_MAP, type Lead } from "../lib/types";
import { fmtDate, fmtDateTime } from "../lib/time";
import { colorFor, initials } from "./Shell";

export function Pill({ stage }: { stage: string }) {
  const s = STAGE_MAP[stage] || { label: stage, color: "#8b93a1" };
  return (
    <span className="tag" style={{ color: s.color, borderColor: s.color + "55", background: s.color + "14" }}>
      {s.label}
    </span>
  );
}

export function Avatar({ name, sm }: { name: string; sm?: boolean }) {
  return (
    <span className={"avatar" + (sm ? " sm" : "")} style={{ background: name ? colorFor(name) : "#c9d0dd" }} title={name}>
      {name ? initials(name) : "?"}
    </span>
  );
}

export const money = (n: number) => (n ? "$" + Math.round(n).toLocaleString("en-CA") : "");

export default function OppCard({ lead }: { lead: Lead }) {
  const over = lead.call_at && lead.stage === "booked" && lead.call_at.getTime() < Date.now() - 15 * 60000;
  return (
    <Link href={`/lead/${lead.id}`} className="opp">
      <div className="n">{lead.business || "(no name)"}</div>
      <div className="b">{[lead.contact, lead.trade].filter(Boolean).join(" · ") || lead.phone}</div>
      {lead.call_at && lead.stage === "booked" && (
        <div className={"call" + (over ? " over" : "")}>
          {over ? "Needs outcome · " : "Call · "}{fmtDateTime(lead.call_at)}{lead.call_rep ? " · " + lead.call_rep : ""}
        </div>
      )}
      {lead.follow_up_at && !["won", "lost"].includes(lead.stage) && lead.stage !== "booked" && (
        <div className={"call" + (lead.follow_up_at.getTime() < Date.now() + 12 * 3600000 ? " over" : "")} style={lead.follow_up_at.getTime() < Date.now() + 12 * 3600000 ? undefined : { color: "#d946ef" }}>
          Follow up {fmtDate(lead.follow_up_at)}{lead.next_step ? " · " + lead.next_step : ""}
        </div>
      )}
      {!lead.follow_up_at && !lead.call_at && lead.next_step && <div className="call" style={{ color: "var(--text2)" }}>Next: {lead.next_step}</div>}
      <div className="f" style={{ marginTop: 6 }}>
        <span className="v">{money(lead.value)}</span>
        <span className="row" style={{ gap: 6 }}>
          <span>{lead.rep}</span>
          <Avatar name={lead.rep} sm />
        </span>
      </div>
    </Link>
  );
}
