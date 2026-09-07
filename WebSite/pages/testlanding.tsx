import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Minus, Plus } from "lucide-react";
import SybMark from "@/components/icons/SybMark";
import DashboardPreview from "@/components/landing/DashboardPreview";
import { useWaitlistModalStore } from "@/stores";
import { MONITORING_PLANS } from "@/lib/monitoring/plans";

/**
 * `/testlanding` — the condensed landing page.
 *
 * A shorter edit of `/`: seven sections, each making exactly one point, in the
 * order a prospect actually needs them (what changed → what the product is →
 * how it runs → what it costs → objections → act). Deliberate departures from
 * the page it condenses:
 *
 *  - **French throughout.** `/` mixes an English pitch with French pricing
 *    cards and a French app; the target buyer is French.
 *  - **Two sections merged.** "GEO is the new SEO" and "GEO is not SEO with a
 *    new name" made the same argument twice; here the claim, the picture and
 *    the comparison table are one section.
 *  - **No icon-card grids.** Three identical rounded cards with a pastel icon
 *    is the most recognisable generated-template tell. Sections use different
 *    forms — a table, a ledger, a product frame — so consecutive sections never
 *    look like the same component with new words.
 *  - **The video is the closer**, not an interruption after the hero.
 *  - **The demo is a door, not a screenshot**: `/demo` is the real dashboard,
 *    open without an account.
 *  - Nothing here claims a number the codebase cannot back. The market
 *    statistics strip and the "+56 points in 6 weeks" case study from `/` are
 *    gone.
 */

const ENGINES = [
  { name: "ChatGPT", logo: "/logos/openai-logo.svg" },
  { name: "Perplexity", logo: "/logos/perplexity-logo.svg" },
  { name: "Claude", logo: "/logos/claude-logo.svg" },
  { name: "Gemini", logo: "/logos/gemini-logo.svg" },
];

/* ------------------------------------------------------------------ hero -- */

/**
 * The premise of the product in one picture: an answer that names three
 * competitors and not you. Kept deliberately generic ("Concurrent A") — an
 * invented answer about a named real brand would be a claim we cannot make.
 */
function AnswerCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[2rem] bg-ink-100/60 blur-2xl" />
      <div className="relative rounded-2xl border border-ink-200 bg-white shadow-premium-lg">
        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3">
          <Image
            src="/logos/openai-logo.svg"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4"
          />
          <span className="font-data text-[11px] uppercase tracking-[0.14em] text-ink-500">
            ChatGPT · aujourd&apos;hui
          </span>
        </div>

        <div className="px-5 py-5">
          <p className="mb-4 text-sm text-ink-600">
            <span className="font-data text-[11px] uppercase tracking-widest text-ink-400">
              Requête
            </span>
            <br />
            <span className="text-ink-900">
              « Quel outil choisir pour <em>[votre catégorie]</em> ? »
            </span>
          </p>

          <div className="space-y-2 text-[15px] leading-relaxed text-ink-700">
            <p>Trois options ressortent selon les cas d&apos;usage :</p>
            <p>
              <span className="rounded bg-ink-100 px-1.5 py-0.5 font-medium text-ink-900">
                Concurrent A
              </span>{" "}
              pour les équipes qui démarrent,{" "}
              <span className="rounded bg-ink-100 px-1.5 py-0.5 font-medium text-ink-900">
                Concurrent B
              </span>{" "}
              si le budget suit, et{" "}
              <span className="rounded bg-ink-100 px-1.5 py-0.5 font-medium text-ink-900">
                Concurrent C
              </span>{" "}
              pour un usage plus technique.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-accent/25 bg-accent-muted px-4 py-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
              <Minus className="h-3 w-3 text-white" strokeWidth={3} />
            </span>
            <span className="text-sm font-medium text-accent-contrast">
              Votre marque n&apos;apparaît pas. Rien dans vos outils ne vous
              l&apos;a signalé.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- SEO → GEO shift -- */

