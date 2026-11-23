import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const AUTH_COOKIE = "vz_session";
const MAX_AGE = 60 * 60 * 24 * 365;

/** Signing key for session cookies. Derived from env so nothing extra needs setting up. */
function secret() {
  const base = process.env.SESSION_SECRET || process.env.TEAM_PASSWORD || "";
  return createHash("sha256").update("vz-session:" + base).digest("hex");
}

/** token = base64url(name).expiry.hmac */
export function makeToken(name: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const body = Buffer.from(name, "utf8").toString("base64url") + "." + exp;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return body + "." + sig;
}

export function readToken(token: string | undefined): string {
  if (!token || !secret()) return "";
  const parts = token.split(".");
  if (parts.length !== 3) return "";
  const [n, exp, sig] = parts;
  const want = createHmac("sha256", secret()).update(n + "." + exp).digest("base64url");
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return "";
  if (Number(exp) < Date.now() / 1000) return "";
  return Buffer.from(n, "base64url").toString("utf8");
}

export function setSession(name: string) {
  cookies().set(AUTH_COOKIE, makeToken(name), { httpOnly: true, sameSite: "lax", secure: true, maxAge: MAX_AGE, path: "/" });
}

export function isAuthed() {
  return !!currentRep();
}

/** The logged-in rep, from the signed session cookie. */
export function currentRep() {
  return readToken(cookies().get(AUTH_COOKIE)?.value);
}

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function checkPassword(pw: string, stored: string) {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const got = scryptSync(pw, salt, 64);
  const want = Buffer.from(hash, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}
