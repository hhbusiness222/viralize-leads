import Shell from "../../components/Shell";
import PlaybookBody from "../../components/PlaybookBody";
import { getSettings } from "../../lib/data";
import { FLOW, OBJECTIONS } from "../../lib/playbook";

export const dynamic = "force-dynamic";

export default async function Playbook() {
  const settings = await getSettings();
  return (
    <Shell active="playbook" title="Playbook" reps={settings.reps}>
      <div className="goal-banner">
        <div className="gb-k">The goal</div>
        <div className="gb-v">Book the call. That&apos;s it.</div>
        <div className="small" style={{ color: "#e6defc" }}>We don&apos;t sell in text. Every message is a step toward a 15 min call.</div>
      </div>


      <PlaybookBody flow={FLOW} objections={OBJECTIONS} />
    </Shell>
  );
}
