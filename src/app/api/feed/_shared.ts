import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

export const FEED_SESSION_COOKIE = "bbm_feed_session";

export type FeedUser = {
  userId: string;
  inscricaoId: string;
  email: string;
  nome: string;
  fotoUrl: string;
  status: string;
};

export async function ensureFeedTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS inscricoes (
      id uuid PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      nome text NOT NULL,
      idade int NOT NULL,
      telefone text NOT NULL,
      email text NOT NULL,
      descricao text,
      foto_url text NOT NULL,
      video_url text,
      status text NOT NULL DEFAULT 'pending'
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_inscricoes_status ON inscricoes(status);`;

  await sql`
    CREATE TABLE IF NOT EXISTS feed_users (
      id uuid PRIMARY KEY,
      inscricao_id uuid UNIQUE NOT NULL,
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      password_salt text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_feed_users_email ON feed_users(email);`;

  await sql`
    CREATE TABLE IF NOT EXISTS feed_sessions (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES feed_users(id) ON DELETE CASCADE,
      token_hash text UNIQUE NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_feed_sessions_user ON feed_sessions(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feed_sessions_expires ON feed_sessions(expires_at);`;

  await sql`
    CREATE TABLE IF NOT EXISTS feed_posts (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES feed_users(id) ON DELETE CASCADE,
      message text NOT NULL,
      attachment_url text,
      attachment_type text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts(created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feed_posts_user ON feed_posts(user_id);`;
}

export function generatePassword() {
  return randomBytes(12).toString("base64url");
}

export function generateSaltHex() {
  return randomBytes(16).toString("hex");
}

export function hashPassword(password: string, saltHex: string) {
  const buf = scryptSync(password, saltHex, 64);
  return buf.toString("hex");
}

export function verifyPassword(
  password: string,
  saltHex: string,
  expectedHashHex: string,
) {
  const actual = Buffer.from(hashPassword(password, saltHex), "hex");
  const expected = Buffer.from(expectedHashHex, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function getBaseUrl() {
  const siteUrl =
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL;
  if (siteUrl) {
    const normalized = siteUrl.startsWith("http")
      ? siteUrl
      : `https://${siteUrl}`;
    return normalized.replace(/\/+$/, "");
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export function isProbablyUrl(value: string) {
  return /^https?:\/\/.+/i.test(value);
}

export async function getFeedUserFromRequest(): Promise<FeedUser | null> {
  const jar = await cookies();
  const token = jar.get(FEED_SESSION_COOKIE)?.value ?? "";
  if (!token) return null;
  const tokenHash = hashToken(token);

  await ensureFeedTables();

  const res = await sql<{
    user_id: string;
    inscricao_id: string;
    email: string;
    nome: string;
    foto_url: string;
    status: string;
  }>`
    SELECT
      u.id as user_id,
      u.inscricao_id,
      u.email,
      i.nome,
      i.foto_url,
      i.status
    FROM feed_sessions s
    JOIN feed_users u ON u.id = s.user_id
    JOIN inscricoes i ON i.id = u.inscricao_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > now()
    LIMIT 1;
  `;

  const row = res.rows[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    inscricaoId: row.inscricao_id,
    email: row.email,
    nome: row.nome,
    fotoUrl: row.foto_url,
    status: row.status,
  };
}
