/**
 * TypeBlaze — JSON-LD Structured Data Schemas
 * src/components/seo/JsonLd.tsx
 *
 * Usage:
 *   import { HomeSchemas, TestPageSchema, FAQSchema } from "@/components/seo/JsonLd";
 *   // In your page or layout:
 *   <HomeSchemas />
 */

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://typeblaze.vercel.app";

// ── Generic injector ───────────────────────────────────────────────────────
function JsonLd({ data }: { data: object | object[] }) {
  const schema = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data }
    : data;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}

// ── Organization ──────────────────────────────────────────────────────────
const organization = {
  "@type": "Organization",
  "@id": `${BASE}/#organization`,
  name: "TypeBlaze",
  url: BASE,
  logo: {
    "@type": "ImageObject",
    url: `${BASE}/logo.png`,
    width: 512,
    height: 512,
  },
  sameAs: [
    "https://twitter.com/typeblaze",
    "https://github.com/typeblaze",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@typeblaze.com",
    availableLanguage: "English",
  },
};

// ── WebSite (enables sitelinks search box) ────────────────────────────────
const website = {
  "@type": "WebSite",
  "@id": `${BASE}/#website`,
  url: BASE,
  name: "TypeBlaze",
  description:
    "Free typing speed test and practice platform with games, classroom tools, and certificates.",
  publisher: { "@id": `${BASE}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

// ── WebApplication ────────────────────────────────────────────────────────
const webApp = {
  "@type": "WebApplication",
  "@id": `${BASE}/#webapp`,
  name: "TypeBlaze",
  url: BASE,
  description:
    "Free online typing speed test and practice platform. Features games, classroom management, and achievement certificates.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "All",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "Real-time WPM and accuracy tracking",
    "Multiple typing game modes",
    "Classroom management for teachers",
    "Downloadable achievement certificates",
    "Global leaderboard",
    "Custom text practice",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    bestRating: "5",
    worstRating: "1",
    ratingCount: "12400",
  },
  author: { "@id": `${BASE}/#organization` },
};

// ── FAQ ────────────────────────────────────────────────────────────────────
const faqItems = [
  {
    q: "What is a good typing speed in WPM?",
    a: "The average typing speed is around 40 WPM. Professional typists typically reach 65–75 WPM. Power users and programmers often hit 100+ WPM. TypeBlaze awards certificates at every milestone from Beginner (20 WPM) to Master (100+ WPM).",
  },
  {
    q: "Is TypeBlaze free to use?",
    a: "Yes. TypeBlaze is completely free for all students. Teachers get full classroom management, student tracking, and assignment tools included at no cost.",
  },
  {
    q: "How do I improve my typing speed?",
    a: "Practice daily with TypeBlaze's speed tests and games. Focus on accuracy first — speed follows naturally. Aim for 15–30 minutes of deliberate practice each day. Most users see measurable improvement within two weeks.",
  },
  {
    q: "Can teachers use TypeBlaze with their class?",
    a: "Yes. TypeBlaze has a dedicated Classroom mode. Teachers can create a class, invite students via a class code, assign typing tests, and track each student's WPM and accuracy over time.",
  },
  {
    q: "How do I earn a typing certificate?",
    a: "Complete a typing test on TypeBlaze. When you reach a milestone (20, 40, 60, 80, or 100+ WPM), a certificate is automatically generated. You can download it as a PDF and share it or add it to your resume.",
  },
  {
    q: "What typing test modes does TypeBlaze offer?",
    a: "TypeBlaze offers: Words mode (random vocabulary), Quotes mode (famous quotes), Numbers mode (digits and sequences), Capitals mode (uppercase practice), Custom Text (paste your own content), and Code mode (programming syntax).",
  },
  {
    q: "Does TypeBlaze work on mobile?",
    a: "Yes. TypeBlaze is fully responsive and works on smartphones and tablets. For best results, use a physical keyboard.",
  },
  {
    q: "How is WPM calculated on TypeBlaze?",
    a: "WPM (Words Per Minute) is calculated as the number of correct characters typed, divided by 5 (a standard 'word'), divided by elapsed time in minutes. Only correctly typed words count toward your score.",
  },
];

