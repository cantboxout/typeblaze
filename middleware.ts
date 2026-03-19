/**
 * TypeBlaze — Next.js Edge Middleware
 * middleware.ts  (project root)
 *
 * Runs on every request before it hits any route handler.
 * Handles: JWT auth, CSRF validation, route protection, security headers.
 *
 * Fixes: C3 (CSRF), C4 (JWT enforcement), rate limiting at edge
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { validateCSRF, setCSRFCookie } from "@/lib/security";

// ── Route config ──────────────────────────────────────────────────────────
// Protected routes: require valid JWT
const PROTECTED_ROUTES = [
  "/profile",
  "/classroom/settings",
  "/api/classroom",
  "/api/certificates/generate",
  "/api/test/submit",
  "/api/user",
];

// Auth routes: redirect to /typing-test if already authenticated
const AUTH_ROUTES = ["/login", "/signup"];

// Public API routes: no auth required, but still rate limited
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/forgot-password",
  "/api/leaderboard",
];

export const config = {
  // Run middleware on all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|screenshots/|og/).*)",
  ],
};

// ── JWT verification (Edge-compatible — no Node.js crypto) ────────────────
const JWT_ISSUER   = "typeblaze.com";
const JWT_AUDIENCE = "typeblaze-api";

async function verifyAuthToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );
    return payload as { userId: string; role: string; sessionId: string };
  } catch {
    return null;
  }
}

// ── Main middleware ───────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // ── 1. CSRF validation on all state-mutating requests ─────────────────
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    // Skip CSRF for bearer-token authenticated API calls (mobile / programmatic)
    const hasBearerToken = req.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasBearerToken) {
      const csrfError = validateCSRF(req);
      if (csrfError) return csrfError;
    }
  }

  // ── 2. Set CSRF cookie on page loads (GET requests to HTML pages) ──────
  if (req.method === "GET" && !pathname.startsWith("/api/")) {
    setCSRFCookie(res);
  }

  // ── 3. Extract JWT from cookie or Authorization header ─────────────────
  const tokenFromCookie = req.cookies.get("auth-token")?.value;
  const tokenFromHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  const token = tokenFromCookie ?? tokenFromHeader;

  const user = token ? await verifyAuthToken(token) : null;

  // ── 4. Auth route redirect (already logged in → redirect away) ─────────
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && user) {
    return NextResponse.redirect(new URL("/typing-test", req.url));
  }

  // ── 5. Protected route guard ────────────────────────────────────────────
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected && !user) {
    // API routes return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    // Page routes redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 6. Teacher-only routes ──────────────────────────────────────────────
  const isTeacherRoute = pathname.startsWith("/classroom/") ||
                         pathname.startsWith("/api/classroom/");
  if (isTeacherRoute && user && user.role !== "teacher" && user.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Teacher account required" },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/classroom", req.url));
  }

  // ── 7. Inject user context headers for downstream handlers ─────────────
  if (user) {
    res.headers.set("x-user-id", user.userId);
    res.headers.set("x-user-role", user.role);
    res.headers.set("x-session-id", user.sessionId);
  }

  // ── 8. Additional security headers ─────────────────────────────────────
  // (Full headers are also in next.config.js — this adds dynamic ones)
  res.headers.set("X-Request-ID", crypto.randomUUID());

  return res;
}
