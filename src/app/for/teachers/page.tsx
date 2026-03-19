/**
 * TypeBlaze — For Teachers Landing Page
 * app/for/teachers/page.tsx
 * Target: "classroom typing program" (5K/mo, KD 22) + "typing test for teachers"
 */

import type { Metadata } from "next";
import { ClassroomSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Free Typing Program for Teachers & Schools — TypeBlaze Classroom",
  description:
    "The free typing platform built for classrooms. Set up a class in 2 minutes. Assign tests, track every student's WPM and accuracy, celebrate progress with certificates. No subscription needed.",
  alternates: { canonical: "https://typeblaze.com/for/teachers" },
  keywords: [
    "typing program for teachers", "classroom typing software",
    "free typing test for students", "typing class management",
    "student wpm tracker", "typing curriculum school",
  ],
};

export default function ForTeachersPage() {
  return (
    <>
      <ClassroomSchema />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "For Teachers", path: "/for/teachers" },
        ]}
      />

      <article className="seo-content">

        <h1>The Free Typing Program Teachers Actually Want to Use</h1>
        <p className="lead">
          TypeBlaze Classroom gives teachers everything they need to run a
          structured typing programme: a class dashboard, student invitations,
          assigned tests, live progress tracking, and automatic certificates — all
          free, with no subscription and no credit card.
        </p>

        {/* ── Why teachers choose TypeBlaze ── */}
        <h2>Why Teachers Choose TypeBlaze</h2>

        <h3>Set up a class in under 2 minutes</h3>
        <p>
          Create a teacher account, name your class, and share the join code with
          your students. They sign up or join as guests, and they immediately
          appear in your roster. There is no IT approval process, no app
          installation, and no per-student licensing fee. TypeBlaze works in any
          browser on any device.
        </p>

        <h3>See every student's progress at a glance</h3>
        <p>
          Your classroom dashboard shows each student's current WPM, accuracy
          percentage, number of tests completed, and improvement trend over time.
          You can sort by any metric to instantly see who is excelling and who
          needs additional support. All data updates in real time as students
          complete tests.
        </p>

        <h3>Assign targeted typing exercises</h3>
        <p>
          Create assignments with specific parameters: a minimum WPM target, a
          required accuracy threshold, a test mode (words, quotes, numbers,
          capitals), and a due date. Students see the assignment in their
          dashboard and their results are automatically linked to it. You get
          completion tracking without any manual grading.
        </p>

        <h3>Celebrate achievement with certificates</h3>
        <p>
          When students reach a WPM milestone, TypeBlaze automatically generates
          a professional PDF certificate. You can print these for classroom
          displays, share them with parents, or encourage students to add them to
          their portfolios. Recognition is a proven motivator in educational
          settings — TypeBlaze makes it automatic.
        </p>

        {/* ── Curriculum fit ── */}
        <h2>How TypeBlaze Fits Your Curriculum</h2>

        <h3>Computer Science and ICT classes</h3>
        <p>
          TypeBlaze is a natural fit for technology curriculum. Students learn
          proper keyboard technique, build speed benchmarks, and practise
          code-syntax typing patterns. The platform's clean data output — WPM,
          accuracy, test history — can also serve as a dataset for data analysis
          exercises.
        </p>

        <h3>English and language arts</h3>
        <p>
          Quotes mode exposes students to well-constructed sentences from great
          writers while building typing speed. Custom mode lets teachers assign
          passages from set texts — students type lines from the novel they are
          studying, internalising both language and keyboard skills simultaneously.
        </p>

        <h3>Business and office skills</h3>
        <p>
          Many business education syllabuses include a minimum typing speed
          requirement (typically 40 WPM). TypeBlaze provides a free, measurable,
          certifiable path to that goal, with downloadable proof that students
          can include in job applications.
        </p>

        <h3>Special education and differentiated learning</h3>
        <p>
          TypeBlaze's assignment system allows teachers to set different targets
          for different students within the same class. A student who enters at
          15 WPM gets a 25 WPM milestone target while another student works toward
          60 WPM — both tracked, both celebrated, both motivated by visible
          personal progress.
        </p>

        {/* ── Compared to paid alternatives ── */}
        <h2>TypeBlaze vs Paid Typing Programmes</h2>
        <p>
          Popular school typing platforms typically charge between $30 and $80 per
          student per year for classroom access. For a class of 30 students, that
          is $900–$2,400 annually for features that TypeBlaze provides free. The
          difference: TypeBlaze is ad-supported for students (non-intrusive banner
          ads) rather than subscription-funded. Teachers and school administrators
          never pay anything.
        </p>

        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>TypeBlaze</th>
              <th>Typical Paid Platform</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Classroom dashboard</td><td>✅ Free</td><td>✅ Paid ($30–80/student/yr)</td></tr>
            <tr><td>Student progress tracking</td><td>✅ Free</td><td>✅ Paid</td></tr>
            <tr><td>Assignments with due dates</td><td>✅ Free</td><td>✅ Paid</td></tr>
            <tr><td>Achievement certificates</td><td>✅ Free PDF</td><td>⚠️ Sometimes included</td></tr>
            <tr><td>Multiple game modes</td><td>✅ 6+ modes</td><td>⚠️ Varies</td></tr>
            <tr><td>Custom text practice</td><td>✅ Free</td><td>⚠️ Sometimes paid</td></tr>
            <tr><td>No IT setup required</td><td>✅ Browser-based</td><td>⚠️ Often requires setup</td></tr>
            <tr><td>Student data privacy</td><td>✅ FERPA-aligned</td><td>✅ Usually</td></tr>
          </tbody>
        </table>

        {/* ── FAQ ── */}
        <h2>Teacher FAQ</h2>

        <h3>Is TypeBlaze really free for teachers?</h3>
        <p>
          Yes. Teacher accounts, classroom creation, student tracking, assignment
          management, and certificate generation are all completely free. TypeBlaze
          is funded by non-intrusive advertising shown to students, not by teacher
          or school subscriptions.
        </p>

        <h3>How many students can I add to a class?</h3>
        <p>
          There is no hard limit on class size during the free period. TypeBlaze
          supports standard class sizes (20–35 students) comfortably, and larger
          groups for computer lab or whole-school implementations.
        </p>

        <h3>Is student data private and secure?</h3>
        <p>
          TypeBlaze stores only the data required to provide the service: student
          display names, typing test results, and assignment completions. No
          personal contact information is required for student accounts. Data is
          encrypted in transit and at rest, and is never sold to third parties.
        </p>

        <h3>Can students use TypeBlaze at home?</h3>
        <p>
          Yes. Students can access their TypeBlaze account from any device with a
          browser. Their class, assignments, and progress history are all linked
          to their account and available anywhere.
        </p>

        <h3>What grade levels is TypeBlaze appropriate for?</h3>
        <p>
          TypeBlaze is used in elementary schools (age 8+) through university
          level. The interface is clean and simple enough for younger students,
          while the certificate and leaderboard features provide appropriate
          challenge for advanced students and adults.
        </p>

      </article>
    </>
  );
}
