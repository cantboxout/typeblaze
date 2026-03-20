import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler, hashPassword, logSecurityEvent } from "@/lib/security";
import { validate, validationErrorResponse, PasswordResetSchema } from "@/lib/security/validation";

export const POST = withErrorHandler(async (req: NextRequest) => {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validate(PasswordResetSchema, body);
  if (!validation.success) return validationErrorResponse(validation.errors);

  const { token, newPassword } = validation.data;

  const dbToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!dbToken) {
    logSecurityEvent("PASSWORD_RESET_COMPLETE", { result: "invalid_token" }, req);
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }
  if (dbToken.usedAt !== null) {
    logSecurityEvent("PASSWORD_RESET_COMPLETE", { userId: dbToken.userId, result: "already_used" }, req);
    return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
  }
  if (dbToken.expiresAt < new Date()) {
    logSecurityEvent("PASSWORD_RESET_COMPLETE", { userId: dbToken.userId, result: "expired" }, req);
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: dbToken.userId }, data: { passwordHash: newHash } }),
    prisma.passwordResetToken.update({ where: { id: dbToken.id }, data: { usedAt: new Date() } }),
  ]);

  logSecurityEvent("PASSWORD_RESET_COMPLETE", { userId: dbToken.userId, result: "success" }, req);
  return NextResponse.json({ success: true, message: "Password updated. Please sign in." });
});
