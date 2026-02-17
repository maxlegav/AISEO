import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import AuditStepper, {
  statusLabel,
  statusColor,
  type AuditStatus,
} from "@/components/AuditStepper";
import QuestionsReview from "@/components/QuestionsReview";
import AuditReview from "@/components/AuditReview";
import toast from "react-hot-toast";

interface AuditDetail {
  _id: string;
  businessId?: string;
  userId?: string;
  businessName?: string;
  status: string;
  geoScore?: number;
  schemaVersion?: number;
  createdAt?: string;
  completedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  error?: string;
  results?: {
    businessSnapshot?: {
      name?: string;
      primaryUrl?: string;
      subUrls?: string[];
      competitorUrls?: string[];
      competitorNames?: string[];
      category?: string;
      description?: string;
      localityTier?: string;
    };
    localityTier?: string;
    generatedPrompts?: Array<{
      id: string;
      level: number;
      category: string;
      question: string;
      enabled?: boolean;
    }>;
    promptResults?: Array<{
      promptId: string;
      level: number;
      category: string;
      question: string;
      promptScore: number;
      mentionRate: number;
      engines: Record<
        string,
        {
          mentioned?: boolean;
          quality?: number;
          position?: number;
          rawResponse?: string;
          responseTime?: number;
          error?: string;
        }
      >;
    }>;
    categoryScores?: Record<
      string,
      {
        score: number;
        promptCount: number;
        mentionRate: number;
      }
    >;
    levelScores?: Record<
      string,
      {
        score: number;
        promptCount: number;
        mentionRate: number;
      }
    >;
    auditEngineScore?: number;
    htmlScannerScore?: number;
    htmlScan?: Record<string, unknown>;
    discoverabilityThreshold?: {
      level: number;
      label: string;
    };
    competitorResults?: Array<{
      name: string;
      url: string;
      geoScore: number;
      mentionRate: number;
    }>;
    enginesUsed?: string[];
    enginesSucceeded?: string[];
    totalPromptsProcessed?: number;
    totalResponsesReceived?: number;
    processingTimeMs?: number;
  };
}

interface UserInfo {
  name?: string;
  email?: string;
  subscriptionTier?: string;
}

interface BusinessInfo {
  name?: string;
  primaryUrl?: string;
  category?: string;
}

export default function AuditDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "prompts" | "html" | "competitors" | "raw"
  >("overview");

  const fetchAudit = async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/audits/${id}`);
      const data = await r.json();
      setAudit(data.audit);
      setUser(data.user);
      setBusiness(data.business);
    } catch {
      console.error("Failed to fetch audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAction = async (action: "approve" | "reject") => {
    const status = audit?.status;
    let confirmMsg = "";
    if (action === "approve" && (status === "questions_review")) {
      confirmMsg = "Approve these questions and start the full audit?";
    } else if (action === "approve") {
      confirmMsg = "Approve this audit and deliver it to the client?";
    } else {
      confirmMsg = "Reject this audit?";
    }
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/audits/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: id, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          action === "approve"
            ? `Approved — moved to "${data.newStatus}"`
            : "Audit rejected"
        );
        fetchAudit();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const togglePrompt = (promptId: string) => {
    setExpandedPrompts((prev) => {
      const next = new Set(prev);
      if (next.has(promptId)) next.delete(promptId);
      else next.add(promptId);
      return next;
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <p className="text-gray-400">Loading audit details...</p>
      </AdminLayout>
    );
  }

  if (!audit) {
    return (
      <AdminLayout title="Not Found">
        <p className="text-red-400">Audit not found.</p>
      </AdminLayout>
    );
  }

  const results = audit.results;
  const status = audit.status as AuditStatus;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link
            href="/audits"
            className="text-sm text-gray-400 hover:text-white mb-2 inline-block"
          >
            &larr; Back to audits
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {audit.businessName || "Unnamed Audit"}
          </h1>
          <p className="text-sm text-gray-400 font-mono mt-1">
            ID: {audit._id}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded text-sm font-medium text-white ${statusColor(status)}`}
        >
          {statusLabel(status)}
        </span>
      </div>

      {/* Stepper */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <AuditStepper status={status} />
      </div>

      {/* Error display */}
      {audit.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <h3 className="text-red-400 font-medium mb-1">Error</h3>
          <pre className="text-sm text-red-300 whitespace-pre-wrap">
            {audit.error}
          </pre>
        </div>
      )}

      {/* Stage-specific content */}
      {status === "pending" && <PendingContent audit={audit} user={user} business={business} />}

      {(status === "generating" || status === "processing") && (
        <GeneratingContent audit={audit} user={user} business={business} />
      )}

      {status === "questions_review" && results?.generatedPrompts && (
        <QuestionsReview
          auditId={audit._id}
          questions={results.generatedPrompts}
          onApprove={() => handleAction("approve")}
          onReject={() => handleAction("reject")}
          onQuestionsUpdated={fetchAudit}
        />
      )}

      {status === "auditing" && (
        <AuditingContent audit={audit} user={user} business={business} />
      )}

      {(status === "audit_review" || status === "review_pending") && results && (
        <AuditReview
          onApprove={() => handleAction("approve")}
          onReject={() => handleAction("reject")}
        >
          <AuditResultsContent
            audit={audit}
            user={user}
            business={business}
            results={results}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            expandedPrompts={expandedPrompts}
            togglePrompt={togglePrompt}
          />
        </AuditReview>
      )}

      {status === "completed" && results && (
        <CompletedContent
          audit={audit}
          user={user}
          business={business}
          results={results}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          expandedPrompts={expandedPrompts}
          togglePrompt={togglePrompt}
        />
      )}

      {(status === "rejected" || status === "failed") && results && (
        <AuditResultsContent
          audit={audit}
          user={user}
          business={business}
          results={results}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          expandedPrompts={expandedPrompts}
          togglePrompt={togglePrompt}
        />
      )}
    </AdminLayout>
  );
}

