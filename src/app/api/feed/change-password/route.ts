import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import {
  ensureFeedTables,
  generateSaltHex,
  getFeedUserFromRequest,
  hashPassword,
  verifyPassword,
} from "../_shared";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureFeedTables();
  const user = await getFeedUserFromRequest();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const currentPassword =
    typeof (body as { currentPassword?: unknown } | null)?.currentPassword ===
    "string"
      ? (body as { currentPassword: string }).currentPassword
      : "";
  const newPassword =
    typeof (body as { newPassword?: unknown } | null)?.newPassword === "string"
      ? (body as { newPassword: string }).newPassword
      : "";

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Informe a senha atual e uma nova senha (mínimo 8)." },
      { status: 400 },
    );
  }

  const res = await sql<{
    password_hash: string;
    password_salt: string;
  }>`
    SELECT password_hash, password_salt
    FROM feed_users
    WHERE id = ${user.userId}
    LIMIT 1;
  `;

  const row = res.rows[0];
  if (!row) {
    return NextResponse.json({ ok: false, error: "Usuário não encontrado." }, { status: 404 });
  }

  const ok = verifyPassword(currentPassword, row.password_salt, row.password_hash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Senha atual incorreta." }, { status: 400 });
  }

  const salt = generateSaltHex();
  const hash = hashPassword(newPassword, salt);

  await sql`
    UPDATE feed_users
    SET password_hash = ${hash}, password_salt = ${salt}, updated_at = now()
    WHERE id = ${user.userId};
  `;

  return NextResponse.json({ ok: true });
}

