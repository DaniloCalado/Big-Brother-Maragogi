import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sql } from "@vercel/postgres";
import {
  ensureFeedTables,
  FEED_SESSION_COOKIE,
  generateSessionToken,
  hashToken,
  verifyPassword,
} from "../_shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureFeedTables();

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const emailRaw =
    typeof (body as { email?: unknown } | null)?.email === "string"
      ? (body as { email: string }).email.trim()
      : "";
  const password =
    typeof (body as { password?: unknown } | null)?.password === "string"
      ? (body as { password: string }).password
      : "";

  const email = emailRaw.toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "E-mail inválido." }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ ok: false, error: "Senha inválida." }, { status: 400 });
  }

  const userRes = await sql<{
    id: string;
    inscricao_id: string;
    email: string;
    password_hash: string;
    password_salt: string;
    status: string;
  }>`
    SELECT
      u.id,
      u.inscricao_id,
      u.email,
      u.password_hash,
      u.password_salt,
      i.status
    FROM feed_users u
    JOIN inscricoes i ON i.id = u.inscricao_id
    WHERE lower(u.email) = ${email}
    LIMIT 1;
  `;

  const user = userRes.rows[0];
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Usuário não encontrado. Verifique o e-mail e a senha." },
      { status: 401 },
    );
  }

  if (user.status !== "approved") {
    return NextResponse.json(
      { ok: false, error: "Apenas participantes selecionados podem acessar o feed." },
      { status: 403 },
    );
  }

  const ok = verifyPassword(password, user.password_salt, user.password_hash);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Usuário não encontrado. Verifique o e-mail e a senha." },
      { status: 401 },
    );
  }

  const sessionToken = generateSessionToken();
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await sql`
    DELETE FROM feed_sessions
    WHERE expires_at <= now();
  `;

  await sql`
    INSERT INTO feed_sessions (id, user_id, token_hash, expires_at)
    VALUES (${randomUUID()}, ${user.id}, ${tokenHash}, ${expiresAt.toISOString()});
  `;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(FEED_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return res;
}

