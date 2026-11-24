import { findByPhone } from "../../../lib/data";
import { isAuthed } from "../../../lib/auth";
import { STAGE_MAP } from "../../../lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAuthed()) return new Response("Unauthorized", { status: 401 });
  const phone = new URL(req.url).searchParams.get("phone") || "";
  const hits = await findByPhone(phone);
  return Response.json(
    hits.map((l) => ({ id: l.id, business: l.business || l.contact || "Lead", rep: l.rep, stage: STAGE_MAP[l.stage]?.label || l.stage }))
  );
}
