import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
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

  useEffect(() => {
    if (!id) return;
    fetch(`/api/audits/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAudit(data.audit);
        setUser(data.user);
        setBusiness(data.business);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: "approve" | "reject") => {
    const confirmMsg =
      action === "approve"
        ? "Approve this audit and make it visible to the client?"
        : "Reject this audit?";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/audits/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: id, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve" ? "Audit approved" : "Audit rejected");
        // Refresh
        const refreshRes = await fetch(`/api/audits/${id}`);
        const refreshData = await refreshRes.json();
        setAudit(refreshData.audit);
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

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
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
        <div className="flex items-center gap-3">
          <StatusBadge status={audit.status} />
          {audit.status === "review_pending" && (
            <>
              <button
                onClick={() => handleAction("approve")}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-medium transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction("reject")}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-medium transition-colors"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Scores */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-3">Scores</h3>
          <div className="space-y-2">
            <ScoreRow
              label="GEO Score"
              value={audit.geoScore}
              suffix="%"
              bold
            />
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
                href={results?.businessSnapshot?.primaryUrl || business?.primaryUrl}
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
              {results?.businessSnapshot?.category || business?.category || "N/A"}
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
              {user ? `${user.name || ""} (${user.email})` : audit.userId || "N/A"}
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
                {results.totalPromptsProcessed} / {results.totalResponsesReceived}
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

      {/* Error display */}
      {audit.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <h3 className="text-red-400 font-medium mb-1">Error</h3>
          <pre className="text-sm text-red-300 whitespace-pre-wrap">
            {audit.error}
          </pre>
        </div>
      )}

      {/* Tabs */}
      {results && (
        <>
          <div className="flex gap-1 mb-4 border-b border-gray-700">
            {(
              ["overview", "prompts", "html", "competitors", "raw"] as const
            ).map((tab) => (
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
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <OverviewTab results={results} />
          )}
          {activeTab === "prompts" && (
            <PromptsTab
              results={results}
              expandedPrompts={expandedPrompts}
              togglePrompt={togglePrompt}
            />
          )}
          {activeTab === "html" && <HtmlTab results={results} />}
          {activeTab === "competitors" && (
            <CompetitorsTab results={results} />
          )}
          {activeTab === "raw" && <RawTab audit={audit} />}
        </>
      )}
    </AdminLayout>
  );
}

// --- Sub-components ---

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-gray-500",
    processing: "bg-blue-500",
    review_pending: "bg-yellow-500",
    completed: "bg-green-500",
    rejected: "bg-orange-500",
    failed: "bg-red-500",
  };
  return (
    <span
      className={`px-3 py-1 rounded text-sm font-medium text-white ${
        colors[status] || "bg-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

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

function OverviewTab({ results }: { results: AuditDetail["results"] }) {
  if (!results) return null;

  return (
    <div className="space-y-6">
      {/* Category Scores */}
      {results.categoryScores && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Category Scores
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(results.categoryScores).map(([cat, data]) => (
              <div key={cat} className="bg-gray-800 rounded-lg p-3">
                <p className="text-sm text-gray-400 capitalize">{cat}</p>
                <p className={`text-2xl font-bold font-mono ${scoreColor(data.score * 100)}`}>
                  {(data.score * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {data.promptCount} prompts • {(data.mentionRate * 100).toFixed(0)}%
                  mention rate
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level Scores */}
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
                  <p className={`text-xl font-bold font-mono ${scoreColor(data.score * 100)}`}>
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
  results: AuditDetail["results"];
  expandedPrompts: Set<string>;
  togglePrompt: (id: string) => void;
}) {
  if (!results?.promptResults) {
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
                    className={`text-xs font-mono ${scoreColor(pr.promptScore * 100)}`}
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

function HtmlTab({ results }: { results: AuditDetail["results"] }) {
  if (!results?.htmlScan) {
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

function CompetitorsTab({ results }: { results: AuditDetail["results"] }) {
  if (!results?.competitorResults || results.competitorResults.length === 0) {
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
