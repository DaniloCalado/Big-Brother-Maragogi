import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FeedClient } from "./FeedClient";

export const dynamic = "force-dynamic";

export default function FeedPage() {
  return (
    <div className="flex min-h-full flex-col text-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Feed
            </h1>
            <p className="text-sm text-white/70">
              Atualizações e registros do que está rolando na casa.
            </p>
          </div>
          <div className="mt-8">
            <FeedClient />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

