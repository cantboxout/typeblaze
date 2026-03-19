/**
 * TypeBlaze — Dynamic Sitemap
 * src/app/api/sitemap/route.ts
 *
 * Generates sitemap.xml dynamically so blog posts, leaderboard profiles,
 * and classroom pages can be included at build-time or via ISR.
 *
 * Access at: GET https://typeblaze.com/sitemap.xml
 * (next.config.js rewrite maps /sitemap.xml → /api/sitemap)
 */

import { NextResponse } from "next/server";

const BASE = "https://typeblaze.com";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always" | "hourly" | "daily"
    | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

// ── Static routes ─────────────────────────────────────────────────────────
const STATIC_ROUTES: SitemapEntry[] = [
  { loc: "/",                    changefreq: "weekly",  priority: 1.0  },
  { loc: "/typing-test",         changefreq: "monthly", priority: 0.95 },
  { loc: "/games",               changefreq: "monthly", priority: 0.85 },
  { loc: "/games/words",         changefreq: "monthly", priority: 0.70 },
  { loc: "/games/quotes",        changefreq: "monthly", priority: 0.70 },
  { loc: "/games/numbers",       changefreq: "monthly", priority: 0.70 },
  { loc: "/games/capitals",      changefreq: "monthly", priority: 0.70 },
  { loc: "/games/custom",        changefreq: "monthly", priority: 0.65 },
  { loc: "/games/code",          changefreq: "monthly", priority: 0.65 },
  { loc: "/leaderboard",         changefreq: "daily",   priority: 0.75 },
  { loc: "/classroom",           changefreq: "monthly", priority: 0.80 },
  { loc: "/typing-certificate",  changefreq: "monthly", priority: 0.80 },
  { loc: "/vs/monkeytype",       changefreq: "monthly", priority: 0.75 },
  { loc: "/vs/typing-com",       changefreq: "monthly", priority: 0.70 },
  { loc: "/for/teachers",        changefreq: "monthly", priority: 0.80 },
  { loc: "/for/students",        changefreq: "monthly", priority: 0.75 },
  { loc: "/blog",                changefreq: "weekly",  priority: 0.60 },
  { loc: "/verify",              changefreq: "yearly",  priority: 0.40 },
  { loc: "/privacy",             changefreq: "yearly",  priority: 0.20 },
  { loc: "/terms",               changefreq: "yearly",  priority: 0.20 },
];

// ── Fetch dynamic routes (blog posts, etc.) ───────────────────────────────
async function getDynamicRoutes(): Promise<SitemapEntry[]> {
  try {
    // Replace with your actual DB/CMS call
    // const posts = await db.blogPost.findMany({ where: { published: true } });
    // return posts.map(p => ({ loc: `/blog/${p.slug}`, lastmod: p.updatedAt.toISOString(), priority: 0.55 }));
    return [];
  } catch {
    return [];
  }
}

// ── XML builder ───────────────────────────────────────────────────────────
function buildXml(entries: SitemapEntry[]): string {
  const today = new Date().toISOString().split("T")[0];

  const urls = entries
    .map(({ loc, lastmod, changefreq, priority }) => {
      return [
        "  <url>",
        `    <loc>${BASE}${loc}</loc>`,
        `    <lastmod>${lastmod ?? today}</lastmod>`,
        changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
        priority !== undefined ? `    <priority>${priority.toFixed(2)}</priority>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    "</urlset>",
  ].join("\n");
}

// ── Route Handler ─────────────────────────────────────────────────────────
export const dynamic = "force-static"; // Cache at build; set "force-dynamic" if content changes frequently

export async function GET() {
  const dynamic_ = await getDynamicRoutes();
  const all = [...STATIC_ROUTES, ...dynamic_];
  const xml = buildXml(all);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}
