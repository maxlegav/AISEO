import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useState } from "react";
import { Building2, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import {
  listSwitcherProjects,
  type SwitcherEntry,
} from "@/lib/monitoring/dashboard";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import mongoose from "mongoose";
import Client from "@/models/Client";
import Project from "@/models/Project";

interface ClientRow {
  id: string;
  name: string;
  websiteUrl?: string;
  contactEmail?: string;
  projectCount: number;
}

interface ClientsPageProps {
  switcherProjects: SwitcherEntry[];
  clients: ClientRow[];
  canManage: boolean;
  organizationName: string;
}

export default function ClientsPage({
  switcherProjects,
  clients: initial,
  canManage,
  organizationName,
}: ClientsPageProps) {
  const [clients, setClients] = useState<ClientRow[]>(initial);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addClient() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), websiteUrl: website.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Échec.");
      setClients((c) => [
        {
          id: json.data._id,
          name: json.data.name,
          websiteUrl: json.data.websiteUrl,
          projectCount: 0,
        },
        ...c,
      ]);
      setName("");
      setWebsite("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(false);
    }
  }

  async function removeClient(id: string) {
    if (!confirm("Supprimer ce client ? Ses projets seront détachés (non supprimés).")) return;
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) setClients((c) => c.filter((x) => x.id !== id));
  }

  return (
    <>
      <Head>
        <title>Clients · ShowYourBrand</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        projects={switcherProjects}
        active="clients"
        title="Clients"
        subtitle={`Regroupez vos projets par client · ${organizationName}.`}
      >
        {canManage && (
          <section className="mb-6 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
            <h2 className="mb-3 font-heading text-base font-semibold text-gray-900">
              Ajouter un client
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du client"
                className="flex-1 rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-ink-200"
              />
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="site.fr (optionnel)"
                className="flex-1 rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-ink-200"
              />
              <button
                type="button"
                onClick={addClient}
                disabled={busy || !name.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Ajouter
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </section>
        )}

        {clients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-10 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              Aucun client pour l&apos;instant. Créez-en un pour regrouper vos projets.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <div
                key={c.id}
                className="flex flex-col rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="truncate font-semibold text-gray-900">{c.name}</h3>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => removeClient(c.id)}
                      className="text-gray-300 transition-colors hover:text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {c.websiteUrl && (
                  <a
                    href={c.websiteUrl.startsWith("http") ? c.websiteUrl : `https://${c.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-3 inline-flex items-center gap-1 truncate text-xs text-gray-400 hover:text-gray-600"
                  >
                    {c.websiteUrl} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <a
                  href={`/app?client=${c.id}`}
                  className="mt-auto text-sm font-medium text-accent hover:text-accent"
                >
                  {c.projectCount} projet{c.projectCount > 1 ? "s" : ""} →
                </a>
              </div>
            ))}
          </div>
        )}
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<ClientsPageProps> = async (ctx) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app/clients");
  const { organizationId, organizationName, role } = session.workspace;

  const clients = (await Client.find({ organizationId, archived: false })
    .sort({ createdAt: -1 })
    .lean()) as unknown as {
    _id: mongoose.Types.ObjectId;
    name: string;
    websiteUrl?: string;
    contactEmail?: string;
  }[];

  const counts = await Project.aggregate<{ _id: mongoose.Types.ObjectId | null; n: number }>([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    { $group: { _id: "$clientId", n: { $sum: 1 } } },
  ]);
  const countById = new Map(counts.filter((c) => c._id).map((c) => [c._id!.toString(), c.n]));

  const switcherProjects = await listSwitcherProjects(organizationId);

  return {
    props: {
      switcherProjects,
      clients: clients.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        websiteUrl: c.websiteUrl ?? "",
        contactEmail: c.contactEmail ?? "",
        projectCount: countById.get(c._id.toString()) ?? 0,
      })),
      canManage: role === "owner" || role === "admin",
      organizationName,
    },
  };
};
