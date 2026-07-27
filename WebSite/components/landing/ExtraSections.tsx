import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  CalendarClock,
  ListChecks,
  Quote,
  Users,
  FileCode2,
  Bot,
  Bell,
  TrendingUp,
  Building2,
  Handshake,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import SybMark from "@/components/icons/SybMark";

/**
 * Optional landing sections for ShowYourBrand, inspired in structure (not copy)
 * by leading GEO tools and adapted to what SYB actually ships. Each section is
 * self-contained so the sections can be reordered, kept or removed freely.
 */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700">
      <SybMark className="w-3.5 h-3.5" />
      {children}
    </span>
  );
}

/* 1. How it works — 4 concrete steps */
export function HowItWorks() {
  const steps = [
    {
      Icon: Search,
      title: "Add your brand and competitors",
      desc: "Enter your brand, your site and the two or three rivals you keep losing deals to. That's the whole setup.",
    },
    {
      Icon: SlidersHorizontal,
      title: "Pick the prompts and engines",
      desc: "Choose the real questions buyers ask in your category, and which of ChatGPT, Claude, Perplexity and Gemini to track.",
    },
    {
      Icon: CalendarClock,
      title: "We query the AIs on a schedule",
      desc: "Every week (or every day on Pro), we run your prompts, store every answer and turn them into scores, no manual checks.",
    },
    {
      Icon: ListChecks,
      title: "Work the action plan",
      desc: "You get a per-engine score, the sources to earn and a prioritised list of what to fix first to get cited more.",
    },
  ];
  return (
    <section id="how-it-works" className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mt-5 mb-4">
            From invisible to cited, in four steps
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Setup takes minutes. After that ShowYourBrand runs on its own and
            tells you what changed and what to do next.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 lg:p-7 shadow-premium border border-white/60"
            >
              <span className="absolute top-6 right-6 text-4xl font-heading font-medium text-violet-100">
                {i + 1}
              </span>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center ring-1 ring-violet-100 mb-5">
                <s.Icon className="w-6 h-6 text-violet-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 2. Alternating feature deep-dives with lightweight, honest mockups */
function ScoreMock() {
  const rows = [
    { name: "Perplexity", v: 86, c: "bg-violet-500" },
    { name: "ChatGPT", v: 57, c: "bg-fuchsia-500" },
    { name: "Gemini", v: 29, c: "bg-indigo-400" },
    { name: "Claude", v: 14, c: "bg-purple-400" },
  ];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-6">
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-medium text-gray-400">
          Visibility by engine
        </span>
        <span className="text-2xl font-bold text-gradient-premium">47/100</span>
      </div>
      <div className="space-y-3.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className="text-xs w-20 text-gray-600">{r.name}</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${r.c}`}
                style={{ width: `${r.v}%` }}
              />
            </div>
            <span className="text-xs w-8 text-right font-semibold text-gray-700">
              {r.v}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-gray-400 leading-snug">
        Weighted by each engine&apos;s real usage share, not a flat average.
      </p>
    </div>
  );
}

function SourcesMock() {
  const rows = [
    { d: "g2.com", cites: true },
    { d: "reddit.com/r/saas", cites: false },
    { d: "capterra.fr", cites: true },
    { d: "producthunt.com", cites: false },
  ];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-6">
      <span className="text-sm font-medium text-gray-400 block mb-4">
        Sources cited by the AI
      </span>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.d}
            className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5"
          >
            <span className="text-sm text-gray-700">{r.d}</span>
            {r.cites ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="w-3.5 h-3.5" /> mentions you
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                <X className="w-3.5 h-3.5" /> ignores you
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CompetitorMock() {
  const rows = [
    { name: "You", v: 47, bold: true, c: "bg-violet-500" },
    { name: "Competitor A", v: 71, bold: false, c: "bg-gray-400" },
    { name: "Competitor B", v: 63, bold: false, c: "bg-gray-400" },
    { name: "Competitor C", v: 38, bold: false, c: "bg-gray-400" },
  ];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-6">
      <span className="text-sm font-medium text-gray-400 block mb-4">
        You vs competitors, same prompts
      </span>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3">
            <span
              className={`text-xs w-28 ${r.bold ? "font-semibold text-gray-900" : "text-gray-500"}`}
            >
              {r.name}
            </span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${r.c}`}
                style={{ width: `${r.v}%` }}
              />
            </div>
            <span
              className={`text-xs w-8 text-right ${r.bold ? "font-semibold text-gray-900" : "text-gray-500"}`}
            >
              {r.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactMock() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-400">
          Measured impact
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
          <TrendingUp className="w-4 h-4" /> +19 pts
        </span>
      </div>
      <div className="flex items-end gap-2 h-28">
        {[31, 34, 33, 40, 44, 50].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-fuchsia-400"
              style={{ height: `${h * 1.6}px` }}
            />
            <span className="text-[10px] text-gray-400">W{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-gray-400 leading-snug">
        Real week-over-week movement from stored runs, shown as correlation, not
        a causation claim.
      </p>
    </div>
  );
}

function FeatureRow({
  eyebrow,
  title,
  desc,
  bullets,
  mock,
  flip,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  bullets: string[];
  mock: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
      <div className={flip ? "lg:order-2" : ""}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 mt-5 mb-4 leading-tight">
          {title}
        </h3>
        <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-5">
          {desc}
        </p>
        <ul className="space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-gray-700">
              <span className="mt-1 w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-violet-700" />
              </span>
              <span className="text-sm md:text-base leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`relative ${flip ? "lg:order-1" : ""}`}>
        <div className="absolute -inset-4 bg-gradient-to-br from-violet-200/40 via-fuchsia-200/25 to-transparent rounded-[2.5rem] blur-2xl" />
        <div className="relative">{mock}</div>
      </div>
    </div>
  );
}

export function FeatureDeepDives() {
  return (
    <section className="px-4 py-16 md:py-24 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl space-y-20 md:space-y-28">
        <FeatureRow
          eyebrow="Per-engine scores"
          title="One score per engine, not a vague global grade"
          desc="Being strong on Perplexity and invisible on ChatGPT are two very different problems. ShowYourBrand scores each engine separately and weights the global by real usage share."
          bullets={[
            "Presence rate per prompt, per engine, refreshed automatically",
            "Global score weighted toward the engines your buyers actually use",
            "12 weeks of history so you see the trend, not a snapshot",
          ]}
          mock={<ScoreMock />}
        />
        <FeatureRow
          flip
          eyebrow="Cited sources"
          title="See the pages AI pulls from, and whether they mention you"
          desc="Models don't invent answers, they cite specific pages. We surface every source behind your prompts and flag the ones that ignore your brand, so you know exactly where to earn a mention."
          bullets={[
            "Every source the engines cite for your prompts, deduplicated",
            "A clear ‘mentions you / ignores you' flag on each one",
            "Ranked by how often it's cited, so you start with the highest-leverage ones",
          ]}
          mock={<SourcesMock />}
        />
        <FeatureRow
          eyebrow="Competitor benchmark"
          title="Watch competitors on the exact same prompts"
          desc="Your score only means something next to theirs. We run your rivals through the same prompts and engines so you can see, prompt by prompt, who the AI recommends instead of you."
          bullets={[
            "Side-by-side visibility on identical prompts and engines",
            "Spot the queries where a competitor wins and you don't",
            "Add or change competitors any time",
          ]}
          mock={<CompetitorMock />}
        />
        <FeatureRow
          flip
          eyebrow="Impact loop"
          title="Prove that your GEO work actually moves the score"
          desc="Publish a fix, then watch the effect. ShowYourBrand compares your stored runs week after week and shows the real movement per engine, honestly labelled as correlation."
          bullets={[
            "Baseline captured automatically from your monitoring history",
            "Per-engine and global deltas between any two weeks",
            "No inflated ‘guaranteed +X pts' promises, just measured change",
          ]}
          mock={<ImpactMock />}
        />
      </div>
    </section>
  );
}

/* 3. What AI says about you — sentiment / reading responses */
export function WhatAISays() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <Eyebrow>Read every answer</Eyebrow>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mt-5 mb-4 leading-tight">
              Know what AI actually says about you
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-5">
              A score tells you if you&apos;re cited. The full answer tells you
              how. We keep every response, so you can read exactly how each
              engine describes your brand and where it puts you next to rivals.
            </p>
            <ul className="space-y-2.5">
              {[
                "Full, stored responses for every prompt and engine",
                "See the exact wording and the position you're given",
                "Catch a bad or outdated description before it spreads",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-gray-700">
                  <span className="mt-1 w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-violet-700" />
                  </span>
                  <span className="text-sm md:text-base leading-relaxed">
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-violet-200/40 via-fuchsia-200/25 to-transparent rounded-[2.5rem] blur-2xl" />
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-premium-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Quote className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-medium text-gray-400">
                  Perplexity, answer stored on this week&apos;s run
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                &ldquo;For French B2B cold email, the tools most often
                recommended are{" "}
                <span className="bg-violet-100 text-violet-800 rounded px-1 font-medium">
                  your brand
                </span>{" "}
                and Competitor A. Your brand is usually cited first for
                deliverability&hellip;&rdquo;
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 font-medium">
                  Cited 1st
                </span>
                <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-3 py-1 font-medium">
                  Positive framing
                </span>
                <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-3 py-1 font-medium">
                  2 sources
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 4. Technical readiness + generated deliverables + outreach + alerts grid */
export function BeyondMonitoring() {
  const cards = [
    {
      Icon: Bot,
      title: "Make sure AI can read your site",
      desc: "We fetch your real robots.txt and llms.txt live and check that GPTBot, ClaudeBot, PerplexityBot and Google-Extended can actually reach your pages.",
    },
    {
      Icon: FileCode2,
      title: "Generate the deliverables, not just advice",
      desc: "One click produces a filled llms.txt, FAQ JSON-LD, an answer page for a query you lose and Organization schema, ready to publish.",
    },
    {
      Icon: Handshake,
      title: "Earn mentions on trusted sources",
      desc: "For each source that ignores you, we find the right channel and draft the message. You review and send, nothing is published automatically.",
    },
    {
      Icon: Bell,
      title: "Get alerted when your score moves",
      desc: "A meaningful drop or spike on any engine triggers an email, so you react in days instead of discovering it a quarter later.",
    },
  ];
  return (
    <section className="px-4 py-16 md:py-24 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Beyond monitoring</Eyebrow>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mt-5 mb-4">
            Not just what&apos;s wrong, the work to fix it
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Most tools stop at a report. ShowYourBrand goes from diagnosis to
            ready-to-ship deliverables and human-reviewed outreach.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((c) => (
            <div
              key={c.title}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-premium border border-white/60 flex gap-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center ring-1 ring-violet-100 flex-shrink-0">
                <c.Icon className="w-6 h-6 text-violet-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {c.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 5. Who it's for */
export function WhoItsFor() {
  const personas = [
    {
      Icon: TrendingUp,
      title: "Marketing & growth teams",
      desc: "Own your brand's presence in the answers buyers now trust, and report on it like any other channel.",
    },
    {
      Icon: Users,
      title: "SEO & GEO consultants",
      desc: "Bring a new, data-backed service to clients: track AI visibility, prove wins, and justify retainers.",
    },
    {
      Icon: Building2,
      title: "Agencies with many clients",
      desc: "Monitor 10 to 20 brands from one dashboard and hand over reports in your own colours.",
    },
  ];
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Who it&apos;s for</Eyebrow>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mt-5 mb-4">
            Built for the people who own visibility
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {personas.map((p) => (
            <div
              key={p.title}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-7 shadow-premium border border-white/60"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center ring-1 ring-violet-100 mb-5">
                <p.Icon className="w-6 h-6 text-violet-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 6. Agency / white-label band (dark) */
export function AgencyBand() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0B1120] px-6 py-14 md:px-14 md:py-20 text-white shadow-premium-lg">
          <div className="absolute inset-0 bg-grid-dark opacity-70" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
          <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-violet-200 mb-5">
                <SybMark className="w-3.5 h-3.5" />
                Agency mode
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium mb-4 leading-tight">
                Run every client&apos;s AI visibility from one place
              </h2>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6">
                Manage 10 to 20 brands, switch between them in a click, and send
                each client a report with your logo and colours, not ours.
              </p>
              <Link
                href="/signup?plan=agency"
                className="inline-flex items-center gap-2 rounded-full bg-white text-gray-900 hover:bg-gray-100 px-7 py-3.5 text-sm font-semibold transition-colors"
              >
                Explore the agency plan
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid gap-3">
              {[
                "Multi-client dashboard with per-brand scoping",
                "White-label PDF reports with your branding",
                "Per-engine, per-client recommendations",
                "Priority support in French",
              ].map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-violet-100" />
                  </span>
                  <span className="text-sm text-gray-200">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 7. GEO vs SEO comparison */
export function GeoVsSeo() {
  const rows = [
    { label: "Where buyers look", seo: "Ten blue links to scroll", geo: "One answer, one or two brands named" },
    { label: "What you optimise", seo: "Keywords and rankings", geo: "Being cited by the model, and by its sources" },
    { label: "How you measure", seo: "Position and clicks", geo: "Per-engine citation rate and share of answer" },
    { label: "The risk", seo: "Page two", geo: "Not being mentioned at all" },
  ];
  return (
    <section className="px-4 py-16 md:py-24 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Why it&apos;s different</Eyebrow>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mt-5 mb-4">
            GEO is not SEO with a new name
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            The rules changed when the answer replaced the results page.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/60 shadow-premium bg-white">
          <div className="grid grid-cols-3 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <div className="px-5 py-4" />
            <div className="px-5 py-4">Classic SEO</div>
            <div className="px-5 py-4 text-violet-700">GEO with SYB</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.label}
              className={`grid grid-cols-3 text-sm ${i % 2 ? "bg-white" : "bg-gray-50/40"}`}
            >
              <div className="px-5 py-4 font-medium text-gray-800">
                {r.label}
              </div>
              <div className="px-5 py-4 text-gray-500">{r.seo}</div>
              <div className="px-5 py-4 text-gray-800 font-medium">{r.geo}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** All optional sections in one block; reorder or remove freely in index.tsx. */
export default function ExtraSections() {
  return (
    <>
      <HowItWorks />
      <FeatureDeepDives />
      <WhatAISays />
      <BeyondMonitoring />
      <WhoItsFor />
      <AgencyBand />
      <GeoVsSeo />
    </>
  );
}
