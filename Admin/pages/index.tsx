import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";

interface Stats {
  users: number;
  businesses: number;
  audits: {
    total: number;
    pending: number;
    generating: number;
    questions_review: number;
    auditing: number;
    audit_review: number;
    completed: number;
    failed: number;
    rejected: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if(!stats || !stats.audits)
    return(
      <>
        Loading...
      </>
    )

  const awaitingAction =
    (stats.audits.questions_review ?? 0) + (stats.audits.audit_review ?? 0);

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <p className="text-gray-400">Loading stats...</p>
      ) : stats ? (
        <div className="space-y-8">
          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Users" value={stats.users} />
            <StatCard label="Businesses" value={stats.businesses} />
            <StatCard label="Total Audits" value={stats.audits.total} />
            <StatCard
              label="Awaiting Action"
              value={awaitingAction}
              highlight={awaitingAction > 0}
              href="/audits?status=questions_review"
            />
          </div>

          {/* Needs attention */}
          {awaitingAction > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">
                Needs Your Attention
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stats.audits.questions_review > 0 && (
                  <Link
                    href="/audits?status=questions_review"
                    className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 hover:bg-amber-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-300 font-medium">
                          Questions to Review
                        </p>
                        <p className="text-sm text-amber-400/70">
                          Validate generated questions before full audit
                        </p>
                      </div>
                      <span className="text-3xl font-bold text-amber-300">
                        {stats.audits.questions_review}
                      </span>
                    </div>
                  </Link>
                )}
                {stats.audits.audit_review > 0 && (
                  <Link
                    href="/audits?status=audit_review"
                    className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 hover:bg-yellow-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-300 font-medium">
                          Audits to Review
                        </p>
                        <p className="text-sm text-yellow-400/70">
                          Approve final audit results before delivery
                        </p>
                      </div>
                      <span className="text-3xl font-bold text-yellow-300">
                        {stats.audits.audit_review}
                      </span>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Audit status breakdown */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              Audit Pipeline
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <StatusCard
                label="Pending"
                value={stats.audits.pending}
                color="bg-gray-600"
              />
              <StatusCard
                label="Generating"
                value={stats.audits.generating}
                color="bg-blue-600"
              />
              <StatusCard
                label="Questions Review"
                value={stats.audits.questions_review}
                color="bg-amber-600"
              />
              <StatusCard
                label="Auditing"
                value={stats.audits.auditing}
                color="bg-indigo-600"
              />
              <StatusCard
                label="Audit Review"
                value={stats.audits.audit_review}
                color="bg-yellow-600"
              />
              <StatusCard
                label="Completed"
                value={stats.audits.completed}
                color="bg-green-600"
              />
              <StatusCard
                label="Rejected"
                value={stats.audits.rejected}
                color="bg-orange-600"
              />
              <StatusCard
                label="Failed"
                value={stats.audits.failed}
                color="bg-red-600"
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-red-400">Failed to load stats.</p>
      )}
    </AdminLayout>
  );
}

function StatCard({
  label,
  value,
  highlight,
  href,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={`bg-gray-800 rounded-lg p-4 ${
        highlight ? "ring-2 ring-yellow-500" : ""
      } ${href ? "hover:bg-gray-750 cursor-pointer" : ""}`}
    >
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function StatusCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
