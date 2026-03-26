"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Profile = {
  nome: string;
  idade: number;
  telefone: string;
  email: string;
  fotoUrl: string;
};

type ProfileResponse =
  | { ok: true; profile: Profile }
  | { ok: false; error: string };

export function PerfilClient() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/feed/profile", { cache: "no-store" });
      const data = (await res
        .json()
        .catch(() => null)) as ProfileResponse | null;
      if (!data || data.ok !== true) {
        setError(
          data && "error" in data
            ? data.error
            : "Não foi possível carregar o perfil.",
        );
        setProfile(null);
        return;
      }
      setProfile(data.profile);
      setNome(data.profile.nome);
      setIdade(String(data.profile.idade));
      setTelefone(data.profile.telefone);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function saveProfile() {
    setSaveMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/feed/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nome, idade, telefone }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!data || data.ok !== true) {
        setSaveMsg(data && "error" in data ? data.error : "Falha ao salvar.");
        return;
      }
      setSaveMsg("Dados atualizados.");
      await loadProfile();
      window.dispatchEvent(new Event("bbm-feed-auth-changed"));
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/feed/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function changePassword() {
    setPwMsg(null);
    setPwLoading(true);
    try {
      const res = await fetch("/api/feed/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!data || data.ok !== true) {
        setPwMsg(
          data && "error" in data ? data.error : "Falha ao alterar senha.",
        );
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setPwMsg(null);
      setToast("Senha alterada com sucesso.");
      window.setTimeout(() => setToast(null), 2200);
      setPwOpen(false);
    } finally {
      setPwLoading(false);
    }
  }

  async function deleteAccount() {
    setDeleteMsg(null);
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/feed/account", { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!data || data.ok !== true) {
        setDeleteMsg(
          data && "error" in data ? data.error : "Falha ao apagar conta.",
        );
        return;
      }
      await fetch("/api/feed/logout", { method: "POST" });
      window.location.href = "/";
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/55 p-6 text-sm text-white/70 backdrop-blur">
        Carregando...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-200">
        <p className="font-semibold">Não foi possível carregar o perfil.</p>
        <p className="mt-2">{error ?? "Erro desconhecido."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/feed"
            className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
          >
            Ir para o feed
          </Link>
          <button
            type="button"
            onClick={() => void loadProfile()}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-white/10 bg-black/55 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative size-16 overflow-hidden rounded-full border border-white/10 bg-black/40">
              <Image
                src={profile.fotoUrl}
                alt={profile.nome}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-white">
                {profile.nome}
              </p>
              <p className="truncate text-sm text-white/65">{profile.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-4 text-xs font-semibold text-white/85 hover:bg-white/10"
          >
            Sair do feed
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-white">Nome</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-white">Idade</span>
            <input
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              inputMode="numeric"
              className="h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
            />
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-semibold text-white">Telefone</span>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
            />
          </label>
        </div>

        {saveMsg ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
            {saveMsg}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void saveProfile()}
            disabled={saving}
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/55 p-6 backdrop-blur">
        <p className="text-sm font-semibold text-white/90">Conta</p>
        <p className="mt-2 text-sm text-white/70">
          Altere sua senha e gerencie o acesso ao feed.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPwOpen((v) => !v)}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
          >
            Alterar senha
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-red-400/90 px-5 text-sm font-semibold text-black hover:bg-red-400"
          >
            Apagar conta
          </button>
        </div>

        {pwOpen ? (
          <div className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-black/40 p-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">
                Senha atual
              </span>
              <input
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                type="password"
                className="h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">
                Nova senha
              </span>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                className="h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                placeholder="Mínimo 8 caracteres"
              />
            </label>
            {pwMsg ? (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
                {pwMsg}
              </div>
            ) : null}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void changePassword()}
                disabled={pwLoading}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pwLoading ? "Alterando..." : "Confirmar alteração"}
              </button>
              <button
                type="button"
                onClick={() => setPwOpen(false)}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-7 text-sm font-semibold text-white/85 transition hover:bg-white/10 active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/80 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">
                  Apagar conta do feed?
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Suas postagens serão removidas e você perderá o acesso ao
                  feed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="cursor-pointer rounded-full border border-white/15 bg-black/40 px-3 py-1 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Fechar
              </button>
            </div>

            {deleteMsg ? (
              <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                {deleteMsg}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white/85 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={deleteLoading}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-red-400/90 px-5 text-sm font-semibold text-black hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading ? "Apagando..." : "Sim, apagar conta"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-black/85 p-6 text-center">
            <p className="text-sm font-semibold text-white">{toast}</p>
            <p className="mt-2 text-xs text-white/65">
              Esta mensagem fecha automaticamente.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
