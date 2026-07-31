/**
 * Visual building blocks for `/testlanding`.
 *
 * Kept out of the page file so the page reads as a document (copy + structure)
 * and the pixel work lives here. Everything is inline SVG/CSS — no images to
 * load, no charting library, and it stays crisp on any background.
 *
 * All the numbers rendered here are derived from `WEEKS` with the same weighting
 * the product uses, so the mock cannot drift out of sync with itself.
 */
import Image from "next/image";
import { LLM_ORDER, LLMS, ENGINE_WEIGHTS, type LLMId } from "@/lib/monitoring/types";

export const ACCENT = "#C6F24E";

/* ------------------------------------------------------------- logos ----- */

const LOGO_SRC: Record<LLMId, string> = {
  chatgpt: "/logos/openai-logo.svg",
  perplexity: "/logos/perplexity-logo.svg",
  claude: "/logos/claude-logo.svg",
  gemini: "/logos/gemini-logo.svg",
  aio: "/logos/google-aio-logo.svg",
};

/**
 * The logo files are authored with `fill="currentColor"`, which renders black
 * when loaded as an `<img>` — invisible on this page's near-black canvas. They
 * are set on a light chip so they stay legible whatever the brand mark does.
 */
export function EngineLogo({ id, size = 28 }: { id: LLMId; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-white shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={LOGO_SRC[id]}
        alt={LLMS[id].name}
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        className="object-contain"
      />
    </span>
  );
}

/* -------------------------------------------------------- demo data ------ */

/** 12 weekly presence rates per engine for the mocked brand (multiples of 5 = k/20 prompts). */
export const WEEKS: Record<LLMId, number[]> = {
  chatgpt: [30, 30, 35, 35, 40, 40, 45, 45, 50, 55, 55, 60],
  perplexity: [45, 50, 50, 55, 60, 65, 65, 70, 75, 75, 80, 85],
  claude: [10, 10, 15, 15, 15, 20, 20, 20, 25, 25, 30, 30],
  gemini: [15, 15, 20, 20, 25, 25, 30, 30, 35, 35, 40, 40],
  aio: [20, 25, 25, 30, 30, 35, 35, 40, 45, 45, 50, 55],
};

export const PROMPT_COUNT = 20;

export function globalScoreAt(week: number): number {
  const total = LLM_ORDER.reduce((acc, id) => acc + ENGINE_WEIGHTS[id], 0);
  const weighted = LLM_ORDER.reduce(
    (acc, id) => acc + (WEEKS[id][week] ?? 0) * ENGINE_WEIGHTS[id],
    0,
  );
  return Math.round(weighted / total);
}

export const CURRENT = globalScoreAt(11);
export const DELTA = CURRENT - globalScoreAt(10);

/* ------------------------------------------------------------ pieces ----- */

/** Faint blueprint grid — gives the dark canvas depth without adding an image. */
export function GridBg({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
      }}
    />
  );
}

function ScoreRing({ score, delta }: { score: number; delta: number }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-[124px] h-[124px] shrink-0">
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={ACCENT}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[34px] font-bold leading-none text-white"
          style={{ fontFamily: "var(--font-grotesk)" }}
        >
          {score}
        </span>
        <span className="mt-1 text-[11px] font-semibold text-[#C6F24E]">
          {delta >= 0 ? `+${delta}` : delta} / 7j
        </span>
      </div>
    </div>
  );
}

