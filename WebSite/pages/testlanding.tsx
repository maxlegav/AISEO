import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useWaitlistModalStore } from "@/stores";
import SybMark from "@/components/icons/SybMark";
import config from "@/config";
import { MONITORING_PLANS } from "@/lib/monitoring/plans";
import { LLM_ORDER, LLMS, ENGINE_WEIGHTS } from "@/lib/monitoring/types";
import {
  ACCENT,
  CURRENT,
  DashboardMock,
  EngineLogo,
  GridBg,
  PROMPT_COUNT,
  SerpVsAnswer,
  VisualActions,
  VisualCompetitors,
  VisualImpact,
  VisualOutreach,
  VisualScore,
  VisualSources,
} from "@/components/landing/TestLandingVisuals";
import {
  ArrowRight,
  Bell,
  Check,
  FileDown,
  LineChart,
  Link2,
  ListChecks,
  Radar,
  Swords,
  Target,
} from "lucide-react";

/**
 * `/testlanding` — an alternative landing page, designed from scratch as a
 * counter-proposal to `/` (which is pastel + serif + English).
 *
 * Deliberate choices, so the two can be compared side by side:
 *  - **French copy.** The product targets the French market (SaaS marketing
 *    teams, freelance SEO consultants, agencies); the pitch lands harder in the
 *    prospect's own language.
 *  - **Instrument, not brochure.** Near-black canvas, monospace data labels, one
 *    acid accent. It should read like a measurement tool, because that is what
 *    is being sold.
 *  - **Show the pain before the product.** The hero is an AI answer where the
 *    visitor's brand is missing — the single fact the whole product exists for.
 *  - **Only true claims.** Every number on this page comes from the codebase
 *    (plans, engine weights, engine biases, dashboard surfaces). No invented
 *    market statistics.
 *
 * Self-contained: own header/footer, no shared Navbar, no network calls.
 */

/* ------------------------------------------------------------------ hero -- */

interface DemoPrompt {
  engine: (typeof LLM_ORDER)[number];
  question: string;
  /** Brands named in the answer, in the order the engine cites them. */
  answer: { brand: string; you?: boolean }[];
}

const DEMO_BRAND = "Fluo";

const DEMO_PROMPTS: DemoPrompt[] = [
  {
    engine: "chatgpt",
    question: "Quel CRM choisir pour une PME française ?",
    answer: [{ brand: "HubSpot" }, { brand: "Pipedrive" }, { brand: "Axonaut" }],
  },
  {
    engine: "perplexity",
    question: "Alternative à Salesforce pour une équipe de 20 personnes ?",
    answer: [{ brand: "Pipedrive" }, { brand: DEMO_BRAND, you: true }, { brand: "Zoho" }],
  },
  {
    engine: "claude",
    question: "Meilleur CRM open source en 2026 ?",
    answer: [{ brand: "Odoo" }, { brand: "EspoCRM" }, { brand: "Twenty" }],
  },
];

