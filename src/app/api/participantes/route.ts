import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const runtime = "nodejs";

type Participante = {
  id: string;
  nome: string;
  idade: number;
  descricao: string | null;
  foto_url: string;
};

export async function GET() {
  try {
    const result = await sql<Participante>`
      SELECT id, nome, idade, descricao, foto_url
      FROM inscricoes
      WHERE status = 'approved'
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 30;
    `;

    return NextResponse.json({ ok: true, participantes: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json(
      { ok: false, error: message, participantes: [] as Participante[] },
      { status: 200 },
    );
  }
}
