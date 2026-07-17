import Head from "next/head";
import { useState } from "react";
import { ImagePlus, Lock, Globe, FileText } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#16a34a",
  "#ea580c",
  "#db2777",
  "#0f172a",
];

export default function BrandingSettings() {
  const [agencyName, setAgencyName] = useState("Mon Agence");
  const [color, setColor] = useState("#7c3aed");
  const [domain, setDomain] = useState("");
  const [pdf, setPdf] = useState(true);

  return (
    <>
      <Head>
        <title>Branding & équipe · ShowYourBrand</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        active="settings"
        title="Branding & équipe"
        subtitle="Personnalisez les rapports remis à vos clients (option agences)."
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          <Lock className="h-3.5 w-3.5" />
          Maquette — le white-label sera activé sur le plan Agence
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Logo + identity */}
          <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
            <h2 className="mb-1 font-heading text-lg font-semibold text-gray-900">
              Identité agence
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              Ce logo et ces couleurs remplacent la marque SYB sur les rapports
              clients.
            </p>

            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Logo
            </label>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-300">
                <ImagePlus className="h-6 w-6" />
              </div>
              <button className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Importer un logo
              </button>
            </div>

            <label
              htmlFor="agency"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Nom de l&apos;agence
            </label>
            <input
              id="agency"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="mb-5 w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-violet-500"
            />

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Couleur principale
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 transition-transform hover:scale-110",
                    color === c && "ring-2 ring-gray-900"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </section>

          {/* Preview + options */}
          <section className="space-y-5">
            <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
              <h2 className="mb-4 font-heading text-lg font-semibold text-gray-900">
                Aperçu du rapport client
              </h2>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <div
                  className="flex items-center gap-2 px-4 py-3 text-white"
                  style={{ backgroundColor: color }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/25 text-xs font-bold">
                    {agencyName.charAt(0) || "A"}
                  </div>
                  <span className="text-sm font-semibold">
                    {agencyName || "Mon Agence"}
                  </span>
                  <span className="ml-auto text-[11px] opacity-80">
                    Rapport GEO · {domain || "monagence.fr"}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <div className="h-2.5 w-1/3 rounded-full bg-gray-200" />
                  <div className="h-2 w-2/3 rounded-full bg-gray-100" />
                  <div className="h-2 w-1/2 rounded-full bg-gray-100" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-premium backdrop-blur-sm">
              <label
                htmlFor="domain"
                className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <Globe className="h-4 w-4 text-gray-400" />
                Domaine personnalisé
              </label>
              <input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="reports.monagence.fr"
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-violet-500"
              />

              <div className="mt-5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Export PDF brandé
                </span>
                <button
                  onClick={() => setPdf((v) => !v)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    pdf ? "bg-violet-600" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                      pdf ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </button>
              </div>
            </div>

            <button
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-gray-900/90 px-4 py-3 text-sm font-semibold text-white opacity-60"
            >
              Enregistrer (bientôt disponible)
            </button>
          </section>
        </div>
      </MonitoringLayout>
    </>
  );
}
