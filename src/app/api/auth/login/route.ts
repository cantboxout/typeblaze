/**
 * TypeBlaze — Hardened Login API Route
 * src/app/api/auth/login/route.ts
 *
 * Fixes applied:
 *   C1  — Rate limiting (loginLimiter)
 *   C4  — Strong JWT via signJWT()
 *   H1  — bcrypt cost factor 12 via verifyPassword()
 *   H2  — Global error handler via withErrorHandler()
 *   H3  — No PII in response
 *   M2  — Account lockout after 10 failures
 *   Security logging on all auth events
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  loginLimiter,
} from "@/lib/security/rate-limit";
import {
  withErrorHandler,
  verifyPassword,
  needsRehash,
  hashPassword,
  signJWT,
  recordFailedLogin,
  isAccountLocked,
  clearFailedAttempts,
  logSecurityEvent,
} from "@/lib/security";
import {
  validate,
  validationErrorResponse,
  LoginSchema,
} from "@/lib/security/validation";

const LOGIN_COOKIE_NAME = "auth-token";
const REFRESH_COOKIE_NAME = "refresh-token";

export const POST = withErrorHandler(async (req: NextRequest) => {
  // ── 1. Rate limiting ───────────────────────────────────────────────────
  const limited = await loginLimiter(req);
  if (limited) {
    logSecurityEvent("RATE_LIMIT_HIT", { endpoint: "/api/auth/login" }, req);
    return limited;
  }

  // ── 2. Parse & validate body ───────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validate(LoginSchema, body);
  if (!validation.success) {
    logSecurityEvent("INPUT_VALIDATION_FAILED", { endpoint: "/api/auth/login" }, req);
    return validationErrorResponse(validation.errors);
  }

  const { email, password } = validation.data;

  // ── 3. Account lockout check ───────────────────────────────────────────
  const lockStatus = await isAccountLocked(email);
  if (lockStatus.locked) {
    logSecurityEvent("LOGIN_LOCKED", { email }, req);
    return NextResponse.json(
      {
        error: `Account temporarily locked. Try again in ${Math.ceil((lockStatus.remainingSeconds ?? 0) / 60)} minutes.`,
        lockedFor: lockStatus.remainingSeconds,
      },
      { status: 423 } // 423 Locked
    );
  }

  // ── 4. Fetch user (timing-safe: always hash even if user not found) ────
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      displayName: true,
      passwordHash: true,
      role: true,
      isActive: true,
      emailVerified: true,
    },
  });

  // Use a dummy hash to prevent user enumeration via timing
  const dummyHash = "$2b$12$LCKas6Ri3yS/7YJpRzNLMONRdyp31XzMBxBf.lB9tLBxRIjxsEdli";
  const hashToVerify = user?.passwordHash ?? dummyHash;
  const passwordValid = await verifyPassword(password, hashToVerify);

  if (!user || !passwordValid) {
    if (user) recordFailedLogin(email);
    logSecurityEvent("LOGIN_FAILED", { email, reason: !user ? "user_not_found" : "wrong_password" }, req);

    // Generic error — do NOT distinguish "user not found" from "wrong password"
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // ── 5. Additional checks ───────────────────────────────────────────────
  if (!user.isActive) {
    return NextResponse.json({ error: "Account is disabled. Contact support." }, { status: 403 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" },
      { status: 403 }
    );
  }

  // ── 6. Upgrade bcrypt rounds if needed (transparent rehash) ───────────
  if (await needsRehash(user.passwordHash)) {
    const newHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
  }

  // ── 7. Clear failed attempt counter on success ─────────────────────────
  clearFailedAttempts(email);

  // ── 8. Issue tokens ────────────────────────────────────────────────────
  const sessionId = crypto.randomUUID();

  const accessToken = await signJWT(
    { userId: user.id, role: user.role, email: user.email, sessionId },
    "15m"
  );
  const refreshToken = await signJWT(
    { userId: user.id, role: user.role, email: user.email, sessionId, type: "refresh" },
    "7d"
  );

  // ── 9. Log success ─────────────────────────────────────────────────────
  logSecurityEvent("LOGIN_SUCCESS", { userId: user.id, role: user.role }, req);

  // ── 10. Build response (strip PII — Fix H3) ────────────────────────────
  const response = NextResponse.json({
    user: {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
      // NOTE: email NOT returned here — only present in the JWT, never in response body
    },
  });

  const isProd = process.env.NODE_ENV === "production";

  // HttpOnly access token cookie (15m)
  response.cookies.set(LOGIN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 15,
  });

  // HttpOnly refresh token cookie (7d)
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
});
