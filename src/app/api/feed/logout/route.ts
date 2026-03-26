import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@vercel/postgres";
import { ensureFeedTables, FEED_SESSION_COOKIE, hashToken } from "../_shared";

export const runtime = "nodejs";

export async function POST() {
  await ensureFeedTables();
  const jar = await cookies();
  const token = jar.get(FEED_SESSION_COOKIE)?.value ?? "";
  if (token) {
    const tokenHash = hashToken(token);
    await sql`
      DELETE FROM feed_sessions
      WHERE token_hash = ${tokenHash};
    `;
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(FEED_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return res;
}

