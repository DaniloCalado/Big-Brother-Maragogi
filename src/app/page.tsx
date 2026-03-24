import { sql } from "@vercel/postgres";
import { unstable_noStore as noStore } from "next/cache";
import { HomeClient, type ConfirmedParticipant } from "./HomeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  noStore();

  let participantes: ConfirmedParticipant[] = [];
  let status: "ok" | "empty" | "error" = "error";

  try {
    const result = await sql<ConfirmedParticipant>`
      SELECT id, nome, idade, descricao, foto_url
      FROM inscricoes
      WHERE status = 'approved'
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 30;
    `;
    participantes = result.rows;
    status = participantes.length > 0 ? "ok" : "empty";
  } catch (_e) {
    void _e;
    participantes = [];
    status = "error";
  }

  return (
    <HomeClient
      initialConfirmedParticipants={participantes}
      initialConfirmedParticipantsStatus={status}
    />
  );
}
