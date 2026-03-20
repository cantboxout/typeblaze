import Link from "next/link";

export default function HomePage() {
  return (
    <main className="seo-content">
      <h1>TypeBlaze</h1>
      <p className="lead">
        Free typing speed tests, focused game modes, and progress tools to help you
        improve WPM and accuracy.
      </p>

      <h2>Start Typing</h2>
      <ul>
        <li>
          <Link href="/games/words">Words Mode</Link>
        </li>
        <li>
          <Link href="/games/numbers">Numbers Mode</Link>
        </li>
      </ul>

      <h2>Learn and Compare</h2>
      <ul>
        <li>
          <Link href="/for/teachers">For Teachers</Link>
        </li>
        <li>
          <Link href="/blog/how-to-type-faster">How to Type Faster</Link>
        </li>
        <li>
          <Link href="/vs/monkeytype">TypeBlaze vs MonkeyType</Link>
        </li>
      </ul>
    </main>
  );
}