function ShiftPanels() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-ink-200 bg-paper-sunken/60 p-6">
        <p className="font-data mb-5 text-[11px] uppercase tracking-[0.16em] text-ink-500">
          Hier · dix liens bleus
        </p>
        <div className="space-y-3.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div
                className="h-2 rounded bg-ink-400/60"
                style={{ width: `${72 - i * 6}%` }}
              />
              <div
                className="h-1.5 rounded bg-ink-300/50"
                style={{ width: `${90 - i * 5}%` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-ink-600">
          Dix places, une position mesurable, un clic, un referrer dans vos
          analytics. Tout l&apos;outillage SEO est construit là-dessus.
        </p>
      </div>

      <div className="rounded-2xl border border-accent/25 bg-white p-6 shadow-premium">
        <p className="font-data mb-5 text-[11px] uppercase tracking-[0.16em] text-accent">
          Aujourd&apos;hui · un paragraphe
        </p>
        <div className="space-y-2.5">
          <div className="h-2 w-[92%] rounded bg-ink-200" />
          <div className="h-2 w-[84%] rounded bg-ink-200" />
          <div className="flex flex-wrap items-center gap-1.5 py-1.5">
            <span className="rounded bg-ink-900 px-2 py-0.5 text-xs font-medium text-white">
              Concurrent A
            </span>
            <span className="text-xs text-ink-400">,</span>
            <span className="rounded bg-ink-900 px-2 py-0.5 text-xs font-medium text-white">
              Concurrent B
            </span>
            <span className="text-xs text-ink-400">et</span>
            <span className="rounded bg-ink-900 px-2 py-0.5 text-xs font-medium text-white">
              Concurrent C
            </span>
          </div>
          <div className="h-2 w-[78%] rounded bg-ink-200" />
          <div className="h-2 w-[45%] rounded bg-ink-200" />
        </div>
        <p className="mt-6 text-sm leading-relaxed text-ink-600">
          Trois noms. Pas de position, pas de clic, pas de referrer.{" "}
          <span className="font-medium text-ink-900">
            Vous y êtes ou vous n&apos;y êtes pas
          </span>{" "}
          — et c&apos;est exactement ce que personne ne mesure chez vous.
        </p>
      </div>
    </div>
  );
}

const SHIFT_ROWS = [
  {
    label: "Où regarde l'acheteur",
    seo: "Une page de résultats, dix liens à comparer",
    geo: "Une réponse, deux ou trois marques nommées",
  },
  {
    label: "Ce que vous optimisez",
    seo: "Des mots-clés et un classement",
    geo: "Le fait d'être cité — par le modèle, et par ses sources",
  },
  {
    label: "Ce que vous mesurez",
    seo: "Position moyenne, clics, impressions",
    geo: "Taux de citation par moteur, et part de la réponse",
  },
  {
    label: "Le risque",
    seo: "Tomber en page deux",
    geo: "Ne pas être mentionné du tout",
  },
];

/* ------------------------------------------------------------- how it runs */

const LEDGER = [
  {
    when: "Jour 0 · 4 min",
    title: "Vous décrivez la marque",
    body: "Le nom, le site, deux ou trois concurrents que vous perdez régulièrement. On vous propose les requêtes que vos acheteurs tapent réellement ; vous gardez celles qui comptent.",
  },
  {
    when: "Jour 0 · 10 min",
    title: "Le premier run part",
    body: "Vos requêtes sont posées à ChatGPT, Perplexity, Claude et Gemini. Vous ressortez avec un score par moteur et, surtout, la liste des marques citées à votre place.",
  },
  {
    when: "Chaque lundi · 6 h",
    title: "Le suivi tourne sans vous",
    body: "Mêmes requêtes, mêmes moteurs, même mesure, semaine après semaine. C'est la répétition qui transforme un score en courbe, et une courbe en décision.",
  },
  {
    when: "Dès qu'un score bouge",
    title: "Vous recevez un mail",
    body: "Une variation au-delà de votre seuil, sur un moteur ou sur le score global. Vous n'ouvrez l'outil que quand il y a une raison de l'ouvrir.",
  },
  {
    when: "Semaine 6",
    title: "Vous savez ce qui a marché",
    body: "La page Impact rapproche chaque action de la courbe qui a suivi. Ce qui déplace le score reste au programme, le reste saute.",
  },
];

