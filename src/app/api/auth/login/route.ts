import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginLimiter } from "@/lib/security/rate-limit";
import {
  withErrorHandler, verifyPassword, needsRehash, hashPassword,
  signJWT, recordFailedLogin, isAccountLocked, clearFailedAttempts, logSecurityEvent,
} from "@/lib/security";
import { validate, validationErrorResponse, LoginSchema } from "@/lib/security/validation";

const LOGIN_COOKIE = "auth-token";
const REFRESH_COOKIE = "refresh-token";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const limited = await loginLimiter(req);
  if (limited) {
    logSecurityEvent("RATE_LIMIT_HIT", { endpoint: "/api/auth/login" }, req);
    return limited;
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validate(LoginSchema, body);
  if (!validation.success) {
    logSecurityEvent("INPUT_VALIDATION_FAILED", { endpoint: "/api/auth/login" }, req);
    return validationErrorResponse(validation.errors);
  }

  const { email, password } = validation.data;

  const lockStatus = await isAccountLocked(email);
  if (lockStatus.locked) {
    logSecurityEvent("LOGIN_LOCKED", { email }, req);
    return NextResponse.json(
      { error: `Account locked. Try again in ${Math.ceil((lockStatus.remainingSeconds ?? 0) / 60)} minutes.` },
      { status: 423 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, displayName: true, passwordHash: true, role: true, isActive: true, emailVerified: true },
  });

  const dummyHash = "$2b$12$LCKas6Ri3yS/7YJpRzNLMONRdyp31XzMBxBf.lB9tLBxRIjxsEdli";
  const passwordValid = await verifyPassword(password, user?.passwordHash ?? dummyHash);

  if (!user || !passwordValid) {
    if (user) await recordFailedLogin(email);
    logSecurityEvent("LOGIN_FAILED", { email, reason: !user ? "user_not_found" : "wrong_password" }, req);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (!user.isActive) return NextResponse.json({ error: "Account is disabled. Contact support." }, { status: 403 });
  if (!user.emailVerified) return NextResponse.json({ error: "Please verify your email.", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });

  if (await needsRehash(user.passwordHash)) {
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
  }

  await clearFailedAttempts(email);

  const sessionId = crypto.randomUUID();
  const roleStr = user.role.toLowerCase() as "student" | "teacher";
  const accessToken  = await signJWT({ userId: user.id, role: roleStr, email: user.email, sessionId }, "15m");
  const refreshToken = await signJWT({ userId: user.id, role: roleStr, email: user.email, sessionId }, "7d");

  logSecurityEvent("LOGIN_SUCCESS", { userId: user.id, role: user.role }, req);

  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ user: { id: user.id, displayName: user.displayName, role: roleStr } });
  res.cookies.set(LOGIN_COOKIE,   accessToken,  { httpOnly: true, secure: isProd, sameSite: "strict", path: "/",                maxAge: 900 });
  res.cookies.set(REFRESH_COOKIE, refreshToken, { httpOnly: true, secure: isProd, sameSite: "strict", path: "/api/auth/refresh", maxAge: 604800 });
  return res;
});