const faqSchema = {
  "@type": "FAQPage",
  "@id": `${BASE}/#faq`,
  mainEntity: faqItems.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

// ── Breadcrumbs (reusable factory) ────────────────────────────────────────
export function breadcrumb(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${BASE}${path}`,
    })),
  };
}

// ── Course (Classroom / For Teachers page) ────────────────────────────────
const courseSchema = {
  "@type": "Course",
  name: "TypeBlaze Typing Program",
  description:
    "Structured typing curriculum for classrooms. Teachers assign progressive speed and accuracy drills, track student progress, and award certificates.",
  provider: { "@id": `${BASE}/#organization` },
  url: `${BASE}/classroom`,
  educationalLevel: "beginner to advanced",
  teaches: "Touch typing, keyboard speed, typing accuracy",
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    instructor: { "@type": "Organization", name: "TypeBlaze" },
  },
};

// ── SoftwareApplication (alternative type for app stores) ─────────────────
const softwareApp = {
  "@type": "SoftwareApplication",
  name: "TypeBlaze",
  operatingSystem: "Web",
  applicationCategory: "EducationApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "12400",
  },
};

// ── Exported page-level schema components ─────────────────────────────────

/** Home page — use in app/page.tsx */
export function HomeSchemas() {
  return (
    <JsonLd
      data={[
        { "@context": "https://schema.org", ...organization },
        { "@context": "https://schema.org", ...website },
        { "@context": "https://schema.org", ...webApp },
        { "@context": "https://schema.org", ...faqSchema },
      ]}
    />
  );
}

/** Typing test page */
export function TestPageSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        ...breadcrumb([
          { name: "Home", path: "/" },
          { name: "Typing Test", path: "/typing-test" },
        ]),
      }}
    />
  );
}

/** Games page */
export function GamesPageSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "TypeBlaze Typing Game Modes",
        url: `${BASE}/games`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Words Mode",    url: `${BASE}/games/words` },
          { "@type": "ListItem", position: 2, name: "Quotes Mode",   url: `${BASE}/games/quotes` },
          { "@type": "ListItem", position: 3, name: "Numbers Mode",  url: `${BASE}/games/numbers` },
          { "@type": "ListItem", position: 4, name: "Capitals Mode", url: `${BASE}/games/capitals` },
          { "@type": "ListItem", position: 5, name: "Custom Text",   url: `${BASE}/games/custom` },
          { "@type": "ListItem", position: 6, name: "Code Mode",     url: `${BASE}/games/code` },
        ],
      }}
    />
  );
}

/** Classroom / teachers page */
export function ClassroomSchema() {
  return (
    <JsonLd
      data={[
        { "@context": "https://schema.org", ...courseSchema },
        {
          "@context": "https://schema.org",
          ...breadcrumb([
            { name: "Home", path: "/" },
            { name: "Classroom", path: "/classroom" },
          ]),
        },
      ]}
    />
  );
}

/** Certificate landing page */
export function CertificatePageSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "EducationalOccupationalCredential",
        name: "TypeBlaze Typing Certificate",
        description:
          "A verified achievement certificate awarded to typists who reach speed milestones on TypeBlaze.",
        url: `${BASE}/typing-certificate`,
        credentialCategory: "certificate",
        competencyRequired: "Typing speed of 20 WPM or above",
        recognizedBy: { "@id": `${BASE}/#organization` },
      }}
    />
  );
}

/** FAQ block — can be added to home or a dedicated /faq page */
export function FAQSchema() {
  return <JsonLd data={{ "@context": "https://schema.org", ...faqSchema }} />;
}

/** Generic breadcrumb helper */
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  return (
    <JsonLd
      data={{ "@context": "https://schema.org", ...breadcrumb(items) }}
    />
  );
}
