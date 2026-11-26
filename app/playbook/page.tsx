import Shell from "../../components/Shell";
import PlaybookBody from "../../components/PlaybookBody";
import { getSettings, isAdmin } from "../../lib/data";
import { currentRep } from "../../lib/auth";
import { getVideo, embedUrl } from "../../lib/video";
import { saveVideo } from "../actions";
import { FLOW, OBJECTIONS } from "../../lib/playbook";

export const dynamic = "force-dynamic";

export default async function Playbook() {
  const [settings, video] = await Promise.all([getSettings(), getVideo()]);
  const admin = isAdmin(currentRep());
  const embed = video ? embedUrl(video.url) : null;
  const isFile = !!embed && /\.(mp4|mov|webm)(\?|$)/i.test(embed);
  return (
    <Shell active="playbook" title="Playbook" reps={settings.reps}>
      <div className="goal-banner">
        <div className="gb-k">The goal</div>
        <div className="gb-v">Book the call. That&apos;s it.</div>
        <div className="small" style={{ color: "#e6defc" }}>We don&apos;t sell in text. Every message is a step toward a 15 min call.</div>
      </div>


      {(video || admin) && (
        <details className="pb" open>
          <summary>Training video <span className="small">what Viralize is and what we sell</span></summary>
          <div className="pb-body">
            {video && (
              <>
                <div className="small" style={{ fontWeight: 700, color: "var(--ink)" }}>{video.title}</div>
                {embed ? (
                  <div className="vid">
                    {isFile ? <video src={embed} controls playsInline preload="metadata" poster={embed === "/training.mp4" ? "/training.jpg" : undefined} />
                      : <iframe src={embed} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />}
                  </div>
                ) : null}
                <a className="btn ghost sm" href={video.url} target="_blank" rel="noreferrer" style={{ alignSelf: "flex-start" }}>
                  {embed ? "Open full screen" : "Watch the video"}
                </a>
              </>
            )}
            {admin && (
              <details className="vid-edit">
                <summary className="small">{video ? "Change video (only you and Jamal see this)" : "Add the training video (only you and Jamal see this)"}</summary>
                <form action={saveVideo} className="form" style={{ marginTop: 8 }}>
                  <div><label>Video link</label><input name="url" defaultValue={video?.url || ""} placeholder="YouTube, Loom, Google Drive or Vimeo link" /></div>
                  <div><label>Title</label><input name="title" defaultValue={video?.title || "What Viralize is and what we sell"} /></div>
                  <div className="small">Google Drive: set sharing to &quot;Anyone with the link&quot;. YouTube: unlisted is fine. Leave the link blank and save to go back to the uploaded video.</div>
                  <button className="btn" type="submit">Save video</button>
                </form>
              </details>
            )}
          </div>
        </details>
      )}

      <PlaybookBody flow={FLOW} objections={OBJECTIONS} />
    </Shell>
  );
}
