import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

interface ProjectCardProps {
  name: string;
  slug: string;
  primaryUrl: string;
  category: string;
  username: string;
  score?: number;
  lastAuditDate?: string;
}

export default function ProjectCard({
  name,
  slug,
  primaryUrl,
  category,
  username,
  score,
  lastAuditDate,
}: ProjectCardProps) {
  const { t } = useLanguage();

  const getScoreColor = (s: number) => {
    if (s < 40) return "text-red-600 bg-red-100";
    if (s < 70) return "text-orange-600 bg-orange-100";
    return "text-green-600 bg-green-100";
  };

  return (
    <Link href={`/${username}/${slug}`}>
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-purple-600" />
          </div>
          {score !== undefined && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(score)}`}
            >
              {score}%
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-gray-500 mb-1 truncate">{primaryUrl}</p>
        <p className="text-xs text-gray-400 mb-4">{category}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {lastAuditDate
              ? `${String(t("dashboard.lastAudit"))}: ${lastAuditDate}`
              : String(t("project.noAuditYet"))}
          </span>
          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
