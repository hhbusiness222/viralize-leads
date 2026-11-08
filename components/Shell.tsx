import Link from "next/link";
import { currentRep } from "../lib/auth";

const I = {
  opp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/></svg>,
  contacts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c3 0 5.5 1.8 5.5 4.5"/></svg>,
  cal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  add: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>,
};

export type Active = "opp" | "contacts" | "cal" | "add" | "settings" | "none";

export default function Shell({ children, active, title, actions }: { children: React.ReactNode; active: Active; title: string; actions?: React.ReactNode }) {
  const rep = currentRep();
  const nav = (
    <>
      <Link href="/" className={active === "opp" ? "active" : ""}>{I.opp}Opportunities</Link>
      <Link href="/contacts" className={active === "contacts" ? "active" : ""}>{I.contacts}Contacts</Link>
      <Link href="/calendar" className={active === "cal" ? "active" : ""}>{I.cal}Calendar</Link>
      <Link href="/new" className={active === "add" ? "active" : ""}>{I.add}Add lead</Link>
      <Link href="/settings" className={active === "settings" ? "active" : ""}>{I.settings}Settings</Link>
    </>
  );
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo"><i>V</i>Viralize</div>
        <div className="sec">Sub-account</div>
        {nav}
        <div className="foot"><b>{rep || "No name picked"}</b>Logged in</div>
      </aside>
      <div className="main">
        <div className="topbar">
          <h1>{title}</h1>
          <div className="grow" />
          {actions}
          <Link href="/settings" className="avatar" title={rep || "Pick your name"} style={{ background: rep ? colorFor(rep) : "#c9d0dd" }}>
            {rep ? initials(rep) : "?"}
          </Link>
        </div>
        <div className="content">{children}</div>
      </div>
      <nav className="bottomnav">
        <Link href="/" className={active === "opp" ? "active" : ""}>{I.opp}Pipeline</Link>
        <Link href="/contacts" className={active === "contacts" ? "active" : ""}>{I.contacts}Contacts</Link>
        <Link href="/new" className="add"><span className="ico">{I.add}</span>Add</Link>
        <Link href="/calendar" className={active === "cal" ? "active" : ""}>{I.cal}Calendar</Link>
        <Link href="/settings" className={active === "settings" ? "active" : ""}>{I.settings}Settings</Link>
      </nav>
    </div>
  );
}

export function initials(s: string) {
  const p = s.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}
export function colorFor(s: string) {
  const palette = ["#155eef", "#7a5af8", "#17b26a", "#f79009", "#e5484d", "#0ea5e9", "#d946ef", "#0d9488"];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
