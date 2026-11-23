import Link from "next/link";
import Shell from "../../../components/Shell";
import { saveAvailability } from "../../actions";
import { getSettings } from "../../../lib/data";
import { currentRep } from "../../../lib/auth";
import { DAYS_LONG, getAvailability, toHHMM } from "../../../lib/availability";

export const dynamic = "force-dynamic";

export default async function EditAvailability({ searchParams }: { searchParams: { rep?: string } }) {
  const [settings, windows] = await Promise.all([getSettings(), getAvailability()]);
  const rep = searchParams.rep || currentRep() || settings.reps[0];
  const mine = windows.filter((w) => w.rep === rep);

  return (
    <Shell active="avail" title="Edit availability" reps={settings.reps} actions={<Link href="/availability" className="btn ghost sm">← Back</Link>}>
      <form method="get" className="toolbar">
        <select name="rep" defaultValue={rep}>
          {settings.reps.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn ghost sm" type="submit">Switch</button>
      </form>

      <form action={saveAvailability} className="panel" style={{ maxWidth: 640 }}>
        <input type="hidden" name="rep" value={rep} />
        <div className="ph">{rep}&apos;s weekly windows <span className="small">up to 3 per day, leave blank = off</span></div>
        <div className="pb" style={{ display: "grid", gap: 14 }}>
          {DAYS_LONG.map((day, dow) => {
            const ws = mine.filter((w) => w.dow === dow);
            return (
              <div key={day} className="av-edit">
                <b>{day}</b>
                <div className="av-slots">
                  {[0, 1, 2].map((i) => (
                    <div className="av-slot" key={i}>
                      <input type="time" name={`d${dow}_${i}_s`} defaultValue={ws[i] ? toHHMM(ws[i].s) : ""} step={900} />
                      <span>to</span>
                      <input type="time" name={`d${dow}_${i}_e`} defaultValue={ws[i] ? toHHMM(ws[i].e) : ""} step={900} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="sticky-save"><button className="btn wide" type="submit">Save {rep}&apos;s availability</button></div>
        </div>
      </form>
    </Shell>
  );
}
