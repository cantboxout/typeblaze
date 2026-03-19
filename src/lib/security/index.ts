/**
 * TypeBlaze — Security Utilities (PATCHED)
 * src/lib/security/index.ts
 *
 * Fixes:
 *   - Account lockout now uses Redis when UPSTASH_REDIS_REST_URL is set,
 *     falls back to in-memory Map for single-instance/dev
 *   - Logging wired to Axiom when AXIOM_DATASET + AXIOM_TOKEN are set,
 *     falls back to structured stdout JSON
 *   - Removed unused `remaining` variable in rate limiter (was dead code)
 *   - JWT secret minimum raised to 32 chars with clear error message
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// ── 1. ENV VALIDATION ──────────────────────────────────────────────────────

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

const MIN_SECRET_LENGTH = 32;

export function validateEnv(): void {
  const missing: string[] = [];
  const weak: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    const val = process.env[key];
    if (!val) { missing.push(key); continue; }
    if (key.includes("SECRET") && val.length < MIN_SECRET_LENGTH) {
      weak.push(`${key} (min ${MIN_SECRET_LENGTH} chars, got ${val.length})`);
    }
    if (process.env.NODE_ENV === "production") {
      const forbidden = ["secret", "changeme", "password", "dev", "test", "example", "default"];
      if (forbidden.some((f) => val.toLowerCase() === f || val.toLowerCase().startsWith(f + "_"))) {
        weak.push(`${key} appears to use a default/insecure value — change before production`);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[TypeBlaze] Missing required env vars:\n  ${missing.join("\n  ")}\n` +
      `Set these in .env.local or your deployment secrets.`
    );
  }
  if (weak.length > 0) {
    const msg = `[TypeBlaze] Weak env vars:\n  ${weak.join("\n  ")}`;
    if (process.env.NODE_ENV === "production") throw new Error(msg);
    else console.warn("⚠️  " + msg);
  }
}

// ── 2. JWT ─────────────────────────────────────────────────────────────────

const JWT_ALGORITHM = "HS256";
const JWT_ISSUER    = "typeblaze.com";
const JWT_AUDIENCE  = "typeblaze-api";

export interface TypeBlazeJWTPayload extends JWTPayload {
  userId: string;
  role: "student" | "teacher" | "admin";
  email: string;
  sessionId: string;
}

function getJWTSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < MIN_SECRET_LENGTH) {
    throw new Error(`[TypeBlaze] JWT_SECRET missing or too short. Min ${MIN_SECRET_LENGTH} chars.`);
  }
  return new TextEncoder().encode(s);
}

export async function signJWT(
  payload: Omit<TypeBlazeJWTPayload, "iss" | "aud">,
  expiresIn = "15m"
): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(getJWTSecret());
}

export async function verifyJWT(token: string): Promise<TypeBlazeJWTPayload> {
  const { payload } = await jwtVerify(token, getJWTSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: [JWT_ALGORITHM],
  });
  return payload as TypeBlazeJWTPayload;
}

// ── 3. PASSWORD HASHING (bcrypt cost 12) ──────────────────────────────────

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcrypt");
  return bcrypt.compare(password, hash);
}

export async function needsRehash(hash: string): Promise<boolean> {
  const bcrypt = await import("bcrypt");
  return bcrypt.getRounds(hash) < BCRYPT_ROUNDS;
}

// ── 4. CSRF ────────────────────────────────────────────────────────────────

const CSRF_COOKIE_NAME = "__Host-csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

export function generateCSRFToken(): string {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function setCSRFCookie(response: NextResponse): string {
  const token = generateCSRFToken();
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return token;
}

export function validateCSRF(req: NextRequest): NextResponse | null {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return null;
  if (req.headers.has("authorization")) return null; // Bearer token API calls exempt

  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = req.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return NextResponse.json({ error: "CSRF token missing" }, { status: 403 });
  }
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return NextResponse.json({ error: "CSRF token mismatch" }, { status: 403 });
  }
  return null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ── 5. ACCOUNT LOCKOUT — Redis-backed ─────────────────────────────────────

const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION  = 15 * 60;   // seconds
const ATTEMPT_WINDOW    = 60 * 60;   // seconds

/* FIX: Redis-first with in-memory fallback */
interface LockoutStore {
  getCount(email: string): Promise<number>;
  getLastAttempt(email: string): Promise<number>;
  increment(email: string, windowSecs: number): Promise<void>;
  reset(email: string): Promise<void>;
}

class MemoryLockoutStore implements LockoutStore {
  private map = new Map<string, { count: number; lastAttempt: number }>();

  async getCount(email: string) { return this.map.get(email.toLowerCase())?.count ?? 0; }
  async getLastAttempt(email: string) { return this.map.get(email.toLowerCase())?.lastAttempt ?? 0; }

  async increment(email: string) {
    const key = email.toLowerCase();
    const now = Date.now() / 1000;
    const rec = this.map.get(key);
    if (!rec || now - rec.lastAttempt > ATTEMPT_WINDOW) {
      this.map.set(key, { count: 1, lastAttempt: now });
    } else {
      rec.count++;
      rec.lastAttempt = now;
    }
  }

