import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";

export interface HistoryPoint {
  _id: string;
  geoScore: number | null;
  createdAt: string;
  completedAt?: string;
  previousAuditId?: string | null;
  results?: {
    issuesSummary?: {
      criticalCount: number;
      highCount: number;
      mediumCount: number;
      lowCount: number;
      totalCount: number;
    };
    categoryScores?: Record<string, { score: number; promptCount: number }>;
  } | null;
}

interface Props {
  history: HistoryPoint[];
  username: string;
  currentAuditId?: string;
}

function scoreFill(score: number) {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function DeltaBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 1) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
      <Minus className="w-3 h-3" /> —
    </span>
  );
  if (delta > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      <TrendingUp className="w-3 h-3" />+{delta}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
      <TrendingDown className="w-3 h-3" />{delta}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value as number;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="font-bold text-gray-900" style={{ color: scoreFill(score) }}>
        {score}%
      </p>
    </div>
  );
}

export default function AuditHistory({ history, username, currentAuditId }: Props) {
  if (history.length === 0) return null;

  // Reverse to chronological for the chart (oldest → newest)
  const chrono = [...history].reverse();

  const chartData = chrono.map((h) => ({
    id: h._id,
    date: new Date(h.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
    score: h.geoScore ?? 0,
  }));

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          Historique GEO Score
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {history.length} audit{history.length > 1 ? "s" : ""} — 12 mois max
        </p>
      </div>

      {/* Chart */}
      {history.length >= 2 && (
        <div className="px-4 pt-6 pb-2">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.4} />
              <ReferenceLine y={40} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const color = scoreFill(payload.score);
                  return (
                    <circle
                      key={payload.id}
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: "white" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Audit list */}
      <div className="divide-y divide-gray-50">
        {history.map((h, i) => {
          const prev = history[i + 1];
          const delta = prev?.geoScore != null && h.geoScore != null
            ? Math.round((h.geoScore - prev.geoScore) * 10) / 10
            : null;
          const isCurrent = h._id === currentAuditId;
          const score = h.geoScore ?? 0;

          return (
            <Link
              key={h._id}
              href={`/${username}/audits/${h._id}`}
              className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group ${isCurrent ? "bg-violet-50/50" : ""}`}
            >
              <div className="flex items-center gap-4">
                {/* Score circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: scoreFill(score) }}
                >
                  {score}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(h.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                    {isCurrent && (
                      <span className="ml-2 text-xs text-violet-600 font-medium">
                        — actuel
                      </span>
                    )}
                  </p>
                  {h.results?.issuesSummary && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {h.results.issuesSummary.criticalCount} critiques ·{" "}
                      {h.results.issuesSummary.highCount} hautes ·{" "}
                      {h.results.issuesSummary.mediumCount} moyennes
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {delta !== null && <DeltaBadge delta={delta} />}
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
