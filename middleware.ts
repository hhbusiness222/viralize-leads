import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "vz_auth";

async function expected() {
  const pw = process.env.TEAM_PASSWORD || "";
  if (!pw) return "";
  const data = new TextEncoder().encode("vz:" + pw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname === "/manifest.webmanifest" || pathname.startsWith("/icon") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const want = await expected();
  if (!want || token !== want) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
