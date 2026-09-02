import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useState } from "react";
import { Loader2, UserPlus, Trash2, Check, Clock, Copy } from "lucide-react";
import MonitoringLayout from "@/components/monitoring/MonitoringLayout";
import {
  listSwitcherProjects,
  type SwitcherEntry,
} from "@/lib/monitoring/dashboard";
import { getSessionWorkspace, loginRedirect } from "@/lib/app-auth";
import mongoose from "mongoose";
import Membership, { type MembershipRole, type MembershipStatus } from "@/models/Membership";

interface MemberRow {
  id: string;
  email: string;
  role: MembershipRole;
  status: MembershipStatus;
}

interface TeamPageProps {
  switcherProjects: SwitcherEntry[];
  members: MemberRow[];
  canManage: boolean;
  organizationName: string;
}

const ROLE_LABEL: Record<MembershipRole, string> = {
  owner: "Propriétaire",
  admin: "Admin",
  member: "Membre",
};

export default function TeamPage({
  switcherProjects,
  members: initial,
  canManage,
  organizationName,
}: TeamPageProps) {
  const [members, setMembers] = useState<MemberRow[]>(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function invite() {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setInviteUrl(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Échec de l'invitation.");
      setMembers((m) => [
        ...m,
        { id: json.data.membership._id, email: email.trim().toLowerCase(), role, status: "invited" },
      ]);
      setInviteUrl(json.data.inviteUrl);
      setEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Retirer ce membre de l'organisation ?")) return;
    const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
    if (res.ok) setMembers((m) => m.filter((x) => x.id !== id));
  }

  return (
    <>
      <Head>
        <title>Équipe · ShowYourBrand</title>
        <meta name="robots" content="noindex" />
      </Head>
      <MonitoringLayout
        projects={switcherProjects}
        active="team"
        title="Équipe"
        subtitle={`Invitez vos collègues à collaborer sur ${organizationName}.`}
      >
        {canManage && (
          <section className="mb-6 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
            <h2 className="mb-3 font-heading text-base font-semibold text-gray-900">
              Inviter un membre
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collegue@agence.fr"
                className="flex-1 rounded-lg border border-gray-200 px-3.5 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-ink-200"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as MembershipRole)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-ink-200"
              >
                <option value="member">Membre</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="button"
                onClick={invite}
                disabled={busy || !email.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Inviter
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {inviteUrl && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <span className="truncate">Lien d&apos;invitation : {inviteUrl}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(inviteUrl)}
                  className="ml-auto shrink-0 rounded-md p-1 hover:bg-emerald-100"
                  title="Copier"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-premium backdrop-blur-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-semibold">Membre</th>
                <th className="px-5 py-3 font-semibold">Rôle</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
                {canManage && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-gray-900">{m.email}</td>
                  <td className="px-5 py-3 text-gray-600">{ROLE_LABEL[m.role]}</td>
                  <td className="px-5 py-3">
                    {m.status === "active" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Clock className="h-3.5 w-3.5" /> Invité
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-5 py-3 text-right">
                      {m.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() => remove(m.id)}
                          className="text-gray-300 transition-colors hover:text-red-500"
                          title="Retirer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MonitoringLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<TeamPageProps> = async (ctx) => {
  const session = await getSessionWorkspace(ctx);
  if (!session) return loginRedirect("/app/team");
  const { organizationId, organizationName, role } = session.workspace;

  const members = (await Membership.find({ organizationId })
    .sort({ createdAt: 1 })
    .lean()) as unknown as {
    _id: mongoose.Types.ObjectId;
    email: string;
    role: MembershipRole;
    status: MembershipStatus;
  }[];

  const switcherProjects = await listSwitcherProjects(organizationId);

  return {
    props: {
      switcherProjects,
      members: members.map((m) => ({
        id: m._id.toString(),
        email: m.email,
        role: m.role,
        status: m.status,
      })),
      canManage: role === "owner" || role === "admin",
      organizationName,
    },
  };
};
