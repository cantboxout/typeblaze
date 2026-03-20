import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordResetLimiter } from "@/lib/security/rate-limit";
import { withErrorHandler, generateResetToken, resetTokenExpiry, logSecurityEvent } from "@/lib/security";
import { validate, PasswordResetRequestSchema } from "@/lib/security/validation";

const GENERIC = NextResponse.json(
  { success: true, message: "If an account exists with that email, you will receive a reset link." },
  { status: 200 }
);

export const POST = withErrorHandler(async (req: NextRequest) => {
  const limited = await passwordResetLimiter(req);
  if (limited) {
    logSecurityEvent("RATE_LIMIT_HIT", { endpoint: "/api/auth/forgot-password" }, req);
    return limited;
  }

  let body: unknown;
  try { body = await req.json(); } catch { return GENERIC; }

  const validation = validate(PasswordResetRequestSchema, body);
  if (!validation.success) return GENERIC;

  const { email } = validation.data;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isActive: true } });

  if (!user || !user.isActive) {
    logSecurityEvent("PASSWORD_RESET_REQUEST", { email, result: "user_not_found" }, req);
    return GENERIC;
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  const token = generateResetToken();
  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt: resetTokenExpiry() } });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Reset: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`);
  }

  logSecurityEvent("PASSWORD_RESET_REQUEST", { userId: user.id, result: "sent" }, req);
  return GENERIC;
});
