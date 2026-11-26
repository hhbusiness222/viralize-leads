import { sql, ensureSchema } from "./db";

export type Video = { url: string; title: string };

export async function getVideo(): Promise<Video | null> {
  await ensureSchema();
  const r = await sql`select value from settings where key = 'training_video'`;
  const v = r[0]?.value;
  if (v && v.url) return { url: String(v.url), title: String(v.title || "What Viralize is and what we sell") };
  return { url: "/training.mp4", title: "What Viralize is and what we sell" };
}

/** Turn a share link into something we can embed. Returns null if we can't embed it. */
export function embedUrl(url: string): string | null {
  if (url.startsWith("/")) return url;
  try {
    const u = new URL(url.trim());
    const h = u.hostname.replace(/^www\./, "");
    if (h === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (h.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const id = u.searchParams.get("v") || u.pathname.split("/shorts/")[1] || u.pathname.split("/live/")[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (h.endsWith("loom.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.loom.com/embed/${id}` : null;
    }
    if (h.endsWith("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts.find((p) => /^\d+$/.test(p));
      const hash = parts[parts.indexOf(id || "") + 1];
      return id ? `https://player.vimeo.com/video/${id}${hash && /^[0-9a-f]+$/.test(hash) ? "?h=" + hash : ""}` : null;
    }
    if (h === "drive.google.com") {
      const m = u.pathname.match(/\/d\/([^/]+)/);
      const id = m?.[1] || u.searchParams.get("id");
      return id ? `https://drive.google.com/file/d/${id}/preview` : null;
    }
    if (/\.(mp4|mov|webm)$/i.test(u.pathname)) return url;
    return null;
  } catch {
    return null;
  }
}
