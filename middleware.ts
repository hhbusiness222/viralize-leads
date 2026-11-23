import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "vz_session";

function b64url(buf: ArrayBuffer) {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function valid(token: string | undefined) {
  if (!token) return false;
  const base = process.env.SESSION_SECRET || process.env.TEAM_PASSWORD || "";
  if (!base) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [n, exp, sig] = parts;
  if (Number(exp) < Date.now() / 1000) return false;
  const enc = new TextEncoder();
  const keyHex = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode("vz-session:" + base))))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  const key = await crypto.subtle.importKey("raw", enc.encode(keyHex), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const want = b64url(await crypto.subtle.sign("HMAC", key, enc.encode(n + "." + exp)));
  return want === sig;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname === "/manifest.webmanifest" || pathname.startsWith("/icon")) {
    return NextResponse.next();
  }
  if (!(await valid(req.cookies.get(AUTH_COOKIE)?.value))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
