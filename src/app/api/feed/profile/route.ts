import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { ensureFeedTables, getFeedUserFromRequest } from "../_shared";

export const runtime = "nodejs";

export async function GET() {
  await ensureFeedTables();
  const user = await getFeedUserFromRequest();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const res = await sql<{
    nome: string;
    idade: number;
    telefone: string;
    email: string;
    foto_url: string;
  }>`
    SELECT nome, idade, telefone, email, foto_url
    FROM inscricoes
    WHERE id = ${user.inscricaoId}
    LIMIT 1;
  `;

  const row = res.rows[0];
  if (!row) {
    return NextResponse.json({ ok: false, error: "Perfil não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    profile: {
      nome: row.nome,
      idade: row.idade,
      telefone: row.telefone,
      email: row.email,
      fotoUrl: row.foto_url,
    },
  });
}

export async function PUT(req: Request) {
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

  const nome =
    typeof (body as { nome?: unknown } | null)?.nome === "string"
      ? (body as { nome: string }).nome.trim()
      : "";
  const idadeRaw =
    typeof (body as { idade?: unknown } | null)?.idade === "string" ||
    typeof (body as { idade?: unknown } | null)?.idade === "number"
      ? String((body as { idade: string | number }).idade).trim()
      : "";
  const telefone =
    typeof (body as { telefone?: unknown } | null)?.telefone === "string"
      ? (body as { telefone: string }).telefone.trim()
      : "";

  const idade = Number.parseInt(idadeRaw.replace(/\D/g, ""), 10);

  if (!nome || nome.length < 2) {
    return NextResponse.json({ ok: false, error: "Informe um nome válido." }, { status: 400 });
  }
  if (!Number.isFinite(idade) || idade < 1 || idade > 120) {
    return NextResponse.json({ ok: false, error: "Informe uma idade válida." }, { status: 400 });
  }
  if (!telefone || telefone.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Informe um telefone válido." },
      { status: 400 },
    );
  }

  await sql`
    UPDATE inscricoes
    SET nome = ${nome}, idade = ${idade}, telefone = ${telefone}, updated_at = now()
    WHERE id = ${user.inscricaoId};
  `;

  return NextResponse.json({ ok: true });
}