// --- Stage Content Components ---

function PendingContent({
  audit,
  user,
  business,
}: {
  audit: AuditDetail;
  user: UserInfo | null;
  business: BusinessInfo | null;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">&#9203;</div>
        <p className="text-lg text-white mb-1">Audit is pending</p>
        <p className="text-sm text-gray-400">
          Waiting for the processing service to pick up this audit.
        </p>
      </div>
      <MetaCards audit={audit} user={user} business={business} />
    </div>
  );
}

function GeneratingContent({
  audit,
  user,
  business,
}: {
  audit: AuditDetail;
  user: UserInfo | null;
  business: BusinessInfo | null;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-lg text-white mb-1">Generating HTML scan &amp; questions</p>
        <p className="text-sm text-gray-400">
          The server is scanning the website and generating audit questions.
        </p>
      </div>
      <MetaCards audit={audit} user={user} business={business} />
    </div>
  );
}

function AuditingContent({
  audit,
  user,
  business,
}: {
  audit: AuditDetail;
  user: UserInfo | null;
  business: BusinessInfo | null;
}) {
  const results = audit.results;
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-lg text-white mb-1">Full audit in progress</p>
        <p className="text-sm text-gray-400">
          AI engines are processing the approved questions.
        </p>
        {results?.enginesUsed && (
          <p className="text-sm text-gray-500 mt-2">
            Engines: {results.enginesUsed.join(", ")}
          </p>
        )}
      </div>
      <MetaCards audit={audit} user={user} business={business} />
    </div>
  );
}

function CompletedContent({
  audit,
  user,
  business,
  results,
  activeTab,
  setActiveTab,
  expandedPrompts,
  togglePrompt,
}: {
  audit: AuditDetail;
  user: UserInfo | null;
  business: BusinessInfo | null;
  results: NonNullable<AuditDetail["results"]>;
  activeTab: string;
  setActiveTab: (tab: "overview" | "prompts" | "html" | "competitors" | "raw") => void;
  expandedPrompts: Set<string>;
  togglePrompt: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 flex items-center gap-3">
        <span className="text-2xl">&#10003;</span>
        <div>
          <p className="text-green-300 font-medium">Audit delivered</p>
          <p className="text-sm text-green-400/70">
            {audit.completedAt
              ? `Completed on ${new Date(audit.completedAt).toLocaleString("fr-FR")}`
              : ""}
            {audit.reviewedBy ? ` — reviewed by ${audit.reviewedBy}` : ""}
          </p>
        </div>
      </div>
      <AuditResultsContent
        audit={audit}
        user={user}
        business={business}
        results={results}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expandedPrompts={expandedPrompts}
        togglePrompt={togglePrompt}
      />
    </div>
  );
}

// --- Shared Content ---

