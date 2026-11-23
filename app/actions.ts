"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, ensureSchema } from "../lib/db";
import { AUTH_COOKIE, checkPassword, currentRep, hashPassword, setSession } from "../lib/auth";
import { getLoginHash, getSettings, isAdmin } from "../lib/data";
import { fmtDate, fmtDateTime, fromDateInput, fromLocalInput } from "../lib/time";
import { STAGE_MAP } from "../lib/types";
import { shrinkImage } from "../lib/images";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const year = 60 * 60 * 24 * 365;
const len = (fd: FormData) => { const n = Number(String(fd.get("call_len") ?? "")); return [10, 15, 20, 30, 45, 60].includes(n) ? n : 30; };
const num = (fd: FormData, k: string) => { const n = Number(String(fd.get(k) ?? "").replace(/[^0-9.]/g, "")); return isFinite(n) ? n : 0; };

export async function login(fd: FormData) {
  const pw = s(fd, "password");
  const rep = s(fd, "rep");
  if (!process.env.TEAM_PASSWORD) redirect("/login?err=nopw");
  if (!rep) redirect("/login?err=name");
  const { reps } = await getSettings();
  if (!reps.includes(rep)) redirect("/login?err=bad");
  const stored = await getLoginHash(rep);
  let ok = false;
  if (stored) ok = checkPassword(pw, stored);
  // Bootstrap: an admin with no password yet can get in with the team password and set everyone up.
  else if (isAdmin(rep)) ok = pw === process.env.TEAM_PASSWORD;
  if (!ok) redirect(`/login?err=${stored || isAdmin(rep) ? "bad" : "nopass"}&rep=${encodeURIComponent(rep)}`);
  setSession(rep);
  redirect("/");
}

export async function logout() {
  cookies().delete(AUTH_COOKIE);
  redirect("/login");
}

