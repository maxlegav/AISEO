import Link from "next/link";
import SybMark from "@/components/icons/SybMark";

/** Notice shown on dashboard pages when the data is demo/mock, not real. */
export default function DemoBanner({ demo }: { demo: boolean }) {
  if (!demo) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-ink-200 bg-accent-muted/70 p-4 text-sm text-gray-600">
      <SybMark className="h-4 w-4 shrink-0 text-accent" />
      <span>
        Données de démonstration. Créez votre premier projet pour lancer un vrai
        monitoring.
      </span>
      <Link
        href="/app/new"
        className="ml-auto rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800"
      >
        Créer un projet
      </Link>
    </div>
  );
}
