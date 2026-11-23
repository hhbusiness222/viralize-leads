import Shell from "../../components/Shell";
import { clearFlash, generatePasswords, logout, saveSettings, setPassword } from "../actions";
import { cookies } from "next/headers";
import CopyButton from "../../components/CopyButton";
import { getLoginNames, getSettings, isAdmin } from "../../lib/data";
import { currentRep } from "../../lib/auth";
import { STAGES } from "../../lib/types";

export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: { saved?: string; pw?: string; err?: string; who?: string } }) {
  const [settings, withPw] = await Promise.all([getSettings(), getLoginNames()]);
  const me = currentRep();
  const admin = isAdmin(me);
  let flash: Record<string, string> = {};
  try { flash = JSON.parse(Buffer.from(cookies().get("vz_flash")?.value || "", "base64url").toString() || "{}"); } catch { flash = {}; }
  const flashNames = admin ? Object.keys(flash) : [];
  const site = "viralize-leads.vercel.app";
  const textFor = (n: string) => `Your Viralize login\n${site}\nName: ${n}\nPassword: ${flash[n]}`;
  const missing = settings.reps.filter((r) => !withPw.includes(r));
  const errMsg: Record<string, string> = {
    short: "Password needs at least 6 characters.",
    current: "Your current password was wrong.",
    perm: "Only Hunter or Jamal can change other people's passwords.",
  };
  return (
    <Shell active="settings" title="Settings" reps={settings.reps}>
      {searchParams.saved && <div className="note ok" style={{ marginBottom: 12 }}>Saved.</div>}
      {searchParams.pw && <div className="note ok" style={{ marginBottom: 12 }}>Password set for {searchParams.pw}.</div>}
      {searchParams.err && errMsg[searchParams.err] && <div className="note err" style={{ marginBottom: 12 }}>{errMsg[searchParams.err]}</div>}
      <div className="detail">
        <div style={{ display: "grid", gap: 16 }}>
          <div className="panel">
            <div className="ph">Logged in as {me}</div>
            <div className="pb">
              <form action={logout}><button className="btn ghost" type="submit">Log out</button></form>
            </div>
          </div>
          <form className="panel" action={setPassword}>
            <div className="ph">Change my password</div>
            <div className="pb form">
              <input type="hidden" name="name" value={me} />
              {!admin && withPw.includes(me) && (
                <div><label>Current password</label><input name="current" type="password" required autoComplete="current-password" /></div>
              )}
              <div><label>New password</label><input name="password" type="password" required minLength={6} autoComplete="new-password" /></div>
              <button className="btn" type="submit">Save password</button>
            </div>
          </form>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          {flashNames.length > 0 && (
            <div className="panel" style={{ borderColor: "var(--blue)" }}>
              <div className="ph">New passwords <span className="small">shown once, copy them now</span></div>
              <div className="pb" style={{ display: "grid", gap: 10 }}>
                {flashNames.map((n) => (
                  <div key={n} className="script-h" style={{ alignItems: "center" }}>
                    <div><b>{n}</b>: <code style={{ fontSize: 15 }}>{flash[n]}</code></div>
                    <CopyButton text={textFor(n)} />
                  </div>
                ))}
                <div className="small">Copy puts a ready-to-send text on your clipboard (link, name and password). Paste it to each guy.</div>
                <form action={clearFlash}><button className="btn ghost sm" type="submit">Done, hide these</button></form>
              </div>
            </div>
          )}
          {admin && (
            <form action={generatePasswords} className="panel">
              <div className="pb" style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <div>
                  <b>Make passwords for me</b>
                  <div className="small">{missing.length ? `${missing.length} guy${missing.length === 1 ? "" : "s"} without a password: ${missing.join(", ")}` : "Everyone has a password."}</div>
                </div>
                <button className="btn" type="submit" disabled={!missing.length}>Generate passwords</button>
              </div>
            </form>
          )}
          {admin && (
            <div className="panel">
              <div className="ph">Team logins <span className="small">only you and Jamal see this</span></div>
              <div className="pb" style={{ display: "grid", gap: 10 }}>
                {settings.reps.map((r) => (
                  <form key={r} action={setPassword} className="login-row">
                    <input type="hidden" name="name" value={r} />
                    <div className="lr-name">
                      <b>{r}</b>
                      <span className={"tag" + (withPw.includes(r) ? "" : " warn")}>{withPw.includes(r) ? "Has password" : "No password yet"}</span>
                    </div>
                    <input name="password" type="text" placeholder={withPw.includes(r) ? "New password to reset" : "Set a password"} minLength={6} required autoComplete="off" />
                    <button className="btn sm" type="submit">{withPw.includes(r) ? "Reset" : "Set"}</button>
                    <button className="btn ghost sm" type="submit" formAction={generatePasswords} formNoValidate>Random</button>
                  </form>
                ))}
                <div className="small">Type one yourself, or hit Random. Each guy can change his own after.</div>
              </div>
            </div>
          )}
          {admin && (
            <form className="panel" action={saveSettings}>
              <div className="ph">Team</div>
              <div className="pb form">
                <div><label>Reps (one per line)</label><textarea name="reps" defaultValue={settings.reps.join("\n")} /></div>
                <div><label>&quot;How they get clients&quot; options (one per line)</label><textarea name="how" defaultValue={settings.how.join("\n")} /></div>
                <button className="btn" type="submit">Save</button>
              </div>
            </form>
          )}
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
