import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { iniciarDemo } from "@/lib/demo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Steady" },
      {
        name: "description",
        content:
          "Steady is a mobile gym log designed for one real user: an older adult who logs sets, weight, water and cardio on his phone.",
      },
      { property: "og:title", content: "About Steady — a gym log built for my father" },
      {
        property: "og:description",
        content: "Design decisions behind Steady, a private, installable gym tracker PWA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function DemoButton() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      className="ui-cta w-full"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await iniciarDemo();
          navigate({ to: "/dashboards" });
        } catch (e) {
          setLoading(false);
          toast.error(e instanceof Error ? e.message : "Could not start the demo.");
        }
      }}
    >
      {loading ? "Preparing demo…" : "Try the demo"}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ui-card">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}

function Decision({ title, children }: { title: string; children: ReactNode }) {
  return (
    <p>
      <strong className="font-semibold text-ink">{title}</strong> {children}
    </p>
  );
}

function AboutPage() {
  return (
    <main lang="en" className="min-h-screen bg-canvas px-5 py-10">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <p className="text-2xl font-extrabold tracking-tighter lowercase text-brand-gradient">
          steady
        </p>
        <h1 className="text-[2.1rem] leading-[1.08] font-semibold text-brand-gradient">
          A gym log built for one person: <span className="serif-emphasis">my father.</span>
        </h1>
        <p className="text-[0.95rem] leading-relaxed text-gray-600">
          Steady is a mobile web app for tracking gym progress: sets, weight, water and cardio. It
          was designed for a single real user, an older adult who logs his training on his phone
          between sets.
        </p>
        <DemoButton />

        <Section title="Why it exists">
          <p>
            Most fitness apps are built for people who want plans, feeds and coaching. My father
            wanted three things: log a set in seconds, see what he lifted last time, and know
            whether he is improving. Everything in Steady follows from those three needs.
          </p>
        </Section>

        <Section title="Design decisions">
          <Decision title="Large targets, short flows.">
            Every tap target is at least 44 px. Adding a glass of water is one tap. Logging a set is
            two fields.
          </Decision>
          <Decision title={"\u201CLast time\u201D before every set."}>
            When he picks a strength exercise, the app shows the sets from his previous session, so
            the number to beat is visible before he lifts.
          </Decision>
          <Decision title="One entry per day.">
            Body weight and water are stored once per user per day. Correcting a mistake edits the
            entry; it never creates a duplicate.
          </Decision>
          <Decision title="Private by default.">
            Row Level Security is enabled on every table and keyed to the signed-in user. Default
            exercises are shared; exercises a user creates are private to that user.
          </Decision>
          <Decision title="Installable.">
            Steady is a PWA. It installs to the home screen and opens even when the gym signal is
            weak.
          </Decision>
          <Decision title="A demo that cannot break.">
            {"\u201C"}Try the demo{"\u201D"} creates an anonymous session with its own sample data,
            deleted after 24 hours. There is no shared demo account for visitors to modify.
          </Decision>
        </Section>

        <Section title="Built with">
          <p>
            Lovable · Supabase (Postgres, Auth, Row Level Security) · React · TypeScript · Tailwind
            CSS · Recharts
          </p>
        </Section>

        <Section title="Why it is in Spanish">
          <p>Its first user lives in Medellín, Colombia. The interface speaks his language.</p>
        </Section>

        <DemoButton />

        <p className="pt-2 text-center text-sm text-gray-500">
          Built by <strong className="font-semibold text-ink">Santiago Cardona Ortiz</strong> ·{" "}
          <a className="font-semibold text-violet-strong" href="https://github.com/santiagocardonao" target="_blank" rel="noreferrer">
            GitHub
          </a>{" "}
          ·{" "}
          <a className="font-semibold text-violet-strong" href="https://www.linkedin.com/in/scardonaortiz" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </p>
      </div>
    </main>
  );
}
