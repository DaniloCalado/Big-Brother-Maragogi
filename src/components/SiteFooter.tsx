import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-white/70 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Big Brother Enseada • Semana Santa (2 a 5 de abril) • Enseada dos Corais - PE
          </p>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="inline-flex items-center gap-3">
              <Image
                src="/rt.png"
                alt="Foto do organizador"
                width={40}
                height={40}
                className="size-10 rounded-full object-cover ring-1 ring-white/15"
              />
              <span>
                Criador do evento:{" "}
                <span className="text-white">Padão RT Eventos</span>
              </span>
            </span>
            <div className="text-white/60">
              <a
                href="https://www.instagram.com/renantenorio_/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-white/80 underline decoration-white/25 underline-offset-4 hover:decoration-white/70"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="currentColor"
                >
                  <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm10.25 1.75a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                </svg>
                @renantenorio_
              </a>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-white/50">
          Este site é uma página de evento independente e não possui vínculo
          oficial com programas de TV.
        </p>
        <p className="mt-4 text-center text-xs text-white/60">
          Todos os direitos reservados para RT Produções e Eventos
        </p>
      </div>
    </footer>
  );
}
