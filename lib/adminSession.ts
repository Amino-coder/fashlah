/**
 * Signs/verifies the admin session cookie. Deliberately built on Web
 * Crypto (`crypto.subtle`) rather than Node's `crypto` module — Web
 * Crypto is available in BOTH the Edge runtime (middleware.ts, which
 * needs to check this on every /admin request) and in Node (the admin
 * API routes), so the exact same code works in both places instead of
 * needing two implementations. It also means zero new npm dependencies
 * for something this security-sensitive — fewer moving parts, less that
 * can break in a deploy.
 *
 * Token shape: `${base64url(payloadJSON)}.${base64url(hmacSignature)}`.
 * crypto.subtle.verify does the actual signature comparison, which is
 * constant-time by construction — not something hand-rolled here.
 */

export type AdminSessionPayload = {
  id: string;
  role: "owner" | "editor" | "viewer";
  exp: number; // epoch ms
};

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    // Fails loudly rather than silently signing with an empty/predictable
    // key — an admin panel is exactly the wrong place for a quiet fallback.
    throw new Error(
      "ADMIN_SESSION_SECRET is not set. Add a long random string to your environment variables before using the admin panel."
    );
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signAdminSession(id: string, role: AdminSessionPayload["role"]): Promise<string> {
  const payload: AdminSessionPayload = { id, role, exp: Date.now() + SESSION_DURATION_MS };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await importHmacKey(getSecret());
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const signatureB64 = toBase64Url(new Uint8Array(signature));
  return `${payloadB64}.${signatureB64}`;
}

export async function verifyAdminSession(token: string | undefined | null): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signatureB64] = parts;

  try {
    const key = await importHmacKey(getSecret());
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signatureB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return null;

    const payload: AdminSessionPayload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null; // malformed token, wrong secret, tampered payload — all just "not signed in"
  }
}

export const ADMIN_COOKIE_NAME = "bagdoonis_admin_session";
