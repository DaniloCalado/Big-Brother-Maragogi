import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PerfilClient } from "./PerfilClient";

export const dynamic = "force-dynamic";

export default function PerfilPage() {
  return (
    <div className="flex min-h-full flex-col text-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Perfil
            </h1>
            <p className="text-sm text-white/70">
              Atualize seus dados e gerencie sua conta do feed.
            </p>
          </div>
          <div className="mt-8">
            <PerfilClient />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

