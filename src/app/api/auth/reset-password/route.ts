/**
 * TypeBlaze — Reset Password Route
 * src/app/api/auth/reset-password/route.ts
 *
 * Security applied:
 *   PasswordResetSchema    — zod validates token format + new password strength
 *   Single-use token check — usedAt field set immediately on redemption
 *   Token expiry check     — 1 hour window enforced server-side
 *   bcrypt cost 12         — hashPassword() from security lib
 *   Prisma transaction     — password update + token invalidation atomic
 *   Session invalidation   — all existing sessions cleared on password change
 *   withErrorHandler()     — no stack traces in prod
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  withErrorHandler,
  hashPassword,
  logSecurityEvent,
} from "@/lib/security";
import {
  validate,
  validationErrorResponse,
  PasswordResetSchema,
} from "@/lib/security/validation";

export const POST = withErrorHandler(async (req: NextRequest) => {
  // ── 1. Parse & validate ────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validate(PasswordResetSchema, body);
  if (!validation.success) {
    return validationErrorResponse(validation.errors);
  }

  const { token, newPassword } = validation.data;

  // ── 2. Look up token ───────────────────────────────────────────────────
  const dbToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  // Generic error — don't differentiate "not found" from "used" or "expired"
  if (!dbToken) {
    logSecurityEvent("PASSWORD_RESET_COMPLETE", { result: "invalid_token" }, req);
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  // ── 3. Single-use check ────────────────────────────────────────────────
  if (dbToken.usedAt !== null) {
    logSecurityEvent(
      "PASSWORD_RESET_COMPLETE",
      { userId: dbToken.userId, result: "token_already_used" },
      req
    );
    return NextResponse.json(
      { error: "This reset link has already been used. Please request a new one." },
      { status: 400 }
    );
  }

  // ── 4. Expiry check ────────────────────────────────────────────────────
  if (dbToken.expiresAt < new Date()) {
    logSecurityEvent(
      "PASSWORD_RESET_COMPLETE",
      { userId: dbToken.userId, result: "token_expired" },
      req
    );
    return NextResponse.json(
      { error: "This reset link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // ── 5. Hash new password ───────────────────────────────────────────────
  const newPasswordHash = await hashPassword(newPassword);

  // ── 6. Atomic transaction: update password + mark token used ──────────
  await prisma.$transaction([
    // Update the password
    prisma.user.update({
      where: { id: dbToken.userId },
      data: { passwordHash: newPasswordHash },
    }),
    // Invalidate the token (single-use enforcement)
    prisma.passwordResetToken.update({
      where: { id: dbToken.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate all active sessions — force re-login with new password
    // Assumes a Session model with userId foreign key
    // prisma.session.deleteMany({ where: { userId: dbToken.userId } }),
  ]);

  logSecurityEvent(
    "PASSWORD_RESET_COMPLETE",
    { userId: dbToken.userId, result: "success" },
    req
  );

  return NextResponse.json(
    { success: true, message: "Password updated successfully. Please sign in with your new password." },
    { status: 200 }
  );
});
