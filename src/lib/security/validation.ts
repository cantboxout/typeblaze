/**
 * TypeBlaze — Input Validation & Sanitisation
 * src/lib/security/validation.ts
 *
 * Fixes:
 *   C2  — SQL injection via raw query interpolation
 *   H6  — Unlimited custom text input length
 *   M5  — No request body size limits
 *
 * Uses zod for schema validation. All API inputs MUST pass through
 * these schemas before touching the database or business logic.
 */

import { z } from "zod";

// ── Constants ──────────────────────────────────────────────────────────────
const MAX_NAME_LEN       = 100;
const MAX_EMAIL_LEN      = 254;  // RFC 5321 maximum
const MAX_PASSWORD_LEN   = 128;
const MIN_PASSWORD_LEN   = 8;
const MAX_CUSTOM_TEXT    = 50_000; // characters
const MAX_DISPLAY_NAME   = 32;
const MAX_CLASS_NAME     = 80;
const MAX_ASSIGNMENT_TITLE = 120;
const MAX_SEARCH_QUERY   = 200;

// ── Helper: sanitise string (strip control chars, normalise whitespace) ───
export function sanitiseString(s: string): string {
  return s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
    .replace(/\s+/g, " ")                               // normalise whitespace
    .trim();
}

// ── Helper: check for SQL injection patterns ──────────────────────────────
// Prisma ORM handles parameterisation, but this catches raw query misuse.
const SQL_INJECTION_PATTERN =
  /('|--|;|\/\*|\*\/|xp_|UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM|EXEC\s*\()/i;

export function containsSQLInjection(s: string): boolean {
  return SQL_INJECTION_PATTERN.test(s);
}

// ── Auth schemas ───────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(MAX_EMAIL_LEN, `Email must be under ${MAX_EMAIL_LEN} characters`)
    .toLowerCase()
    .transform(sanitiseString),
  password: z
    .string()
    .min(1, "Password is required")
    .max(MAX_PASSWORD_LEN, "Password too long"),
});

export const SignupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(MAX_NAME_LEN, `Name must be under ${MAX_NAME_LEN} characters`)
    .regex(/^[\p{L}\p{M}'\- ]+$/u, "Name contains invalid characters")
    .transform(sanitiseString),
  email: z
    .string()
    .email("Invalid email address")
    .max(MAX_EMAIL_LEN)
    .toLowerCase()
    .transform(sanitiseString),
  password: z
    .string()
    .min(MIN_PASSWORD_LEN, `Password must be at least ${MIN_PASSWORD_LEN} characters`)
    .max(MAX_PASSWORD_LEN)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum(["student", "teacher"], { errorMap: () => ({ message: "Role must be student or teacher" }) }),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email().max(MAX_EMAIL_LEN).toLowerCase().transform(sanitiseString),
});

export const PasswordResetSchema = z.object({
  token: z
    .string()
    .min(32, "Invalid reset token")
    .max(256, "Invalid reset token")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid reset token format"),
  newPassword: z
    .string()
    .min(MIN_PASSWORD_LEN)
    .max(MAX_PASSWORD_LEN)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ── Display name ───────────────────────────────────────────────────────────
export const DisplayNameSchema = z.object({
  displayName: z
    .string()
    .min(2)
    .max(MAX_DISPLAY_NAME)
    .regex(/^[\w\-. ]+$/, "Display name contains invalid characters")
    .transform(sanitiseString),
});

// ── Typing test submission ─────────────────────────────────────────────────
export const TestResultSchema = z.object({
  wpm: z
    .number()
    .int("WPM must be an integer")
    .min(0, "WPM cannot be negative")
    .max(300, "WPM exceeds maximum plausible value"),
  accuracy: z
    .number()
    .min(0)
    .max(100)
    .transform((n) => Math.round(n * 10) / 10), // 1 decimal place
  mode: z.enum(["words", "quotes", "numbers", "capitals", "custom", "code"]),
  duration: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]),
  correctWords: z.number().int().min(0).max(10000),
  incorrectWords: z.number().int().min(0).max(10000),
  // Client timestamp — validated server-side against actual test duration
  startedAt: z.number().int().positive(),
  completedAt: z.number().int().positive(),
}).refine(
  (d) => d.completedAt > d.startedAt,
  { message: "completedAt must be after startedAt", path: ["completedAt"] }
).refine(
  (d) => {
    const elapsed = (d.completedAt - d.startedAt) / 1000;
    // Allow 10% variance from stated duration
    return elapsed >= d.duration * 0.9 && elapsed <= d.duration * 1.1 + 5;
  },
  { message: "Timestamp mismatch — possible test manipulation", path: ["completedAt"] }
).refine(
  (d) => {
    // Sanity check: WPM cannot exceed what's physically possible in duration
    // Fastest typists: ~220 WPM. With duration, max correct chars = wpm * 5 * (dur/60)
    const maxPossibleCorrectChars = 220 * 5 * (d.duration / 60);
    const claimedCorrectChars = d.correctWords * 5;
    return claimedCorrectChars <= maxPossibleCorrectChars * 1.1;
  },
  { message: "WPM claims exceed physical limit — possible score manipulation", path: ["wpm"] }
);

