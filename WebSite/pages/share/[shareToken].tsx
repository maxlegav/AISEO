import Head from "next/head";
import type { GetServerSideProps } from "next";
import mongoose from "mongoose";
import Audit from "@/models/Audit";
import { ExternalLink } from "lucide-react";
import AuditHero from "@/components/audit/AuditHero";
import ActionPlan from "@/components/audit/ActionPlan";
import GeoQuickWins from "@/components/audit/GeoQuickWins";
import CompetitorComparison from "@/components/audit/CompetitorComparison";
import DeepDive from "@/components/audit/DeepDive";
import type { AuditDoc, IssueItem, PromptGapItem, HtmlScan } from "@/components/audit/auditTypes";
import { buildSignalItems } from "@/components/audit/auditHelpers";
import config from "@/config";

// ─── Server-side data fetching ────────────────────────────────────────────────

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const shareToken = params?.shareToken;
  if (!shareToken || typeof shareToken !== "string") {
    return { notFound: true };
  }

  try {
    await connectDB();
    const doc = await Audit.findOne({ shareToken, status: "completed" })
      .select("-userId -businessId -reviewedBy -questionsEditedBy -shareToken")
      .lean();

    if (!doc) return { notFound: true };

    // Serialize: convert ObjectIds and Dates to strings
    const audit = JSON.parse(JSON.stringify(doc)) as AuditDoc;
    return { props: { audit } };
  } catch {
    return { notFound: true };
  }
};

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props { audit: AuditDoc }

export default function SharedAuditPage({ audit }: Props) {
  const r = audit.results ?? {};
  const issues = (r.issues ?? []) as IssueItem[];
  const promptGaps = (r.promptGaps ?? []) as PromptGapItem[];
  const competitors = r.competitorResults ?? [];
  const engines = r.enginesSucceeded ?? r.enginesUsed ?? [];
  const promptResults = r.promptResults ?? [];
  const htmlScan = r.htmlScan ?? null;
  const categoryScores = r.categoryScores ?? {};
  const levelScores = r.levelScores ?? {};
  const citationStats = r.citationStats ?? null;
  const llmsTxtContent = r.llmsTxtContent ?? null;
  const llmHijackPrompt = r.llmHijackPrompt ?? null;
  const snap = r.businessSnapshot;
  const geoScore = audit.geoScore ?? 0;

  const faqSchemaContent: string | null = promptGaps.length > 0
    ? `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n${
        promptGaps.map((gap) => {
          const answer = `${snap?.name ?? "We"} — [fill in your specific answer]. Add details about ${gap.category === "comparison" ? "how you compare to alternatives" : "your products and services"}.`;
          return `    {\n      "@type": "Question",\n      "name": ${JSON.stringify(gap.question)},\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": ${JSON.stringify(answer)}\n      }\n    }`;
        }).join(",\n")
      }\n  ]\n}\n</script>`
    : null;

  const hasQuickWins = !!(llmsTxtContent || llmHijackPrompt || faqSchemaContent);
  const signalItems = htmlScan ? buildSignalItems(htmlScan as HtmlScan) : [];

  // Meta content
  const businessName = audit.businessName ?? snap?.name ?? "GEO Audit";
  const scoreLabel = geoScore >= 70 ? "Good" : geoScore >= 40 ? "Moderate" : "Critical";
  const title = `GEO Report — ${businessName} (${geoScore}/100 · ${scoreLabel})`;
  const description = `AI visibility audit for ${businessName}. GEO Health Score: ${geoScore}/100. See how this brand performs across ChatGPT, Claude, Perplexity & DeepSeek.`;
  const siteUrl = config.siteUrl;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="noindex, nofollow" />

        {/* OpenGraph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="ShowYourBrand" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
        {/* Header */}
        <header className="border-b border-white/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-gray-900">ShowYourBrand</span>
              <span className="hidden sm:inline text-[10px] text-violet-600 font-semibold uppercase tracking-wider bg-violet-50 px-2 py-0.5 rounded-full">
                GEO Report
              </span>
            </div>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 transition-colors font-medium"
            >
              Get your own audit
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </header>

        {/* Business + score badge */}
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
            {snap?.primaryUrl && (
              <a
                href={snap.primaryUrl.startsWith("http") ? snap.primaryUrl : `https://${snap.primaryUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-violet-500 transition-colors flex items-center gap-1"
              >
                {snap.primaryUrl.replace(/^https?:\/\//, "")}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-gray-400">
            GEO audit report — shared via ShowYourBrand
          </p>
        </div>

        {/* Audit sections */}
        <main className="max-w-5xl mx-auto px-6 py-4 space-y-4">
          <AuditHero audit={audit} results={r} />
          <ActionPlan
            issues={issues}
            promptGaps={promptGaps}
            hasQuickWins={hasQuickWins}
            categoryScores={categoryScores}
            htmlKeywords={
              (htmlScan as { keywords?: { word: string; count: number; tfidf?: number }[] } | null)
                ?.keywords ?? []
            }
            businessSnapshot={
              snap
                ? {
                    name: snap.name,
                    category: snap.category,
                    description: snap.description,
                    primaryUrl: snap.primaryUrl,
                    targetKeywords: snap.targetKeywords,
                  }
                : undefined
            }
            auditId={audit._id}
            signalItems={signalItems}
          />
          <GeoQuickWins
            llmsTxtContent={llmsTxtContent}
            llmHijackPrompt={llmHijackPrompt}
            faqSchemaContent={faqSchemaContent}
          />
          <DeepDive
            promptResults={promptResults}
            htmlScan={htmlScan}
            citationStats={citationStats}
            categoryScores={categoryScores}
            levelScores={levelScores}
            engines={engines}
            htmlScore={r.htmlScannerScore ?? null}
            businessSnapshot={
              snap
                ? {
                    name: snap.name,
                    category: snap.category,
                    description: snap.description,
                    primaryUrl: snap.primaryUrl,
                    targetKeywords: snap.targetKeywords,
                  }
                : undefined
            }
            promptGaps={promptGaps}
          />
          <CompetitorComparison
            competitors={competitors}
            geoScore={geoScore}
            businessName={audit.businessName}
          />
        </main>

        {/* Footer */}
        <footer className="border-t border-white/60 bg-white/60 mt-12">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Report generated by{" "}
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-500 hover:underline font-medium"
              >
                ShowYourBrand
              </a>{" "}
              — AI visibility platform for agencies.
            </p>
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-full transition-colors whitespace-nowrap"
            >
              Get your own GEO audit →
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