export async function setPassword(fd: FormData) {
  await ensureSchema();
  const me = currentRep();
  const who = s(fd, "name");
  const pw = String(fd.get("password") ?? "");
  if (!me) redirect("/login");
  if (who !== me && !isAdmin(me)) redirect("/settings?err=perm");
  if (pw.length < 4) redirect(`/settings?err=short&who=${encodeURIComponent(who)}`);
  if (who === me && !isAdmin(me)) {
    const stored = await getLoginHash(me);
    if (stored && !checkPassword(String(fd.get("current") ?? ""), stored)) redirect("/settings?err=current");
  }
  await sql`insert into logins (name, pw, updated_at) values (${who}, ${hashPassword(pw)}, now())
            on conflict (name) do update set pw = excluded.pw, updated_at = now()`;
  revalidatePath("/settings");
  redirect(`/settings?pw=${encodeURIComponent(who)}`);
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
    insert into leads (id, business, contact, phone, email, trade, source, rep, stage, how, text_notes, call_at, call_rep, call_len, value, created_by)
    values (${id}, ${s(fd, "business")}, ${s(fd, "contact")}, ${s(fd, "phone")}, ${s(fd, "email")}, ${s(fd, "trade")}, ${s(fd, "source")},
            ${rep}, ${stage}, ${sql.json(how)}, ${s(fd, "text_notes")}, ${callAt}, ${callRep}, ${len(fd)}, ${num(fd, "value")}, ${me})
  `;
  const card = await shrinkImage(fd.get("card") as File | null);
  if (card) await sql`insert into lead_files (lead_id, mime, data) values (${id}, ${card.mime}, ${card.data})`;
  const note = "Lead added" + (card ? " · business card attached" : "") + (callAt ? ` · call booked ${fmtDateTime(callAt)} (${len(fd)} min)${callRep ? " with " + callRep : ""}` : "");
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
    notes.push(`Call booked ${fmtDateTime(callAt)} (${len(fd)} min)${callRep ? " with " + callRep : ""}`);
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
      text_notes = ${s(fd, "text_notes")}, call_at = ${callAt}, call_rep = ${callRep}, call_len = ${len(fd)}, outcome = ${outcome},
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
  if (!isAdmin(currentRep())) redirect("/settings?err=perm");
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

export async function saveAvailability(fd: FormData) {
  await ensureSchema();
  const { fromHHMM } = await import("../lib/availability");
  const rep = s(fd, "rep");
  if (!rep) redirect("/availability/edit");
  const rows: { dow: number; s: number; e: number }[] = [];
  for (let dow = 0; dow < 7; dow++) {
    for (let i = 0; i < 3; i++) {
      const st = fromHHMM(s(fd, `d${dow}_${i}_s`));
      const en = fromHHMM(s(fd, `d${dow}_${i}_e`));
      if (st != null && en != null && en > st) rows.push({ dow, s: st, e: en });
    }
  }
  await sql`delete from availability where rep = ${rep}`;
  for (const r of rows) await sql`insert into availability (rep, dow, start_min, end_min) values (${rep}, ${r.dow}, ${r.s}, ${r.e})`;
  revalidatePath("/availability");
  redirect(`/availability?saved=${encodeURIComponent(rep)}`);
}

export async function bookCall(fd: FormData) {
  await ensureSchema();
  const id = s(fd, "id");
  const callAt = fromLocalInput(s(fd, "call_at"));
  const callRep = s(fd, "call_rep");
  if (!id || !callAt) redirect("/calendar");
  const me = currentRep();
  const cur = (await sql`select stage from leads where id = ${id}`)[0];
  if (!cur) redirect("/calendar");
  const stage = ["texting", "followup", "calldone", "lost"].includes(cur.stage) ? "booked" : cur.stage;
  await sql`update leads set call_at = ${callAt}, call_rep = ${callRep}, call_len = ${len(fd)}, outcome = '', stage = ${stage}, updated_at = now() where id = ${id}`;
  await sql`insert into activity (lead_id, text, by_rep) values (${id}, ${`Call booked ${fmtDateTime(callAt)} (${len(fd)} min)${callRep ? " with " + callRep : ""}`}, ${me})`;
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath(`/lead/${id}`);
  const day = s(fd, "call_at").slice(0, 10);
  redirect(`/calendar?date=${day}&open=${id}`);
}

const WORDS = ["puck", "rink", "snow", "plow", "truck", "maple", "storm", "blade", "salt", "wolf", "bear", "eagle", "tiger", "hammer", "brick", "steel"];
function easyPassword() {
  const { randomInt } = require("crypto") as typeof import("crypto");
  return WORDS[randomInt(WORDS.length)] + String(randomInt(1000, 10000));
}

/** Admin: make passwords for everyone who doesn't have one (or everyone, if all=1). Shown once. */
export async function generatePasswords(fd: FormData) {
  await ensureSchema();
  const me = currentRep();
  if (!isAdmin(me)) redirect("/settings?err=perm");
  const { reps } = await getSettings();
  const existing = (await sql`select name from logins`).map((r: any) => r.name);
  const only = s(fd, "name");
  const targets = only ? [only] : reps.filter((r) => !existing.includes(r));
  const made: Record<string, string> = {};
  for (const r of targets) {
    const pw = easyPassword();
    made[r] = pw;
    await sql`insert into logins (name, pw, updated_at) values (${r}, ${hashPassword(pw)}, now())
              on conflict (name) do update set pw = excluded.pw, updated_at = now()`;
  }
  cookies().set("vz_flash", Buffer.from(JSON.stringify(made)).toString("base64url"), { httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 30, path: "/settings" });
  revalidatePath("/settings");
  redirect("/settings?gen=1");
}

export async function clearFlash() {
  cookies().set("vz_flash", "", { httpOnly: true, sameSite: "lax", secure: true, maxAge: 0, path: "/settings" });
  redirect("/settings");
}

const TEST_LEADS: { b: string; c: string; t: string; stage: string; rep: string; how: string[]; note: string; call?: [number, number, number]; callRep?: string; len?: number; outcome?: string; next?: string; fu?: number; value?: number }[] = [
  { b: "TEST Mike's Plumbing", c: "Mike", t: "Plumber", stage: "texting", rep: "Jaxson", how: ["Word of mouth"], note: "Mostly referrals. Said winter is slow. Asked how it works." },
  { b: "TEST Northside Roofing", c: "Dave", t: "Roofer", stage: "texting", rep: "Cameron", how: ["Referrals", "Google / website"], note: "Has a website but no calls from it. Replied 'yes' to the 5-10 quote requests question." },
  { b: "TEST Capital Eavestrough", c: "Steve", t: "Eavestrough", stage: "texting", rep: "Headsick", how: ["Posting on socials"], note: "Posts in FB groups himself. Asked what the catch is." },
  { b: "TEST Rideau HVAC", c: "Ravi", t: "HVAC", stage: "booked", rep: "Jaxson", how: ["Referrals"], note: "Family business, years in the trade. Asked about cost, pushed to call.", call: [0, 18, 0], callRep: "Jamal", len: 15 },
  { b: "TEST Delta Decks", c: "Dan", t: "Deck builder", stage: "booked", rep: "Sebastian", how: ["Paid ads"], note: "Running his own Meta ads, ~$300/mo, not happy with results.", call: [2, 10, 30], callRep: "Hunter", len: 20 },
  { b: "TEST Ottawa Fence Co", c: "Omar", t: "Fencing", stage: "booked", rep: "Cameron", how: ["Word of mouth", "Lead vendor (Angi, HomeStars etc)"], note: "Pays HomeStars, says leads are garbage.", call: [2, 15, 0], callRep: "Jaxson", len: 30 },
  { b: "TEST Benny Snow Removal", c: "Benny", t: "Snow removal", stage: "booked", rep: "Hunter", how: ["Paid ads"], note: "Spent ~$150 on ads in 2 weeks, 4 contracts signed. $649 single / $849 triple.", call: [3, 13, 0], callRep: "Hunter", len: 30 },
  { b: "TEST Kanata Landscaping", c: "Chris", t: "Landscaping", stage: "booked", rep: "Headsick", how: ["Referrals"], note: "Wants to book spring work early.", call: [0, 19, 0], callRep: "Headsick", len: 20 },
  { b: "TEST Barrhaven Paving", c: "Tony", t: "Paving", stage: "calldone", rep: "Jaxson", how: ["Google / website"], note: "Good convo over text.", outcome: "Showed, thinking about it", next: "Send him the plan Thursday", value: 2500 },
  { b: "TEST Glebe Electric", c: "Sarah", t: "Electrician", stage: "calldone", rep: "Sebastian", how: ["Word of mouth"], note: "Busy but wants steadier work.", outcome: "Showed, good fit", next: "Walk her through setup next week", value: 3000 },
  { b: "TEST Orleans Pressure Wash", c: "Jordan", t: "Pressure washing", stage: "followup", rep: "Cameron", how: ["Posting on socials"], note: "Seasonal, wants to start in spring.", outcome: "Showed, thinking about it", next: "Check back early March", fu: 0, value: 1500 },
  { b: "TEST Stittsville Concrete", c: "Mark", t: "Concrete", stage: "followup", rep: "Jaxson", how: ["Referrals"], note: "Needs to talk to his partner first.", outcome: "Showed, thinking about it", next: "Follow up after he talks to partner", fu: 3, value: 4000 },
  { b: "TEST Bytown Painting", c: "Luc", t: "Painter", stage: "won", rep: "Hunter", how: ["Word of mouth"], note: "Signed after first call.", outcome: "Showed, good fit", value: 3500 },
  { b: "TEST Nepean Windows", c: "Gary", t: "Windows & doors", stage: "lost", rep: "Headsick", how: ["Lead vendor (Angi, HomeStars etc)"], note: "Locked into a HomeStars contract till summer.", outcome: "Showed, not a fit" },
  { b: "TEST Vanier Handyman", c: "Pete", t: "Handyman", stage: "lost", rep: "Sebastian", how: ["Nothing really"], note: "Stopped replying after the opener." },
];

/** Admin: add demo leads (all named TEST ...) to show the pipeline. */
export async function loadTestLeads() {
  await ensureSchema();
  const me = currentRep();
  if (!isAdmin(me)) redirect("/settings?err=perm");
  const { todayKey } = await import("../lib/time");
  const base = Date.parse(todayKey() + "T00:00:00Z");
  const day = (n: number) => new Date(base + n * 86400000).toISOString().slice(0, 10);
  const hh = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  let i = 0;
  for (const t of TEST_LEADS) {
    const id = "test_" + Date.now().toString(36) + "_" + i++;
    const callAt = t.call ? fromLocalInput(`${day(t.call[0])}T${hh(t.call[1], t.call[2])}`) : null;
    const fu = t.fu != null ? fromLocalInput(`${day(t.fu)}T09:00`) : null;
    await sql`
      insert into leads (id, business, contact, phone, email, trade, source, rep, stage, how, text_notes, call_at, call_rep, call_len, outcome, next_step, follow_up_at, value, created_by)
      values (${id}, ${t.b}, ${t.c}, ${"613 555 " + String(1000 + i * 37).slice(0, 4)}, ${t.c.toLowerCase() + "@test.com"}, ${t.t}, ${"TEST - Ottawa Contractors FB group"},
              ${t.rep}, ${t.stage}, ${sql.json(t.how)}, ${t.note}, ${callAt}, ${t.callRep || ""}, ${t.len || 30}, ${t.outcome || ""}, ${t.next || ""}, ${fu}, ${t.value || 0}, ${t.rep})
    `;
    await sql`insert into activity (lead_id, text, by_rep) values (${id}, ${"Lead added (test data)"}, ${t.rep})`;
    if (callAt) await sql`insert into activity (lead_id, text, by_rep) values (${id}, ${`Call booked ${fmtDateTime(callAt)} (${t.len || 30} min) with ${t.callRep}`}, ${t.rep})`;
  }
  revalidatePath("/", "layout");
  redirect("/settings?test=added");
}

/** Admin: remove every lead whose business name starts with TEST. */
export async function clearTestLeads() {
  await ensureSchema();
  if (!isAdmin(currentRep())) redirect("/settings?err=perm");
  await sql`delete from leads where business like 'TEST %' or business like 'TEST-%'`;
  revalidatePath("/", "layout");
  redirect("/settings?test=cleared");
}
