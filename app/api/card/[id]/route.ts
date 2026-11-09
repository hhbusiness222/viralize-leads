import { getCard } from "../../../../lib/data";
import { isAuthed } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return new Response("Unauthorized", { status: 401 });
  const card = await getCard(params.id);
  if (!card) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(card.data), { headers: { "content-type": card.mime, "cache-control": "private, max-age=60" } });
}
