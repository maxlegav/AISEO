import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUp, Check, ChevronDown, Minus, Plus, X } from "lucide-react";

function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Bar({ value, color, inView, delay = 0 }: { value: number; color: string; inView: boolean; delay?: number }) {
  return (
    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out"
        style={{ width: inView ? `${value}%` : "0%", backgroundColor: color, transitionDelay: `${delay}ms` }}
      />
    </div>
  );
}

const ANSWER =
  "For a French B2B team, the tools most often recommended are Competitor A and Competitor B. Competitor A is usually picked for deliverability, Competitor B for price.";

const engineRows = [
  { name: "ChatGPT", logo: "/logos/openai-logo.svg", cited: false, note: "Not cited" },
  { name: "Perplexity", logo: "/logos/perplexity-logo.svg", cited: true, note: "Cited 2nd" },
  { name: "Claude", logo: "/logos/claude-logo.svg", cited: false, note: "Not cited" },
  { name: "Gemini", logo: "/logos/gemini-logo.svg", cited: true, note: "Cited 3rd" },
];

export function AnswerSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.7);
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setTyped((t) => {
        if (t >= ANSWER.length) {
          clearInterval(id);
          return t;
        }
        return t + 2;
      });
    }, 22);
    return () => clearInterval(id);
  }, [inView]);
  const done = typed >= ANSWER.length;

  return (
    <section className="px-4 py-16 md:py-28 border-t border-ink-200">
      <div className="container mx-auto max-w-6xl grid gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16 items-center">
        <div>
          <h2 className="font-heading text-4xl md:text-5xl font-medium leading-[1.08]">
            Search gave ten links.
            <br />
            AI gives one answer.
          </h2>
          <p className="mt-5 text-base md:text-lg leading-relaxed text-ink-600">
            Your buyers ask ChatGPT, Claude or Perplexity which tool to pick, and act on the
            two or three brands they are given. If yours is not in that answer, a competitor is.
          </p>
          <p className="mt-4 hidden sm:block text-base md:text-lg leading-relaxed text-ink-600">
            ShowYourBrand asks your buyers&apos; questions to every engine, on a schedule, and
            records who gets named.
          </p>
        </div>

        <div className="mx-auto w-full max-w-xl space-y-4 lg:max-w-none">
          <div ref={ref} className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-premium-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                ChatGPT <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </span>
              <span className="w-[52px]" />
            </div>
            <div className="space-y-4 px-4 py-5 md:space-y-5 md:px-7 md:py-6">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-3xl bg-[#f4f4f4] px-4 py-2.5 text-sm md:text-[15px] text-gray-900">
                  What&apos;s the best cold email tool for a B2B startup in France?
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
                  <Image src="/logos/openai-logo.svg" alt="" width={16} height={16} className="h-4 w-4" />
                </span>
                <p className="min-h-[120px] sm:min-h-[96px] pt-0.5 text-sm md:text-[15px] leading-relaxed text-gray-800">
                  {ANSWER.slice(0, typed)}
                  {!done && <span className="ml-1 inline-block h-3 w-3 rounded-full bg-gray-900 align-middle animate-pulse" />}
                </p>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between rounded-3xl border border-gray-200 px-4 py-2.5 shadow-sm">
                <span className="flex items-center gap-3 text-[15px] text-gray-400">
                  <Plus className="h-4 w-4" /> Ask anything
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white">
                  <ArrowUp className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-200 bg-paper-raised px-5 py-4 shadow-premium">
            <div className="mb-1 font-data text-[11px] uppercase tracking-[0.12em] text-ink-400">
              Your brand on this prompt
            </div>
            <div className="divide-y divide-ink-100">
              {engineRows.map((r, i) => (
                <div
                  key={r.name}
                  className={`flex items-center justify-between py-2.5 transition-opacity duration-500 ${done ? "opacity-100" : "opacity-0"}`}
                  style={{ transitionDelay: `${i * 140}ms` }}
                >
                  <span className="flex items-center gap-2.5 text-sm text-ink-800">
                    <Image src={r.logo} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                    {r.name}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${r.cited ? "text-emerald-700" : "text-ink-400"}`}>
                    {r.cited ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    {r.note}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreMock() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const rows = [
    { name: "Perplexity", v: 85, c: "#7c3aed" },
    { name: "ChatGPT", v: 55, c: "#10a37f" },
    { name: "Gemini", v: 30, c: "#4285f4" },
    { name: "Claude", v: 15, c: "#d97757" },
  ];
  return (
    <div ref={ref} className="rounded-2xl border border-ink-200 bg-paper-raised p-6 shadow-premium">
      <div className="mb-5 flex items-baseline justify-between">
        <span className="text-sm text-ink-500">Visibility by engine</span>
        <span className="font-data text-2xl font-semibold">53<span className="text-sm text-ink-400">/100</span></span>
      </div>
      <div className="space-y-3.5">
        {rows.map((r, i) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className="w-20 text-xs text-ink-600">{r.name}</span>
            <Bar value={r.v} color={r.c} inView={inView} delay={i * 120} />
            <span className="font-data w-9 text-right text-xs font-semibold text-ink-700">{r.v}%</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[11px] leading-snug text-ink-400">
        Weighted by each engine&apos;s usage share, not a flat average.
      </p>
    </div>
  );
}

function SourcesMock() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const rows = [
    { d: "g2.com", n: 14, cites: true },
    { d: "reddit.com/r/sales", n: 11, cites: false },
    { d: "capterra.fr", n: 8, cites: true },
    { d: "producthunt.com", n: 6, cites: false },
  ];
  return (
    <div ref={ref} className="rounded-2xl border border-ink-200 bg-paper-raised p-6 shadow-premium">
      <div className="mb-4 flex items-baseline justify-between text-sm text-ink-500">
        <span>Sources cited by the engines</span>
        <span className="font-data text-xs">citations</span>
      </div>
      <div className="divide-y divide-ink-100">
        {rows.map((r, i) => (
          <div
            key={r.d}
            className={`flex items-center justify-between py-3 transition-all duration-500 ${inView ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
            style={{ transitionDelay: `${i * 110}ms` }}
          >
            <span className="flex items-center gap-3 text-sm text-ink-800">
              <span className="font-data w-6 text-xs text-ink-400">{r.n}</span>
              {r.d}
            </span>
            {r.cites ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <Check className="h-3.5 w-3.5" /> mentions you
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                <X className="h-3.5 w-3.5" /> ignores you
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CompetitorMock() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const rows = [
    { name: "Competitor A", v: 71, own: false },
    { name: "Competitor B", v: 63, own: false },
    { name: "You", v: 53, own: true },
    { name: "Competitor C", v: 38, own: false },
  ];
  return (
    <div ref={ref} className="rounded-2xl border border-ink-200 bg-paper-raised p-6 shadow-premium">
      <span className="mb-4 block text-sm text-ink-500">Same prompts, same engines</span>
      <div className="space-y-3.5">
        {rows.map((r, i) => (
          <div key={r.name} className="flex items-center gap-3">
            <span className={`w-28 text-xs ${r.own ? "font-semibold text-ink-900" : "text-ink-500"}`}>{r.name}</span>
            <Bar value={r.v} color={r.own ? "#AE3B22" : "#BEB8AC"} inView={inView} delay={i * 120} />
            <span className={`font-data w-8 text-right text-xs ${r.own ? "font-semibold text-ink-900" : "text-ink-500"}`}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureRow({
  index,
  label,
  title,
  desc,
  bullets,
  mock,
  flip,
}: {
  index: string;
  label: string;
  title: string;
  desc: string;
  bullets: string[];
  mock: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={flip ? "lg:order-2" : ""}>
        <div className="font-data text-xs uppercase tracking-[0.14em] text-ink-400">
          {index} <span className="mx-1.5 text-ink-300">/</span> {label}
        </div>
        <h3 className="font-heading mt-4 text-3xl md:text-4xl font-medium leading-tight">{title}</h3>
        <p className="mt-4 text-base md:text-lg leading-relaxed text-ink-600">{desc}</p>
        <ul className="mt-6 space-y-2.5 border-l border-ink-200 pl-5">
          {bullets.map((b) => (
            <li key={b} className="text-sm md:text-base leading-relaxed text-ink-700">
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className={flip ? "lg:order-1" : ""}>{mock}</div>
    </div>
  );
}

export function FeatureRows() {
  return (
    <section id="features" className="px-4 py-20 md:py-28 border-t border-ink-200">
      <div className="container mx-auto max-w-6xl space-y-24 md:space-y-32">
        <FeatureRow
          index="01"
          label="Per-engine score"
          title="Strong on Perplexity, absent from Claude"
          desc="Those are two different problems with two different fixes. Each engine gets its own score, and the global one is weighted by how much your buyers actually use each engine."
          bullets={[
            "Presence rate per prompt and per engine, refreshed on schedule",
            "12 weeks of history, so you see a trend and not a snapshot",
            "Recommendations written for each engine",
          ]}
          mock={<ScoreMock />}
        />
        <FeatureRow
          flip
          index="02"
          label="Cited sources"
          title="The pages AI reads before it answers"
          desc="Engines build their answers from specific pages. ShowYourBrand lists every source behind your prompts and flags the ones that never mention you, so you know where to earn a mention."
          bullets={[
            "Every cited source, deduplicated and ranked by frequency",
            "A clear mentions-you / ignores-you flag on each one",
            "Start with the sources that weigh the most",
          ]}
          mock={<SourcesMock />}
        />
        <FeatureRow
          index="03"
          label="Competitors"
          title="Who gets named instead of you"
          desc="A score only means something next to your competitors'. They run through the same prompts and engines, so you can see, prompt by prompt, who the AI recommends."
          bullets={[
            "Side-by-side visibility on identical prompts",
            "The exact queries where a competitor wins",
            "Email alert when your score moves",
          ]}
          mock={<CompetitorMock />}
        />
      </div>
    </section>
  );
}

const seoRows = [
  { label: "Where buyers look", seo: "Ten links to scroll", geo: "One answer, two or three brands" },
  { label: "What you optimise", seo: "Keywords and rankings", geo: "Being cited by the model and its sources" },
  { label: "How you measure", seo: "Position and clicks", geo: "Citation rate per engine" },
  { label: "The risk", seo: "Page two", geo: "Not being mentioned at all" },
];

export function GeoVsSeo() {
  return (
    <section className="px-4 py-20 md:py-28 border-t border-ink-200">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-heading text-4xl md:text-5xl font-medium">GEO is not SEO with a new name</h2>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm md:text-base">
            <thead>
              <tr className="border-b-2 border-ink-900 font-data text-xs uppercase tracking-[0.12em] text-ink-500">
                <th className="py-3 pr-4 font-medium" />
                <th className="py-3 pr-4 font-medium">Classic SEO</th>
                <th className="py-3 font-medium text-ink-900">GEO</th>
              </tr>
            </thead>
            <tbody>
              {seoRows.map((r) => (
                <tr key={r.label} className="border-b border-ink-200">
                  <td className="py-5 pr-4 font-medium text-ink-900">{r.label}</td>
                  <td className="py-5 pr-4 text-ink-500">{r.seo}</td>
                  <td className="py-5 font-medium text-ink-900">{r.geo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
