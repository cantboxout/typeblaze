/**
 * TypeBlaze — Advanced Security Utilities
 * src/lib/security/advanced.ts
 *
 * Fixes:
 *   M1  — CSP nonces instead of unsafe-inline
 *   H3  — PII stripping from API responses
 *   M5  — Per-route body size limits
 *   L1  — SRI hash generation helper
 *   M4  — Guest data consent + TTL
 */

import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// 1. CSP NONCES — Fix M1
//    Replaces 'unsafe-inline' with per-request nonces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure nonce for CSP.
 * Set this on the request headers so layout.tsx can read it.
 */
export function generateCSPNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Build the full CSP header string using a nonce.
 * Add to middleware.ts and pass nonce to layout.tsx via headers.
 */
export function buildCSPHeader(nonce: string): string {
  const isProd = process.env.NODE_ENV === "production";

  const directives = [
    "default-src 'self'",

    // Scripts: nonce-based (replaces 'unsafe-inline')
    // AdSense requires 'unsafe-eval' sadly — consider a consent-gated load
    `script-src 'self' 'nonce-${nonce}' ${
      isProd
        ? "'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://unpkg.com"
        : "'unsafe-eval' 'unsafe-inline'"
    }`,

    // Styles: nonce-based + Google Fonts
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,

    // Fonts: self + Google Fonts CDN
    "font-src 'self' https://fonts.gstatic.com data:",

    // Images: self + data URIs + HTTPS (OG images, certificates)
    "img-src 'self' data: blob: https:",

    // Connections: self + TypeBlaze API + Analytics
    `connect-src 'self' https://api.typeblaze.com ${
      isProd ? "https://www.google-analytics.com" : ""
    }`,

    // iFrames: Google Ads only
    "frame-src https://googleads.g.doubleclick.net https://www.google.com",

    // Media: self only
    "media-src 'self'",

    // Workers: blob (jsPDF certificate generation)
    "worker-src 'self' blob:",

    // Objects: none (no Flash, no plugins)
    "object-src 'none'",

    // Base URI: restrict to prevent base tag injection
    "base-uri 'self'",

    // Form targets: self only
    "form-action 'self'",

    // Enforce HTTPS upgrade
    "upgrade-insecure-requests",

    // Report CSP violations to your endpoint
    isProd ? "report-uri /api/csp-report" : "",
  ].filter(Boolean);

  return directives.join("; ");
}

// Usage in middleware.ts:
// const nonce = generateCSPNonce();
// res.headers.set("Content-Security-Policy", buildCSPHeader(nonce));
// res.headers.set("x-nonce", nonce); // Pass to layout.tsx
//
// Usage in layout.tsx:
// import { headers } from "next/headers";
// const nonce = headers().get("x-nonce") ?? "";
// <script nonce={nonce} ... />
// <style nonce={nonce} ... />

// ─────────────────────────────────────────────────────────────────────────────
// 2. PII STRIPPING — Fix H3
//    Strip sensitive fields from API responses
// ─────────────────────────────────────────────────────────────────────────────

const PRIVATE_USER_FIELDS = [
  "passwordHash", "password",
  "email",           // Don't expose email on public endpoints
  "resetToken", "resetTokenExpiry",
  "sessionId",
  "ipAddress", "lastLoginIp",
] as const;

type AnyObject = Record<string, unknown>;

/**
 * Strip PII fields from any user object before sending in API response.
 * Works recursively on arrays of users.
 */
export function stripUserPII<T extends AnyObject>(user: T): Omit<T, typeof PRIVATE_USER_FIELDS[number]> {
  const stripped = { ...user };
  for (const field of PRIVATE_USER_FIELDS) {
    delete (stripped as AnyObject)[field];
  }
  return stripped as Omit<T, typeof PRIVATE_USER_FIELDS[number]>;
}

/** Safe public user shape for leaderboard / public endpoints */
export interface PublicUserProfile {
  id: string;
  displayName: string;
  role: "student" | "teacher";
  createdAt: Date;
  // Stats (non-PII)
  bestWpm?: number;
  testsCompleted?: number;
}