// ── Custom text ────────────────────────────────────────────────────────────
export const CustomTextSchema = z.object({
  text: z
    .string()
    .min(10, "Custom text must be at least 10 characters")
    .max(MAX_CUSTOM_TEXT, `Custom text cannot exceed ${MAX_CUSTOM_TEXT} characters`)
    .transform(sanitiseString),
});

// ── Classroom ──────────────────────────────────────────────────────────────
export const CreateClassSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(MAX_CLASS_NAME)
    .regex(/^[\w\s\-'.]+$/, "Class name contains invalid characters")
    .transform(sanitiseString),
  gradeLevel: z.enum(["elementary", "middle", "high", "university", "adult"]).optional(),
  description: z.string().max(500).optional().transform((s) => s ? sanitiseString(s) : s),
});

export const CreateAssignmentSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  title: z
    .string()
    .min(3)
    .max(MAX_ASSIGNMENT_TITLE)
    .transform(sanitiseString),
  mode: z.enum(["words", "quotes", "numbers", "capitals", "custom", "code"]),
  targetWpm: z.number().int().min(1).max(300).optional(),
  targetAccuracy: z.number().min(0).max(100).optional(),
  duration: z.union([z.literal(15), z.literal(30), z.literal(60), z.literal(120)]).default(60),
  dueAt: z.string().datetime({ offset: true }).optional(),
  customText: z.string().max(MAX_CUSTOM_TEXT).optional(),
});

// ── Search / filter (prevents SQL injection via sort/filter params) ────────
export const LeaderboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  period: z.enum(["global", "weekly", "monthly"]).default("global"),
  mode: z.enum(["words", "quotes", "numbers", "capitals", "custom", "code", "all"]).default("all"),
  // SAFE sort — only allow whitelisted column names, never interpolate raw user input
  sortBy: z.enum(["wpm", "accuracy", "tests_completed"]).default("wpm"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const SearchSchema = z.object({
  q: z
    .string()
    .min(1)
    .max(MAX_SEARCH_QUERY)
    .transform(sanitiseString)
    .refine((s) => !containsSQLInjection(s), { message: "Invalid search query" }),
});

// ── Certificate request ────────────────────────────────────────────────────
export const CertificateRequestSchema = z.object({
  testResultId: z.string().uuid("Invalid test result ID"),
  // Optionally override display name on cert (must match their profile)
  displayName: z.string().min(2).max(MAX_DISPLAY_NAME).optional().transform((s) => s ? sanitiseString(s) : s),
});

// ── Generic validation helper ──────────────────────────────────────────────
export function validate<T>(schema: z.ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; errors: z.ZodError["errors"] } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: result.error.errors };
}

// ── Standard validation error response ────────────────────────────────────
export function validationErrorResponse(errors: z.ZodError["errors"]) {
  return Response.json(
    {
      error: "Validation failed",
      details: errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    },
    { status: 422 }
  );
}
