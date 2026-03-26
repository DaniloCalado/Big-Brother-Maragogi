"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const navItems = [
  { href: "/feed", label: "Feed" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#dinamica", label: "Dinâmica" },
  { href: "/#local", label: "Local" },
  { href: "/#galeria", label: "Galeria" },
];

type MeResponse =
  | { ok: true; logged: false }
  | {
      ok: true;
      logged: true;
      user: { email: string; nome: string; fotoUrl: string };
    };

export function SiteHeader() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = useMemo(() => {
    if (!me || me.ok !== true || me.logged !== true) return "";
    const parts = me.user.nome.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (first + last).toUpperCase();
  }, [me]);

  async function refreshMe() {
    const res = await fetch("/api/feed/me", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as MeResponse | null;
    if (data && data.ok) setMe(data);
    else setMe({ ok: true, logged: false });
  }

  async function logout() {
    await fetch("/api/feed/logout", { method: "POST" });
    setMenuOpen(false);
    await refreshMe();
    window.location.href = "/";
  }

  useEffect(() => {
    let active = true;
    fetch("/api/feed/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: unknown) => {
        if (!active) return;
        const me = data as MeResponse | null;
        if (me && me.ok) setMe(me);
        else setMe({ ok: true, logged: false });
      })
      .catch(() => {
        if (!active) return;
        setMe({ ok: true, logged: false });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      void refreshMe();
    };
    window.addEventListener("bbm-feed-auth-changed", handler);
    return () => {
      window.removeEventListener("bbm-feed-auth-changed", handler);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-sm font-semibold tracking-wide text-white"
        >
          <span className="relative block h-12 w-14 overflow-hidden sm:w-16">
            <Image
              src="/logo-bbm.png"
              alt="Logo BBM"
              fill
              className="object-contain scale-[1.35]"
              sizes="(max-width: 640px) 56px, 64px"
              priority
            />
          </span>
          <span className="hidden sm:block">Big Brother Maragogi</span>
        </Link>

        <Link
          href="/feed"
          className="md:hidden inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
        >
          Feed
        </Link>

        <div className="flex items-center gap-3">
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

          {me?.ok === true && me.logged === true ? null : (
            <Link
              href="/inscricao"
              className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Inscrição
            </Link>
          )}

          {me?.ok === true && me.logged === true ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="relative grid size-10 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/15 bg-black/40 hover:bg-white/10"
                aria-label="Abrir menu do usuário"
              >
                {me.user.fotoUrl ? (
                  <Image
                    src={me.user.fotoUrl}
                    alt={me.user.nome}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <span className="text-sm font-black text-white">
                    {initials || "U"}
                  </span>
                )}
              </button>

              {menuOpen ? (
                <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-lg shadow-black/60">
                  <div className="px-4 py-3">
                    <p className="truncate text-sm font-semibold text-white">
                      {me.user.nome}
                    </p>
                    <p className="truncate text-xs text-white/60">
                      {me.user.email}
                    </p>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="grid p-2">
                    <Link
                      href="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                    >
                      Perfil
                    </Link>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/85 hover:bg-white/10"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