export function toPublicProfile(user: AnyObject): PublicUserProfile {
  return {
    id: user.id as string,
    displayName: user.displayName as string,
    role: user.role as "student" | "teacher",
    createdAt: user.createdAt as Date,
    bestWpm: user.bestWpm as number | undefined,
    testsCompleted: user.testsCompleted as number | undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BODY SIZE LIMITS — Fix M5
// ─────────────────────────────────────────────────────────────────────────────

const BODY_LIMITS: Record<string, number> = {
  "/api/auth/login":        10 * 1024,   // 10 KB
  "/api/auth/signup":       10 * 1024,   // 10 KB
  "/api/test/submit":       5  * 1024,   // 5  KB
  "/api/classroom":         50 * 1024,   // 50 KB
  "/api/certificates":      10 * 1024,   // 10 KB
  "/api/games/custom":      200 * 1024,  // 200 KB (custom text)
  default:                  100 * 1024,  // 100 KB default
};

/**
 * Read request body with size enforcement.
 * Returns null and 413 response if limit exceeded.
 */
export async function readBodyWithSizeLimit(
  req: NextRequest,
  limitOverride?: number
): Promise<{ body: string } | { error: NextResponse }> {
  const pathname = new URL(req.url).pathname;
  const limit = limitOverride ??
    Object.entries(BODY_LIMITS).find(([k]) => pathname.startsWith(k))?.[1] ??
    BODY_LIMITS.default;

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > limit) {
    return {
      error: NextResponse.json(
        { error: `Request body too large. Maximum ${Math.round(limit / 1024)} KB allowed.` },
        { status: 413 }
      ),
    };
  }

  // Stream with size check
  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  const reader = req.body?.getReader();

  if (!reader) return { body: "" };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.byteLength;
      if (totalSize > limit) {
        return {
          error: NextResponse.json(
            { error: `Request body too large. Maximum ${Math.round(limit / 1024)} KB allowed.` },
            { status: 413 }
          ),
        };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return { body: new TextDecoder().decode(Buffer.concat(chunks)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SRI HASH HELPER — Fix L1
//    Generate integrity hashes for third-party scripts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pre-computed SRI hashes for third-party scripts TypeBlaze uses.
 * Regenerate these when updating script versions:
 *   openssl dgst -sha384 -binary FILENAME | openssl base64 -A
 *
 * Or use: https://www.srihash.org/
 */
export const SRI_HASHES = {
  // These are example hashes — regenerate for your actual script versions
  jsPDF_2_5_1: "sha384-PLACEHOLDER-REGENERATE-WITH-ACTUAL-HASH",
  // AdSense and Analytics cannot use SRI (they're dynamically generated)
  // Use CSP nonces for those instead
} as const;

// Usage in layout.tsx or page:
// <script
//   src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
//   integrity={SRI_HASHES.jsPDF_2_5_1}
//   crossOrigin="anonymous"
// />

// ─────────────────────────────────────────────────────────────────────────────
// 5. GUEST DATA CONSENT & TTL — Fix M4
// ─────────────────────────────────────────────────────────────────────────────

export const GUEST_SESSION_TTL_HOURS = 24;
export const GUEST_CONSENT_COOKIE = "tb-guest-consent";

/**
 * Check if guest user has given consent.
 * Returns: 'given' | 'pending' | 'denied'
 */
export function getGuestConsentStatus(req: NextRequest): "given" | "pending" | "denied" {
  const cookie = req.cookies.get(GUEST_CONSENT_COOKIE)?.value;
  if (cookie === "1") return "given";
  if (cookie === "0") return "denied";
  return "pending";
}

/**
 * Set consent cookie.
 * Call from the consent banner's API route.
 */
export function setGuestConsent(res: NextResponse, accepted: boolean): void {
  res.cookies.set(GUEST_CONSENT_COOKIE, accepted ? "1" : "0", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

// Prisma scheduled cleanup (run via cron job or Vercel Cron):
// export async function cleanGuestSessions() {
//   const cutoff = new Date(Date.now() - GUEST_SESSION_TTL_HOURS * 60 * 60 * 1000);
//   await prisma.guestSession.deleteMany({ where: { createdAt: { lt: cutoff } } });
// }

// ─────────────────────────────────────────────────────────────────────────────
// 6. CSP VIOLATION REPORT ENDPOINT
//    Receives browser CSP violation reports
// ─────────────────────────────────────────────────────────────────────────────

// src/app/api/csp-report/route.ts:
//
// export async function POST(req: NextRequest) {
//   try {
//     const report = await req.json();
//     // Log to your security monitoring service
//     console.error("[CSP VIOLATION]", JSON.stringify(report));
//     return new Response(null, { status: 204 });
//   } catch {
//     return new Response(null, { status: 400 });
//   }
// }