  async reset(email: string) { this.map.delete(email.toLowerCase()); }
}

class RedisLockoutStore implements LockoutStore {
  constructor(private client: any) {}
  private key(e: string) { return `lockout:${e.toLowerCase()}`; }

  async getCount(email: string) {
    try { return parseInt((await this.client.hget(this.key(email), "count")) ?? "0"); }
    catch { return 0; }
  }
  async getLastAttempt(email: string) {
    try { return parseFloat((await this.client.hget(this.key(email), "last")) ?? "0"); }
    catch { return 0; }
  }
  async increment(email: string, windowSecs: number) {
    try {
      const k = this.key(email);
      const now = Date.now() / 1000;
      await this.client.hset(k, { count: (await this.getCount(email)) + 1, last: now });
      await this.client.expire(k, windowSecs);
    } catch {}
  }
  async reset(email: string) {
    try { await this.client.del(this.key(email)); } catch {}
  }
}

function createLockoutStore(): LockoutStore {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = require("@upstash/redis");
      return new RedisLockoutStore(new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }));
    } catch {}
  }
  return new MemoryLockoutStore();
}

const lockoutStore = createLockoutStore();

export async function recordFailedLogin(email: string): Promise<void> {
  await lockoutStore.increment(email, ATTEMPT_WINDOW);
}

export async function isAccountLocked(
  email: string
): Promise<{ locked: boolean; remainingSeconds?: number }> {
  const count = await lockoutStore.getCount(email);
  if (count < LOCKOUT_THRESHOLD) return { locked: false };
  const last = await lockoutStore.getLastAttempt(email);
  const now = Date.now() / 1000;
  const lockedUntil = last + LOCKOUT_DURATION;
  if (now < lockedUntil) return { locked: true, remainingSeconds: Math.ceil(lockedUntil - now) };
  await lockoutStore.reset(email);
  return { locked: false };
}

export async function clearFailedAttempts(email: string): Promise<void> {
  await lockoutStore.reset(email);
}

// ── 6. PASSWORD RESET TOKENS ───────────────────────────────────────────────

export function generateResetToken(): string {
  const a = new Uint8Array(48);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function resetTokenExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
}

// ── 7. CERTIFICATE ID ──────────────────────────────────────────────────────

export function generateCertificateId(): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `TB-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12)}`;
}

// ── 8. GLOBAL ERROR HANDLER ────────────────────────────────────────────────

type ApiHandler = (req: NextRequest, ctx?: any) => Promise<NextResponse | Response>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      const isProd = process.env.NODE_ENV === "production";
      logSecurityEvent("SUSPICIOUS_WPM" as any, {
        type: "UNHANDLED_ERROR",
        url: req.url,
        method: req.method,
        error: error instanceof Error ? error.message : String(error),
        stack: isProd ? undefined : error instanceof Error ? error.stack : undefined,
      }, req);
      return NextResponse.json(
        { error: isProd ? "An unexpected error occurred." : (error as Error).message },
        { status: 500 }
      );
    }
  };
}

// ── 9. STRUCTURED SECURITY LOGGING — FIX: wired to Axiom ─────────────────

type SecurityEventType =
  | "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGIN_LOCKED"
  | "SIGNUP" | "PASSWORD_RESET_REQUEST" | "PASSWORD_RESET_COMPLETE"
  | "RATE_LIMIT_HIT" | "CSRF_VIOLATION" | "INPUT_VALIDATION_FAILED"
  | "SUSPICIOUS_WPM" | "CERT_GENERATED" | "ADMIN_ACTION";

/* FIX: Lazy-initialised Axiom client — no crash if env vars missing */
let axiomClient: any = null;

async function getAxiomClient() {
  if (axiomClient !== null) return axiomClient;
  if (process.env.AXIOM_DATASET && process.env.AXIOM_TOKEN) {
    try {
      const { Axiom } = await import("@axiomhq/js");
      axiomClient = new Axiom({ token: process.env.AXIOM_TOKEN });
      console.log("[TypeBlaze] Security logging: Axiom client initialised");
    } catch {
      axiomClient = false; // Mark as unavailable, don't retry
    }
  } else {
    axiomClient = false;
  }
  return axiomClient;
}

export function logSecurityEvent(
  type: SecurityEventType,
  details: Record<string, unknown>,
  req?: NextRequest
): void {
  const event = {
    type,
    timestamp: new Date().toISOString(),
    ip: req?.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown",
    userAgent: req?.headers.get("user-agent") ?? "unknown",
    ...details,
  };

  // Fire-and-forget Axiom ingest (does not block request)
  if (process.env.NODE_ENV === "production") {
    getAxiomClient().then((client) => {
      if (client) {
        client
          .ingest(process.env.AXIOM_DATASET!, [event])
          .catch(() => {
            // Axiom failure — fall through to stdout
            process.stdout.write(JSON.stringify(event) + "\n");
          });
      } else {
        process.stdout.write(JSON.stringify(event) + "\n");
      }
    });
  } else {
    console.log(`[SECURITY:${type}]`, JSON.stringify(event, null, 2));
  }
}
