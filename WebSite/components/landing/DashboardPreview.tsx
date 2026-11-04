import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Trophy, Crosshair, CalendarClock } from "lucide-react";
import SybMark from "@/components/icons/SybMark";

/**
 * Interactive, self-contained replica of the real SYB /app project dashboard,
 * rendered inside a browser frame on the landing page so visitors can see what
 * the product looks like before signing up. Data is illustrative (mirrors the
 * seeded demo brands) — no network calls, no real account.
 */

type Engine = "ChatGPT" | "Perplexity" | "Claude" | "Gemini";

interface DemoBrand {
  name: string;
  domain: string;
  favicon: string;
  /** Average rank of the brand among the brands cited in an answer. */
  avgPosition: string;
  frequency: string;
  /** Number of tracked prompts — every presence rate is a multiple of 100/prompts. */
  prompts: number;
  /** 12 weekly presence rates per engine, 0-100. Single source of truth. */
  series: Record<Engine, number[]>;
  /** Rivals only — the brand's own bar is derived from its global score. */
  rivals: { name: string; value: number }[];
}

const ENGINE_COLORS: Record<Engine, string> = {
  ChatGPT: "#10a37f",
  Perplexity: "#7c3aed",
  Claude: "#d97757",
  Gemini: "#4285f4",
};

/**
 * Same weights as the product (`ENGINE_WEIGHTS` in lib/monitoring/types.ts), so
 * the global score shown here is the one the real pipeline would compute from
 * these presence rates.
 */
const ENGINE_WEIGHTS: Record<Engine, number> = {
  ChatGPT: 0.6,
  Gemini: 0.16,
  Perplexity: 0.14,
  Claude: 0.1,
};

const ENGINE_ORDER: Engine[] = ["ChatGPT", "Perplexity", "Claude", "Gemini"];

const BRANDS: DemoBrand[] = [
  {
    name: "Bioburger",
    domain: "bioburger.fr",
    favicon: "https://icons.duckduckgo.com/ip3/bioburger.fr.ico",
    avgPosition: "2.4",
    frequency: "Daily",
    prompts: 20,
    series: {
      Perplexity: [50, 60, 55, 65, 55, 70, 60, 75, 85, 70, 80, 85],
      ChatGPT: [35, 45, 40, 50, 40, 55, 45, 50, 60, 50, 60, 55],
      Gemini: [10, 20, 10, 15, 25, 15, 20, 30, 20, 25, 35, 30],
      Claude: [5, 15, 5, 10, 20, 10, 15, 25, 10, 20, 10, 15],
    },
    rivals: [
      { name: "Big Fernand", value: 63 },
      { name: "Blend", value: 41 },
      { name: "PNY", value: 33 },
    ],
  },
  {
    name: "lemlist",
    domain: "lemlist.com",
    favicon: "https://icons.duckduckgo.com/ip3/lemlist.com.ico",
    avgPosition: "1.6",
    frequency: "Daily",
    prompts: 20,
    series: {
      ChatGPT: [55, 70, 60, 75, 65, 80, 70, 85, 75, 90, 80, 90],
      Perplexity: [60, 70, 80, 65, 85, 75, 90, 80, 95, 85, 90, 95],
      Claude: [40, 55, 45, 60, 50, 65, 55, 75, 60, 80, 70, 80],
      Gemini: [45, 35, 55, 45, 60, 50, 70, 55, 75, 65, 85, 80],
    },
    rivals: [
      { name: "Instantly", value: 71 },
      { name: "Smartlead", value: 64 },
      { name: "Apollo", value: 58 },
    ],
  },
  {
    name: "Qonto",
    domain: "qonto.com",
    favicon: "https://icons.duckduckgo.com/ip3/qonto.com.ico",
    avgPosition: "1.9",
    frequency: "Weekly",
    prompts: 20,
    series: {
      Perplexity: [65, 80, 70, 85, 75, 90, 80, 95, 85, 90, 80, 90],
      ChatGPT: [50, 60, 55, 70, 60, 75, 65, 80, 70, 85, 75, 85],
      Claude: [35, 50, 40, 55, 45, 60, 50, 65, 55, 75, 60, 70],
      Gemini: [45, 40, 55, 50, 65, 55, 60, 70, 60, 75, 65, 75],
    },
    rivals: [
      { name: "Shine", value: 54 },
      { name: "Revolut Business", value: 47 },
      { name: "Blank", value: 26 },
    ],
  },
];

/** Weighted global score for one week index, mirroring `computeGlobalScore`. */
function globalScoreAt(brand: DemoBrand, week: number): number {
  const total = ENGINE_ORDER.reduce((acc, e) => acc + ENGINE_WEIGHTS[e], 0);
  const weighted = ENGINE_ORDER.reduce(
    (acc, e) => acc + (brand.series[e][week] ?? 0) * ENGINE_WEIGHTS[e],
    0,
  );
  return Math.round(weighted / total);
}

