import { useState } from "react";
import { useRouter } from "next/router";
import {
  Send,
  Loader2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Mail,
  FileText,
  MessageSquare,
  MessagesSquare,
  HelpCircle,
  PenLine,
  Youtube,
  Star,
  MapPin,
  BookOpen,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Ban,
  Info,
  type LucideIcon,
} from "lucide-react";
import SybMark from "@/components/icons/SybMark";
import Favicon from "@/components/monitoring/Favicon";
import { LLMBadge } from "@/components/monitoring/widgets";
import type { OutreachStatus } from "@/models/OutreachTarget";
import { CHANNEL_META, type OutreachChannelKind } from "@/lib/outreach/channel";
import type {
  OutreachTargetView,
  SuppressionView,
} from "@/lib/outreach/outreach-page";

const STATUS_STYLE: Record<OutreachStatus, string> = {
  draft: "bg-amber-50 text-amber-700",
  approved: "bg-blue-50 text-blue-700",
  rejected: "bg-gray-100 text-gray-500",
  sent: "bg-emerald-50 text-emerald-700",
};

const CHANNEL_ICON: Record<OutreachChannelKind, LucideIcon> = {
  email: Mail,
  contact_form: FileText,
  reddit: MessageSquare,
  quora: HelpCircle,
  medium: PenLine,
  youtube: Youtube,
  forum: MessagesSquare,
  review_platform: Star,
  listing: MapPin,
  wikipedia: BookOpen,
  social: Share2,
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Status label, channel-aware for the "done" state (envoyé / publié / fait). */
function statusLabel(status: OutreachStatus, channel: OutreachChannelKind): string {
  if (status === "sent") return capitalize(CHANNEL_META[channel].doneVerb);
  return { draft: "Brouillon", approved: "Validé", rejected: "Rejeté", sent: "" }[status];
}

function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 60
      ? "bg-emerald-50 text-emerald-700"
      : score >= 30
        ? "bg-amber-50 text-amber-700"
        : "bg-gray-100 text-gray-500";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      Pertinence {score}/100
    </span>
  );
}

function ChannelBadge({ channel }: { channel: OutreachChannelKind }) {
  const Icon = CHANNEL_ICON[channel];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-muted px-2 py-0.5 text-[11px] font-semibold text-accent">
      <Icon className="h-3 w-3" /> {CHANNEL_META[channel].label}
    </span>
  );
}

