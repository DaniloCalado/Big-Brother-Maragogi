import { sql } from "@vercel/postgres";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import {
  ensureFeedTables,
  generatePassword,
  generateSaltHex,
  getBaseUrl,
  hashPassword,
} from "@/app/api/feed/_shared";

export const dynamic = "force-dynamic";

const SELECTION_NOTIFICATION_EMAIL =
  (process.env.SELECTION_NOTIFICATION_EMAIL ?? "").trim() ||
  "danilocarvalhocalado@gmail.com";

type Inscricao = {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  idade: number;
  telefone: string;
  email: string;
  descricao: string;
  foto_url: string;
  video_url: string | null;
  status: "pending" | "approved" | "rejected" | string;
};

type StatusCount = { status: string; count: number };

function statusLabel(status: string) {
  if (status === "pending") return "Pendente";
  if (status === "approved") return "Selecionado";
  if (status === "rejected") return "Reprovado";
  return status;
}

function statusTone(status: string) {
  if (status === "approved") {
    return "border-emerald-400/30 bg-emerald-400/15 text-emerald-100";
  }
  if (status === "pending") {
    return "border-yellow-400/30 bg-yellow-400/15 text-yellow-100";
  }
  if (status === "rejected") {
    return "border-red-400/30 bg-red-400/15 text-red-100";
  }
  return "border-white/15 bg-black/40 text-white/80";
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS inscricoes (
      id uuid PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      nome text NOT NULL,
      idade int NOT NULL,
      telefone text NOT NULL,
      email text NOT NULL,
      descricao text,
      foto_url text NOT NULL,
      video_url text,
      status text NOT NULL DEFAULT 'pending'
    );
  `;
  await sql`ALTER TABLE inscricoes ALTER COLUMN created_at SET DEFAULT now();`;
  await sql`ALTER TABLE inscricoes ALTER COLUMN updated_at SET DEFAULT now();`;
  await sql`CREATE INDEX IF NOT EXISTS idx_inscricoes_status ON inscricoes(status);`;
}

async function updateStatus(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return;
  if (!["pending", "approved", "rejected"].includes(status)) return;

  await ensureTable();

  const beforeRes = await sql<{
    status: string;
    email: string;
    nome: string;
  }>`
    SELECT status, email, nome
    FROM inscricoes
    WHERE id = ${id}
    LIMIT 1;
  `;
  const before = beforeRes.rows[0] ?? null;

  await sql`
    UPDATE inscricoes
    SET status = ${status}, updated_at = now()
    WHERE id = ${id};
  `;

  if (before && before.status !== "approved" && status === "approved") {
    await ensureFeedTables();

    const plainPassword = generatePassword();
    const salt = generateSaltHex();
    const hash = hashPassword(plainPassword, salt);

    const existingRes = await sql<{ id: string }>`
      SELECT id
      FROM feed_users
      WHERE inscricao_id = ${id} OR lower(email) = lower(${before.email})
      LIMIT 1;
    `;
    const existing = existingRes.rows[0] ?? null;

    if (existing) {
      await sql`
        UPDATE feed_users
        SET
          inscricao_id = ${id},
          email = ${before.email.toLowerCase()},
          password_hash = ${hash},
          password_salt = ${salt},
          updated_at = now()
        WHERE id = ${existing.id};
      `;
    } else {
      await sql`
        INSERT INTO feed_users (id, inscricao_id, email, password_hash, password_salt)
        VALUES (
          ${randomUUID()},
          ${id},
          ${before.email.toLowerCase()},
          ${hash},
          ${salt}
        );
      `;
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const baseUrl = getBaseUrl();
      const feedUrl = `${baseUrl}/feed`;
      const from =
        process.env.RESEND_FROM ??
        "Big Brother Enseada <onboarding@resend.dev>";

      await resend.emails.send({
        from,
        to: SELECTION_NOTIFICATION_EMAIL,
        subject: "Você foi selecionado no Big Brother Enseada!",
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#111">
            <h2 style="margin:0 0 12px 0;">Participante selecionado: ${before.nome}</h2>

            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px;margin:14px 0;">
              <div style="font-weight:700;margin:0 0 6px 0;">Ação</div>
              <div style="margin:0;">
                Copie e cole a mensagem pronta abaixo e envie para o participante.
              </div>
              <div style="margin:10px 0 0 0;font-size:12px;color:#7c2d12;">
                Destinatário do participante: <strong>${before.email}</strong>
              </div>
            </div>

            <div style="background:#f6f6f6;border:1px solid #e5e5e5;border-radius:12px;padding:14px;margin:14px 0;">
              <div style="font-weight:700;margin:0 0 8px 0;">Mensagem para copiar e enviar</div>
              <pre style="margin:0;white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:13px;line-height:1.5;color:#111;">Parabéns, ${before.nome}! 🎉

Sua inscrição foi APROVADA no Big Brother Enseada.

Para acessar o Feed e postar, use:
Login: ${before.email}
Senha: ${plainPassword}

Feed: ${feedUrl}
Para alterar a senha: acesse o Feed (${feedUrl}), faça login e depois vá no menu (dropdown) > Perfil > Alterar senha.
</pre>
            </div>

            <div style="margin:14px 0 0 0;font-size:12px;color:#555;">
              Este e-mail foi enviado para a administração porque o remetente de teste não permite envio direto para todos os participantes.
            </div>
          </div>
        `,
      });
    }
  }

  revalidatePath("/admin/inscricoes");
  revalidatePath("/participantes");
}

