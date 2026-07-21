import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useState } from "react";
import { ImagePlus, Lock, Globe, FileText, Loader2, Check } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import { getUserBranding } from "@/lib/monitoring/branding";
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

interface BrandingSettingsProps {
  initial: {
    agencyName: string;
    logoUrl: string;
    primaryColor: string;
    customDomain: string;
    brandedPdfEnabled: boolean;
  };
  whiteLabelActive: boolean;
}

export default function BrandingSettings({
  initial,
  whiteLabelActive,
}: BrandingSettingsProps) {
  const [agencyName, setAgencyName] = useState(initial.agencyName);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [color, setColor] = useState(initial.primaryColor || "#7c3aed");
  const [domain, setDomain] = useState(initial.customDomain);
  const [pdf, setPdf] = useState(initial.brandedPdfEnabled);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: agencyName.trim(),
          logoUrl: logoUrl.trim(),
          primaryColor: color,
          customDomain: domain.trim(),
          brandedPdfEnabled: pdf,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Échec de l'enregistrement.");
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setSaving(false);
    }
  }

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
        {whiteLabelActive ? (
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            White-label actif sur votre plan Agence
          </div>
        ) : (
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <Lock className="h-3.5 w-3.5" />
            Le white-label sera actif sur le plan Agence — vos réglages sont
            enregistrés dès maintenant.
          </div>
        )}

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

            <label
              htmlFor="logo"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Logo (URL)
            </label>
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-300">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo agence"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImagePlus className="h-6 w-6" />
                )}
              </div>
              <input
                id="logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…/logo.png"
                className="flex-1 rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-violet-500"
              />
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
              placeholder="Mon Agence"
              className="mb-5 w-full rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-violet-500"
            />

            <label className="mb-2 block text-sm font-medium text-gray-700">
              Couleur principale
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
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
                    {(agencyName || "A").charAt(0)}
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
                  type="button"
                  onClick={() => setPdf((v) => !v)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    pdf ? "bg-violet-600" : "bg-gray-200"
                  )}
                  aria-pressed={pdf}
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

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" /> Enregistré
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </section>
        </div>
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<
  BrandingSettingsProps
> = async (ctx) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app/settings");
  const { branding, whiteLabelActive } = await getUserBranding(
    session.workspace.ownerId,
  );
  return { props: { initial: branding, whiteLabelActive } };
};
