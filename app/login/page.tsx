import { login } from "../actions";
import { getSettings } from "../../lib/data";
import { hasDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: { err?: string } }) {
  const noPw = !process.env.TEAM_PASSWORD;
  const noDb = !hasDb();
  let reps: string[] = [];
  let dbErr = "";
  try {
    reps = (await getSettings()).reps;
  } catch (e: any) {
    dbErr = e?.message || "Could not reach the database.";
  }
  return (
    <div className="login-wrap">
      <form className="login" action={login}>
        <div className="logo"><span className="wordmark"><b>V</b>iralize</span></div>
        {noPw && <div className="note err">TEAM_PASSWORD isn&apos;t set. In Vercel: Settings → Environment Variables → add TEAM_PASSWORD, then Deployments → Redeploy.</div>}
        {noDb && <div className="note err">No database attached. In Vercel: Storage → Create Database → Postgres (Neon) → Connect to this project, then Redeploy.</div>}
        {!noDb && dbErr && <div className="note err">Database error: {dbErr}</div>}
        {searchParams.err === "bad" && <div className="note err">Wrong password.</div>}
        <div>
          <label>Team password</label>
          <input name="password" type="password" required autoFocus autoComplete="current-password" />
        </div>
        <div>
          <label>Who are you?</label>
          <select name="rep" defaultValue="">
            <option value="">Pick your name</option>
            {reps.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button className="btn wide" type="submit" disabled={noPw}>Log in</button>
        <div className="small" style={{ textAlign: "center" }}>Stays logged in on this phone. Add to home screen for the app feel.</div>
      </form>
    </div>
  );
}
