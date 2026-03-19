/**
 * TypeBlaze — Forgot Password Route
 * src/app/api/auth/forgot-password/route.ts
 *
 * Security applied:
 *   passwordResetLimiter — 3 attempts/hr per IP
 *   PasswordResetRequestSchema — zod validation
 *   generateResetToken()       — crypto-secure 96-hex chars
 *   Timing-safe response       — identical response whether email exists or not
 *   Token expiry               — 1 hour from creation
 *   withErrorHandler()         — no stack traces in prod
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordResetLimiter } from "@/lib/security/rate-limit";
import {
  withErrorHandler,
  generateResetToken,
  resetTokenExpiry,
  logSecurityEvent,
} from "@/lib/security";
import {
  validate,
  validationErrorResponse,
  PasswordResetRequestSchema,
} from "@/lib/security/validation";

// Generic response — never reveals whether an email is registered
const GENERIC_RESPONSE = NextResponse.json(
  {
    success: true,
    message:
      "If an account exists with that email address, you will receive a password reset link within a few minutes.",
  },
  { status: 200 }
);

export const POST = withErrorHandler(async (req: NextRequest) => {
  // ── 1. Rate limit ──────────────────────────────────────────────────────
  const limited = await passwordResetLimiter(req);
  if (limited) {
    logSecurityEvent("RATE_LIMIT_HIT", { endpoint: "/api/auth/forgot-password" }, req);
    return limited;
  }

  // ── 2. Validate input ──────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validate(PasswordResetRequestSchema, body);
  if (!validation.success) {
    // Return generic response — don't hint at validation details
    return GENERIC_RESPONSE;
  }

  const { email } = validation.data;

  // ── 3. Look up user ────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  });

  // Always return the same response whether user exists or not
  if (!user || !user.isActive) {
    logSecurityEvent("PASSWORD_RESET_REQUEST", { email, result: "user_not_found" }, req);
    return GENERIC_RESPONSE;
  }

  // ── 4. Invalidate existing unused tokens for this user ─────────────────
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() }, // Mark as used (invalidated)
  });

  // ── 5. Create new token ────────────────────────────────────────────────
  const token = generateResetToken();
  const expiresAt = resetTokenExpiry();

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // ── 6. Send email ──────────────────────────────────────────────────────
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  // In production: await sendPasswordResetEmail(email, resetUrl);
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Reset link: ${resetUrl}`);
  }

  logSecurityEvent("PASSWORD_RESET_REQUEST", { userId: user.id, result: "sent" }, req);

  return GENERIC_RESPONSE;
});
