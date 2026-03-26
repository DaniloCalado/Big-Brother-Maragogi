"use client";

import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useState } from "react";

type MeResponse =
  | { ok: true; logged: false }
  | {
      ok: true;
      logged: true;
      user: { email: string; nome: string; fotoUrl: string };
    };

type Post = {
  id: string;
  message: string;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  nome: string;
  foto_url: string;
  isMine?: boolean;
};

type PostsResponse = { ok: true; posts: Post[] } | { ok: false; error: string };

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR");
}

export function FeedClient() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const canPost = me?.ok === true && me.logged === true;

  const fileHint = useMemo(() => {
    if (!file) return "Opcional (foto ou vídeo)";
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `${file.name} • ${mb} MB`;
  }, [file]);

  async function refreshMe() {
    const res = await fetch("/api/feed/me", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as MeResponse | null;
    if (data && data.ok) setMe(data);
    else setMe({ ok: true, logged: false });
  }

  async function refreshPosts() {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/feed/posts", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as PostsResponse | null;
      if (data && "ok" in data && data.ok === true) {
        setPosts(data.posts);
      }
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    refreshMe();
    refreshPosts();
  }, []);

  async function doLogin() {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch("/api/feed/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!data || data.ok !== true) {
        setLoginError(data && "error" in data ? data.error : "Falha ao logar.");
        return;
      }
      setLoginOpen(false);
      setLoginPassword("");
      await refreshMe();
      await refreshPosts();
      window.dispatchEvent(new Event("bbm-feed-auth-changed"));
    } finally {
      setLoginLoading(false);
    }
  }

  async function submitPost() {
    setPostError(null);
    if (!canPost) {
      setPostError("Você precisa estar logado para postar.");
      return;
    }
    const msg = message.trim();
    if (!msg) {
      setPostError("Escreva uma mensagem.");
      return;
    }
    setPosting(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentType: "image" | "video" | null = null;

      if (file) {
        const type = file.type || "";
        if (type.startsWith("image/")) attachmentType = "image";
        else if (type.startsWith("video/")) attachmentType = "video";
        else {
          setPostError("Anexe apenas foto ou vídeo.");
          return;
        }

        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        attachmentUrl = blob.url;
      }

      const res = await fetch("/api/feed/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: msg,
          attachmentUrl,
          attachmentType,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!data || data.ok !== true) {
        setPostError(data && "error" in data ? data.error : "Falha ao postar.");
        return;
      }

      setMessage("");
      setFile(null);
      await refreshPosts();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Falha ao postar.");
    } finally {
      setPosting(false);
    }
  }

  async function startEdit(p: Post) {
    setEditingId(p.id);
    setEditingMessage(p.message);
  }

  async function cancelEdit() {
    setEditingId(null);
    setEditingMessage("");
  }

  async function saveEdit(id: string) {
    const msg = editingMessage.trim();
    if (!msg) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/feed/posts/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;
      if (!data || data.ok !== true) return;
      await refreshPosts();
      await cancelEdit();
    } finally {
      setEditLoading(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Deseja deletar esta postagem?")) return;
    const res = await fetch(`/api/feed/posts/${id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => null)) as
      | { ok: true }
      | { ok: false; error: string }
      | null;
    if (!data || data.ok !== true) return;
    await refreshPosts();
  }

  return (
    <div className="grid gap-6">
      {canPost ? (
        <div className="rounded-3xl border border-white/10 bg-black/55 p-6 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-white/75">
              Logado como{" "}
              <span className="font-semibold text-white">
                {me.logged ? me.user.nome : ""}
              </span>
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">Mensagem</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                placeholder="Conte o que está rolando..."
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-white">Anexo</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/85 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
              />
              <span className="text-xs text-white/60">{fileHint}</span>
            </label>

            {postError ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                {postError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void submitPost()}
              disabled={posting}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 px-8 text-sm font-semibold text-black shadow-lg shadow-orange-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {posting ? "Postando..." : "Postar no feed"}
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/55 p-6 text-center backdrop-blur">
          <p className="text-sm text-white/80">
            Só Participantes Logados podem postar no feed.
          </p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="relative z-20 mt-5 inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90 active:scale-95"
          >
            Logar
          </button>
        </div>
      )}

      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-white/90">Timeline</p>
          <button
            type="button"
            onClick={() => void refreshPosts()}
            disabled={loadingPosts}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-4 text-sm font-semibold text-white/85 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Atualizar
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/55 p-6 text-sm text-white/70 backdrop-blur">
            Nenhuma postagem ainda.
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((p) => (
              <div
                key={p.id}
                className="rounded-3xl border border-white/10 bg-black/55 p-6 backdrop-blur"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
                      <Image
                        src={p.foto_url}
                        alt={p.nome}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {p.nome}
                      </p>
                      <p className="text-xs text-white/60">
                        {formatDateTime(p.created_at)}
                      </p>
                    </div>
                  </div>
                  {p.isMine ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void startEdit(p)}
                        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-4 text-xs font-semibold text-white/85 hover:bg-white/10"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void deletePost(p.id)}
                        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-red-400/90 px-4 text-xs font-semibold text-black hover:bg-red-400"
                      >
                        Deletar
                      </button>
                    </div>
                  ) : null}
                </div>

                {editingId === p.id ? (
                  <div className="mt-4 grid gap-3">
                    <textarea
                      value={editingMessage}
                      onChange={(e) => setEditingMessage(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(p.id)}
                        disabled={editLoading}
                        className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {editLoading ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void cancelEdit()}
                        className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 px-6 text-sm font-semibold text-white/85 hover:bg-white/10"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/85">
                    “{p.message}”
                  </p>
                )}

                {p.attachment_url && p.attachment_type === "image" ? (
                  <a
                    href={p.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block overflow-hidden rounded-2xl border border-white/10 bg-black/40"
                  >
                    <div className="relative h-64 w-full sm:h-80">
                      <Image
                        src={p.attachment_url}
                        alt="Anexo"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 640px"
                      />
                    </div>
                  </a>
                ) : null}

                {p.attachment_url && p.attachment_type === "video" ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    <video
                      src={p.attachment_url}
                      controls
                      className="h-64 w-full object-cover sm:h-80"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {loginOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4 backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">
                  Entrar no Feed
                </p>
                <p className="mt-2 text-sm text-white/70">
                  Use o e-mail e a senha enviados após a aprovação.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                className="cursor-pointer rounded-full border border-white/15 bg-black/40 px-3 py-1 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Fechar
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-white">E-mail</span>
                <input
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                  placeholder="seuemail@exemplo.com"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-white">Senha</span>
                <input
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  type="password"
                  className="h-11 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                  placeholder="Senha"
                />
              </label>

              {loginError ? (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {loginError}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void doLogin()}
                disabled={loginLoading}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginLoading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