/** 12-week multi-line chart, one line per engine, in each engine's brand colour. */
function Trend({ height = 132 }: { height?: number }) {
  const W = 560;
  const H = height;
  const pad = 10;
  const x = (i: number) => pad + (i * (W - 2 * pad)) / 11;
  const y = (v: number) => H - pad - (v / 100) * (H - 2 * pad);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {[0, 25, 50, 75, 100].map((g) => (
        <line
          key={g}
          x1={pad}
          x2={W - pad}
          y1={y(g)}
          y2={y(g)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {LLM_ORDER.map((id) => (
        <polyline
          key={id}
          points={(WEEKS[id] ?? []).map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          fill="none"
          stroke={LLMS[id].color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** Horizontal presence bars, one per engine, sorted strongest first. */
export function EngineBars({ compact = false }: { compact?: boolean }) {
  const rows = LLM_ORDER.map((id) => ({ id, value: WEEKS[id]?.[11] ?? 0 })).sort(
    (a, b) => b.value - a.value,
  );

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-3">
          {!compact && <EngineLogo id={r.id} size={22} />}
          <span className={`text-xs text-gray-400 ${compact ? "w-20" : "w-24"}`}>
            {LLMS[r.id].name}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${r.value}%`, backgroundColor: LLMS[r.id].color }}
            />
          </div>
          <span className="font-mono text-xs text-gray-400 w-9 text-right">{r.value}%</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The product visual: a dark replica of the monitoring dashboard in a browser
 * frame. This is the "what am I buying" answer, and it carries the section.
 */
export function DashboardMock() {
  const best = LLM_ORDER.map((id) => ({ id, value: WEEKS[id]?.[11] ?? 0 })).sort(
    (a, b) => b.value - a.value,
  )[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0C1016] overflow-hidden shadow-2xl">
      {/* browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <div className="ml-3 flex-1 max-w-xs rounded-md bg-black/40 border border-white/5 px-3 py-1 font-mono text-[10px] text-gray-600 truncate">
          app.showyourbrand.app/app
        </div>
      </div>

      <div className="p-5 md:p-6">
        {/* header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[15px] font-semibold text-white">Fluo</div>
            <div className="font-mono text-[11px] text-gray-600">fluo.fr · quotidien</div>
          </div>
          <span className="rounded-full border border-[#C6F24E]/30 bg-[#C6F24E]/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#C6F24E]">
            En cours
          </span>
        </div>

        {/* score + engines */}
        <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-center mb-5">
          <div className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <ScoreRing score={CURRENT} delta={DELTA} />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-gray-600">
                Score global
              </div>
              <div className="mt-1 text-sm text-gray-400 max-w-[150px] leading-snug">
                Pondéré sur {LLM_ORDER.length} moteurs, {PROMPT_COUNT} prompts
              </div>
              {best && (
                <div className="mt-3 flex items-center gap-2">
                  <EngineLogo id={best.id} size={20} />
                  <span className="text-xs text-gray-500">
                    Meilleur : {LLMS[best.id].name} {best.value}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gray-600 mb-3">
              Présence par moteur
            </div>
            <EngineBars />
          </div>
        </div>

        {/* trend */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gray-600">
              12 semaines
            </span>
            <div className="flex flex-wrap gap-3">
              {LLM_ORDER.map((id) => (
                <span key={id} className="inline-flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: LLMS[id].color }}
                  />
                  {LLMS[id].name}
                </span>
              ))}
            </div>
          </div>
          <Trend />
        </div>
      </div>
    </div>
  );
}

/**
 * Side-by-side of what the two worlds look like: ten blue links you can rank in,
 * versus one paragraph naming three brands. Drawn rather than described.
 */
export function SerpVsAnswer() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Google */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-gray-600 mb-4">
          Hier — 10 liens bleus
        </div>
        <div className="space-y-3 opacity-60">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div
                className="h-2 rounded bg-blue-400/40"
                style={{ width: `${70 - i * 6}%` }}
              />
              <div className="h-1.5 rounded bg-white/10" style={{ width: `${88 - i * 5}%` }} />
              <div className="h-1.5 rounded bg-white/10" style={{ width: `${60 - i * 4}%` }} />
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-gray-500 leading-relaxed">
          Dix places. Une position mesurable, un clic, un referrer dans votre
          analytics. Tout l&apos;outillage SEO est construit là-dessus.
        </p>
      </div>

      {/* AI answer */}
      <div className="rounded-2xl border border-[#C6F24E]/25 bg-[#C6F24E]/[0.03] p-6">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[#C6F24E]/70 mb-4">
          Aujourd&apos;hui — un paragraphe
        </div>
        <div className="space-y-2">
          <div className="h-1.5 rounded bg-white/15 w-[92%]" />
          <div className="h-1.5 rounded bg-white/15 w-[85%]" />
          <div className="flex items-center gap-2 py-1">
            <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">HubSpot</span>
            <span className="text-gray-600 text-xs">,</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Pipedrive</span>
            <span className="text-gray-600 text-xs">et</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Axonaut</span>
          </div>
          <div className="h-1.5 rounded bg-white/15 w-[78%]" />
          <div className="h-1.5 rounded bg-white/15 w-[64%]" />
          <div className="h-1.5 rounded bg-white/15 w-[40%]" />
        </div>
        <p className="mt-5 text-sm text-gray-400 leading-relaxed">
          Trois noms. Pas de position, pas de clic, pas de referrer.{" "}
          <span className="text-white font-medium">
            Vous y êtes, ou vous n&apos;y êtes pas
          </span>{" "}
          — et rien dans vos outils ne vous le dira.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------- per-surface mini visuals ---- */

export function VisualScore() {
  return (
    <div className="flex items-center gap-5">
      <ScoreRing score={CURRENT} delta={DELTA} />
      <div className="flex-1 min-w-0">
        <EngineBars compact />
      </div>
    </div>
  );
}

export function VisualCompetitors() {
  const rows = [
    { name: "HubSpot", value: 78, own: false },
    { name: "Fluo", value: CURRENT, own: true },
    { name: "Pipedrive", value: 44, own: false },
    { name: "Axonaut", value: 31, own: false },
  ].sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.name} className="flex items-center gap-3">
          <span
            className={`text-xs w-24 truncate ${r.own ? "font-semibold text-[#C6F24E]" : "text-gray-400"}`}
          >
            {r.name}
          </span>
          <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(r.value / max) * 100}%`,
                backgroundColor: r.own ? ACCENT : "rgba(255,255,255,0.18)",
              }}
            />
          </div>
          <span className="font-mono text-xs text-gray-400 w-8 text-right">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function VisualSources() {
  const rows = [
    { domain: "g2.com", cites: 14, you: true },
    { domain: "reddit.com/r/saas", cites: 11, you: false },
    { domain: "capterra.fr", cites: 9, you: true },
    { domain: "journaldunet.com", cites: 6, you: false },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.domain}
          className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
        >
          <span className="font-mono text-xs text-gray-300 flex-1 truncate">{r.domain}</span>
          <span className="font-mono text-[11px] text-gray-600">{r.cites} citations</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
              r.you ? "bg-[#C6F24E]/15 text-[#C6F24E]" : "bg-red-500/10 text-red-400"
            }`}
          >
            {r.you ? "vous cite" : "vous ignore"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function VisualActions() {
  const rows = [
    { p: "haute", t: "Publier un comparatif face à HubSpot", e: "chatgpt" as LLMId },
    { p: "haute", t: "Obtenir 3 avis G2 datés de moins de 6 mois", e: "perplexity" as LLMId },
    { p: "moyenne", t: "Répondre au thread r/saas sur les CRM FR", e: "claude" as LLMId },
    { p: "basse", t: "Publier une démo produit sur YouTube", e: "gemini" as LLMId },
  ];
  const color = (p: string) =>
    p === "haute" ? "#ef4444" : p === "moyenne" ? "#f59e0b" : "#6b7280";

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.t}
          className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: color(r.p) }}
          />
          <span className="text-xs text-gray-300 flex-1 truncate">{r.t}</span>
          <EngineLogo id={r.e} size={20} />
        </div>
      ))}
    </div>
  );
}

export function VisualImpact() {
  const before = [40, 40, 42, 41, 43];
  const after = [43, 47, 52, 56, CURRENT];
  const series = [...before, ...after];
  const W = 320;
  const H = 110;
  const x = (i: number) => (i * W) / (series.length - 1);
  const y = (v: number) => H - 8 - (v / 100) * (H - 16);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[110px]" preserveAspectRatio="none">
        <line
          x1={x(4)}
          x2={x(4)}
          y1={0}
          y2={H}
          stroke={ACCENT}
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.5"
        />
        <polyline
          points={series.slice(0, 5).map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5"
        />
        <polyline
          points={series.slice(4).map((v, i) => `${x(i + 4)},${y(v)}`).join(" ")}
          fill="none"
          stroke={ACCENT}
          strokeWidth="2.5"
        />
      </svg>
      <div className="flex items-center gap-4 mt-1 font-mono text-[10px] text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-white/30" /> avant action
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{ backgroundColor: ACCENT }} /> après action
        </span>
      </div>
    </div>
  );
}

export function VisualOutreach() {
  const rows = [
    { d: "alternativeto.net", status: "à contacter" },
    { d: "appvizer.fr", status: "à contacter" },
    { d: "g2.com", status: "présent" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.d}
          className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
        >
          <span className="font-mono text-xs text-gray-300 flex-1 truncate">{r.d}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] ${
              r.status === "présent"
                ? "bg-white/10 text-gray-400"
                : "bg-[#C6F24E]/15 text-[#C6F24E]"
            }`}
          >
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}