/* ------------------------------------------------------------------- FAQ -- */

const FAQ = [
  {
    q: "Au bout de combien de temps je vois quelque chose ?",
    a: "Le premier run tourne à la création du projet : vous avez un score par moteur et la liste des concurrents cités le jour même. La courbe, elle, demande quelques semaines — c'est le principe d'un suivi, pas d'un audit.",
  },
  {
    q: "Vous interrogez vraiment les modèles ?",
    a: "Oui : chaque requête part en appel API vers ChatGPT, Perplexity, Claude et Gemini, la réponse complète est stockée, et la détection de marque est faite dessus. Vous pouvez rouvrir la réponse exacte qui a produit chaque point du score.",
  },
  {
    q: "Pourquoi mon score change autant d'un moteur à l'autre ?",
    a: "Parce qu'ils ne lisent pas les mêmes sources. ChatGPT s'appuie sur Bing, Perplexity privilégie les pages récentes à fort trafic, Claude cite les forums bien plus que les autres, Gemini favorise les propriétés Google. Le produit vous donne un score par moteur et l'explication qui va avec, pas une moyenne opaque.",
  },
  {
    q: "Qu'est-ce que je fais concrètement des recommandations ?",
    a: "Chaque requête perdue arrive avec les moteurs qui vous ignorent, les concurrents cités à votre place, les sources qu'ils ont utilisées, et l'action à mener. Le plan d'action est trié par impact estimé sur le score et par effort.",
  },
  {
    q: "Je suis une agence, je peux le présenter à mes clients ?",
    a: "Oui. Le plan Agence ouvre les projets illimités, un tableau multi-clients, et l'export PDF à vos couleurs et votre logo.",
  },
];

