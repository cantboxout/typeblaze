/** @type {import('next').NextConfig} */

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js inline scripts + Google AdSense
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com",
  // Styles: self + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' https://fonts.gstatic.com data:",
  // Images: self + data URIs + HTTPS (certificates, avatars, OG images)
  "img-src 'self' data: blob: https:",
  // API calls: self + TypeBlaze backend
  "connect-src 'self' https://api.typeblaze.com https://www.google-analytics.com",
  // iframes: Google Ads only
  "frame-src https://googleads.g.doubleclick.net https://www.google.com",
  // Media: self only
  "media-src 'self'",
  // Workers: self + blob (PDF generation uses blob workers)
  "worker-src 'self' blob:",
  // Objects: none
  "object-src 'none'",
  // Upgrade all HTTP to HTTPS
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop legacy XSS auditor (modern browsers ignore it, but belt-and-suspenders)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Control referrer information sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser APIs (no camera/mic/geo access)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Force HTTPS for 2 years, include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // CSP
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  // Enable DNS prefetch
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  // ── Output ──────────────────────────────────────────────────────────────
  output: "standalone", // Docker-friendly; or remove for Vercel

  // ── Image optimisation ───────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // ── Experimental ────────────────────────────────────────────────────────
  experimental: {
            // Inline critical CSS, defer the rest
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // ── Compiler ─────────────────────────────────────────────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // Strip console.* in prod
  },

  // ── Security Headers ─────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Long-cache static assets
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache sitemap & robots for 24 h
        source: "/(sitemap.xml|robots.txt)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=3600" },
        ],
      },
    ];
  },

  // ── Redirects (SEO — preserve link equity) ───────────────────────────────
  async redirects() {
    return [
      // Old SPA hash routes → proper Next.js routes
      { source: "/test",        destination: "/typing-test", permanent: true },
      { source: "/speed-test",  destination: "/typing-test", permanent: true },
      { source: "/game",        destination: "/games",        permanent: true },
      { source: "/leaderboards",destination: "/leaderboard",  permanent: true },
      // Normalise trailing slashes
      { source: "/typing-test/", destination: "/typing-test", permanent: true },
      { source: "/games/",       destination: "/games",        permanent: true },
    ];
  },

  // ── Rewrites (clean URLs without extension) ──────────────────────────────
  async rewrites() {
    return {
      beforeFiles: [
        // Serve sitemap dynamically (so it can be built from DB)
        { source: "/sitemap.xml", destination: "/api/sitemap" },
      ],
    };
  },
};

module.exports = nextConfig;
