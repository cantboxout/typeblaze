/**
 * TypeBlaze — Dynamic OG Image Generator
 * src/app/api/og/route.tsx
 *
 * Generates beautiful social preview cards on the fly using Next.js ImageResponse.
 * Used by all TypeBlaze pages for rich Open Graph / Twitter Card images.
 *
 * Usage:
 *   /api/og?title=Free+Typing+Speed+Test&sub=Measure+your+WPM+today
 *   /api/og?type=cert&name=Sarah+Johnson&wpm=112&level=Master
 *   /api/og?type=score&wpm=89&acc=97
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge"; // Fast edge generation

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://typeblaze.vercel.app";

type OGType = "default" | "cert" | "score" | "game";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const type     = (searchParams.get("type")  ?? "default") as OGType;
  const title    = searchParams.get("title")  ?? "TypeBlaze";
  const sub      = searchParams.get("sub")    ?? "Free typing speed test, games & certificates.";
  const name     = searchParams.get("name")   ?? "";
  const wpm      = searchParams.get("wpm")    ?? "0";
  const acc      = searchParams.get("acc")    ?? "0";
  const level    = searchParams.get("level")  ?? "Beginner";

  const levelColors: Record<string, string> = {
    Newcomer: "#B4B2A9", Beginner: "#5DCAA5", Intermediate: "#60A5FA",
    Advanced: "#818CF8", Expert: "#FF6B1A", Master: "#FBBF24",
  };
  const levelColor = levelColors[level] ?? "#FF6B1A";

  // ── DEFAULT card ──────────────────────────────────────────────────────────
  if (type === "default") {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200, height: 630,
            background: "#080810",
            display: "flex", flexDirection: "column",
            padding: "60px 72px",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Grid dots */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.03,
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px", display: "flex" }} />

          {/* Orange glow */}
          <div style={{ position: "absolute", top: -100, left: -100,
            width: 500, height: 500, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,107,26,0.08), transparent)",
            display: "flex" }} />

          {/* Border */}
          <div style={{ position: "absolute", inset: 20, border: "1px solid rgba(255,107,26,0.25)",
            borderRadius: 16, display: "flex" }} />

          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36 }}>
            <div style={{ width: 48, height: 48, background: "#FF5500", borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, color: "white" }}>🔥</div>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#F0F0FA", letterSpacing: "-0.03em" }}>
              Type<span style={{ color: "#FF6B1A" }}>Blaze</span>
            </span>
          </div>

          {/* Title */}
          <div style={{ fontSize: 52, fontWeight: 800, color: "#F0F0FA",
            lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20,
            maxWidth: 900 }}>{title}</div>

          {/* Subtitle */}
          <div style={{ fontSize: 22, color: "#9999BB", lineHeight: 1.5, maxWidth: 700 }}>{sub}</div>

          {/* Bottom badges */}
          <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
            {["Free Forever", "2M+ Typists", "Earn Certificates", "Teacher Classroom"].map(t => (
              <div key={t} style={{ background: "rgba(255,107,26,0.1)", border: "1px solid rgba(255,107,26,0.28)",
                borderRadius: 100, padding: "6px 18px", fontSize: 15, color: "#FF8A40", display: "flex" }}>{t}</div>
            ))}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // ── CERTIFICATE card ──────────────────────────────────────────────────────
  if (type === "cert") {
    return new ImageResponse(
      (
        <div style={{ width: 1200, height: 630, background: "#080810",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", fontFamily: "sans-serif", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.03,
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px", display: "flex" }} />
          <div style={{ position: "absolute", inset: 20,
            border: `1px solid ${levelColor}44`, borderRadius: 16, display: "flex" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <div style={{ width: 44, height: 44, background: "#FF5500", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔥</div>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#F0F0FA" }}>
              Type<span style={{ color: "#FF6B1A" }}>Blaze</span>
            </span>
          </div>

          <div style={{ fontSize: 18, color: "#9999BB", marginBottom: 12 }}>Certificate of Achievement</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#F0F0FA", marginBottom: 8,
            letterSpacing: "-0.03em" }}>{name}</div>
          <div style={{ fontSize: 22, color: levelColor, marginBottom: 24 }}>
            {wpm} WPM · {acc}% Accuracy
          </div>

          <div style={{ background: `${levelColor}18`, border: `1px solid ${levelColor}44`,
            borderRadius: 100, padding: "8px 28px", fontSize: 18,
            color: levelColor, fontWeight: 700 }}>{level} Typist</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // ── SCORE card ────────────────────────────────────────────────────────────
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#080810",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", fontFamily: "sans-serif", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#F0F0FA" }}>
            Type<span style={{ color: "#FF6B1A" }}>Blaze</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 48 }}>
          {[
            { label: "WPM", value: wpm, color: "#FF6B1A" },
            { label: "Accuracy", value: `${acc}%`, color: "#10D9A0" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 80, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 20, color: "#9999BB", marginTop: 8 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 18, color: "#525270" }}>typeblaze.vercel.app · Free Typing Speed Test</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
