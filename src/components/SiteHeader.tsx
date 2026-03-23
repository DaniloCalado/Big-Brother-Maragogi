import Link from "next/link";

const navItems = [
  { href: "/#sobre", label: "Sobre" },
  { href: "/#dinamica", label: "Dinâmica" },
  { href: "/#local", label: "Local" },
  { href: "/#galeria", label: "Galeria" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-sm font-semibold tracking-wide text-white"
        >
          <span className="relative grid size-9 place-items-center overflow-hidden rounded-full">
            <span className="absolute inset-0 bg-[conic-gradient(from_180deg,#fbbf24,#f97316,#a855f7,#22d3ee,#fbbf24)]" />
            <span className="relative grid size-[34px] place-items-center rounded-full bg-black text-xs font-black">
              BBM
            </span>
          </span>
          <span className="hidden sm:block">Big Brother Maragogi</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-4 text-sm text-white/80 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/inscricao"
            className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Inscrição
          </Link>
        </div>
      </div>
    </header>
  );
}
