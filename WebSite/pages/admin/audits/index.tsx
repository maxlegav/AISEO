import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { statusLabel, statusColor } from "@/components/admin/AuditStepper";
import toast from "react-hot-toast";

interface AuditSummary {
  _id: string;
  businessName?: string;
  status: string;
  geoScore?: number;
  createdAt?: string;
  completedAt?: string;
  error?: string;
  userId?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "questions_review", label: "Questions Review" },
  { value: "audit_review", label: "Audit Review" },
  { value: "generating", label: "Generating" },
  { value: "auditing", label: "Auditing" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminAuditsPage() {
  const router = useRouter();
  const statusFilter = (router.query.status as string) || "";

  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/audits?${params}`);
      const data = await res.json();
      setAudits(data.audits || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to fetch audits");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (router.isReady) {
      fetchAudits();
    }
  }, [router.isReady, fetchAudits]);

  const handleApprove = async (auditId: string, status: string) => {
    const msg =
      status === "questions_review"
        ? "Approve these questions and start the full audit?"
        : "Approve this audit and make it visible to the client?";
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/admin/audits/${auditId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Approved — moved to "${data.newStatus}"`);
        fetchAudits();
      } else {
        toast.error(data.error || "Failed to approve");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleReject = async (auditId: string) => {
    if (!confirm("Reject this audit?")) return;
    try {
      const res = await fetch(`/api/admin/audits/${auditId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Audit rejected");
        fetchAudits();
      } else {
        toast.error(data.error || "Failed to reject");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const isReviewable = (status: string) =>
    ["questions_review", "audit_review", "review_pending"].includes(status);

  return (
    <AdminLayout title={`Audits (${total})`}>
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setPage(1);
              const query: Record<string, string> = {};
              if (opt.value) query.status = opt.value;
              router.push({ pathname: "/admin/audits", query }, undefined, {
                shallow: true,
              });
            }}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              statusFilter === opt.value
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : audits.length === 0 ? (
        <p className="text-gray-400">No audits found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-2 pr-4">Business</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">GEO Score</th>
                  <th className="pb-2 pr-4">Created</th>
                  <th className="pb-2 pr-4">Completed</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr
                    key={audit._id}
                    className="border-b border-gray-800 hover:bg-gray-800/50"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/audits/${audit._id}`}
                        className="text-blue-400 hover:underline"
                      >
                        {audit.businessName || "N/A"}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-white ${statusColor(
                          audit.status
                        )}`}
                      >
                        {statusLabel(audit.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono">
                      {audit.geoScore != null
                        ? `${audit.geoScore.toFixed(1)}%`
                        : "-"}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {audit.createdAt
                        ? new Date(audit.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {audit.completedAt
                        ? new Date(audit.completedAt).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "-"}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/audits/${audit._id}`}
                          className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                        >
                          View
                        </Link>
                        {isReviewable(audit.status) && (
                          <>
                            <button
                              onClick={() =>
                                handleApprove(audit._id, audit.status)
                              }
                              className="text-xs px-2 py-1 bg-green-700 rounded hover:bg-green-600 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(audit._id)}
                              className="text-xs px-2 py-1 bg-red-700 rounded hover:bg-red-600 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex gap-2 mt-4 items-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 bg-gray-700 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