function AnswerPanel({ prompt }: { prompt: DemoPrompt }) {
  const engine = LLMS[prompt.engine];
  const hit = prompt.answer.find((a) => a.you);
  const position = hit ? prompt.answer.findIndex((a) => a.you) + 1 : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F1319] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-white/5">
        <EngineLogo id={prompt.engine} size={26} />
        <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
          Réponse {engine.name}
        </span>
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: engine.color }}
        />
      </div>

      <div className="p-5 md:p-6">
        <p className="text-gray-500 text-sm mb-4">
          <span className="text-gray-600">&gt;</span> {prompt.question}
        </p>

        <ul className="space-y-2.5">
          {prompt.answer.map((a, i) => (
            <li
              key={a.brand}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
                a.you
                  ? "border-[#C6F24E]/40 bg-[#C6F24E]/[0.06]"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <span className="font-mono text-xs text-gray-600 w-4">{i + 1}</span>
              <span
                className={`text-sm ${
                  a.you ? "font-semibold text-[#C6F24E]" : "text-gray-300"
                }`}
              >
                {a.brand}
              </span>
              {a.you && (
                <span className="ml-auto text-[10px] uppercase tracking-widest text-[#C6F24E]">
                  vous
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2 text-sm">
          {position ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6F24E]" />
              <span className="text-gray-400">
                {DEMO_BRAND} est cité en{" "}
                <span className="text-white font-semibold">
                  position {position}
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-gray-400">
                {DEMO_BRAND} n&apos;apparaît{" "}
                <span className="text-red-400 font-semibold">nulle part</span>{" "}
                dans cette réponse
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- dashboard tabs -- */

const SURFACES = [
  {
    id: "overview",
    label: "Score",
    icon: LineChart,
    title: "Un score de visibilité, moteur par moteur",
    body: "Le pourcentage de vos prompts suivis où la marque est citée, sur chaque moteur, semaine après semaine. Le score global pondère chaque moteur par son usage réel — être cité par ChatGPT ne vaut pas la même chose qu'être cité par Claude.",
    visual: VisualScore,
  },
  {
    id: "competitors",
    label: "Concurrents",
    icon: Swords,
    title: "Qui l'IA cite à votre place",
    body: "Les mêmes prompts, les mêmes moteurs, appliqués à vos concurrents. Vous voyez qui occupe le terrain, sur quelles questions, et depuis quand.",
    visual: VisualCompetitors,
  },
  {
    id: "sources",
    label: "Sources",
    icon: Link2,
    title: "Les pages que les moteurs citent réellement",
    body: "Chaque réponse est parsée pour en extraire les URL citées. Vous obtenez la liste des domaines qui construisent l'opinion de l'IA sur votre catégorie — et lesquels parlent déjà de vous.",
    visual: VisualSources,
  },
  {
    id: "reco",
    label: "Actions",
    icon: ListChecks,
    title: "Des recommandations par moteur, pas des généralités",
    body: "« Absent de Claude » et « absent de Gemini » ne se corrigent pas de la même façon. Les recommandations sont dérivées de vos résultats et du fonctionnement de chaque moteur.",
    visual: VisualActions,
  },
  {
    id: "impact",
    label: "Impact",
    icon: Target,
    title: "Ce que l'action a changé",
    body: "Vous cochez une action, on continue de mesurer. La courbe d'après montre si le score a bougé — ou pas. C'est la partie que personne ne veut montrer, et c'est la seule qui prouve la valeur.",
    visual: VisualImpact,
  },
  {
    id: "outreach",
    label: "Outreach",
    icon: Radar,
    title: "Aller chercher les sources manquantes",
    body: "À partir des domaines cités par les moteurs sur votre catégorie, la liste de ceux où vous n'êtes pas — le point de départ concret d'un plan de présence.",
    visual: VisualOutreach,
  },
] as const;

/* ---------------------------------------------------------------- page --- */

export default function TestLanding() {
  const { openWaitlistModal } = useWaitlistModalStore();
  const [promptIdx, setPromptIdx] = useState(0);
  const [surfaceIdx, setSurfaceIdx] = useState(0);

  const prompt = DEMO_PROMPTS[promptIdx] ?? DEMO_PROMPTS[0];
  const surface = SURFACES[surfaceIdx] ?? SURFACES[0];
  if (!prompt || !surface) return null;
  const SurfaceIcon = surface.icon;
  const SurfaceVisual = surface.visual;

  return (
    <>
      <Head>
        <title>ShowYourBrand — Êtes-vous cité par les IA ?</title>
        <meta
          name="description"
          content="ShowYourBrand interroge ChatGPT, Perplexity, Claude et Gemini chaque semaine sur vos prompts, mesure si votre marque est citée, et vous dit quoi corriger moteur par moteur."
        />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-[#07090C] text-white antialiased">
        {/* ------------------------------------------------------- header -- */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07090C]/80 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
            <Link href="/testlanding" className="flex items-center gap-2.5">
              <SybMark className="w-5 h-5 text-[#C6F24E]" />
              <span
                className="font-bold tracking-tight"
                style={{ fontFamily: "var(--font-grotesk)" }}
              >
                ShowYourBrand
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-7 text-sm text-gray-400">
              <a href="#mecanique" className="hover:text-white transition">
                Le problème
              </a>
              <a href="#produit" className="hover:text-white transition">
                Le produit
              </a>
              <a href="#moteurs" className="hover:text-white transition">
                Moteurs
              </a>
              <a href="#prix" className="hover:text-white transition">
                Prix
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:block text-sm text-gray-400 hover:text-white transition"
              >
                Connexion
              </Link>
              <button
                type="button"
                onClick={openWaitlistModal}
                className="rounded-full bg-[#C6F24E] px-4 py-2 text-sm font-semibold text-[#07090C] hover:brightness-110 transition"
              >
                Voir mon score
              </button>
            </div>
          </div>
        </header>

        {/* --------------------------------------------------------- hero -- */}
        <section className="relative overflow-hidden">
          <GridBg />
          <div
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-[0.18] blur-3xl"
            style={{
              background: `radial-gradient(circle, ${ACCENT} 0%, transparent 65%)`,
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C6F24E] animate-pulse" />
                Monitoring GEO en continu
              </span>

              <h1
                className="mt-6 text-[2.6rem] leading-[1.05] sm:text-5xl md:text-6xl font-bold tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-grotesk)" }}
              >
                Vos clients ne
                <br />
                cherchent plus.
                <br />
                <span className="text-[#C6F24E]">Ils demandent.</span>
              </h1>

              <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-lg">
                Et quand ils demandent, une IA répond par trois noms de marques.
                ShowYourBrand mesure, chaque semaine, si le vôtre en fait partie
                — sur ChatGPT, Perplexity, Claude et Gemini.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={openWaitlistModal}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C6F24E] px-6 py-3.5 font-semibold text-[#07090C] hover:brightness-110 transition"
                >
                  Mesurer ma visibilité
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#produit"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 font-medium text-gray-300 hover:bg-white/5 transition"
                >
                  Voir le produit
                </a>
              </div>

              <div className="mt-8 flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-600">
                  Surveillé sur
                </span>
                {LLM_ORDER.map((id) => (
                  <EngineLogo key={id} id={id} size={30} />
                ))}
              </div>

              <p className="mt-5 text-sm text-gray-600">
                Sans engagement · {PROMPT_COUNT} prompts suivis · Rapport
                hebdomadaire
              </p>
            </div>

            {/* interactive answer panel */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {DEMO_PROMPTS.map((p, i) => (
                  <button
                    key={p.question}
                    type="button"
                    onClick={() => setPromptIdx(i)}
                    className={`rounded-full px-3.5 py-1.5 text-xs transition border ${
                      i === promptIdx
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/5 bg-white/[0.02] text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Prompt {i + 1}
                  </button>
                ))}
              </div>
              <AnswerPanel prompt={prompt} />
              <p className="mt-3 text-xs text-gray-600">
                Exemple illustratif — {DEMO_BRAND} est une marque fictive.
                Changez de prompt : la marque apparaît sur l&apos;un, disparaît
                sur les autres. C&apos;est exactement ce que le produit mesure.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------- product visual ------ */}
        <section className="relative border-t border-white/5 bg-[#0B0E13]">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <div className="grid lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-14 items-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                  Ce que vous ouvrez le lundi
                </p>
                <h2
                  className="mt-4 text-3xl md:text-[2.5rem] leading-[1.1] font-bold tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-grotesk)" }}
                >
                  Un chiffre,
                  <br />
                  et sa raison.
                </h2>
                <p className="mt-5 text-gray-400 leading-relaxed">
                  Un score global sur 100, la décomposition par moteur qui
                  explique d&apos;où il vient, et douze semaines d&apos;historique
                  pour savoir si vous montez ou si vous décrochez.
                </p>

                <dl className="mt-8 space-y-4">
                  {[
                    { k: `${CURRENT}/100`, v: "score global pondéré" },
                    { k: `${PROMPT_COUNT} prompts`, v: "rejoués à intervalle fixe" },
                    { k: "4 moteurs", v: "mesurés séparément" },
                  ].map((s) => (
                    <div key={s.k} className="flex items-baseline gap-3">
                      <dt
                        className="text-xl font-bold text-[#C6F24E] tabular-nums"
                        style={{ fontFamily: "var(--font-grotesk)" }}
                      >
                        {s.k}
                      </dt>
                      <dd className="text-sm text-gray-500">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <DashboardMock />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- mécanique -- */}
        <section id="mecanique" className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
              Le problème
            </p>
            <h2
              className="mt-4 text-3xl md:text-[2.75rem] leading-tight font-bold tracking-[-0.02em] max-w-3xl"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              Vos outils SEO ne voient rien de ce qui se passe dans une
              conversation.
            </h2>

            <div className="mt-12">
              <SerpVsAnswer />
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
              {[
                {
                  gone: "Pas de clic",
                  detail:
                    "L'utilisateur obtient sa réponse dans le chat. Aucune visite, aucun referrer : votre analytics ne verra jamais cette recommandation.",
                },
                {
                  gone: "Pas de mot-clé",
                  detail:
                    "On ne tape plus « crm pme », on écrit une phrase entière, différente à chaque fois. Le volume de recherche ne décrit plus la demande.",
                },
                {
                  gone: "Pas de position 1",
                  detail:
                    "Il n'y a pas dix résultats bleus, mais deux ou trois marques nommées dans un paragraphe. On y est, ou on n'y est pas.",
                },
              ].map((c) => (
                <div key={c.gone} className="bg-[#0B0E13] p-7 md:p-8">
                  <div className="text-red-400/80 text-sm font-mono mb-3">
                    ✕ {c.gone}
                  </div>
                  <p className="text-gray-400 leading-relaxed text-[15px]">
                    {c.detail}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-lg text-gray-300 max-w-2xl">
              La seule mesure qui reste, c&apos;est de{" "}
              <span className="text-white font-semibold">
                poser les questions soi-même
              </span>{" "}
              — régulièrement, sur chaque moteur, et de compter. C&apos;est tout
              ce que fait ShowYourBrand, en continu.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------- comment ça --- */}
        <section className="border-t border-white/5 bg-[#0B0E13]">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
              Comment ça marche
            </p>
            <h2
              className="mt-4 text-3xl md:text-4xl font-bold tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              Quatre étapes, puis ça tourne tout seul.
            </h2>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  n: "01",
                  t: "Vous déclarez",
                  d: "Votre marque, votre site, vos concurrents, et les questions que vos clients posent vraiment.",
                },
                {
                  n: "02",
                  t: "On interroge",
                  d: "Chaque prompt est envoyé à chaque moteur activé, automatiquement, chaque semaine ou chaque jour.",
                },
                {
                  n: "03",
                  t: "On mesure",
                  d: "Détection de la marque dans la réponse, position parmi les marques citées, extraction des sources.",
                },
                {
                  n: "04",
                  t: "On alerte",
                  d: "Score recalculé, comparé à la semaine précédente. Si ça décroche, vous recevez un email.",
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
                >
                  <span
                    className="font-mono text-sm text-[#C6F24E]"
                    style={{ fontFamily: "var(--font-grotesk)" }}
                  >
                    {s.n}
                  </span>
                  <h3 className="mt-3 font-semibold text-white">{s.t}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ moteurs -- */}
        <section id="moteurs" className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
              <div className="lg:sticky lg:top-24">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                  Un score par moteur
                </p>
                <h2
                  className="mt-4 text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-tight"
                  style={{ fontFamily: "var(--font-grotesk)" }}
                >
                  Fort sur Perplexity, absent de Claude — et ce n&apos;est pas la
                  même correction.
                </h2>
                <p className="mt-5 text-gray-400 leading-relaxed">
                  Chaque moteur construit ses réponses à partir de sources
                  différentes. Un score global unique masque exactement
                  l&apos;information dont vous avez besoin pour agir.
                </p>

                <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 mb-4">
                    Pondération du score global
                  </p>
                  <div className="space-y-3">
                    {LLM_ORDER.map((id) => (
                      <div key={id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 w-24">
                          {LLMS[id].name}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${ENGINE_WEIGHTS[id] * 100}%`,
                              backgroundColor: LLMS[id].color,
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs text-gray-500 w-10 text-right">
                          {Math.round(ENGINE_WEIGHTS[id] * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-gray-600 leading-relaxed">
                    Pondéré par l&apos;usage estimé de chaque moteur : être cité
                    là où sont vos clients compte davantage.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {LLM_ORDER.map((id) => (
                  <div
                    key={id}
                    className="rounded-2xl border border-white/[0.07] bg-[#0B0E13] p-6 hover:border-white/15 transition"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <EngineLogo id={id} size={32} />
                      <span
                        className="font-semibold"
                        style={{ fontFamily: "var(--font-grotesk)" }}
                      >
                        {LLMS[id].name}
                      </span>
                      <span
                        className="ml-auto font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded"
                        style={{
                          color: LLMS[id].color,
                          backgroundColor: `${LLMS[id].color}1a`,
                        }}
                      >
                        {Math.round(ENGINE_WEIGHTS[id] * 100)}% du score
                      </span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      {LLMS[id].bias}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ produit -- */}
        <section id="produit" className="border-t border-white/5 bg-[#0B0E13]">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
              Le produit
            </p>
            <h2
              className="mt-4 text-3xl md:text-4xl font-bold tracking-[-0.02em] max-w-2xl"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              Six écrans. Un seul objectif : savoir quoi faire lundi matin.
            </h2>

            <div className="mt-10 flex flex-wrap gap-2">
              {SURFACES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSurfaceIdx(i)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition border ${
                    i === surfaceIdx
                      ? "border-[#C6F24E]/40 bg-[#C6F24E]/10 text-[#C6F24E]"
                      : "border-white/[0.07] bg-white/[0.02] text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid lg:grid-cols-2 gap-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7 md:p-9">
              <div>
                <SurfaceIcon className="w-6 h-6 text-[#C6F24E]" />
                <h3
                  className="mt-4 text-2xl font-bold tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-grotesk)" }}
                >
                  {surface.title}
                </h3>
                <p className="mt-3 text-gray-400 leading-relaxed text-[15px]">
                  {surface.body}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#0C1016] p-5 flex flex-col justify-center">
                <SurfaceVisual />
              </div>
            </div>

            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Bell,
                  t: "Alerte email",
                  d: "Déclenchée quand la variation dépasse votre seuil.",
                },
                {
                  icon: FileDown,
                  t: "Rapport client",
                  d: "Export en marque blanche sur le plan Agence.",
                },
                {
                  icon: Check,
                  t: "Sans clé API",
                  d: "Rien à brancher : les moteurs sont interrogés côté serveur.",
                },
              ].map((f) => (
                <div
                  key={f.t}
                  className="rounded-xl border border-white/[0.07] p-5"
                >
                  <f.icon className="w-4 h-4 text-gray-500" />
                  <div className="mt-3 text-sm font-semibold text-white">
                    {f.t}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ pour qui -- */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
              Pour qui
            </p>
            <h2
              className="mt-4 text-3xl md:text-4xl font-bold tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              Trois métiers, trois questions différentes.
            </h2>

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              {[
                {
                  who: "Équipe marketing SaaS",
                  q: "« Est-ce que ChatGPT nous cite quand on demande une alternative à notre concurrent ? »",
                  d: "Un projet, vos prompts d'acquisition, la courbe qui prouve que le contenu publié a servi à quelque chose.",
                },
                {
                  who: "Consultant SEO freelance",
                  q: "« Comment je facture du GEO si je ne peux rien mesurer ? »",
                  d: "Un score avant / après par client, des recommandations par moteur, et l'écran Impact pour montrer ce que votre intervention a changé.",
                },
                {
                  who: "Agence",
                  q: "« Comment je suis 15 clients sans y passer mes lundis ? »",
                  d: "Projets illimités, exécution quotidienne, rapports en marque blanche, alertes automatiques quand un compte décroche.",
                },
              ].map((p) => (
                <div
                  key={p.who}
                  className="rounded-2xl border border-white/[0.07] bg-[#0B0E13] p-7"
                >
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#C6F24E]">
                    {p.who}
                  </div>
                  <p
                    className="mt-4 text-lg leading-snug text-white"
                    style={{ fontFamily: "var(--font-grotesk)" }}
                  >
                    {p.q}
                  </p>
                  <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                    {p.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- prix -- */}
        <section id="prix" className="border-t border-white/5 bg-[#0B0E13]">
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
              Tarifs
            </p>
            <h2
              className="mt-4 text-3xl md:text-4xl font-bold tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              Le prix d&apos;un outil, pas d&apos;un consultant.
            </h2>

            <div className="mt-12 grid md:grid-cols-3 gap-5">
              {(["solo", "pro", "agency"] as const).map((id) => {
                const plan = MONITORING_PLANS[id];
                const featured = id === "pro";
                return (
                  <div
                    key={id}
                    className={`rounded-2xl border p-7 flex flex-col ${
                      featured
                        ? "border-[#C6F24E]/40 bg-[#C6F24E]/[0.04]"
                        : "border-white/[0.07] bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-semibold"
                        style={{ fontFamily: "var(--font-grotesk)" }}
                      >
                        {plan.name}
                      </span>
                      {featured && (
                        <span className="rounded-full bg-[#C6F24E] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#07090C]">
                          Le plus choisi
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-baseline gap-1">
                      <span
                        className="text-4xl font-bold tracking-tight"
                        style={{ fontFamily: "var(--font-grotesk)" }}
                      >
                        {plan.price}€
                      </span>
                      <span className="text-gray-500 text-sm">/mois</span>
                    </div>

                    <ul className="mt-7 space-y-3 text-sm flex-1">
                      {[
                        plan.projects === Infinity
                          ? "Projets illimités"
                          : `${plan.projects} projet${plan.projects > 1 ? "s" : ""} suivi${plan.projects > 1 ? "s" : ""}`,
                        `${plan.maxLLMs} moteurs sur ${LLM_ORDER.length}`,
                        plan.frequencies.includes("daily")
                          ? "Analyse quotidienne"
                          : "Analyse hebdomadaire",
                        "Concurrents, sources & recommandations",
                        plan.brandedPdf
                          ? "Rapports en marque blanche"
                          : "Alertes email sur variation",
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#C6F24E] shrink-0 mt-0.5" />
                          <span className="text-gray-400">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/signup?plan=${id}`}
                      className={`mt-7 rounded-full px-5 py-3 text-sm font-semibold text-center transition ${
                        featured
                          ? "bg-[#C6F24E] text-[#07090C] hover:brightness-110"
                          : "border border-white/15 text-white hover:bg-white/5"
                      }`}
                    >
                      Commencer
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-sm text-gray-600">
              Prix en {config.monitoring.currency}, facturés au mois. Sans
              engagement.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- faq -- */}
        <section className="border-t border-white/5">
          <div className="mx-auto max-w-3xl px-5 py-20 md:py-28">
            <h2
              className="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-10"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              Questions légitimes.
            </h2>

            <div className="divide-y divide-white/5 border-y border-white/5">
              {[
                {
                  q: "Les réponses des IA changent tout le temps. Comment mesurer quelque chose de stable ?",
                  a: "Justement : on ne mesure pas une réponse, on mesure un taux. Le même jeu de prompts est rejoué à intervalle fixe sur chaque moteur, et le score est le pourcentage de réponses où la marque est citée. C'est la répétition qui rend la mesure exploitable, pas la capture d'écran.",
                },
                {
                  q: "En quoi c'est différent d'un audit GEO ponctuel ?",
                  a: "Un audit vous donne une photo. Ici, vous suivez une courbe : vous voyez le décrochage la semaine où il arrive, et vous voyez si une action a produit un effet. C'est du monitoring, pas un rapport.",
                },
                {
                  q: "Il faut fournir mes clés API OpenAI ou Anthropic ?",
                  a: "Non. Les moteurs sont interrogés côté serveur, dans votre abonnement. Vous n'avez rien à brancher.",
                },
                {
                  q: "Et si mes concurrents font la même chose ?",
                  a: "Ils la feront. C'est précisément la raison de commencer maintenant : la courbe n'a de valeur que si elle est longue, et celle qui commence aujourd'hui vaudra plus dans six mois que celle qui commencera dans six mois.",
                },
                {
                  q: "Je peux suivre les projets de plusieurs clients ?",
                  a: `Oui : ${MONITORING_PLANS.pro.projects} projets sur le plan ${MONITORING_PLANS.pro.name}, illimités sur ${MONITORING_PLANS.agency.name}, avec rapports en marque blanche.`,
                },
              ].map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                    <span className="font-medium text-[15px] text-white">
                      {f.q}
                    </span>
                    <span className="text-gray-600 text-xl leading-none transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-gray-400 leading-relaxed text-[15px] pr-8">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- final CTA -- */}
        <section className="border-t border-white/5 bg-[#0B0E13]">
          <div className="mx-auto max-w-3xl px-5 py-24 text-center">
            <h2
              className="text-3xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.1]"
              style={{ fontFamily: "var(--font-grotesk)" }}
            >
              En ce moment, une IA recommande
              <br />
              <span className="text-[#C6F24E]">quelqu&apos;un d&apos;autre</span>
              .
            </h2>
            <p className="mt-5 text-gray-400 text-lg">
              Sachez qui, sur quelles questions, et ce qu&apos;il faut corriger.
            </p>
            <button
              type="button"
              onClick={openWaitlistModal}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#C6F24E] px-7 py-4 font-semibold text-[#07090C] hover:brightness-110 transition"
            >
              Mesurer ma visibilité
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ------------------------------------------------------- footer -- */}
        <footer className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <SybMark className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                ShowYourBrand · Monitoring GEO
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-gray-400 transition">
                Confidentialité
              </Link>
              <Link href="/terms" className="hover:text-gray-400 transition">
                CGU
              </Link>
              <Link href="/" className="hover:text-gray-400 transition">
                Landing actuelle
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
