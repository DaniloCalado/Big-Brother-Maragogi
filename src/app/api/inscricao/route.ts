import { Resend } from "resend";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ADMIN_EMAIL = "danilocarvalhocalado@gmail.com";

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nome = getText(formData, "nome");
    const idadeRaw = getText(formData, "idade");
    const telefone = getText(formData, "telefone");
    const email = getText(formData, "email");
    const descricao = getText(formData, "descricao");

    const idade = Number.parseInt(idadeRaw, 10);

    if (!nome || nome.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Informe um nome válido." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(idade) || idade < 1 || idade > 120) {
      return NextResponse.json(
        { ok: false, error: "Informe uma idade válida." },
        { status: 400 },
      );
    }

    if (!telefone || telefone.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Informe um telefone válido." },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Informe um e-mail válido." },
        { status: 400 },
      );
    }

    if (!descricao || descricao.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Escreva uma descrição um pouco maior." },
        { status: 400 },
      );
    }

    const fotoUrlRaw = getText(formData, "fotoUrl");
    const videoUrlRaw = getText(formData, "videoUrl");
    const fotoUrl =
      fotoUrlRaw && /^https?:\/\//.test(fotoUrlRaw) ? fotoUrlRaw : null;
    const videoUrl =
      videoUrlRaw && /^https?:\/\//.test(videoUrlRaw) ? videoUrlRaw : null;

    if (!fotoUrl) {
      return NextResponse.json(
        { ok: false, error: "Envie uma foto válida." },
        { status: 400 },
      );
    }
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Envio de e-mail não configurado (faltando RESEND_API_KEY no ambiente).",
        },
        { status: 500 },
      );
    }

    const resend = new Resend(resendKey);
    const from =
      process.env.RESEND_FROM ?? "Big Brother Maragogi <onboarding@resend.dev>";

    const subject = `Inscrição — Big Brother Maragogi — ${nome}`;
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111">
        <h2 style="margin:0 0 12px">Nova inscrição — Big Brother Maragogi</h2>
        <p style="margin:0 0 16px">Semana Santa • 2 a 5 de abril • Maragogi - AL</p>

        <table style="border-collapse:collapse;width:100%;max-width:680px">
          <tr><td style="padding:8px 0;width:160px"><strong>Nome</strong></td><td style="padding:8px 0">${escapeHtml(
            nome,
          )}</td></tr>
          <tr><td style="padding:8px 0"><strong>Idade</strong></td><td style="padding:8px 0">${idade}</td></tr>
          <tr><td style="padding:8px 0"><strong>Telefone</strong></td><td style="padding:8px 0">${escapeHtml(
            telefone,
          )}</td></tr>
          <tr><td style="padding:8px 0"><strong>E-mail</strong></td><td style="padding:8px 0">${escapeHtml(
            email,
          )}</td></tr>
          <tr><td style="padding:8px 0;vertical-align:top"><strong>Descrição</strong></td><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(
            descricao,
          )}</td></tr>
          <tr><td style="padding:8px 0"><strong>Foto</strong></td><td style="padding:8px 0"><a href="${fotoUrl}" target="_blank" rel="noreferrer">${fotoUrl}</a></td></tr>
          <tr><td style="padding:8px 0"><strong>Vídeo</strong></td><td style="padding:8px 0">${
            videoUrl
              ? `<a href="${videoUrl}" target="_blank" rel="noreferrer">${videoUrl}</a>`
              : "Não enviado"
          }</td></tr>
        </table>
      </div>
    `;

    await resend.emails.send({
      from,
      to: [ADMIN_EMAIL],
      replyTo: email,
      subject,
      html,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Inscrição enviada com sucesso! Em breve você recebe um retorno.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro inesperado ao enviar. Tente novamente." },
      { status: 500 },
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
