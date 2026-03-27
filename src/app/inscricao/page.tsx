"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { InscricaoForm } from "./InscricaoForm";
import { useState } from "react";

export default function InscricaoPage() {
  const [progress, setProgress] = useState({
    nome: false,
    idade: false,
    telefone: false,
    email: false,
    descricao: false,
    foto: false,
    video: false,
  });

  return (
    <div className="flex min-h-full flex-col bg-black/20 text-white backdrop-blur-[2px]">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-wide text-white/70">
              Semana Santa • 2 a 5 de abril • Enseada dos Corais - PE
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Formulário de inscrição
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/75">
              Preencha seus dados. Se quiser, envie um vídeo curto de inscrição
              (opcional). Após enviar, sua inscrição será encaminhada para o
              e-mail do organizador.
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/90 transition hover:bg-white/10"
              >
                Voltar ao site
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black/55 p-6 sm:p-8">
                <InscricaoForm onProgressChange={setProgress} />
              </div>
            </div>
            <aside className="lg:col-span-5">
              <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black/55 p-6 sm:p-8">
                <h2 className="text-base font-semibold">O que vai no e-mail</h2>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {[
                    { label: "Nome", ok: progress.nome },
                    { label: "Idade", ok: progress.idade },
                    { label: "Telefone", ok: progress.telefone },
                    { label: "E-mail", ok: progress.email },
                    { label: "Descrição", ok: progress.descricao },
                    { label: "Foto", ok: progress.foto },
                    { label: "Vídeo (opcional)", ok: progress.video },
                  ].map((item) => (
                    <li key={item.label} className="flex items-center gap-2">
                      <svg
                        viewBox="0 0 20 20"
                        className={`size-4 ${item.ok ? "text-emerald-400" : "text-white/30"}`}
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4l2.3 2.3 6.3-6.3a1 1 0 0 1 1.4 0Z" />
                      </svg>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-sm font-semibold text-white">
                    Datas do evento
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    2 de abril a 5 de abril (Semana Santa)
                  </p>
                  <p className="mt-4 text-sm font-semibold text-white">
                    Criador do evento
                  </p>
                  <p className="mt-2 text-sm text-white/70">Renan Tenorio</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
