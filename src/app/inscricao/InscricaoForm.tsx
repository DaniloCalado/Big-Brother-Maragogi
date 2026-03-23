"use client";

import { upload } from "@vercel/blob/client";
import { useEffect, useMemo, useState } from "react";

type ApiOk = { ok: true; message: string };
type ApiErr = { ok: false; error: string };

function isApiOk(data: unknown): data is ApiOk {
  return (
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    (data as { ok: unknown }).ok === true
  );
}

function isApiErr(data: unknown): data is ApiErr {
  return (
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    (data as { ok: unknown }).ok === false
  );
}

type Progress = {
  nome: boolean;
  idade: boolean;
  telefone: boolean;
  email: boolean;
  descricao: boolean;
  foto: boolean;
  video: boolean;
};

export function InscricaoForm({
  onProgressChange,
}: {
  onProgressChange?: (p: Progress) => void;
}) {
  const [clientErrors, setClientErrors] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ApiOk | ApiErr | null>(null);

  useEffect(() => {
    const progress: Progress = {
      nome: nome.trim().length > 0,
      idade: idade.trim().length > 0,
      telefone: telefone.trim().length > 0,
      email: email.trim().length > 0,
      descricao: descricao.trim().length > 0,
      foto: !!foto || !!fotoUrl,
      video: !!video || !!videoUrl,
    };
    onProgressChange?.(progress);
  }, [
    nome,
    idade,
    telefone,
    email,
    descricao,
    foto,
    fotoUrl,
    video,
    videoUrl,
    onProgressChange,
  ]);

  const fotoHint = useMemo(() => {
    if (!foto) return "Obrigatória (JPG, PNG, etc.)";
    const mb = (foto.size / (1024 * 1024)).toFixed(1);
    return `${foto.name} • ${mb} MB`;
  }, [foto]);

  const videoHint = useMemo(() => {
    if (!video) return "Opcional (MP4, MOV, etc.)";
    const mb = (video.size / (1024 * 1024)).toFixed(1);
    return `${video.name} • ${mb} MB`;
  }, [video]);

  function formatTelefone(value: string) {
    const rawDigits = value.replace(/\D/g, "");
    if (!rawDigits) return "";

    const withoutCountry = rawDigits.startsWith("55")
      ? rawDigits.slice(2)
      : rawDigits;
    const digits = withoutCountry.slice(0, 11);

    if (digits.length < 3) return `55 (${digits}`;

    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);

    if (!rest) return `55 (${ddd}) `;
    if (rest.length <= 4) return `55 (${ddd}) ${rest}`;
    if (rest.length <= 8) {
      const a = rest.slice(0, 4);
      const b = rest.slice(4);
      return `55 (${ddd}) ${a}-${b}`;
    }
    const a = rest.slice(0, 5);
    const b = rest.slice(5, 9);
    return `55 (${ddd}) ${a}-${b}`;
  }

  function validate() {
    const errors: string[] = [];

    if (!nome.trim()) errors.push("Nome");

    const idadeDigits = idade.replace(/\D/g, "");
    const idadeNum = Number.parseInt(idadeDigits, 10);
    if (
      !idadeDigits ||
      Number.isNaN(idadeNum) ||
      idadeNum < 1 ||
      idadeNum > 120
    ) {
      errors.push("Idade");
    }

    const telDigitsRaw = telefone.replace(/\D/g, "");
    const telDigits = telDigitsRaw.startsWith("55")
      ? telDigitsRaw.slice(2)
      : telDigitsRaw;
    if (telDigits.length !== 11 && telDigits.length !== 10)
      errors.push("Telefone");

    const emailTrim = email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
    if (!emailTrim || !emailOk) errors.push("E-mail");

    if (descricao.trim().length < 10) errors.push("Descrição");

    if (!foto && !fotoUrl) errors.push("Foto");

    return errors;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    setClientErrors([]);

    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setClientErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedFotoUrl: string | null = fotoUrl;
      if (foto && !uploadedFotoUrl) {
        try {
          const blob = await upload(foto.name, foto, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          uploadedFotoUrl = blob.url;
          setFotoUrl(blob.url);
        } catch (err) {
          const details = err instanceof Error ? err.message : String(err);
          setResult({
            ok: false,
            error:
              "Não foi possível enviar a foto agora. Verifique se o upload está configurado (BLOB_READ_WRITE_TOKEN) e tente novamente. " +
              details,
          });
          return;
        }
      }

      let uploadedVideoUrl: string | null = videoUrl;
      if (video && !uploadedVideoUrl) {
        try {
          const blob = await upload(video.name, video, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          uploadedVideoUrl = blob.url;
          setVideoUrl(blob.url);
        } catch (err) {
          const details = err instanceof Error ? err.message : String(err);
          setResult({
            ok: false,
            error:
              "Não foi possível enviar o vídeo agora. Verifique se o upload está configurado (BLOB_READ_WRITE_TOKEN) e tente novamente ou envie a inscrição sem vídeo. " +
              details,
          });
          return;
        }
      }

      const formData = new FormData();
      formData.set("nome", nome);
      formData.set("idade", idade);
      formData.set("telefone", telefone);
      formData.set("email", email);
      formData.set("descricao", descricao);
      if (uploadedFotoUrl) formData.set("fotoUrl", uploadedFotoUrl);
      if (uploadedVideoUrl) formData.set("videoUrl", uploadedVideoUrl);

      const res = await fetch("/api/inscricao", {
        method: "POST",
        body: formData,
      });

      const data: unknown = await res.json().catch(() => null);

      if (isApiOk(data)) {
        setResult(data);
        setNome("");
        setIdade("");
        setTelefone("");
        setEmail("");
        setDescricao("");
        setFoto(null);
        setFotoUrl(null);
        setVideo(null);
        setVideoUrl(null);
        return;
      }

      if (isApiErr(data)) {
        setResult(data);
        return;
      }

      setResult({
        ok: false,
        error: "Não foi possível enviar agora. Tente novamente.",
      });
    } catch {
      setResult({ ok: false, error: "Erro de conexão. Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white">Nome</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            maxLength={80}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none ring-0 transition focus:border-white/25"
            placeholder="Seu nome completo"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white">Idade</span>
          <input
            value={idade}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 3);
              setIdade(next);
            }}
            required
            inputMode="numeric"
            maxLength={3}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none ring-0 transition focus:border-white/25"
            placeholder="Ex: 23"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white">Telefone</span>
          <input
            value={telefone}
            onChange={(e) => setTelefone(formatTelefone(e.target.value))}
            required
            inputMode="tel"
            autoComplete="tel"
            maxLength={18}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none ring-0 transition focus:border-white/25"
            placeholder="55 (XX) XXXXX-XXXX"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-white">E-mail</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            maxLength={120}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none ring-0 transition focus:border-white/25"
            placeholder="voce@exemplo.com"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-white">
          Por que você deveria participar do BBM?
        </span>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          minLength={10}
          maxLength={1500}
          rows={6}
          className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-white/25"
          placeholder="Conte um pouco sobre você e por que quer participar."
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-white">
          Foto (obrigatória)
        </span>
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-4">
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => {
              setFoto(e.target.files?.[0] ?? null);
              setFotoUrl(null);
            }}
            className="w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-white/90"
          />
          <p className="text-xs text-white/60">{fotoHint}</p>
          {fotoUrl ? (
            <p className="text-xs text-white/70">
              Foto enviada:{" "}
              <a
                href={fotoUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
              >
                abrir link
              </a>
            </p>
          ) : null}
        </div>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-white">
          Vídeo de inscrição (opcional)
        </span>
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-4">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              setVideo(e.target.files?.[0] ?? null);
              setVideoUrl(null);
            }}
            className="w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-white/90"
          />
          <p className="text-xs text-white/60">{videoHint}</p>
          {videoUrl ? (
            <p className="text-xs text-white/70">
              Vídeo enviado:{" "}
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/30 underline-offset-4 hover:decoration-white/70"
              >
                abrir link
              </a>
            </p>
          ) : null}
        </div>
      </label>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Enviando..." : "Enviar inscrição"}
        </button>

        {clientErrors.length > 0 ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <p className="font-semibold">
              Preencha os campos obrigatórios antes de enviar:
            </p>
            <ul className="mt-2 list-disc pl-5">
              {clientErrors.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {result?.ok === true ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {result.message}
          </div>
        ) : null}

        {result?.ok === false ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {result.error}
          </div>
        ) : null}
      </div>
    </form>
  );
}
