import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@vercel/postgres";
import { ensureFeedTables, getFeedUserFromRequest } from "../../_shared";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await ensureFeedTables();
  const user = await getFeedUserFromRequest();
  if (!user || user.status !== "approved") {
    return NextResponse.json(
      { ok: false, error: "Não autorizado." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const postId = String(id ?? "");
  if (!postId) {
    return NextResponse.json(
      { ok: false, error: "ID inválido." },
      { status: 400 },
    );
  }

  const ownerRes = await sql<{ user_id: string }>`
    SELECT user_id
    FROM feed_posts
    WHERE id = ${postId}
    LIMIT 1;
  `;
  const owner = ownerRes.rows[0];
  if (!owner) {
    return NextResponse.json(
      { ok: false, error: "Post não encontrado." },
      { status: 404 },
    );
  }
  if (owner.user_id !== user.userId) {
    return NextResponse.json(
      { ok: false, error: "Sem permissão." },
      { status: 403 },
    );
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const message =
    typeof (body as { message?: unknown } | null)?.message === "string"
      ? (body as { message: string }).message.trim()
      : "";

  if (!message) {
    return NextResponse.json(
      { ok: false, error: "Escreva uma mensagem." },
      { status: 400 },
    );
  }
  if (message.length > 1200) {
    return NextResponse.json(
      { ok: false, error: "Mensagem muito longa." },
      { status: 400 },
    );
  }

  await sql`
    UPDATE feed_posts
    SET message = ${message}
    WHERE id = ${postId} AND user_id = ${user.userId};
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await ensureFeedTables();
  const user = await getFeedUserFromRequest();
  if (!user || user.status !== "approved") {
    return NextResponse.json(
      { ok: false, error: "Não autorizado." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const postId = String(id ?? "");
  if (!postId) {
    return NextResponse.json(
      { ok: false, error: "ID inválido." },
      { status: 400 },
    );
  }

  const res = await sql<{ id: string }>`
    DELETE FROM feed_posts
    WHERE id = ${postId} AND user_id = ${user.userId}
    RETURNING id;
  `;

  if (res.rows.length === 0) {
    const exists = await sql<{ id: string }>`
      SELECT id
      FROM feed_posts
      WHERE id = ${postId}
      LIMIT 1;
    `;
    if (exists.rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Post não encontrado." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Sem permissão." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
