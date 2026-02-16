import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import Link from "next/link";

interface Stats {
  users: number;
  businesses: number;
  audits: {
    total: number;
    pending: number;
    processing: number;
    review_pending: number;
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
              label="Awaiting Review"
              value={stats.audits.review_pending}
              highlight={stats.audits.review_pending > 0}
              href="/audits?status=review_pending"
            />
          </div>

          {/* Audit status breakdown */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">
              Audit Status Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatusCard
                label="Pending"
                value={stats.audits.pending}
                color="bg-gray-600"
              />
              <StatusCard
                label="Processing"
                value={stats.audits.processing}
                color="bg-blue-600"
              />
              <StatusCard
                label="Review Pending"
                value={stats.audits.review_pending}
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
