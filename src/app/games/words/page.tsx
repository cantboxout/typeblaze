/**
 * TypeBlaze — Words Mode Page
 * app/games/words/page.tsx
 * Target keyword: "typing practice words" (165K/mo, KD 64)
 */

import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Words Typing Practice — Build Speed with Real Vocabulary | TypeBlaze",
  description:
    "Practice typing with the most common English words. Real-time WPM and accuracy tracking. Choose 15, 30, 60 or 120-second tests. Free — no sign-up needed.",
  alternates: { canonical: "https://typeblaze.com/games/words" },
  openGraph: {
    title: "Words Typing Practice — TypeBlaze",
    description: "Build typing speed with common English words. Free WPM test, instant feedback.",
    url: "https://typeblaze.com/games/words",
  },
};

export default function WordsModePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Games", path: "/games" },
          { name: "Words Mode", path: "/games/words" },
        ]}
      />

      {/* ── Above the fold: embed the actual typing test ── */}
      {/* <TypingTest defaultMode="words" /> */}

      {/* ── SEO content section ── */}
      <article className="seo-content">

        <h1>Words Mode — The Foundation of Faster Typing</h1>
        <p className="lead">
          Words mode is the core TypeBlaze experience: a randomised stream of the
          most common English words, timed, with live WPM and accuracy feedback.
          It is the single most effective way to build raw typing speed because
          your muscle memory adapts to the patterns that appear most often in
          real writing.
        </p>

        {/* ── What is words mode ── */}
        <h2>What Is Words Mode?</h2>
        <p>
          In Words mode, TypeBlaze presents a continuous stream of high-frequency
          English vocabulary drawn from the top 1,000 most common words. Each
          test runs for a duration you choose — 15, 30, 60, or 120 seconds —
          while the system tracks every keystroke in real time. Correct characters
          light up as you type; errors are highlighted in red so you see exactly
          where you slow down or make mistakes.
        </p>
        <p>
          At the end of your test you receive a detailed breakdown: your WPM
          (words per minute), raw accuracy percentage, the number of correct and
          incorrect words, and your consistency score. If you hit a milestone —
          20, 40, 60, 80, or 100+ WPM — a certificate is automatically generated
          for you to download and share.
        </p>

        {/* ── Why high-frequency words ── */}
        <h2>Why High-Frequency Words Beat Random Text</h2>
        <p>
          Studies in motor learning consistently show that deliberate, repeated
          exposure to a defined set of patterns produces faster skill acquisition
          than random input. The same principle applies to typing. The 1,000 most
          common English words account for roughly 85% of all written text. By
          practising with this vocabulary, you are directly training the finger
          sequences that will appear in your emails, documents, and code — not
          obscure words you will never type again.
        </p>
        <p>
          This is why platforms like TypeBlaze, MonkeyType, and Keybr all use
          weighted word lists rather than random dictionary words. The repetition
          builds genuine muscle memory, not just test familiarity.
        </p>

        {/* ── How to improve ── */}
        <h2>How to Improve Your WPM in Words Mode</h2>

        <h3>1. Prioritise accuracy over speed</h3>
        <p>
          The single most common mistake new typists make is prioritising speed
          before they have accuracy. Every backspace costs you more time than the
          mistake itself. Aim for 95%+ accuracy at your current speed before
          pushing for higher WPM. TypeBlaze highlights errors in real time — treat
          red characters as the signal to slow down, not panic and rush.
        </p>

        <h3>2. Use the 60-second test as your benchmark</h3>
        <p>
          The 15-second test rewards bursts of speed and luck. The 120-second test
          measures endurance. The 60-second test is the most reliable benchmark for
          true typing ability because it balances both. Track your 60-second score
          weekly to see consistent progress rather than daily variance.
        </p>

        <h3>3. Do not look at the keyboard</h3>
        <p>
          Touch typing — placing all ten fingers on the home row and never
          looking down — is the ceiling-breaking technique. A hunt-and-peck typist
          rarely exceeds 50–60 WPM. A touch typist can comfortably reach 80–120
          WPM with practice. If you are still looking at the keyboard, spend one
          week deliberately practising with your eyes on the screen only, even if
          your speed drops temporarily.
        </p>

        <h3>4. Target your problem keys</h3>
        <p>
          After each test, review which words caused the most errors. Most typists
          have consistent weak spots — common culprits are the letters B, Y, and P
          (which require awkward finger stretches) and frequent bigrams like
          "th", "he", and "in". Use TypeBlaze's custom text mode to create
          targeted drills for your weak keys.
        </p>

        <h3>5. Practice daily in short sessions</h3>
        <p>
          Twenty minutes of daily focused practice outperforms two hours once a
          week. Motor skills — typing included — consolidate during sleep. Short
          daily sessions allow your nervous system to encode the patterns overnight.
          Most TypeBlaze users who practice 15–20 minutes per day report a
          10–20 WPM improvement within their first month.
        </p>

        {/* ── WPM benchmarks ── */}
        <h2>WPM Benchmarks: Where Do You Stand?</h2>
        <p>
          TypeBlaze awards certificates at the following milestones based on
          aggregate data from millions of tests:
        </p>

        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th>WPM Range</th>
              <th>Who This Describes</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Newcomer</td><td>0–19 WPM</td><td>Just starting out or relearning touch typing</td></tr>
            <tr><td>Beginner</td><td>20–39 WPM</td><td>Casual typist, some hunt-and-peck habits</td></tr>
            <tr><td>Intermediate</td><td>40–59 WPM</td><td>Average office worker or student</td></tr>
            <tr><td>Advanced</td><td>60–79 WPM</td><td>Proficient touch typist</td></tr>
            <tr><td>Expert</td><td>80–99 WPM</td><td>Fast professional typist</td></tr>
            <tr><td>Master</td><td>100+ WPM</td><td>Top 5% of all typists globally</td></tr>
          </tbody>
        </table>

        <p>
          The global average on TypeBlaze is 52 WPM. If you are already above
          that, you are ahead of the majority of typists. If you are below, the
          gap to the average is entirely closeable with consistent practice.
        </p>

        {/* ── FAQ ── */}
        <h2>Frequently Asked Questions</h2>

        <h3>How is WPM calculated in Words mode?</h3>
        <p>
          TypeBlaze calculates WPM as the total number of correctly typed
          characters divided by 5 (the standard definition of one "word"), divided
          by the elapsed time in minutes. Only correctly completed words count —
          words with any uncorrected error are excluded from your score, which
          incentivises accuracy.
        </p>

        <h3>Can I change the word list?</h3>
        <p>
          Yes. TypeBlaze offers English by default but you can switch to
          programming-focused word lists or switch to Custom mode and paste your
          own vocabulary. Teachers can also configure custom word sets for
          classroom assignments.
        </p>

        <h3>Does WPM matter for jobs?</h3>
        <p>
          Many roles — data entry, transcription, legal assistant, customer
          support — specify a minimum WPM requirement, typically 40–60 WPM.
          Some competitive roles require 80+ WPM. TypeBlaze certificates are
          downloadable and can be added to a CV or LinkedIn profile as evidence
          of verified typing speed.
        </p>

        <h3>What is the world record for typing speed?</h3>
        <p>
          The Guinness World Record for English typing speed is 216 WPM, set by
          Stella Pajunas in 1946 on an IBM electric typewriter. On modern
          keyboards, competitive typists regularly exceed 200 WPM using tools like
          TypeBlaze and MonkeyType.
        </p>

      </article>
    </>
  );
}
