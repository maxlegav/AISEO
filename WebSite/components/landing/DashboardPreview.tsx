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
  global: number;
  delta: number;
  best: Engine;
  avgPosition: string;
  frequency: string;
  engines: { name: Engine; value: number; color: string }[];
  /** 12 weekly points per engine, 0-100 */
  series: Record<Engine, number[]>;
  competitors: { name: string; value: number }[];
}

const ENGINE_COLORS: Record<Engine, string> = {
  ChatGPT: "#10a37f",
  Perplexity: "#7c3aed",
  Claude: "#d97757",
  Gemini: "#4285f4",
};

const BRANDS: DemoBrand[] = [
  {
    name: "Bioburger",
    domain: "bioburger.fr",
    favicon: "https://icons.duckduckgo.com/ip3/bioburger.fr.ico",
    global: 47,
    delta: 4,
    best: "Perplexity",
    avgPosition: "1.0",
    frequency: "Daily",
    engines: [
      { name: "Perplexity", value: 86, color: ENGINE_COLORS.Perplexity },
      { name: "ChatGPT", value: 57, color: ENGINE_COLORS.ChatGPT },
      { name: "Gemini", value: 29, color: ENGINE_COLORS.Gemini },
      { name: "Claude", value: 14, color: ENGINE_COLORS.Claude },
    ],
    series: {
      Perplexity: [55, 58, 60, 62, 71, 74, 74, 78, 80, 82, 84, 86],
      ChatGPT: [40, 41, 43, 44, 46, 50, 52, 53, 55, 56, 57, 57],
      Gemini: [10, 12, 14, 16, 18, 20, 22, 24, 25, 27, 28, 29],
      Claude: [8, 9, 10, 10, 11, 12, 12, 13, 13, 14, 14, 14],
    },
    competitors: [
      { name: "Big Fernand", value: 63 },
      { name: "Bioburger", value: 47 },
      { name: "Blend", value: 41 },
      { name: "PNY", value: 33 },
    ],
  },
  {
    name: "lemlist",
    domain: "lemlist.com",
    favicon: "https://icons.duckduckgo.com/ip3/lemlist.com.ico",
    global: 100,
    delta: 25,
    best: "ChatGPT",
    avgPosition: "1.0",
    frequency: "Daily",
    engines: [
      { name: "ChatGPT", value: 100, color: ENGINE_COLORS.ChatGPT },
      { name: "Perplexity", value: 100, color: ENGINE_COLORS.Perplexity },
      { name: "Claude", value: 100, color: ENGINE_COLORS.Claude },
      { name: "Gemini", value: 100, color: ENGINE_COLORS.Gemini },
    ],
    series: {
      ChatGPT: [70, 74, 78, 80, 85, 88, 90, 93, 95, 97, 99, 100],
      Perplexity: [72, 75, 80, 84, 86, 90, 92, 95, 97, 98, 99, 100],
      Claude: [55, 60, 64, 68, 72, 78, 82, 86, 90, 94, 98, 100],
      Gemini: [50, 55, 60, 65, 70, 76, 82, 87, 91, 95, 98, 100],
    },
    competitors: [
      { name: "lemlist", value: 100 },
      { name: "Instantly", value: 71 },
      { name: "Smartlead", value: 64 },
      { name: "Apollo", value: 58 },
    ],
  },
  {
    name: "Les Chandelles",
    domain: "leschandelles.com",
    favicon: "https://icons.duckduckgo.com/ip3/leschandelles.com.ico",
    global: 41,
    delta: 0,
    best: "Perplexity",
    avgPosition: "1.0",
    frequency: "Daily",
    engines: [
      { name: "Perplexity", value: 88, color: ENGINE_COLORS.Perplexity },
      { name: "ChatGPT", value: 38, color: ENGINE_COLORS.ChatGPT },
      { name: "Claude", value: 25, color: ENGINE_COLORS.Claude },
      { name: "Gemini", value: 13, color: ENGINE_COLORS.Gemini },
    ],
    series: {
      Perplexity: [70, 72, 74, 78, 80, 82, 83, 84, 85, 86, 87, 88],
      ChatGPT: [30, 31, 32, 33, 34, 35, 36, 36, 37, 37, 38, 38],
      Claude: [15, 16, 18, 19, 20, 21, 22, 23, 24, 24, 25, 25],
      Gemini: [6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13],
    },
    competitors: [
      { name: "Les Chandelles", value: 41 },
      { name: "Le Set", value: 37 },
      { name: "L'Orangerie", value: 29 },
      { name: "Le 2+2", value: 22 },
    ],
  },
];

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
        <span className="text-2xl font-bold text-gray-900">{score}</span>
        <span className="text-[11px] font-semibold" style={{ color: t.color }}>
          {t.label}
        </span>
      </div>
    </div>
  );
}

function TrendChart({ brand }: { brand: DemoBrand }) {
  const engines = brand.engines.map((e) => e.name);
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
      {engines.map((eng) => {
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
  const maxComp = Math.max(...brand.competitors.map((c) => c.value));
  const topEngine = brand.engines[0];

  return (
    <section id="preview" className="px-4 py-16 md:py-24">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700">
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
                      ? "bg-violet-50 text-violet-700 font-semibold"
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
                  <ScoreRing score={brand.global} />
                  <div>
                    <div className="text-xs text-gray-400">
                      Visibility score
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {brand.global}
                      <span className="text-sm font-normal text-gray-400">
                        /100
                      </span>
                    </div>
                    {brand.delta > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        ↗ +{brand.delta} pts / 7d
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">0 pts / 7d</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      <Trophy className="w-3.5 h-3.5" /> Best engine
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {brand.best}
                    </div>
                    <div className="text-xs text-gray-400">
                      {topEngine ? topEngine.value : 0}% presence
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      <Crosshair className="w-3.5 h-3.5" /> Avg. position
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
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
                    <div className="text-xs text-gray-400">4 AI engines</div>
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
                    {brand.engines.map((e) => (
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
                  <span className="text-sm font-semibold text-gray-900">
                    Presence by engine
                  </span>
                  <div className="space-y-3 mt-4">
                    {brand.engines.map((e) => (
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
                        <span className="text-xs font-semibold text-gray-700 w-9 text-right">
                          {e.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-sm font-semibold text-gray-900">
                    You vs competitors
                  </span>
                  <div className="space-y-3 mt-4">
                    {brand.competitors.map((c) => {
                      const isOwn = c.name === brand.name;
                      return (
                        <div key={c.name} className="flex items-center gap-3">
                          <span
                            className={`text-xs w-24 truncate ${
                              isOwn
                                ? "font-semibold text-violet-700"
                                : "text-gray-600"
                            }`}
                          >
                            {c.name}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOwn ? "bg-violet-500" : "bg-gray-300"
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

        <p className="text-center text-xs text-gray-400 mt-4">
          Illustrative product preview — demo data.
        </p>
      </div>
    </section>
  );
}
