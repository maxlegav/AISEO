import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";

export default function ProjectNotFound() {
  return (
    <MonitoringLayout active="dashboard" title="Projet introuvable">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/70 py-20 text-center shadow-premium">
        <p className="mb-1 text-lg font-semibold text-gray-900">
          Ce projet n&apos;existe pas
        </p>
        <p className="mb-5 text-sm text-gray-500">
          Il a peut-être été supprimé, ou le lien est incorrect.
        </p>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour aux projets
        </Link>
      </div>
    </MonitoringLayout>
  );
}
