import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { signupLimiter } from "@/lib/security/rate-limit";
import { withErrorHandler, hashPassword, generateResetToken, logSecurityEvent } from "@/lib/security";
import { validate, validationErrorResponse, SignupSchema } from "@/lib/security/validation";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const limited = await signupLimiter(req);
  if (limited) {
    logSecurityEvent("RATE_LIMIT_HIT", { endpoint: "/api/auth/signup" }, req);
    return limited;
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validate(SignupSchema, body);
  if (!validation.success) {
    logSecurityEvent("INPUT_VALIDATION_FAILED", { endpoint: "/api/auth/signup" }, req);
    return validationErrorResponse(validation.errors);
  }

  const { name, email, password, role } = validation.data;

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const passwordHash = await hashPassword(password);

  if (existingUser) {
    logSecurityEvent("SIGNUP", { email, result: "email_taken" }, req);
    return NextResponse.json(
      { success: true, message: "If this email is not registered, you will receive a verification link." },
      { status: 200 }
    );
  }

  const verificationToken = generateResetToken();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Map lowercase zod role to Prisma uppercase enum
  const prismaRole: Role = role === "teacher" ? Role.TEACHER : Role.STUDENT;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      displayName: name.split(" ")[0],
      passwordHash,
      role: prismaRole,
      isActive: true,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    },
    select: { id: true, displayName: true, role: true },
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Verify: ${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`);
  }

  logSecurityEvent("SIGNUP", { userId: user.id, role }, req);

  return NextResponse.json(
    { success: true, message: "Account created. Please check your email to verify your address.", user: { id: user.id, displayName: user.displayName } },
    { status: 201 }
  );
});