function AuditResultsContent({
  audit,
  user,
  business,
  results,
  activeTab,
  setActiveTab,
  expandedPrompts,
  togglePrompt,
}: {
  audit: AuditDetail;
  user: UserInfo | null;
  business: BusinessInfo | null;
  results: NonNullable<AuditDetail["results"]>;
  activeTab: string;
  setActiveTab: (tab: "overview" | "prompts" | "html" | "competitors" | "raw") => void;
  expandedPrompts: Set<string>;
  togglePrompt: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <MetaCards audit={audit} user={user} business={business} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {(["overview", "prompts", "html", "competitors", "raw"] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-blue-500 text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>

      {activeTab === "overview" && <OverviewTab results={results} />}
      {activeTab === "prompts" && (
        <PromptsTab
          results={results}
          expandedPrompts={expandedPrompts}
          togglePrompt={togglePrompt}
        />
      )}
      {activeTab === "html" && <HtmlTab results={results} />}
      {activeTab === "competitors" && <CompetitorsTab results={results} />}
      {activeTab === "raw" && <RawTab audit={audit} />}
    </div>
  );
}

function MetaCards({
  audit,
  user,
  business,
}: {
  audit: AuditDetail;
  user: UserInfo | null;
  business: BusinessInfo | null;
}) {
  const results = audit.results;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Scores */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-3">Scores</h3>
        <div className="space-y-2">
          <ScoreRow label="GEO Score" value={audit.geoScore} suffix="%" bold />
          <ScoreRow
            label="AI Engine Score"
            value={results?.auditEngineScore}
            suffix="%"
          />
          <ScoreRow
            label="HTML Scanner Score"
            value={results?.htmlScannerScore}
            suffix="%"
          />
        </div>
        {results?.discoverabilityThreshold && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">Discoverability</p>
            <p className="text-sm text-white">
              Level {results.discoverabilityThreshold.level} —{" "}
              {results.discoverabilityThreshold.label}
            </p>
          </div>
        )}
      </div>

      {/* Business Info */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-3">Business</h3>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-400">Name:</span>{" "}
            {results?.businessSnapshot?.name || business?.name || "N/A"}
          </p>
          <p>
            <span className="text-gray-400">URL:</span>{" "}
            <a
              href={
                results?.businessSnapshot?.primaryUrl || business?.primaryUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {results?.businessSnapshot?.primaryUrl ||
                business?.primaryUrl ||
                "N/A"}
            </a>
          </p>
          <p>
            <span className="text-gray-400">Category:</span>{" "}
            {results?.businessSnapshot?.category ||
              business?.category ||
              "N/A"}
          </p>
          <p>
            <span className="text-gray-400">Locality:</span>{" "}
            {results?.localityTier || "N/A"}
          </p>
        </div>
      </div>

      {/* User & Timing */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-3">Context</h3>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-400">User:</span>{" "}
            {user
              ? `${user.name || ""} (${user.email})`
              : audit.userId || "N/A"}
          </p>
          <p>
            <span className="text-gray-400">Tier:</span>{" "}
            {user?.subscriptionTier || "N/A"}
          </p>
          <p>
            <span className="text-gray-400">Created:</span>{" "}
            {audit.createdAt
              ? new Date(audit.createdAt).toLocaleString("fr-FR")
              : "N/A"}
          </p>
          <p>
            <span className="text-gray-400">Completed:</span>{" "}
            {audit.completedAt
              ? new Date(audit.completedAt).toLocaleString("fr-FR")
              : "N/A"}
          </p>
          {results?.processingTimeMs && (
            <p>
              <span className="text-gray-400">Processing time:</span>{" "}
              {(results.processingTimeMs / 1000).toFixed(1)}s
            </p>
          )}
          {results?.enginesUsed && (
            <p>
              <span className="text-gray-400">Engines:</span>{" "}
              {results.enginesSucceeded?.join(", ") || "N/A"} (
              {results.enginesSucceeded?.length || 0}/
              {results.enginesUsed?.length || 0} succeeded)
            </p>
          )}
          {results?.totalPromptsProcessed != null && (
            <p>
              <span className="text-gray-400">Prompts/Responses:</span>{" "}
              {results.totalPromptsProcessed} /{" "}
              {results.totalResponsesReceived}
            </p>
          )}
        </div>
        {audit.reviewedAt && (
          <div className="mt-3 pt-3 border-t border-gray-700 text-sm">
            <p className="text-gray-400">
              Reviewed by {audit.reviewedBy} on{" "}
              {new Date(audit.reviewedAt).toLocaleString("fr-FR")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Tab Components ---

function ScoreRow({
  label,
  value,
  suffix,
  bold,
}: {
  label: string;
  value?: number | null;
  suffix?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-400">{label}</span>
      <span
        className={`font-mono ${bold ? "text-xl font-bold" : "text-sm"} ${
          value != null ? scoreColor(value) : "text-gray-500"
        }`}
      >
        {value != null ? `${value.toFixed(1)}${suffix || ""}` : "N/A"}
      </span>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function OverviewTab({
  results,
}: {
  results: NonNullable<AuditDetail["results"]>;
}) {
  return (
    <div className="space-y-6">
      {results.categoryScores && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Category Scores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(results.categoryScores).map(([cat, data]) => (
              <div key={cat} className="bg-gray-800 rounded-lg p-3">
                <p className="text-sm text-gray-400 capitalize">{cat}</p>
                <p
                  className={`text-2xl font-bold font-mono ${scoreColor(
                    data.score * 100
                  )}`}
                >
                  {(data.score * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {data.promptCount} prompts •{" "}
                  {(data.mentionRate * 100).toFixed(0)}% mention rate
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.levelScores && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Level Scores
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(results.levelScores)
              .sort()
              .map(([level, data]) => (
                <div key={level} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-gray-400 capitalize">{level}</p>
                  <p
                    className={`text-xl font-bold font-mono ${scoreColor(
                      data.score * 100
                    )}`}
                  >
                    {(data.score * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {(data.mentionRate * 100).toFixed(0)}% mentions
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PromptsTab({
  results,
  expandedPrompts,
  togglePrompt,
}: {
  results: NonNullable<AuditDetail["results"]>;
  expandedPrompts: Set<string>;
  togglePrompt: (id: string) => void;
}) {
  if (!results.promptResults) {
    return <p className="text-gray-400">No prompt results available.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-400 mb-3">
        {results.promptResults.length} prompts total. Click to expand AI
        responses.
      </p>
      {results.promptResults.map((pr) => {
        const isExpanded = expandedPrompts.has(pr.promptId);
        return (
          <div key={pr.promptId} className="bg-gray-800 rounded-lg">
            <button
              onClick={() => togglePrompt(pr.promptId)}
              className="w-full text-left p-3 flex items-center justify-between hover:bg-gray-750 rounded-lg transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                    L{pr.level}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 capitalize">
                    {pr.category}
                  </span>
                  <span
                    className={`text-xs font-mono ${scoreColor(
                      pr.promptScore * 100
                    )}`}
                  >
                    {(pr.promptScore * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {(pr.mentionRate * 100).toFixed(0)}% mentioned
                  </span>
                </div>
                <p className="text-sm text-white truncate">{pr.question}</p>
              </div>
              <span className="text-gray-500 ml-2">
                {isExpanded ? "▼" : "▶"}
              </span>
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-3">
                {Object.entries(pr.engines).map(([engine, data]) => (
                  <div
                    key={engine}
                    className="bg-gray-900 rounded p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-white capitalize">
                        {engine}
                      </span>
                      {data.error ? (
                        <span className="text-xs text-red-400">
                          Error: {data.error}
                        </span>
                      ) : (
                        <>
                          <span
                            className={`text-xs ${
                              data.mentioned
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {data.mentioned ? "Mentioned" : "Not mentioned"}
                          </span>
                          {data.quality != null && (
                            <span className="text-xs text-gray-400">
                              Quality: {data.quality}/3
                            </span>
                          )}
                          {data.position != null && data.position > 0 && (
                            <span className="text-xs text-gray-400">
                              Position: #{data.position}
                            </span>
                          )}
                          {data.responseTime != null && (
                            <span className="text-xs text-gray-500">
                              {(data.responseTime / 1000).toFixed(1)}s
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {data.rawResponse && (
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto bg-gray-950 p-2 rounded">
                        {data.rawResponse}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HtmlTab({
  results,
}: {
  results: NonNullable<AuditDetail["results"]>;
}) {
  if (!results.htmlScan) {
    return <p className="text-gray-400">No HTML scan data available.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <p className="text-lg font-semibold text-white">HTML Scanner</p>
        {results.htmlScannerScore != null && (
          <span
            className={`text-2xl font-bold font-mono ${scoreColor(
              results.htmlScannerScore
            )}`}
          >
            {results.htmlScannerScore.toFixed(1)}%
          </span>
        )}
      </div>
      <pre className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
        {JSON.stringify(results.htmlScan, null, 2)}
      </pre>
    </div>
  );
}

function CompetitorsTab({
  results,
}: {
  results: NonNullable<AuditDetail["results"]>;
}) {
  if (!results.competitorResults || results.competitorResults.length === 0) {
    return <p className="text-gray-400">No competitor data available.</p>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">Competitors</h3>
      <div className="space-y-3">
        {results.competitorResults.map((comp, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-white font-medium">{comp.name}</p>
                <a
                  href={comp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline"
                >
                  {comp.url}
                </a>
              </div>
              <div className="text-right">
                <p
                  className={`text-2xl font-bold font-mono ${scoreColor(
                    comp.geoScore
                  )}`}
                >
                  {comp.geoScore.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">
                  {(comp.mentionRate * 100).toFixed(0)}% mention rate
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RawTab({ audit }: { audit: AuditDetail }) {
  return (
    <div>
      <p className="text-sm text-gray-400 mb-3">
        Full audit document (JSON). Use this for debugging.
      </p>
      <pre className="bg-gray-800 p-4 rounded-lg text-xs text-gray-300 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
        {JSON.stringify(audit, null, 2)}
      </pre>
    </div>
  );
}
