/**
 * Minimal admin interface — list of audits awaiting review.
 * Only accessible when logged in as ADMIN_EMAIL.
 */
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Loader2, CheckCircle2, Clock, ExternalLink } from "lucide-react";

interface AuditRow {
  _id: string;
  businessName?: string;
  status: string;
  geoScore?: number | null;
  createdAt?: string;
  user?: { name?: string; email: string; username?: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  awaiting_prompt_approval: "Prompts ready → Approve",
  review_pending: "Review → Complete",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-gray-500 bg-gray-50",
  processing: "text-blue-600 bg-blue-50",
  awaiting_prompt_approval: "text-amber-700 bg-amber-50",
  review_pending: "text-violet-700 bg-violet-50",
};

export default function AdminAuditsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status !== "authenticated") return;

    fetch("/api/admin/audits")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAudits(d.data);
        else router.push("/");
      })
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [status, router]);

  const handleApprovePrompts = async (auditId: string) => {
    const res = await fetch(`/api/admin/audits/${auditId}/approve-prompts`, {
      method: "POST",
    });
    if (res.ok) {
      setAudits((prev) =>
        prev.map((a) => a._id === auditId ? { ...a, status: "processing" } : a)
      );
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? "Failed to approve prompts");
    }
  };

  const handleComplete = async (auditId: string) => {
    setCompleting(auditId);
    try {
      const res = await fetch(`/api/admin/audits/${auditId}/complete`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAudits((prev) => prev.filter((a) => a._id !== auditId));
      } else {
        alert(data.message ?? "Failed to complete audit");
      }
    } finally {
      setCompleting(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin — Audits</h1>
            <p className="text-xs text-gray-500">Logged as {session?.user?.email}</p>
          </div>
          <span className="text-xs text-violet-600 font-semibold uppercase tracking-wider bg-violet-50 px-3 py-1 rounded-full">
            ShowYourBrand Admin
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {audits.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No audits awaiting review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((audit) => (
              <div
                key={audit._id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {audit.businessName ?? "Unknown business"}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[audit.status] ?? "text-gray-600 bg-gray-50"}`}>
                      {STATUS_LABELS[audit.status] ?? audit.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {audit.user?.name ?? ""} · {audit.user?.email ?? ""}
                    {audit.geoScore != null && ` · Score: ${audit.geoScore}/100`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {audit.createdAt ? new Date(audit.createdAt).toLocaleString("fr-FR") : "—"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {audit.user?.username && (
                    <a
                      href={`/${audit.user.username}/audits/${audit._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {audit.status === "awaiting_prompt_approval" && (
                    <button
                      onClick={() => handleApprovePrompts(audit._id)}
                      className="text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Approve prompts →
                    </button>
                  )}

                  {audit.status === "review_pending" && (
                    <button
                      onClick={() => handleComplete(audit._id)}
                      disabled={completing === audit._id}
                      className="flex items-center gap-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {completing === audit._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Mark complete + notify client
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
