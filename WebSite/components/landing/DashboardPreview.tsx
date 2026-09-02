import { useState } from "react";
import { Trophy, Crosshair, CalendarClock } from "lucide-react";
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
      Perplexity: [55, 55, 60, 60, 65, 70, 70, 75, 80, 80, 85, 85],
      ChatGPT: [40, 40, 45, 45, 45, 50, 50, 50, 55, 55, 50, 55],
      Gemini: [10, 10, 15, 15, 20, 20, 20, 25, 25, 25, 30, 30],
      Claude: [5, 10, 10, 10, 10, 15, 15, 15, 15, 15, 15, 15],
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
      ChatGPT: [60, 65, 65, 70, 70, 75, 80, 80, 85, 85, 85, 90],
      Perplexity: [65, 70, 70, 75, 80, 80, 85, 85, 90, 90, 95, 95],
      Claude: [45, 50, 50, 55, 60, 60, 65, 70, 70, 75, 75, 80],
      Gemini: [40, 45, 50, 50, 55, 60, 65, 65, 70, 75, 75, 80],
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
      Perplexity: [70, 70, 75, 75, 80, 80, 85, 85, 85, 90, 90, 90],
      ChatGPT: [55, 55, 60, 60, 65, 65, 70, 70, 75, 80, 85, 85],
      Claude: [40, 40, 45, 50, 50, 55, 55, 60, 65, 65, 70, 70],
      Gemini: [40, 45, 45, 50, 55, 55, 60, 65, 65, 70, 70, 75],
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
  if (score >= 40) return { label: "Medium", color: "#ea580c" };
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
  const H = 150;
  const pad = 8;
  const n = 12;
  const x = (i: number) => pad + (i * (W - 2 * pad)) / (n - 1);
  const y = (v: number) => H - pad - (v / 100) * (H - 2 * pad);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[150px]" preserveAspectRatio="none">
      {[0, 25, 50, 75, 100].map((g) => (
        <line
          key={g}
          x1={pad}
          x2={W - pad}
          y1={y(g)}
          y2={y(g)}
          stroke="#f1f1f4"
          strokeWidth="1"
        />
      ))}
      {ENGINE_ORDER.map((eng) => {
        const pts = brand.series[eng]
          .map((v, i) => `${x(i)},${y(v)}`)
          .join(" ");
        return (
          <polyline
            key={eng}
            points={pts}
            fill="none"
            stroke={ENGINE_COLORS[eng]}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export default function DashboardPreview() {
  const [active, setActive] = useState(0);
  const brand = BRANDS[active] ?? BRANDS[0];
  if (!brand) return null;
  const { engines, global, delta, best, competitors } = derive(brand);
  const maxComp = Math.max(...competitors.map((c) => c.value));

  return (
    <section id="preview" className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-accent-muted px-4 py-1.5 text-xs font-semibold text-accent">
            <SybMark className="w-3.5 h-3.5" />
            Live dashboard preview
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mt-5 mb-4">
            See exactly what your visibility looks like
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            This is the real ShowYourBrand dashboard. Switch brands to see how
            scores, engines and competitors move.
          </p>
        </div>

        {/* Brand switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {BRANDS.map((b, i) => (
            <button
              key={b.name}
              type="button"
              onClick={() => setActive(i)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                i === active
                  ? "bg-gray-900 text-white shadow-premium"
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
            <div className="ml-3 flex-1 max-w-md rounded-md bg-white border border-gray-200 px-3 py-1 text-xs text-gray-400 truncate">
              app.showyourbrand.app/app/{brand.domain}
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
                      : "text-gray-500"
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
                  <span className="text-xs text-gray-400">
                    https://www.{brand.domain}
                  </span>
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 mb-5">
                <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <ScoreRing score={global} />
                  <div>
                    <div className="text-xs text-gray-400">
                      Visibility score
                    </div>
                    <div className="font-data text-2xl font-bold text-gray-900">
                      {global}
                      <span className="text-sm font-normal text-gray-400">
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
                      <span className="text-xs text-gray-400">
                        → stable / 7d
                      </span>
                    )}
                    <div className="text-[11px] text-gray-400 mt-1">
                      Weighted across {engines.length} engines
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      <Trophy className="w-3.5 h-3.5" /> Best engine
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {best ? best.name : "—"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {best ? best.value : 0}% presence
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      <Crosshair className="w-3.5 h-3.5" /> Avg. position
                    </div>
                    <div className="font-data font-semibold text-gray-900 text-sm">
                      {brand.avgPosition}
                    </div>
                    <div className="text-xs text-gray-400">when cited</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      <CalendarClock className="w-3.5 h-3.5" /> Frequency
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {brand.frequency}
                    </div>
                    <div className="text-xs text-gray-400">
                      {brand.prompts} prompts × {engines.length} engines
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    12-week evolution
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
                  <div className="text-xs text-gray-400 mt-0.5">
                    Share of the {brand.prompts} tracked prompts citing{" "}
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
                            className="h-full rounded-full"
                            style={{
                              width: `${e.value}%`,
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
                  <div className="text-xs text-gray-400 mt-0.5">
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
                              className={`h-full rounded-full ${
                                isOwn ? "bg-accent" : "bg-gray-300"
                              }`}
                              style={{ width: `${(c.value / maxComp) * 100}%` }}
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

        <p className="text-center text-xs text-gray-400 mt-4 max-w-2xl mx-auto">
          Illustrative product preview — demo data. The global score is computed
          from the per-engine presence rates with the same weighting the product
          uses (ChatGPT 60%, Gemini 16%, Perplexity 14%, Claude 10%).
        </p>
      </div>
    </section>
  );
}