function TargetCard({
  target,
  projectId,
  onChanged,
}: {
  target: OutreachTargetView;
  projectId: string;
  onChanged: () => void;
}) {
  const [subject, setSubject] = useState(target.subject);
  const [body, setBody] = useState(target.body);
  const [email, setEmail] = useState(target.contactEmail ?? "");
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const meta = CHANNEL_META[target.channel];
  const usesEmail = meta.usesEmail;
  const hasSubject = target.channel === "email" || target.channel === "contact_form";

  const dirty =
    subject !== target.subject ||
    body !== target.body ||
    (usesEmail && (email || null) !== (target.contactEmail ?? null));

  async function patch(payload: Record<string, unknown>, tag: string) {
    setBusy(tag);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/outreach/${target.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "L'action a échoué.");
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  }

  async function saveEdits() {
    await patch(
      {
        editedSubject: subject,
        editedBody: body,
        ...(usesEmail ? { contactEmail: email.trim() || null } : {}),
      },
      "save",
    );
  }

  async function setStatus(status: OutreachStatus) {
    await patch({ status }, status);
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/outreach/${target.id}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "La suppression a échoué.");
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  }

  async function suppress() {
    if (!email.trim()) {
      setError("Aucun email à ajouter à la liste de suppression.");
      return;
    }
    setBusy("suppress");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/outreach/suppress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reason: "opt-out manuel" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "L'ajout a échoué.");
      }
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  }

  async function copyDraft() {
    try {
      const text = hasSubject && subject ? `Objet : ${subject}\n\n${body}` : body;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  const mailto = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
  const actionHref = usesEmail ? mailto : target.actionUrl ?? "";
  const actionEnabled = usesEmail ? Boolean(email.trim()) : Boolean(target.actionUrl);
  const ActionIcon = usesEmail ? Mail : ExternalLink;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-premium backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Favicon source={target.domain} label={target.domain} size={22} rounded="rounded-md" />
            <span className="text-[15px] font-semibold text-gray-900">
              {target.domain}
            </span>
            <ChannelBadge channel={target.channel} />
            <ScorePill score={target.relevanceScore} />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[target.status]}`}
            >
              {statusLabel(target.status, target.channel)}
            </span>
            {target.mock && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                <Info className="h-3 w-3" /> Modèle local (sans clé LLM)
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>
              {/* Summed across engines, like the sources page: this counts
                  answers, not queries. */}
              Cité dans {target.citations} réponse(s) par{" "}
              {target.engines.length} moteur(s)
            </span>
            <span className="flex items-center gap-1">
              {target.engines.map((e) => (
                <LLMBadge key={e} llm={e} size={14} />
              ))}
            </span>
          </div>
          {target.sampleUrl && (
            <a
              href={target.sampleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              Voir la page citée <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <button
          onClick={remove}
          disabled={busy !== null}
          title="Supprimer"
          className="rounded-lg border border-white/60 bg-white/60 p-1.5 text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
        >
          {busy === "delete" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-accent-muted/60 px-3 py-2 text-[12px] text-accent">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{meta.howto}</span>
      </div>

      {usesEmail && (
        <label className="mb-2 block text-sm">
          <span className="mb-1 block font-medium text-gray-700">
            Email de contact
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              target.contactSource === "page_contact"
                ? ""
                : "Contact à trouver manuellement (aucun email public détecté)"
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          {target.contactSource === "page_contact" && (
            <span className="mt-1 block text-[11px] text-gray-400">
              Email public détecté sur la page contact du site.
            </span>
          )}
        </label>
      )}

      {hasSubject && (
        <label className="mb-2 block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Objet</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
      )}
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-gray-700">
          {usesEmail ? "Message" : "Contenu à publier"}
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={9}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-[12px] leading-relaxed"
        />
      </label>

      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {dirty && (
          <button
            onClick={saveEdits}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Enregistrer les modifications
          </button>
        )}
        <button
          onClick={copyDraft}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copié
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> {usesEmail ? "Copier l'email" : "Copier le message"}
            </>
          )}
        </button>
        <a
          href={actionEnabled ? actionHref : undefined}
          target={usesEmail ? undefined : "_blank"}
          rel={usesEmail ? undefined : "noopener noreferrer"}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
            actionEnabled
              ? "border-ink-200 bg-accent-muted text-accent hover:bg-accent-muted"
              : "pointer-events-none border-gray-100 bg-gray-50 text-gray-300"
          }`}
        >
          <ActionIcon className="h-4 w-4" /> {meta.actionLabel}
        </a>
        {target.status !== "approved" && (
          <button
            onClick={() => setStatus("approved")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"
          >
            <ThumbsUp className="h-4 w-4" /> Valider
          </button>
        )}
        {target.status !== "sent" && (
          <button
            onClick={() => setStatus("sent")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> J&apos;ai {meta.doneVerb}
          </button>
        )}
        {target.status !== "rejected" && (
          <button
            onClick={() => setStatus("rejected")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            <ThumbsDown className="h-4 w-4" /> Rejeter
          </button>
        )}
        {usesEmail && (
          <button
            onClick={suppress}
            disabled={busy !== null}
            title="Ajouter cet email à la liste « ne plus contacter »"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-red-600 disabled:opacity-60"
          >
            <Ban className="h-4 w-4" /> Ne plus contacter
          </button>
        )}
      </div>
    </div>
  );
}

export default function OutreachManager({
  projectId,
  targets,
  suppressions,
  dailyRemaining,
}: {
  projectId: string;
  targets: OutreachTargetView[];
  suppressions: SuppressionView[];
  dailyRemaining: number;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function refresh() {
    router.replace(router.asPath, undefined, { scroll: false });
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "La préparation a échoué.");
      }
      const created = json.data?.created ?? 0;
      setNotice(
        created > 0
          ? `${created} demande(s) préparée(s). Relisez, éditez, puis envoyez ou publiez vous-même.`
          : "Aucune nouvelle cible à préparer (déjà traitées, ou aucune source à conquérir).",
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-ink-200 bg-accent-muted p-5">
        <p className="text-sm font-semibold text-gray-900">
          Transformez les « sources à conquérir » en actions ciblées.
        </p>
        <p className="mt-0.5 text-sm text-gray-600">
          L&apos;agent identifie les sources que les IA citent sans vous
          mentionner et choisit le bon canal pour chacune : email pour un site
          éditorial, réponse sur Reddit ou Quora, fiche à revendiquer sur G2 ou
          TripAdvisor, etc. Vous relisez, éditez, puis envoyez ou publiez
          vous-même : rien n&apos;est envoyé automatiquement.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={generate}
            disabled={generating || dailyRemaining <= 0}
            className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Préparation…
              </>
            ) : (
              <>
                <SybMark className="h-4 w-4" /> Préparer des demandes
              </>
            )}
          </button>
          <span className="text-xs text-gray-500">
            {dailyRemaining > 0
              ? `${dailyRemaining} brouillon(s) restants aujourd'hui`
              : "Plafond quotidien atteint, réessayez demain"}
          </span>
        </div>
        {notice && <p className="mt-2 text-[12px] text-accent">{notice}</p>}
        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
      </div>

      {targets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-8 text-center">
          <p className="text-sm font-medium text-gray-700">
            Aucune demande préparée pour l&apos;instant.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Lancez un run de monitoring pour détecter des sources, puis cliquez
            sur « Préparer des demandes ».
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {targets.map((t) => (
            <TargetCard
              key={t.id}
              target={t}
              projectId={projectId}
              onChanged={refresh}
            />
          ))}
        </div>
      )}

      {suppressions.length > 0 && (
        <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5">
            <Ban className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-800">
              Liste « ne plus contacter » ({suppressions.length})
            </span>
          </div>
          <p className="mb-3 text-[12px] text-gray-500">
            Ces adresses sont exclues des prochaines préparations (opt-out /
            RGPD).
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            {suppressions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span>{s.email}</span>
                {s.reason && (
                  <span className="text-[11px] text-gray-400">{s.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-gray-400">
        Cadre : demande de mention ou contribution B2B, contacts et pages
        publics uniquement, aucun envoi automatique, opt-out respecté. Vérifiez
        chaque brouillon et sa destination avant envoi ou publication.
      </p>
    </div>
  );
}