function FaqRow({ item }: { item: (typeof FAQ)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="text-[15px] font-medium text-ink-900 md:text-base">
          {item.q}
        </span>
        <span className="shrink-0 text-ink-500">
          {open ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </span>
      </button>
      {open && (
        <p className="max-w-3xl pb-6 text-[15px] leading-relaxed text-ink-600">
          {item.a}
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- pricing -- */

const PLAN_COPY: {
  id: "solo" | "pro" | "agency";
  for: string;
  features: string[];
  cta: string;
}[] = [
  {
    id: "solo",
    for: "Indépendants et consultants",
    features: [
      "2 marques suivies en continu",
      "3 moteurs au choix",
      "Suivi hebdomadaire automatique",
      "Score et explication par moteur",
      "Concurrents et sources citées",
      "Alerte mail sur variation",
    ],
    cta: "Commencer",
  },
  {
    id: "pro",
    for: "Équipes marketing",
    features: [
      "10 marques suivies en continu",
      "Les 4 moteurs, dont 2 projets en quotidien",
      "Historique 12 semaines par moteur",
      "Plan d'action trié par impact",
      "Suivi concurrentiel avancé",
      "Alerte mail sur variation",
    ],
    cta: "Suivre ma visibilité",
  },
  {
    id: "agency",
    for: "Agences, 10 à 20 clients",
    features: [
      "Projets illimités",
      "Les 4 moteurs, dont 5 projets en quotidien",
      "Tableau multi-clients",
      "Export PDF à votre marque",
      "Logo et couleurs de l'agence",
      "Support prioritaire en français",
    ],
    cta: "Réserver un appel",
  },
];

/* ------------------------------------------------------------------ page -- */

export default function TestLanding() {
  const { openWaitlistModal } = useWaitlistModalStore();

  return (
    <>
      <Head>
        <title>ShowYourBrand — Votre marque est-elle citée par les IA ?</title>
        <meta
          name="description"
          content="ShowYourBrand interroge ChatGPT, Perplexity, Claude et Gemini sur vos requêtes chaque semaine, mesure si votre marque est citée, et vous dit quoi corriger moteur par moteur."
        />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-paper text-ink-900 antialiased">
        {/* ------------------------------------------------------ header -- */}
        <header className="sticky top-0 z-50 border-b border-ink-200/70 bg-paper/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link href="/testlanding" className="flex items-center gap-2">
              <Image
                src="/syb_logo_transparent.png"
                alt=""
                width={26}
                height={26}
                className="h-[26px] w-[26px]"
              />
              <span className="text-[15px] font-semibold tracking-tight text-ink-900">
                ShowYourBrand
              </span>
            </Link>

            <nav className="hidden items-center gap-7 text-sm text-ink-600 md:flex">
              <a href="#constat" className="transition-colors hover:text-ink-900">
                Le constat
              </a>
              <a href="#produit" className="transition-colors hover:text-ink-900">
                Le produit
              </a>
              <a href="#methode" className="transition-colors hover:text-ink-900">
                Comment ça tourne
              </a>
              <a href="#prix" className="transition-colors hover:text-ink-900">
                Prix
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden text-sm text-ink-600 transition-colors hover:text-ink-900 sm:block"
              >
                Connexion
              </Link>
              <Link
                href="/demo"
                className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
              >
                Voir la démo
              </Link>
            </div>
          </div>
        </header>

        {/* -------------------------------------------------------- hero -- */}
        <section className="relative overflow-hidden border-b border-ink-200/70">
          <div className="absolute inset-0 bg-grid-premium opacity-70 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:pb-28 md:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div>
              <span className="font-data inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/80 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-600">
                <SybMark className="h-3.5 w-3.5 text-accent" />
                Monitoring GEO en continu
              </span>

              <h1 className="font-heading mt-6 text-[2.6rem] font-medium leading-[1.04] tracking-tight text-ink-900 sm:text-6xl lg:text-[4.2rem]">
                Vous êtes la réponse.
                <br />
                Ou vous n&apos;existez pas.
              </h1>

              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-600 md:text-lg">
                Quand un acheteur demande une recommandation à une IA, il reçoit
                deux ou trois noms — pas dix liens. ShowYourBrand pose vos
                requêtes à ChatGPT, Perplexity, Claude et Gemini chaque semaine,
                et vous dit lesquels vous citent, lesquels vous ignorent, et
                quoi corriger.
              </p>

              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/demo"
                  className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-7 py-3.5 text-base font-semibold text-white shadow-premium transition-all hover:-translate-y-0.5 hover:bg-ink-800"
                >
                  Ouvrir le dashboard de démo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <button
                  type="button"
                  onClick={openWaitlistModal}
                  className="inline-flex items-center rounded-full border border-ink-300 bg-white px-7 py-3.5 text-base font-semibold text-ink-800 transition-colors hover:border-ink-400 hover:text-ink-900"
                >
                  Réserver une démo
                </button>
              </div>
              <p className="mt-3 text-sm text-ink-500">
                La démo s&apos;ouvre sans compte et sans carte bancaire.
              </p>
            </div>

            <AnswerCard />
          </div>

          <div className="relative border-t border-ink-200/70 bg-white/50">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-5">
              <span className="font-data text-[11px] uppercase tracking-[0.16em] text-ink-500">
                Moteurs suivis
              </span>
              {ENGINES.map((e) => (
                <span key={e.name} className="flex items-center gap-2">
                  <Image
                    src={e.logo}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                  />
                  <span className="text-sm font-medium text-ink-700">
                    {e.name}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------- 1. le constat (SEO → GEO, fusionné) -- */}
        <section id="constat" className="border-b border-ink-200/70 px-5 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1fr] lg:gap-16">
              <div>
                <span className="font-data text-[11px] uppercase tracking-[0.16em] text-accent">
                  Le constat
                </span>
                <h2 className="font-heading mt-4 text-4xl font-medium leading-[1.08] tracking-tight text-ink-900 md:text-5xl">
                  Le SEO n&apos;a pas disparu.
                  <br />
                  Il a changé de page.
                </h2>
              </div>
              <div className="space-y-4 text-[17px] leading-relaxed text-ink-600 lg:pt-3">
                <p>
                  Vos acheteurs n&apos;arbitrent plus entre dix résultats : ils
                  posent la question et lisent la réponse. Le tri s&apos;est
                  déplacé du lecteur vers le modèle — et le modèle ne rend
                  qu&apos;une poignée de noms.
                </p>
                <p className="text-ink-900">
                  Ce n&apos;est pas du SEO rebaptisé. Ce qu&apos;on optimise, ce
                  qu&apos;on mesure et ce qu&apos;on risque ont changé en même
                  temps.
                </p>
              </div>
            </div>

            <div className="mt-12">
              <ShiftPanels />
            </div>

            {/* The comparison, set as an editorial table rather than cards. */}
            <div className="mt-12 overflow-hidden rounded-2xl border border-ink-200 bg-white">
              <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-ink-200 bg-paper-sunken/70">
                <div className="px-5 py-3.5" />
                <div className="font-data px-5 py-3.5 text-[11px] uppercase tracking-[0.14em] text-ink-500">
                  SEO classique
                </div>
                <div className="font-data px-5 py-3.5 text-[11px] uppercase tracking-[0.14em] text-accent">
                  GEO avec SYB
                </div>
              </div>
              {SHIFT_ROWS.map((r, i) => (
                <div
                  key={r.label}
                  className={
                    "grid grid-cols-[1.1fr_1fr_1fr] text-sm " +
                    (i < SHIFT_ROWS.length - 1
                      ? "border-b border-ink-100"
                      : "")
                  }
                >
                  <div className="px-5 py-4 font-medium text-ink-900">
                    {r.label}
                  </div>
                  <div className="px-5 py-4 text-ink-500">{r.seo}</div>
                  <div className="px-5 py-4 font-medium text-ink-800">
                    {r.geo}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-600">
              Même métier, autre terrain. Aucun de vos outils actuels ne mesure
              une seule ligne de la colonne de droite.
            </p>
          </div>
        </section>

        {/* --------------------------------------- 2. le produit / la démo -- */}
        <section id="produit" className="border-b border-ink-200/70 bg-white/40">
          <DashboardPreview ctaHref="/demo" />
        </section>

        {/* ------------------------------------ 3. comment ça tourne (ledger) */}
        <section id="methode" className="border-b border-ink-200/70 px-5 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="font-data text-[11px] uppercase tracking-[0.16em] text-accent">
                Comment ça tourne
              </span>
              <h2 className="font-heading mt-4 text-4xl font-medium leading-[1.08] tracking-tight text-ink-900 md:text-5xl">
                Quatre minutes de réglage,
                <br />
                puis ça tourne sans vous.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-ink-600">
                Le constat plus haut décrit le marché. Ceci décrit votre semaine.
              </p>
            </div>

            <ol className="mt-14 border-l border-ink-200">
              {LEDGER.map((step) => (
                <li
                  key={step.title}
                  className="relative grid gap-2 pb-10 pl-6 last:pb-0 md:grid-cols-[190px_1fr] md:gap-8 md:pl-8"
                >
                  <span className="absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full border-2 border-paper bg-ink-900" />
                  <span className="font-data pt-1 text-[11px] uppercase tracking-[0.14em] text-accent">
                    {step.when}
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-medium text-ink-900 md:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-600 md:text-base">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* --------------------------------------------------- 4. les prix -- */}
        <section id="prix" className="border-b border-ink-200/70 px-5 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="font-data text-[11px] uppercase tracking-[0.16em] text-accent">
                Les prix
              </span>
              <h2 className="font-heading mt-4 text-4xl font-medium leading-[1.08] tracking-tight text-ink-900 md:text-5xl">
                Un abonnement, pas un audit.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-ink-600">
                Un audit vous donne une photo. Vous avez besoin d&apos;une
                courbe : les prix sont mensuels, sans engagement, en euros.
              </p>
            </div>

            <div className="mt-12 grid items-stretch gap-5 md:grid-cols-3">
              {PLAN_COPY.map((plan) => {
                const p = MONITORING_PLANS[plan.id];
                const featured = plan.id === "pro";
                return (
                  <div
                    key={plan.id}
                    className={
                      "flex flex-col rounded-2xl border p-7 " +
                      (featured
                        ? "border-ink-900 bg-white shadow-premium-lg"
                        : "border-ink-200 bg-white/70")
                    }
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-data text-[11px] uppercase tracking-[0.16em] text-ink-600">
                        {p.name}
                      </span>
                      {featured && (
                        <span className="rounded-full bg-accent-muted px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                          Le plus choisi
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-500">{plan.for}</p>

                    <p className="mt-6 flex items-baseline gap-1.5">
                      <span className="font-heading text-5xl font-medium text-ink-900">
                        {p.price} €
                      </span>
                      <span className="text-sm text-ink-500">/ mois</span>
                    </p>

                    <ul className="mt-7 flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2.5 text-[15px] text-ink-700">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/signup?plan=${plan.id}`}
                      className={
                        "mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors " +
                        (featured
                          ? "bg-ink-900 text-white hover:bg-ink-800"
                          : "border border-ink-300 text-ink-800 hover:border-ink-400 hover:text-ink-900")
                      }
                    >
                      {plan.cta}
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-sm text-ink-600">
              Besoin d&apos;un volume sur mesure pour votre agence ?{" "}
              <button
                type="button"
                onClick={openWaitlistModal}
                className="font-semibold text-accent underline underline-offset-2"
              >
                Parlons-en.
              </button>
            </p>
          </div>
        </section>

        {/* --------------------------------------------------------- 5. FAQ */}
        <section className="border-b border-ink-200/70 px-5 py-20 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.7fr_1fr] lg:gap-16">
            <div>
              <span className="font-data text-[11px] uppercase tracking-[0.16em] text-accent">
                Objections
              </span>
              <h2 className="font-heading mt-4 text-4xl font-medium leading-[1.08] tracking-tight text-ink-900">
                Les questions qui reviennent
              </h2>
            </div>
            <div className="border-t border-ink-200">
              {FAQ.map((item) => (
                <FaqRow key={item.q} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------- 6. vidéo + CTA final -- */}
        <section className="relative overflow-hidden bg-ink-950 px-5 py-20 text-white md:py-28">
          <div className="absolute inset-0 bg-grid-dark opacity-60" />
          <div className="relative mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="font-data text-[11px] uppercase tracking-[0.16em] text-accent-soft">
                Deux minutes
              </span>
              <h2 className="font-heading mt-4 text-4xl font-medium leading-[1.06] tracking-tight md:text-6xl">
                Voyez ce que les IA
                <br />
                disent de vous.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-ink-300">
                Le produit en conditions réelles : un projet, un run, un score
                par moteur, et le plan d&apos;action qui en sort.
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 shadow-premium-lg">
              <video
                className="aspect-video w-full object-cover"
                controls
                playsInline
                preload="metadata"
              >
                <source src="/SYBvideo.mov" type="video/mp4" />
              </video>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-ink-900 transition-all hover:-translate-y-0.5 hover:bg-paper"
              >
                Ouvrir le dashboard de démo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={openWaitlistModal}
                className="inline-flex items-center rounded-full border border-white/25 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:border-white/50"
              >
                Réserver une démo
              </button>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ footer -- */}
        <footer className="bg-ink-950 px-5 pb-12 text-ink-300">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-white/10 pt-10 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <SybMark className="h-5 w-5 text-white" />
              <span className="text-sm font-semibold text-white">
                ShowYourBrand
              </span>
              <span className="text-sm text-ink-400">
                · Monitoring GEO en continu
              </span>
            </div>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <Link href="/demo" className="transition-colors hover:text-white">
                Démo
              </Link>
              <Link href="/blog" className="transition-colors hover:text-white">
                Blog
              </Link>
              <Link href="/login" className="transition-colors hover:text-white">
                Connexion
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-white">
                Confidentialité
              </Link>
              <Link href="/terms" className="transition-colors hover:text-white">
                CGU
              </Link>
            </nav>
          </div>
          <p className="mx-auto mt-8 max-w-6xl text-xs text-ink-500">
            © {new Date().getFullYear()} ShowYourBrand. Tous droits réservés.
          </p>
        </footer>
      </div>
    </>
  );
}
