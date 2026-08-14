import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Node's built-in scrypt rather than bcrypt/argon2 — one less npm
 * dependency for something security-sensitive, and scrypt is a
 * perfectly solid choice (memory-hard, still recommended). Only used
 * server-side (login/bootstrap API routes, which run in the Node
 * runtime by default) — never imported into anything that could end up
 * in a client bundle or the Edge runtime, unlike lib/adminSession.ts.
 */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  // timingSafeEqual requires equal-length buffers, or it throws — a
  // mismatched length just means "wrong password" too, not an error.
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
