import { cookies } from "next/headers";
import { createHash } from "crypto";

export const AUTH_COOKIE = "vz_auth";
export const REP_COOKIE = "vz_rep";

export function expectedToken() {
  const pw = process.env.TEAM_PASSWORD || "";
  if (!pw) return "";
  return createHash("sha256").update("vz:" + pw).digest("hex");
}

export function isAuthed() {
  const t = expectedToken();
  if (!t) return false;
  return cookies().get(AUTH_COOKIE)?.value === t;
}

export function currentRep() {
  return cookies().get(REP_COOKIE)?.value || "";
}
