import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { ensureFeedTables, getFeedUserFromRequest } from "../_shared";

export const runtime = "nodejs";

export async function DELETE() {
  await ensureFeedTables();
  const user = await getFeedUserFromRequest();
  if (!user || user.status !== "approved") {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  await sql`
    DELETE FROM feed_users
    WHERE id = ${user.userId};
  `;

  return NextResponse.json({ ok: true });
}

