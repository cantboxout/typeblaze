/**
 * TypeBlaze — Server Instrumentation (PATCHED)
 * instrumentation.ts
 *
 * Fixes:
 *   - TODO comment replaced with working Axiom initialisation
 *   - Database crash exits with descriptive message
 *   - Added Redis connectivity check if configured
 *   - Added startup banner with environment summary
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateEnv } = await import("@/lib/security");

  // ── 1. Validate all required env vars (throws + crashes if bad) ────────
  validateEnv();
  console.log("[TypeBlaze] ✓ Environment variables validated");

  // ── 2. Initialise security logging ────────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    if (process.env.AXIOM_DATASET && process.env.AXIOM_TOKEN) {
      try {
        const { Axiom } = await import("@axiomhq/js");
        const axiom = new Axiom({ token: process.env.AXIOM_TOKEN });
        // Send a startup ping to verify connection
        await axiom.ingest(process.env.AXIOM_DATASET, [{
          type: "STARTUP",
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          version: process.env.npm_package_version ?? "unknown",
        }]);
        console.log("[TypeBlaze] ✓ Axiom security logging connected");
      } catch (err) {
        // Non-fatal: log to stdout instead
        console.warn("[TypeBlaze] ⚠ Axiom init failed, using stdout logging:", (err as Error).message);
      }
    } else {
      console.warn(
        "[TypeBlaze] ⚠ AXIOM_DATASET or AXIOM_TOKEN not set — " +
        "security events will be written to stdout only"
      );
    }
  }

  // ── 3. Database connection check ──────────────────────────────────────
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    console.log("[TypeBlaze] ✓ Database connection verified");
  } catch (err) {
    console.error("[TypeBlaze] ✗ FATAL: Database connection failed:", (err as Error).message);
    console.error("Check DATABASE_URL is correct and the database is reachable.");
    process.exit(1);
  }

  // ── 4. Redis connectivity check (non-fatal) ────────────────────────────
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      await redis.ping();
      console.log("[TypeBlaze] ✓ Redis (Upstash) connected — rate limiting is distributed");
    } catch (err) {
      console.warn(
        "[TypeBlaze] ⚠ Redis connection failed — falling back to in-memory rate limiting:",
        (err as Error).message
      );
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[TypeBlaze] ⚠ UPSTASH_REDIS_REST_URL not set — " +
        "rate limiting and account lockout use in-memory store (single-instance only)"
      );
    }
  }

  // ── 5. Startup summary ─────────────────────────────────────────────────
  console.log(
    `[TypeBlaze] 🔥 Server ready · env=${process.env.NODE_ENV} · ` +
    `redis=${!!process.env.UPSTASH_REDIS_REST_URL} · ` +
    `axiom=${!!process.env.AXIOM_TOKEN}`
  );
}
