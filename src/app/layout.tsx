/**
 * TypeBlaze — Root Layout
 * src/app/layout.tsx
 *
 * - Self-hosted Google Fonts via next/font (eliminates render-blocking)
 * - Global metadata / OpenGraph defaults
 * - Organization + WebSite JSON-LD on every page
 * - Google Analytics 4 (G-HWVBV8YW29) + AdSense (pub-4642355460644381)
 */

import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit, JetBrains_Mono } from "next/font/google";
import { homeMeta } from "@/lib/seo";
import { HomeSchemas } from "@/components/seo/JsonLd";
import "./globals.css";

// ── Fonts ──────────────────────────────────────────────────────────────────
// next/font downloads & self-hosts at build time → zero external font requests
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// ── Default metadata (overridden per-page) ────────────────────────────────
export const metadata: Metadata = homeMeta;

// ── Root Layout ───────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to required origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicons — generate full set at realfavicongenerator.net */}
        <link rel="icon"             href="/favicon.ico" sizes="any" />
        <link rel="icon"             href="/icon.svg"    type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest"         href="/site.webmanifest" />

        {/* Theme color (matches --bg brand color) */}
        <meta name="theme-color" content="#080810" />
        <meta name="color-scheme" content="dark light" />

        {/* Google AdSense — pub-4642355460644381 */}
        {process.env.NODE_ENV === "production" && (
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4642355460644381"
            crossOrigin="anonymous"
          />
        )}

        {/* Organization + WebSite schema on every page */}
        <HomeSchemas />
      </head>
      <body className="antialiased">
        {/* Google Analytics 4 — Stream ID: 14051742358 · Measurement ID: G-HWVBV8YW29 */}
        {process.env.NODE_ENV === "production" && (
          <>
            <script
              async
              src="https://www.googletagmanager.com/gtag/js?id=G-HWVBV8YW29"
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-HWVBV8YW29', {
                    page_path: window.location.pathname,
                    send_page_view: true
                  });
                `,
              }}
            />
          </>
        )}

        {children}
      </body>
    </html>
  );
}
