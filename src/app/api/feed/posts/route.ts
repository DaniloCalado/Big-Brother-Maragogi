import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sql } from "@vercel/postgres";
import {
  ensureFeedTables,
  getFeedUserFromRequest,
  isProbablyUrl,
} from "../_shared";

export const runtime = "nodejs";

export async function GET() {
  await ensureFeedTables();
  const user = await getFeedUserFromRequest();
  const currentUserId = user?.userId ?? null;

  const res = await sql<{
    id: string;
    user_id: string;
    message: string;
    attachment_url: string | null;
    attachment_type: string | null;
    created_at: string;
    nome: string;
    foto_url: string;
  }>`
    SELECT
      p.id,
      p.user_id,
      p.message,
      p.attachment_url,
      p.attachment_type,
      p.created_at,
      i.nome,
      i.foto_url
    FROM feed_posts p
    JOIN feed_users u ON u.id = p.user_id
    JOIN inscricoes i ON i.id = u.inscricao_id
    ORDER BY p.created_at DESC
    LIMIT 200;
  `;

  const posts = res.rows.map((p) => ({
    id: p.id,
    message: p.message,
    attachment_url: p.attachment_url,
    attachment_type: p.attachment_type,
    created_at: p.created_at,
    nome: p.nome,
    foto_url: p.foto_url,
    isMine: currentUserId ? p.user_id === currentUserId : false,
  }));

  return NextResponse.json({ ok: true, posts });
}

export async function POST(req: Request) {
  await ensureFeedTables();
  const user = await getFeedUserFromRequest();
  if (!user || user.status !== "approved") {
    return NextResponse.json(
      { ok: false, error: "Você precisa estar logado para postar." },
      { status: 401 },
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
  const attachmentUrl =
    typeof (body as { attachmentUrl?: unknown } | null)?.attachmentUrl ===
    "string"
      ? (body as { attachmentUrl: string }).attachmentUrl.trim()
      : "";
  const attachmentType =
    typeof (body as { attachmentType?: unknown } | null)?.attachmentType ===
    "string"
      ? (body as { attachmentType: string }).attachmentType.trim()
      : "";

  if (!message || message.length < 1) {
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

  let safeAttachmentUrl: string | null = null;
  let safeAttachmentType: string | null = null;

  if (attachmentUrl) {
    if (!isProbablyUrl(attachmentUrl)) {
      return NextResponse.json(
        { ok: false, error: "Anexo inválido." },
        { status: 400 },
      );
    }
    if (attachmentType !== "image" && attachmentType !== "video") {
      return NextResponse.json(
        { ok: false, error: "Tipo de anexo inválido." },
        { status: 400 },
      );
    }
    safeAttachmentUrl = attachmentUrl;
    safeAttachmentType = attachmentType;
  }

  await sql`
    INSERT INTO feed_posts (id, user_id, message, attachment_url, attachment_type)
    VALUES (${randomUUID()}, ${user.userId}, ${message}, ${safeAttachmentUrl}, ${safeAttachmentType});
  `;

  return NextResponse.json({ ok: true });
}
