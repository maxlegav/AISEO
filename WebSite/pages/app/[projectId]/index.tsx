import Head from "next/head";
import { useRouter } from "next/router";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Crosshair, MessageSquare, RefreshCw, Trophy } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import ProjectNotFound from "@/components/monitoring/ProjectNotFound";
import {
  DeltaBadge,
  LLMBadge,
  ScoreRing,
  scoreColor,
  scoreLabel,
} from "@/components/monitoring/widgets";
import { getProject, LLMS, LLM_ORDER } from "@/lib/mock/monitoring";

export default function ProjectDashboard() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const project = getProject(projectId);

  if (!project) return <ProjectNotFound />;

  const ranked = [...project.llmScores].sort(
    (a, b) => b.presenceRate - a.presenceRate
  );
  const best = ranked[0]!;

  const stats = [
    {
      icon: Trophy,
      label: "Meilleur moteur",
      value: LLMS[best.llm].name,
      hint: `${best.presenceRate}% de présence`,
    },
    {
      icon: Crosshair,
      label: "Position moyenne",
      value:
        best.avgPosition != null
          ? `${best.avgPosition.toFixed(1)}ᵉ`
          : "—",
      hint: "quand la marque est citée",
    },
    {
      icon: MessageSquare,
      label: "Requêtes suivies",
      value: `${project.prompts}`,
      hint: `sur ${LLM_ORDER.length} moteurs IA`,
    },
    {
      icon: RefreshCw,
      label: "Fréquence",
      value: project.frequency,
      hint: "prochain run dans 6 h",
    },
  ];

  return (
    <>
      <Head>
        <title>{project.brandName} · Monitoring GEO</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        project={project}
        active="dashboard"
        title={project.brandName}
        subtitle={project.category}
      >
        {/* Top: global score + stats */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex items-center gap-5 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
            <ScoreRing value={project.globalScore} />
            <div>
              <p className="text-sm font-medium text-gray-500">
                Score de visibilité
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  {project.globalScore}
                </span>
                <span className="text-lg text-gray-400">/100</span>
              </div>
              <div className="mt-2">
                <DeltaBadge value={project.globalDelta} suffix=" pts / 7j" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center gap-2 text-gray-400">
                  <s.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400">{s.hint}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Evolution chart */}
        <div className="mt-5 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-gray-900">
                Évolution sur 12 semaines
              </h2>
              <p className="text-sm text-gray-500">
                Taux de présence dans les réponses IA, par moteur.
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={project.weekly}
                margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #eee",
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="plainline"
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                {LLM_ORDER.map((llm) => (
                  <Line
                    key={llm}
                    type="monotone"
                    dataKey={llm}
                    name={LLMS[llm].name}
                    stroke={LLMS[llm].color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-LLM breakdown — the differentiator */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              Pourquoi votre score diffère selon le modèle
            </h2>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
              Le + SYB : granularité par LLM
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...project.llmScores]
              .sort((a, b) => b.presenceRate - a.presenceRate)
              .map((s) => (
                <div
                  key={s.llm}
                  className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <LLMBadge llm={s.llm} size={22} />
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          color: scoreColor(s.presenceRate),
                          backgroundColor: `${scoreColor(s.presenceRate)}14`,
                        }}
                      >
                        {scoreLabel(s.presenceRate)}
                      </span>
                      <DeltaBadge value={s.deltaVsLastWeek} />
                    </div>
                  </div>

                  <div className="mb-3 flex items-end gap-4">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {s.presenceRate}%
                      </p>
                      <p className="text-xs text-gray-400">présence</p>
                    </div>
                    <div className="mb-0.5">
                      <p className="text-sm font-semibold text-gray-700">
                        {s.avgPosition != null
                          ? `${s.avgPosition.toFixed(1)}ᵉ position`
                          : "Jamais cité"}
                      </p>
                      <p className="text-xs text-gray-400">quand cité</p>
                    </div>
                  </div>

                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.presenceRate}%`,
                        backgroundColor: scoreColor(s.presenceRate),
                      }}
                    />
                  </div>

                  <p className="text-sm leading-relaxed text-gray-600">
                    {s.explanation}
                  </p>
                  <p className="mt-2 text-[11px] italic text-gray-400">
                    {LLMS[s.llm].bias}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </MonitoringLayout>
    </>
  );
}