async function deleteInscricao(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!id) return;
  if (confirm !== "DELETE") return;

  await ensureTable();
  await sql`
    DELETE FROM inscricoes
    WHERE id = ${id};
  `;

  revalidatePath("/admin/inscricoes");
  revalidatePath("/participantes");
}

async function backfillApprovedWithDefaultPassword(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  if (!password || password.length < 8) return;

  await ensureTable();
  await ensureFeedTables();

  const list = await sql<{ id: string; email: string }>`
    SELECT id, email
    FROM inscricoes
    WHERE status = 'approved';
  `;

  for (const row of list.rows) {
    const salt = generateSaltHex();
    const hash = hashPassword(password, salt);
    await sql`
      INSERT INTO feed_users (id, inscricao_id, email, password_hash, password_salt)
      VALUES (${randomUUID()}, ${row.id}, ${row.email.toLowerCase()}, ${hash}, ${salt})
      ON CONFLICT (email)
      DO UPDATE SET
        inscricao_id = EXCLUDED.inscricao_id,
        password_hash = EXCLUDED.password_hash,
        password_salt = EXCLUDED.password_salt,
        updated_at = now();
    `;
  }

  revalidatePath("/admin/inscricoes");
}

export default async function AdminInscricoesPage() {
  noStore();
  let inscricoes: Inscricao[] = [];
  let counts: StatusCount[] = [];
  let dbError: string | null = null;

  try {
    await ensureTable();
    const countResult = await sql<StatusCount>`
      SELECT status, COUNT(*)::int as count
      FROM inscricoes
      GROUP BY status;
    `;
    counts = countResult.rows;

    const result = await sql<Inscricao>`
      SELECT
        id,
        created_at,
        updated_at,
        nome,
        idade,
        telefone,
        email,
        descricao,
        foto_url,
        video_url,
        status
      FROM inscricoes
      ORDER BY created_at DESC
      LIMIT 300;
    `;
    inscricoes = result.rows;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Erro desconhecido";
  }

  const total = counts.reduce((acc, c) => acc + c.count, 0);
  const pending = counts.find((c) => c.status === "pending")?.count ?? 0;
  const approved = counts.find((c) => c.status === "approved")?.count ?? 0;
  const rejected = counts.find((c) => c.status === "rejected")?.count ?? 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Admin • Inscrições
          </h1>
          <p className="text-sm text-white/70">
            Painel privado para selecionar participantes e gerenciar inscrições.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form
            action={backfillApprovedWithDefaultPassword}
            className="hidden items-center gap-2 sm:flex"
            title="Definir uma senha padrão para todos os selecionados (apenas os já aprovados)."
          >
            <input
              name="password"
              type="password"
              placeholder="Senha padrão (mín. 8)"
              className="h-10 rounded-full border border-white/15 bg-black/40 px-4 text-sm text-white/85 outline-none placeholder:text-white/40"
            />
            <button
              type="submit"
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
            >
              Aplicar senha padrão
            </button>
          </form>
          <Link
            href="/"
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
          >
            Voltar para home
          </Link>
        </div>
      </div>

      {dbError ? (
        <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-200">
          <p className="text-sm font-semibold">
            Banco de dados não disponível.
          </p>
          <p className="mt-2 text-sm text-red-200/90">{dbError}</p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: total, tone: "text-white" },
          { label: "Pendentes", value: pending, tone: "text-yellow-200" },
          { label: "Selecionados", value: approved, tone: "text-emerald-200" },
          { label: "Reprovados", value: rejected, tone: "text-red-200" },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-3xl border border-white/10 bg-black/55 p-6 backdrop-blur"
          >
            <p className="text-xs font-semibold tracking-wide text-white/65">
              {c.label}
            </p>
            <p className={`mt-3 text-3xl font-black ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {inscricoes.map((i) => (
          <div
            key={i.id}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/55 p-6 backdrop-blur"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
              <div className="absolute -left-12 -top-12 size-44 rounded-full bg-orange-400/10 blur-2xl" />
              <div className="absolute -bottom-12 -right-12 size-44 rounded-full bg-cyan-400/10 blur-2xl" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <a
                    href={i.foto_url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative grid size-14 shrink-0 place-items-center"
                    aria-label="Abrir foto"
                    title="Abrir foto"
                  >
                    <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,#fbbf24,#f97316,#a855f7,#22d3ee,#fbbf24)]" />
                    <div className="absolute inset-[6px] overflow-hidden rounded-full bg-black ring-1 ring-white/10">
                      <Image
                        src={i.foto_url}
                        alt={i.nome}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  </a>
                  <p className="truncate text-lg font-semibold text-white">
                    {i.nome}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(i.status)}`}
                >
                  {statusLabel(i.status)}
                </span>
              </div>
              <p className="text-sm text-white/70">
                {i.idade} anos • {i.telefone}
              </p>
              <p className="text-sm text-white/70">{i.email}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/80">
                {i.descricao}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {i.video_url ? (
                <a
                  href={i.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 bg-black/40 px-4 py-2 font-semibold text-white/85 hover:bg-white/10"
                >
                  Abrir vídeo
                </a>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <form
                action={updateStatus}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="id" value={i.id} />
                {i.status === "approved" ? (
                  <button
                    type="submit"
                    name="status"
                    value="pending"
                    className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
                  >
                    Desselecionar
                  </button>
                ) : (
                  <button
                    type="submit"
                    name="status"
                    value="approved"
                    className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-emerald-400/90 px-5 text-sm font-semibold text-black hover:bg-emerald-400"
                  >
                    Selecionar
                  </button>
                )}
                <button
                  type="submit"
                  name="status"
                  value="rejected"
                  className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-red-400/90 px-5 text-sm font-semibold text-black hover:bg-red-400"
                >
                  Reprovar
                </button>
              </form>

              <div className="flex shrink-0 items-center gap-2">
                <input
                  id={`delete-${i.id}`}
                  type="checkbox"
                  className="peer hidden"
                />
                <label
                  htmlFor={`delete-${i.id}`}
                  className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    aria-hidden="true"
                    className="mr-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                  Deletar inscrição
                </label>

                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 opacity-0 backdrop-blur-sm transition peer-checked:pointer-events-auto peer-checked:opacity-100">
                  <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/80 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-white">
                          Deletar inscrição?
                        </p>
                        <p className="mt-2 text-sm text-white/70">
                          Essa ação é permanente e não pode ser desfeita.
                        </p>
                      </div>
                      <label
                        htmlFor={`delete-${i.id}`}
                        className="cursor-pointer rounded-full border border-white/15 bg-black/40 px-3 py-1 text-sm font-semibold text-white/80 hover:bg-white/10"
                      >
                        Fechar
                      </label>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
                      <p className="font-semibold text-white">{i.nome}</p>
                      <p className="mt-1 text-white/70">{i.email}</p>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                      <label
                        htmlFor={`delete-${i.id}`}
                        className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
                      >
                        Cancelar
                      </label>
                      <form action={deleteInscricao}>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="confirm" value="DELETE" />
                        <button
                          type="submit"
                          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-red-400/90 px-5 text-sm font-semibold text-black hover:bg-red-400"
                        >
                          Sim, deletar inscrição
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-white/55">
              Criado: {new Date(i.created_at).toLocaleString("pt-BR")} •
              Atualizado: {new Date(i.updated_at).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
