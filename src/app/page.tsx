"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useEffect, useRef, useState } from "react";

type ConfirmedParticipant = {
  id: string;
  nome: string;
  idade: number;
  descricao: string | null;
  foto_url: string;
};

const localSlides = [
  { src: "/casa-1.jpeg", alt: "Casa — foto 1" },
  { src: "/casa-2.jpeg", alt: "Casa — foto 2" },
  { src: "/casa-3.jpeg", alt: "Casa — foto 3" },
] as const;

const galleryImages = [
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Maragogi4.JPG",
    alt: "Maragogi, Alagoas",
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Praia%20de%20Antunes%20(51724006234).jpg",
    alt: "Praia de Antunes, Maragogi",
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Praia%20de%20Maragogi.jpg",
    alt: "Praia de Maragogi",
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Pontal%20do%20Maragogi%20-%20panoramio.jpg",
    alt: "Pontal do Maragogi",
  },
  {
    src: "https://a0.muscache.com/pictures/4881b2ec-055d-47a5-9f54-270192e67710.jpg",
    alt: "Churrasqueira na praia",
  },
  {
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Misquamicut%20Beach,%20RI%202009-08-03%205.JPG",
    alt: "Casa de praia (ilustração) — ângulo 2",
  },
] as const;

export default function Home() {
  const localCarouselRef = useRef<HTMLDivElement | null>(null);
  const localDragRef = useRef<{
    active: boolean;
    startX: number;
    startScrollLeft: number;
  }>({ active: false, startX: 0, startScrollLeft: 0 });
  const [isLocalHovered, setIsLocalHovered] = useState(false);
  const [nowDate, setNowDate] = useState(() => new Date());
  const eventStart = new Date(2026, 3, 2);
  const msLeft =
    new Date(
      eventStart.getFullYear(),
      eventStart.getMonth(),
      eventStart.getDate(),
    ).getTime() -
    new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
    ).getTime();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));

  const galleryCarouselRef = useRef<HTMLDivElement | null>(null);
  const galleryDragRef = useRef<{
    active: boolean;
    startX: number;
    startScrollLeft: number;
  }>({ active: false, startX: 0, startScrollLeft: 0 });

  const confirmedCarouselRef = useRef<HTMLDivElement | null>(null);
  const confirmedDragRef = useRef<{
    active: boolean;
    startX: number;
    startScrollLeft: number;
  }>({ active: false, startX: 0, startScrollLeft: 0 });
  const [isConfirmedHovered, setIsConfirmedHovered] = useState(false);
  const [confirmedParticipants, setConfirmedParticipants] = useState<
    ConfirmedParticipant[]
  >([]);

  useEffect(() => {
    const el = localCarouselRef.current;
    if (!el) return;
    if (isLocalHovered) return;

    const interval = window.setInterval(() => {
      const width = el.clientWidth;
      if (!width) return;
      const index = Math.round(el.scrollLeft / width);
      const next = (index + 1) % localSlides.length;
      el.scrollTo({ left: next * width, behavior: "smooth" });
    }, 4500);

    return () => window.clearInterval(interval);
  }, [isLocalHovered]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowDate(new Date());
    }, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/participantes", {
          signal: controller.signal,
        });
        const data: unknown = await res.json().catch(() => null);
        if (
          typeof data === "object" &&
          data !== null &&
          "ok" in data &&
          (data as { ok: unknown }).ok === true &&
          "participantes" in data &&
          Array.isArray((data as { participantes: unknown }).participantes)
        ) {
          setConfirmedParticipants(
            (data as { participantes: ConfirmedParticipant[] }).participantes,
          );
        } else {
          setConfirmedParticipants([]);
        }
      } catch {
        setConfirmedParticipants([]);
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const el = confirmedCarouselRef.current;
    if (!el) return;
    if (isConfirmedHovered) return;
    if (confirmedParticipants.length < 2) return;

    let raf = 0;
    let last = window.performance.now();

    const tick = (t: number) => {
      const dt = t - last;
      last = t;

      if (!confirmedDragRef.current.active) {
        el.scrollLeft += dt * 0.04;
        const maxLeft = el.scrollWidth - el.clientWidth;
        if (maxLeft > 0 && el.scrollLeft >= maxLeft - 1) {
          el.scrollLeft = 0;
        }
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [confirmedParticipants.length, isConfirmedHovered]);

  const snapConfirmedCarousel = () => {
    const el = confirmedCarouselRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-confirmed-card='true']");
    const gap = Number.parseFloat(window.getComputedStyle(el).gap || "0");
    const step = first ? first.offsetWidth + gap : el.clientWidth;
    if (!step) return;
    const index = Math.round(el.scrollLeft / step);
    el.scrollTo({ left: index * step, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-full flex-col text-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="https://commons.wikimedia.org/wiki/Special:FilePath/Praia%20de%20Maragogi.jpg"
              alt="Praia de Maragogi, Alagoas"
              fill
              priority
              loading="eager"
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(251,191,36,0.35),transparent_52%),radial-gradient(circle_at_72%_14%,rgba(249,115,22,0.32),transparent_56%),radial-gradient(circle_at_70%_65%,rgba(168,85,247,0.26),transparent_60%),radial-gradient(circle_at_20%_85%,rgba(34,211,238,0.26),transparent_60%)]" />
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-4 pb-8 pt-5 sm:px-6 sm:pb-24 sm:pt-16">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
              <div className="lg:col-span-7">
                <div className="mx-auto flex w-fit items-center justify-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-center text-xs font-semibold text-white/90 sm:mx-0 sm:justify-start sm:text-left">
                  <span className="size-2 rounded-full bg-yellow-400" />
                  <span>Semana Santa • 2 a 5 de abril • Maragogi - AL</span>
                </div>
                <h1 className="mt-5 text-center text-4xl font-black leading-tight tracking-tight sm:text-left sm:text-6xl">
                  Big Brother Maragogi
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
                  Experiência na praia com provas, convivência , muita bebida e
                  eliminações diárias.{" "}
                  <span className="text-white">Padão RT Eventos.</span>
                </p>

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/inscricao"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 px-8 text-sm font-semibold text-black shadow-lg shadow-orange-500/30 transition hover:scale-[1.02] hover:shadow-orange-500/50 sm:w-auto"
                  >
                    Fazer inscrição
                  </Link>
                  <Link
                    href="/#dinamica"
                    className="hidden h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 text-sm font-semibold text-white transition hover:bg-white/10 hover:scale-[1.01] sm:inline-flex sm:w-auto"
                  >
                    Entender a dinâmica
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5">
                <p className="mb-3 text-center text-sm text-white/85">
                  Faltam{" "}
                  <span className="text-lg font-black text-white sm:text-xl">
                    {daysLeft}
                  </span>{" "}
                  dias para o evento começar
                </p>
                <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/55 p-8 text-center backdrop-blur">
                  <div className="mx-auto flex flex-col items-center text-center">
                    <div className="relative size-28 sm:size-32">
                      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,#fbbf24,#f97316,#a855f7,#22d3ee,#fbbf24)]" />
                      <div className="absolute inset-[12px] rounded-full bg-[#1a1a1a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
                      <div className="absolute inset-[18px] rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
                      <div className="absolute inset-[18px] rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_22%,rgba(0,0,0,0.00)_58%),radial-gradient(circle_at_50%_72%,#0b0b0b_0%,#000000_70%)]" />
                      <div className="absolute inset-[30px] rounded-full border-[8px] border-white/15" />
                      <div className="absolute inset-[44px] rounded-full border border-white/10 opacity-60" />
                      <div className="relative grid h-full w-full place-items-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
                        <span className="text-3xl font-black tracking-tight text-white">
                          BBM
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
                        Big Brother Maragogi
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/participantes"
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                  >
                    Ver participantes
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:mt-14 sm:grid-cols-3">
              {[
                { label: "Datas", value: "2 a 5 de abril" },
                { label: "Cidade", value: "Maragogi • AL" },
                { label: "Base", value: "Casa de Praia do RT" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/10 bg-black/55 p-5 backdrop-blur"
                >
                  <p className="text-xs font-semibold tracking-wide text-white/70">
                    {card.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="sobre" className="bg-black/20 backdrop-blur-[2px]">
          <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-10 sm:px-6 sm:py-20">
            <div className="grid gap-6 md:grid-cols-2 md:items-center md:gap-10">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-7 backdrop-blur sm:bg-black/60 sm:p-8">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Sobre o evento
                </h2>
                <p className="mt-4 text-base leading-7 text-white/75">
                  O Big Brother Maragogi acontece na Semana Santa, de{" "}
                  <span className="text-white">2 de abril</span> a{" "}
                  <span className="text-white">5 de abril</span>, em uma casa de
                  praia em Maragogi, Alagoas. A proposta é reunir participantes
                  para uma vivência intensa de convivência, conteúdo, diversão e
                  desafios.
                </p>
                <div className="mt-6 flex flex-col gap-3 text-sm text-white/80">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 size-2 rounded-full bg-cyan-400" />
                    <p>Local: Maragogi - AL • Casa de praia</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 size-2 rounded-full bg-purple-400" />
                    <p>Formato: Convivência +Bebida + Farra + Som Alto</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 size-2 rounded-full bg-emerald-400" />
                    <p>Inscrição online com vídeo opcional</p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <Image
                  src="/maragogi-1.jpeg"
                  alt="Maragogi — foto 1"
                  width={1200}
                  height={800}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="dinamica" className="bg-black/20 backdrop-blur-[2px]">
          <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:py-20">
            <div className="max-w-none">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Como funciona a dinâmica
              </h2>
              <p className="mt-4 text-base leading-7 text-white/75">
                A dinâmica define como o jogo acontece nos 4 dias do evento:
                convivência na casa, provas e eliminações até sobrar apenas uma
                pessoa vencedora. Teremos atividades com bebidas envolvidas
                (somente para maiores de 18, com consumo responsável).
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    title: "Convivência",
                    desc: "Rotina compartilhada, interação e momentos em grupo dentro e fora da casa.",
                    icon: (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="currentColor"
                      >
                        <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-3.33 0-6 1.34-6 3v2h12v-2c0-1.66-2.67-3-6-3Zm-8 0c-2.76 0-5 1.12-5 2.5V18h5.5v-2c0-1.17.54-2.24 1.48-3.06A6.9 6.9 0 0 0 8 13Z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Desafios",
                    desc: "Provas diárias para movimentar o jogo e definir vantagens do dia.",
                    icon: (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="currentColor"
                      >
                        <path d="M14 3H5a2 2 0 0 0-2 2v16l4-4h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm5 4h-2v8a4 4 0 0 1-4 4H7v2h10l4 4V9a2 2 0 0 0-2-2Z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Prova do Líder",
                    desc: "O líder do dia será quem beber mais na dinâmica de bebidas (com regras de segurança e consumo irresponsável).",
                    icon: (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="currentColor"
                      >
                        <path d="M5 3h14l-1.2 7.2A5 5 0 0 1 12.9 14H11a5 5 0 0 1-4.9-3.8L5 3Zm5 13h4v2h3v3H7v-3h3v-2Z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Anjo",
                    desc: "O anjo será quem 'pegar' mais pessoas — ou seja, quem fizer mais conexões durante o dia, sempre com respeito e consentimento.",
                    icon: (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="currentColor"
                      >
                        <path d="M12 21s-7-4.35-9.33-8.54C.64 9.25 2.1 6 5.5 6c1.74 0 3.41 1 4.5 2.09C11.09 7 12.76 6 14.5 6 17.9 6 19.36 9.25 21.33 12.46 19 16.65 12 21 12 21Z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Paredão",
                    desc: "O paredão será definido em consenso geral: um indicado pelo líder, um pela casa e um que beber menos.",
                    icon: (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="currentColor"
                      >
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 2a8 8 0 0 1 6.93 4H16.5a4.5 4.5 0 0 0-9 0H5.07A8 8 0 0 1 12 4Zm0 6a2 2 0 1 1-2 2 2 2 0 0 1 2-2Zm0 10a8 8 0 0 1-6.93-4H7.5a4.5 4.5 0 0 0 9 0h2.43A8 8 0 0 1 12 20Z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Eliminações",
                    desc: "Todo dia algumas pessoas serão eliminadas. O último que ficar é o vencedor do Big Brother Maragogi.",
                    icon: (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="currentColor"
                      >
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-3 7a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9 9Zm6 0a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 15 9Zm-6.46 8.2a1 1 0 0 1 .26-1.39A6.52 6.52 0 0 1 12 15a6.52 6.52 0 0 1 3.2.81 1 1 0 1 1-1 1.72A4.54 4.54 0 0 0 12 17a4.54 4.54 0 0 0-2.2.53 1 1 0 0 1-1.26-.33Z" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/70 p-7 sm:bg-black/80"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-black/30 text-white/90 sm:bg-black/40">
                        {item.icon}
                      </span>
                      <p className="text-base font-semibold">{item.title}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="local" className="bg-black/20 backdrop-blur-[2px]">
          <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-8 sm:px-6 sm:py-20">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div className="relative">
                  <div
                    ref={localCarouselRef}
                    className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    onPointerDown={(e) => {
                      const el = localCarouselRef.current;
                      if (!el) return;
                      el.setPointerCapture(e.pointerId);
                      localDragRef.current = {
                        active: true,
                        startX: e.clientX,
                        startScrollLeft: el.scrollLeft,
                      };
                    }}
                    onPointerMove={(e) => {
                      const el = localCarouselRef.current;
                      if (!el) return;
                      if (!localDragRef.current.active) return;
                      const dx = e.clientX - localDragRef.current.startX;
                      el.scrollLeft = localDragRef.current.startScrollLeft - dx;
                    }}
                    onPointerUp={() => {
                      const el = localCarouselRef.current;
                      if (!el) return;
                      localDragRef.current.active = false;
                      const width = el.clientWidth;
                      if (!width) return;
                      const index = Math.round(el.scrollLeft / width);
                      el.scrollTo({ left: index * width, behavior: "smooth" });
                    }}
                    onPointerCancel={() => {
                      localDragRef.current.active = false;
                    }}
                    onMouseEnter={() => setIsLocalHovered(true)}
                    onMouseLeave={() => setIsLocalHovered(false)}
                    onTouchStart={() => setIsLocalHovered(true)}
                    onTouchEnd={() => setIsLocalHovered(false)}
                    onWheel={(e) => {
                      const el = localCarouselRef.current;
                      if (!el) return;
                      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
                      e.preventDefault();
                      el.scrollBy({ left: e.deltaY, behavior: "smooth" });
                    }}
                  >
                    {localSlides.map((img, index) => (
                      <div
                        key={img.src}
                        className="relative h-[340px] shrink-0 basis-full snap-center sm:h-[420px]"
                      >
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          priority={index === 0}
                          className="object-cover"
                          sizes="(min-width: 768px) 50vw, 100vw"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/0 to-black/35" />
                      </div>
                    ))}
                  </div>

                  <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />

                  <button
                    type="button"
                    aria-label="Foto anterior"
                    className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 md:flex"
                    onClick={() => {
                      const el = localCarouselRef.current;
                      if (!el) return;
                      const width = el.clientWidth;
                      if (!width) return;
                      const index = Math.round(el.scrollLeft / width);
                      const prev =
                        (index - 1 + localSlides.length) % localSlides.length;
                      el.scrollTo({ left: prev * width, behavior: "smooth" });
                    }}
                  >
                    <span aria-hidden="true">‹</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Próxima foto"
                    className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 md:flex"
                    onClick={() => {
                      const el = localCarouselRef.current;
                      if (!el) return;
                      const width = el.clientWidth;
                      if (!width) return;
                      const index = Math.round(el.scrollLeft / width);
                      const next = (index + 1) % localSlides.length;
                      el.scrollTo({ left: next * width, behavior: "smooth" });
                    }}
                  >
                    <span aria-hidden="true">›</span>
                  </button>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  A CASA
                </h2>
                <p className="mt-2 text-sm font-semibold tracking-wide text-white/70">
                  Maragogi - Alagoas
                </p>
                <p className="mt-4 text-base leading-7 text-white/75">
                  Maragogi é conhecida pelas águas claras e piscinas naturais —
                  o cenário perfeito para uma experiência intensa e ao mesmo
                  tempo leve, com clima de praia e Semana Santa.
                </p>
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-6">
                  <div className="sr-only">Card de informações</div>
                  <p className="text-sm font-semibold text-white">
                    Base do evento
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Casa de praia em Maragogi - AL
                  </p>
                  <p className="mt-4 text-sm font-semibold text-white">Datas</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    2 de abril a 5 de abril (Semana Santa)
                  </p>
                </div>
                <div className="mt-6 flex justify-center">
                  <Link
                    href="/inscricao"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 px-8 text-sm font-semibold text-black shadow-lg shadow-orange-500/30 transition hover:scale-[1.02] hover:shadow-orange-500/50"
                  >
                    Inscreva-se agora
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {confirmedParticipants.length > 0 ? (
          <section className="bg-black/20 backdrop-blur-[2px]">
            <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:py-16">
              <div className="flex flex-col gap-3">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Participantes Confirmados
                </h2>
                <p className="text-base text-white/75">
                  Quem já foi selecionado para o BBM.
                </p>
              </div>

              <div className="mt-8">
                <div
                  ref={confirmedCarouselRef}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  onMouseEnter={() => setIsConfirmedHovered(true)}
                  onMouseLeave={() => setIsConfirmedHovered(false)}
                  onPointerDown={(e) => {
                    const el = confirmedCarouselRef.current;
                    if (!el) return;
                    el.setPointerCapture(e.pointerId);
                    confirmedDragRef.current = {
                      active: true,
                      startX: e.clientX,
                      startScrollLeft: el.scrollLeft,
                    };
                  }}
                  onPointerMove={(e) => {
                    const el = confirmedCarouselRef.current;
                    if (!el) return;
                    if (!confirmedDragRef.current.active) return;
                    const dx = e.clientX - confirmedDragRef.current.startX;
                    el.scrollLeft =
                      confirmedDragRef.current.startScrollLeft - dx;
                  }}
                  onPointerUp={() => {
                    confirmedDragRef.current.active = false;
                    snapConfirmedCarousel();
                  }}
                  onPointerCancel={() => {
                    confirmedDragRef.current.active = false;
                  }}
                  onWheel={(e) => {
                    const el = confirmedCarouselRef.current;
                    if (!el) return;
                    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
                    e.preventDefault();
                    el.scrollBy({ left: e.deltaY, behavior: "smooth" });
                  }}
                >
                  {confirmedParticipants.map((p) => (
                    <div
                      key={p.id}
                      data-confirmed-card="true"
                      className="w-full shrink-0 snap-start rounded-3xl border border-white/10 bg-black/55 p-6 text-center backdrop-blur sm:w-[320px] sm:text-left"
                    >
                      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
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
                          <p className="w-full truncate text-base font-semibold text-white">
                            {p.nome}
                          </p>
                          <p className="text-sm text-white/70">
                            {p.idade} anos
                          </p>
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
              </div>
            </div>
          </section>
        ) : null}

        <section id="galeria" className="bg-black/20 backdrop-blur-[2px]">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:py-20">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Galeria
              </h2>
              <p className="text-base text-white/75">
                Praia, casa e uma vibe de reality pra entrar no clima do BBM.
              </p>
            </div>

            <div className="mt-10 md:hidden">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div
                  ref={galleryCarouselRef}
                  className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  onPointerDown={(e) => {
                    const el = galleryCarouselRef.current;
                    if (!el) return;
                    el.setPointerCapture(e.pointerId);
                    galleryDragRef.current = {
                      active: true,
                      startX: e.clientX,
                      startScrollLeft: el.scrollLeft,
                    };
                  }}
                  onPointerMove={(e) => {
                    const el = galleryCarouselRef.current;
                    if (!el) return;
                    if (!galleryDragRef.current.active) return;
                    const dx = e.clientX - galleryDragRef.current.startX;
                    el.scrollLeft = galleryDragRef.current.startScrollLeft - dx;
                  }}
                  onPointerUp={() => {
                    const el = galleryCarouselRef.current;
                    if (!el) return;
                    galleryDragRef.current.active = false;
                    const width = el.clientWidth;
                    if (!width) return;
                    const index = Math.round(el.scrollLeft / width);
                    el.scrollTo({ left: index * width, behavior: "smooth" });
                  }}
                  onPointerCancel={() => {
                    galleryDragRef.current.active = false;
                  }}
                  onWheel={(e) => {
                    const el = galleryCarouselRef.current;
                    if (!el) return;
                    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
                    e.preventDefault();
                    el.scrollBy({ left: e.deltaY, behavior: "smooth" });
                  }}
                >
                  {galleryImages.map((img, index) => (
                    <div
                      key={img.src}
                      className="group relative h-72 shrink-0 basis-full snap-center overflow-hidden sm:h-80"
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        priority={index === 0}
                        className="object-cover"
                        sizes="(max-width: 768px) calc(100vw - 2rem), 768px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                    </div>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
              </div>
            </div>

            <div className="mt-10 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((img) => (
                <div
                  key={img.src}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={1200}
                    height={900}
                    className="h-64 w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:h-72"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
