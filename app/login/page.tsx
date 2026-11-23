import { login } from "../actions";
import { getSettings } from "../../lib/data";
import { hasDb } from "../../lib/db";
import { DEFAULT_REPS } from "../../lib/types";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: { err?: string; rep?: string } }) {
  const noPw = !process.env.TEAM_PASSWORD;
  const noDb = !hasDb();
  let reps: string[] = [];
  let dbErr = "";
  try {
    reps = (await getSettings()).reps;
  } catch (e: any) {
    dbErr = e?.message || "Could not reach the database.";
    reps = DEFAULT_REPS;
  }
  const err = searchParams.err;
  return (
    <div className="login-wrap">
      <form className="login" action={login}>
        <div className="logo"><span className="wordmark"><b>V</b>iralize</span></div>
        {noPw && <div className="note err">TEAM_PASSWORD isn&apos;t set in Vercel.</div>}
        {noDb && <div className="note err">No database attached.</div>}
        {!noDb && dbErr && <div className="note err">Database error: {dbErr}</div>}
        {err === "bad" && <div className="note err">Wrong password.</div>}
        {err === "name" && <div className="note err">Pick your name.</div>}
        {err === "nopass" && <div className="note err">You don&apos;t have a password yet. Ask Hunter or Jamal to set one for you.</div>}
        <div>
          <label>Name</label>
          <select name="rep" defaultValue={searchParams.rep || ""} required>
            <option value="" disabled>Pick your name</option>
            {reps.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" required autoComplete="current-password" />
        </div>
        <button className="btn wide" type="submit" disabled={noPw}>Log in</button>
        <div className="small" style={{ textAlign: "center" }}>Stays logged in on this phone for a year.</div>
      </form>
    </div>
  );
}
