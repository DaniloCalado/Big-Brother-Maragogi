import { sql } from "@vercel/postgres";
import Image from "next/image";
import Link from "next/link";

type Participante = {
  id: string;
  nome: string;
  idade: number;
  descricao: string | null;
  foto_url: string;
  created_at: string;
  updated_at: string;
};

export default async function ParticipantesPage() {
  let participantes: Participante[] = [];
  let dbError: string | null = null;

  try {
    const result = await sql<Participante>`
      SELECT id, nome, idade, descricao, foto_url, created_at, updated_at
      FROM inscricoes
      WHERE status = 'approved'
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 200;
    `;
    participantes = result.rows;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Erro desconhecido";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Participantes confirmados
        </h1>
        <Link
          href="/"
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
        >
          Voltar para home
        </Link>
      </div>

      {dbError ? (
        <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-red-200">
          <p className="text-sm font-semibold">
            Banco de dados não disponível.
          </p>
          <p className="mt-2 text-sm text-red-200/90">{dbError}</p>
        </div>
      ) : null}

      {!dbError && participantes.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-3xl border border-white/10 bg-black/45 px-6 py-16 text-center backdrop-blur">
          <div className="max-w-2xl">
            <p className="text-lg font-semibold text-white">
              Nenhum participante foi confirmado ainda na seleção!
            </p>
            <p className="mt-2 text-sm text-white/70">
              Aguarde mais um pouco que em breve a lista final sairá.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {participantes.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/55 p-6 backdrop-blur"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                <div className="absolute -left-10 -top-10 size-40 rounded-full bg-orange-400/10 blur-2xl" />
                <div className="absolute -bottom-10 -right-10 size-40 rounded-full bg-purple-400/10 blur-2xl" />
              </div>

              <div className="flex items-center gap-4">
                <a
                  href={p.foto_url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative grid size-[72px] shrink-0 cursor-pointer place-items-center"
                  aria-label="Abrir foto"
                  title="Abrir foto"
                >
                  <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,#fbbf24,#f97316,#a855f7,#22d3ee,#fbbf24)]" />
                  <div className="absolute inset-[7px] overflow-hidden rounded-full bg-black ring-1 ring-white/10">
                    <Image
                      src={p.foto_url}
                      alt={p.nome}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  </div>
                </a>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">
                    {p.nome}
                  </p>
                  <p className="text-sm text-white/70">{p.idade} anos</p>
                </div>
              </div>
              {p.descricao ? (
                <p className="mt-4 whitespace-pre-wrap text-sm italic leading-6 text-white/80">
                  “{p.descricao}”
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