/** Everything the dashboard shows, derived from the 12-week series. */
function derive(brand: DemoBrand) {
  const last = 11;
  const engines = ENGINE_ORDER.map((name) => ({
    name,
    value: brand.series[name][last] ?? 0,
    color: ENGINE_COLORS[name],
  })).sort((a, b) => b.value - a.value);

  const global = globalScoreAt(brand, last);
  const delta = global - globalScoreAt(brand, last - 1);
  const best = engines[0];
  const competitors = [...brand.rivals, { name: brand.name, value: global }].sort(
    (a, b) => b.value - a.value,
  );

  return { engines, global, delta, best, competitors };
}

function tier(score: number): { label: string; color: string } {
  if (score >= 65) return { label: "Strong", color: "#16a34a" };
  if (score >= 40) return { label: "Average", color: "#ea580c" };
  if (score >= 20) return { label: "Weak", color: "#dc2626" };
  return { label: "Critical", color: "#991b1b" };
}

function ScoreRing({ score }: { score: number }) {
  const t = tier(score);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f1f4" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={t.color}
          strokeWidth="8"
          className="transition-[stroke-dasharray] duration-700 ease-out"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-data text-2xl font-bold text-gray-900">{score}</span>
        <span className="text-[11px] font-semibold" style={{ color: t.color }}>
          {t.label}
        </span>
      </div>
    </div>
  );
}

