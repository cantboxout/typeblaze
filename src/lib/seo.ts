/**
 * TypeBlaze — SEO Metadata Config  (PATCHED)
 * src/lib/seo.ts
 *
 * Fixes:
 *   - Added openGraph.images to leaderboardMeta (was missing)
 *   - Added openGraph.images to vsMonkeytypeMeta (was missing)
 *   - Added openGraph.images to forStudentsMeta (was missing)
 *   - Added openGraph.images to forTeachersMeta  (was missing)
 *   - Added twitter card images to all pages
 *   - Added missing description fields
 *   - Added keywords to high-value pages
 */

import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://typeblaze.vercel.app";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og/default.png`;

const sharedTwitter = {
  card: "summary_large_image" as const,
  site: "@typeblaze",
  creator: "@typeblaze",
};

const sharedRobots = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

function makeMeta(
  title: string,
  description: string,
  path: string,
  ogImage?: string,
  extra?: Partial<Metadata>
): Metadata {
  const url = `${BASE_URL}${path}`;
  const image = ogImage ?? DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: url },
    robots: sharedRobots,
    openGraph: {
      title,
      description,
      url,
      siteName: "TypeBlaze",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      ...sharedTwitter,
      title,
      description,
      images: [image],
    },
    ...extra,
  };
}

// ── Page metadata ──────────────────────────────────────────────────────────

export const homeMeta: Metadata = makeMeta(
  "TypeBlaze — Free Typing Speed Test, Games & Certificates",
  "Test and improve your typing speed for free. Real-time WPM tracking, fun games, classroom tools for teachers, and achievement certificates. Join 2M+ typists.",
  "/",
  `${BASE_URL}/og/home.png`,
  {
    keywords: [
      "typing speed test", "free typing test", "wpm test", "typing practice",
      "keyboard speed", "typing games", "typing certificate", "touch typing",
    ],
  }
);

export const testMeta: Metadata = makeMeta(
  "Free Typing Speed Test — Measure Your WPM | TypeBlaze",
  "Take a free online typing speed test. Choose 15s, 30s, 60s or 120s. Get instant WPM, accuracy and consistency scores. Words, quotes, numbers and more modes.",
  "/typing-test",
  `${BASE_URL}/og/test.png`
);

export const gamesMeta: Metadata = makeMeta(
  "Typing Games Online — Numbers, Capitals, Quotes | TypeBlaze",
  "Practice typing with fun games. Numbers mode, capital letters drill, famous quotes, custom text, code mode and more. Improve your WPM while playing.",
  "/games",
  `${BASE_URL}/og/games.png`
);

// FIX: was missing openGraph.images
export const leaderboardMeta: Metadata = makeMeta(
  "Global Typing Speed Leaderboard — Top WPM Rankings | TypeBlaze",
  "See the world's fastest typists ranked by WPM. Compete globally, weekly, or monthly. Track your rank and climb the leaderboard.",
  "/leaderboard",
  `${BASE_URL}/og/leaderboard.png`
);

export const classroomMeta: Metadata = makeMeta(
  "Typing Classroom for Teachers — Free Classroom Tools | TypeBlaze",
  "Free typing classroom management for teachers. Create classes, assign typing tests, track student WPM progress and accuracy, and generate achievement certificates.",
  "/classroom",
  `${BASE_URL}/og/classroom.png`,
  {
    keywords: [
      "typing classroom", "classroom typing program", "typing for students",
      "typing test for teachers", "student wpm tracker", "typing curriculum",
    ],
  }
);

export const certificateMeta: Metadata = makeMeta(
  "Free Typing Certificate Online — Earn & Download | TypeBlaze",
  "Earn a verified typing certificate when you reach speed milestones. From Beginner to Master — download your PDF certificate and share your achievement.",
  "/typing-certificate",
  `${BASE_URL}/og/certificate.png`,
  {
    keywords: [
      "typing certificate online", "free typing certificate",
      "wpm certificate", "typing achievement", "typing speed badge",
    ],
  }
);

// FIX: was missing openGraph.images
export const vsMonkeytypeMeta: Metadata = makeMeta(
  "TypeBlaze vs MonkeyType — Which Typing Test Is Better? (2026)",
  "Full feature comparison of TypeBlaze and MonkeyType. Classroom tools, certificates, game modes, design and more — find the best free typing test for your needs.",
  "/vs/monkeytype",
  `${BASE_URL}/og/vs-monkeytype.png`,
  {
    keywords: [
      "monkeytype alternative", "typeblaze vs monkeytype",
      "best typing test", "free typing platform comparison",
    ],
  }
);

export const vsTypingComMeta: Metadata = makeMeta(
  "TypeBlaze vs Typing.com — Free vs Paid Typing Platform (2026)",
  "Compare TypeBlaze and Typing.com side by side. Features, pricing, classroom tools, game modes, and certificates. Is the free option better?",
  "/vs/typing-com",
  `${BASE_URL}/og/vs-typing-com.png`
);

// FIX: was missing openGraph.images
export const forTeachersMeta: Metadata = makeMeta(
  "Free Typing Program for Teachers & Schools — TypeBlaze Classroom",
  "The free typing platform built for classrooms. Set up a class in 2 minutes. Assign tests, track every student's WPM and accuracy, celebrate progress with certificates.",
  "/for/teachers",
  `${BASE_URL}/og/teachers.png`,
  {
    keywords: [
      "typing program for teachers", "classroom typing software",
      "free typing test for students", "student wpm tracker",
      "typing curriculum school", "classroom typing program",
    ],
  }
);

// FIX: was missing openGraph.images
export const forStudentsMeta: Metadata = makeMeta(
  "Free Typing Practice for Students — Learn to Type Fast | TypeBlaze",
  "Students: improve your typing speed with free tests, fun games, and earn certificates to show your school. No account required to start typing right now.",
  "/for/students",
  `${BASE_URL}/og/students.png`,
  {
    keywords: [
      "typing practice for students", "learn to type", "typing for kids",
      "school typing test", "student typing speed", "free typing lessons",
    ],
  }
);

// ── Dynamic metadata helpers ───────────────────────────────────────────────

export function blogPostMeta(
  title: string,
  description: string,
  slug: string,
  ogImage?: string,
  publishedAt?: string
): Metadata {
  return makeMeta(
    `${title} | TypeBlaze Blog`,
    description,
    `/blog/${slug}`,
    ogImage ?? `${BASE_URL}/og/blog-default.png`,
    {
      openGraph: {
        type: "article",
        publishedTime: publishedAt,
        authors: ["TypeBlaze Team"],
      } as any,
    }
  );
}

export function gameModeMeta(
  mode: string,
  description: string
): Metadata {
  return makeMeta(
    `${mode} Typing Practice | TypeBlaze`,
    description,
    `/games/${mode.toLowerCase().replace(/\s+/g, "-")}`,
    `${BASE_URL}/og/games.png`
  );
}
