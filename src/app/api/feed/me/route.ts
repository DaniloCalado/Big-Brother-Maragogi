import { NextResponse } from "next/server";
import { ensureFeedTables, getFeedUserFromRequest } from "../_shared";

export const runtime = "nodejs";

export async function GET() {
  await ensureFeedTables();
  const user = await getFeedUserFromRequest();
  if (!user) return NextResponse.json({ ok: true, logged: false });
  if (user.status !== "approved") return NextResponse.json({ ok: true, logged: false });

  return NextResponse.json({
    ok: true,
    logged: true,
    user: {
      email: user.email,
      nome: user.nome,
      fotoUrl: user.fotoUrl,
    },
  });
}