function TrendChart({ brand }: { brand: DemoBrand }) {
  const W = 520;
  const H = 170;
  const pad = 8;
  const n = 12;
  const x = (i: number) => pad + (i * (W - 2 * pad)) / (n - 1);
  const y = (v: number) => H - pad - (v / 100) * (H - 2 * pad);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[170px]" preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((g) => (
          <line key={`h${g}`} x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="#f1f1f4" strokeWidth="1" />
        ))}
        {Array.from({ length: n }, (_, i) => (
          <line
            key={`v${i}`}
            x1={x(i)}
            x2={x(i)}
            y1={pad}
            y2={H - pad}
            stroke="#e7e5e0"
            strokeWidth="1"
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {ENGINE_ORDER.map((eng, k) => {
          const pts = brand.series[eng].map((v, i) => `${x(i)},${y(v)}`).join(" ");
          return (
            <polyline
              key={`${brand.name}-${eng}`}
              points={pts}
              pathLength={1}
              fill="none"
              stroke={ENGINE_COLORS[eng]}
              strokeWidth="2"
              strokeLinejoin="miter"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="animate-draw"
              style={{ strokeDasharray: 1, animationDelay: `${k * 120}ms` }}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between px-0.5 font-data text-[10px] text-gray-400">
        {Array.from({ length: n }, (_, i) => (
          <span key={i}>W{i + 1}</span>
        ))}
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(origin + (target - origin) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

interface DashboardPreviewProps {
  /** Where "open the full dashboard" goes. Defaults to the public demo. */
  ctaHref?: string;
}

export default function DashboardPreview({
  ctaHref = "/demo",
}: DashboardPreviewProps) {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!autoplay || !inView) return;
    const id = setInterval(() => setActive((a) => (a + 1) % BRANDS.length), 5000);
    return () => clearInterval(id);
  }, [autoplay, inView]);

  const brand = BRANDS[active] ?? BRANDS[0];
  const derived = derive(brand ?? BRANDS[0]!);
  const animatedGlobal = useCountUp(inView ? derived.global : 0);
  if (!brand) return null;
  const { engines, delta, best, competitors } = derived;
  const maxComp = Math.max(...competitors.map((c) => c.value));

  return (
    <section id="preview" ref={sectionRef} className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="font-heading text-4xl md:text-5xl font-medium text-gray-900 mb-4">
            What your dashboard looks like
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Switch brands to see the score, the engines and the competitors
            move.
          </p>
        </div>

        {/* Brand switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {BRANDS.map((b, i) => (
            <button
              key={b.name}
              type="button"
              onClick={() => {
                setActive(i);
                setAutoplay(false);
              }}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                i === active
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.favicon}
                alt=""
                className="w-4 h-4 rounded"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              {b.name}
            </button>
          ))}
        </div>

        {/* Browser frame */}
        <div className="rounded-2xl overflow-hidden shadow-premium border border-gray-200 bg-white">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <div className="ml-3 flex-1 max-w-md rounded-md bg-white border border-gray-200 px-3 py-1 text-xs text-gray-500 truncate">
              showyourbrand.app/demo/{brand.domain}
            </div>
          </div>

          <div className="flex">
            {/* mini sidebar */}
            <aside className="hidden md:flex flex-col w-44 shrink-0 border-r border-gray-100 p-4 gap-1 bg-white">
              <div className="flex items-center gap-2 mb-4">
                <SybMark className="w-5 h-5" />
                <span className="font-heading font-semibold text-gray-900 text-sm">
                  ShowYourBrand
                </span>
              </div>
              {[
                "Overview",
                "Competitors",
                "Cited sources",
                "Recommendations",
                "Impact",
                "Outreach",
              ].map((item, i) => (
                <span
                  key={item}
                  className={`rounded-lg px-3 py-1.5 text-xs ${
                    i === 0
                      ? "bg-accent-muted text-accent font-semibold"
                      : "text-gray-600"
                  }`}
                >
                  {item}
                </span>
              ))}
            </aside>

            {/* main */}
            <div className="flex-1 p-5 md:p-6 bg-gray-50/40 min-w-0">
              <div className="flex items-center gap-2 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.favicon}
                  alt=""
                  className="w-6 h-6 rounded"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900 leading-tight">
                    {brand.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    https://www.{brand.domain}
                  </span>
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 mb-5">
                <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <ScoreRing score={animatedGlobal} />
                  <div>
                    <div className="text-xs text-gray-500">
                      Visibility score
                    </div>
                    <div className="font-data text-2xl font-bold text-gray-900">
                      {animatedGlobal}
                      <span className="text-sm font-normal text-gray-500">
                        /100
                      </span>
                    </div>
                    {delta > 0 && (
                      <span className="font-data inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        ↗ +{delta} pts / 7d
                      </span>
                    )}
                    {delta < 0 && (
                      <span className="font-data inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        ↘ {delta} pts / 7d
                      </span>
                    )}
                    {delta === 0 && (
                      <span className="text-xs text-gray-500">
                        → stable / 7d
                      </span>
                    )}
                    <div className="text-[11px] text-gray-500 mt-1">
                      Weighted across {engines.length} engines
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Trophy className="w-3.5 h-3.5" /> Best engine
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {best ? best.name : "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {best ? best.value : 0}% presence
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Crosshair className="w-3.5 h-3.5" /> Avg. position
                    </div>
                    <div className="font-data font-semibold text-gray-900 text-sm">
                      {brand.avgPosition}
                    </div>
                    <div className="text-xs text-gray-500">when cited</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <CalendarClock className="w-3.5 h-3.5" /> Frequency
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {brand.frequency}
                    </div>
                    <div className="text-xs text-gray-500">
                      {brand.prompts} prompts × {engines.length} engines
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    Last 12 weeks
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {engines.map((e) => (
                      <span
                        key={e.name}
                        className="inline-flex items-center gap-1.5 text-[11px] text-gray-500"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: e.color }}
                        />
                        {e.name}
                      </span>
                    ))}
                  </div>
                </div>
                <TrendChart brand={brand} />
              </div>

              {/* Per-engine + competitors */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="text-sm font-semibold text-gray-900">
                    Presence by engine
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Share of the {brand.prompts} tracked prompts that cite{" "}
                    {brand.name}
                  </div>
                  <div className="space-y-3 mt-4">
                    {engines.map((e) => (
                      <div key={e.name} className="flex items-center gap-3">
                        <span className="text-xs w-20 text-gray-600">
                          {e.name}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-[width] duration-700 ease-out"
                            style={{
                              width: inView ? `${e.value}%` : "0%",
                              backgroundColor: e.color,
                            }}
                          />
                        </div>
                        <span className="font-data text-xs font-semibold text-gray-700 w-9 text-right">
                          {e.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="text-sm font-semibold text-gray-900">
                    You vs competitors
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Same weighted score, same prompts
                  </div>
                  <div className="space-y-3 mt-4">
                    {competitors.map((c) => {
                      const isOwn = c.name === brand.name;
                      return (
                        <div key={c.name} className="flex items-center gap-3">
                          <span
                            className={`text-xs w-24 truncate ${
                              isOwn
                                ? "font-semibold text-accent"
                                : "text-gray-600"
                            }`}
                          >
                            {c.name}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                                isOwn ? "bg-accent" : "bg-gray-300"
                              }`}
                              style={{ width: inView ? `${(c.value / maxComp) * 100}%` : "0%" }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-9 text-right">
                            {c.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-gray-500 max-w-xl">
            Illustrative demo data. The global score uses the product&apos;s
            real weighting: ChatGPT 60%, Gemini 16%, Perplexity 14%, Claude 10%.
          </p>
          <Link
            href={ctaHref}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:underline"
          >
            Open the full demo dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
