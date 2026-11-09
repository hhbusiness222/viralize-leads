"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, ensureSchema } from "../lib/db";
import { AUTH_COOKIE, REP_COOKIE, currentRep, expectedToken } from "../lib/auth";
import { fmtDate, fmtDateTime, fromDateInput, fromLocalInput } from "../lib/time";
import { STAGE_MAP } from "../lib/types";
import { shrinkImage } from "../lib/images";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const year = 60 * 60 * 24 * 365;
const num = (fd: FormData, k: string) => { const n = Number(String(fd.get(k) ?? "").replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };

export async function login(fd: FormData) {
  const pw = s(fd, "password");
  const rep = s(fd, "rep");
  if (!process.env.TEAM_PASSWORD) redirect("/login?err=nopw");
  if (pw !== process.env.TEAM_PASSWORD) redirect("/login?err=bad");
  cookies().set(AUTH_COOKIE, expectedToken(), { httpOnly: true, sameSite: "lax", secure: true, maxAge: year, path: "/" });
  if (rep) cookies().set(REP_COOKIE, rep, { sameSite: "lax", secure: true, maxAge: year, path: "/" });
  redirect("/");
}

export async function logout() {
  cookies().delete(AUTH_COOKIE);
  redirect("/login");
}

export async function setRep(fd: FormData) {
  const rep = s(fd, "rep");
  cookies().set(REP_COOKIE, rep, { sameSite: "lax", secure: true, maxAge: year, path: "/" });
  revalidatePath("/", "layout");
}

function newId() {
  return "l_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function createLead(fd: FormData) {
  await ensureSchema();
  const me = currentRep();
  const id = newId();
  const how = fd.getAll("how").map(String);
  const callAt = fromLocalInput(s(fd, "call_at"));
  const callRep = s(fd, "call_rep");
  let stage = s(fd, "stage") || "texting";
  if (callAt && stage === "texting") stage = "booked";
  const rep = s(fd, "rep") || me;

  await sql`
    insert into leads (id, business, contact, phone, email, trade, source, rep, stage, how, text_notes, call_at, call_rep, value, created_by)
    values (${id}, ${s(fd, "business")}, ${s(fd, "contact")}, ${s(fd, "phone")}, ${s(fd, "email")}, ${s(fd, "trade")}, ${s(fd, "source")},
            ${rep}, ${stage}, ${sql.json(how)}, ${s(fd, "text_notes")}, ${callAt}, ${callRep}, ${num(fd, "value")}, ${me})
  `;
  const card = await shrinkImage(fd.get("card") as File | null);
  if (card) await sql`insert into lead_files (lead_id, mime, data) values (${id}, ${card.mime}, ${card.data})`;
  const note = "Lead added" + (card ? " · business card attached" : "") + (callAt ? ` · call booked ${fmtDateTime(callAt)}${callRep ? " with " + callRep : ""}` : "");
  await sql`insert into activity (lead_id, text, by_rep) values (${id}, ${note}, ${me})`;
  revalidatePath("/");
  revalidatePath("/calendar");
  redirect(`/lead/${id}?saved=1`);
}

export async function updateLead(fd: FormData) {
  await ensureSchema();
  const id = s(fd, "id");
  const me = currentRep();
  const cur = (await sql`select * from leads where id = ${id}`)[0];
  if (!cur) redirect("/");

  const how = fd.getAll("how").map(String);
  const callAt = fromLocalInput(s(fd, "call_at"));
  const outcome = s(fd, "outcome");
  const nextStep = s(fd, "next_step");
  const callRep = s(fd, "call_rep");
  let stage: string = cur.stage;
  const notes: string[] = [];

  const prevCall = cur.call_at ? new Date(cur.call_at).getTime() : null;
  if (callAt && callAt.getTime() !== prevCall) {
    notes.push(`Call booked ${fmtDateTime(callAt)}${callRep ? " with " + callRep : ""}`);
    if (stage === "texting") stage = "booked";
  }
  if (!callAt && prevCall) notes.push("Call removed");
  if (outcome && outcome !== cur.outcome) {
    notes.push("Outcome: " + outcome);
    if (stage === "booked" && !["No show", "Rescheduled", "Cancelled"].includes(outcome)) stage = "calldone";
  }
  if (nextStep && nextStep !== cur.next_step) notes.push("Next: " + nextStep);
  const followUp = fromDateInput(s(fd, "follow_up_at"));
  const prevFu = cur.follow_up_at ? new Date(cur.follow_up_at).getTime() : null;
  if (followUp && followUp.getTime() !== prevFu) {
    notes.push("Follow up " + fmtDate(followUp));
    if (stage === "calldone") stage = "followup";
  }

  await sql`
    update leads set
      business = ${s(fd, "business")}, contact = ${s(fd, "contact")}, phone = ${s(fd, "phone")}, email = ${s(fd, "email")},
      trade = ${s(fd, "trade")}, source = ${s(fd, "source")}, rep = ${s(fd, "rep")}, how = ${sql.json(how)},
      text_notes = ${s(fd, "text_notes")}, call_at = ${callAt}, call_rep = ${callRep}, outcome = ${outcome},
      call_notes = ${s(fd, "call_notes")}, next_step = ${nextStep}, lost_reason = ${s(fd, "lost_reason")},
      stage = ${stage}, value = ${num(fd, "value")}, follow_up_at = ${followUp}, updated_at = now()
    where id = ${id}
  `;
  const card = await shrinkImage(fd.get("card") as File | null);
  if (card) {
    await sql`insert into lead_files (lead_id, mime, data, updated_at) values (${id}, ${card.mime}, ${card.data}, now())
              on conflict (lead_id) do update set mime = excluded.mime, data = excluded.data, updated_at = now()`;
    notes.push("Business card screenshot added");
  }
  await sql`insert into activity (lead_id, text, by_rep) values (${id}, ${notes.join(" · ") || "Edited details"}, ${me})`;
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath(`/lead/${id}`);
  redirect(`/lead/${id}?saved=1`);
}

export async function setStage(fd: FormData) {
  await ensureSchema();
  const id = s(fd, "id");
  const stage = s(fd, "stage");
  if (!STAGE_MAP[stage]) return;
  const me = currentRep();
  const cur = (await sql`select stage from leads where id = ${id}`)[0];
  if (!cur || cur.stage === stage) return;
  await sql`update leads set stage = ${stage}, updated_at = now() where id = ${id}`;
  await sql`insert into activity (lead_id, text, by_rep) values (${id}, ${"Moved to " + STAGE_MAP[stage].label}, ${me})`;
  revalidatePath("/");
  revalidatePath(`/lead/${id}`);
}

export async function addNote(fd: FormData) {
  await ensureSchema();
  const id = s(fd, "id");
  const text = s(fd, "text");
  if (!text) return;
  const me = currentRep();
  await sql`insert into activity (lead_id, text, by_rep) values (${id}, ${text}, ${me})`;
  await sql`update leads set updated_at = now() where id = ${id}`;
  revalidatePath(`/lead/${id}`);
  revalidatePath("/");
}

export async function deleteLead(fd: FormData) {
  await ensureSchema();
  const id = s(fd, "id");
  if (s(fd, "confirm") !== "yes") return;
  await sql`delete from leads where id = ${id}`;
  revalidatePath("/");
  revalidatePath("/calendar");
  redirect("/?deleted=1");
}

export async function saveSettings(fd: FormData) {
  await ensureSchema();
  const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
  const reps = lines(s(fd, "reps"));
  const how = lines(s(fd, "how"));
  await sql`insert into settings (key, value) values ('reps', ${sql.json(reps)}) on conflict (key) do update set value = excluded.value`;
  await sql`insert into settings (key, value) values ('how', ${sql.json(how)}) on conflict (key) do update set value = excluded.value`;
  const goals = { leads: num(fd, "goal_leads") || 5, calls: num(fd, "goal_calls") || 2 };
  await sql`insert into settings (key, value) values ('goals', ${sql.json(goals)}) on conflict (key) do update set value = excluded.value`;
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function removeCard(fd: FormData) {
  await ensureSchema();
  const id = s(fd, "id");
  await sql`delete from lead_files where lead_id = ${id}`;
  await sql`insert into activity (lead_id, text, by_rep) values (${id}, ${"Business card screenshot removed"}, ${currentRep()})`;
  revalidatePath(`/lead/${id}`);
}
