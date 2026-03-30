import { useEffect, useState, useCallback, useRef } from "react";
import { CheckSquare, Square, Save, CheckCircle2 } from "lucide-react";
import type { IssueItem } from "./auditTypes";

interface ChecklistState {
  issueId: string;
  done: boolean;
}

interface Props {
  auditId: string;
  issues: IssueItem[];
  initialChecklist?: ChecklistState[];
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Faible",
};

const SEVERITY_STYLE: Record<string, string> = {
  critical: "text-red-600 bg-red-50",
  high: "text-orange-600 bg-orange-50",
  medium: "text-yellow-700 bg-yellow-50",
  low: "text-blue-600 bg-blue-50",
};

export default function IssueChecklist({ auditId, issues, initialChecklist = [] }: Props) {
  const [checklist, setChecklist] = useState<Map<string, boolean>>(() => {
    const m = new Map<string, boolean>();
    for (const item of initialChecklist) {
      m.set(item.issueId, item.done);
    }
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with initialChecklist if it arrives after mount (e.g. from parent fetch)
  useEffect(() => {
    if (initialChecklist.length === 0) return;
    setChecklist((prev) => {
      const m = new Map(prev);
      for (const item of initialChecklist) {
        if (!m.has(item.issueId)) m.set(item.issueId, item.done);
      }
      return m;
    });
  }, [initialChecklist]);

  const persistChecklist = useCallback(
    async (current: Map<string, boolean>) => {
      const items = Array.from(current.entries()).map(([issueId, done]) => ({ issueId, done }));
      setSaving(true);
      try {
        await fetch(`/api/audits/${auditId}/checklist`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } finally {
        setSaving(false);
        dirtyRef.current = false;
      }
    },
    [auditId]
  );

  const toggle = (issueId: string) => {
    setChecklist((prev) => {
      const next = new Map(prev);
      next.set(issueId, !prev.get(issueId));
      dirtyRef.current = true;
      // Debounced auto-save after 800ms
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persistChecklist(next), 800);
      return next;
    });
  };

  const doneCount = Array.from(checklist.values()).filter(Boolean).length;
  const total = issues.length;

  if (issues.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              Suivi des actions
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Cochez les problèmes que vous avez traités — intégré au prochain audit
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Save className="w-3 h-3 animate-pulse" />
                Sauvegarde…
              </span>
            )}
            {saved && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Sauvegardé
              </span>
            )}
            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
              {doneCount} / {total}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
            style={{ width: total > 0 ? `${(doneCount / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Issues list */}
      <ul className="divide-y divide-gray-50">
        {issues.map((issue) => {
          const done = checklist.get(issue.id) ?? false;
          return (
            <li
              key={issue.id}
              className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-gray-50/60 ${done ? "opacity-60" : ""}`}
              onClick={() => toggle(issue.id)}
            >
              <div className="mt-0.5 shrink-0 text-violet-500">
                {done
                  ? <CheckSquare className="w-5 h-5 text-emerald-500" />
                  : <Square className="w-5 h-5 text-gray-300 hover:text-violet-400 transition-colors" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_STYLE[issue.severity] ?? "text-gray-600 bg-gray-50"}`}>
                    {SEVERITY_LABEL[issue.severity] ?? issue.severity}
                  </span>
                  <p className={`text-sm font-medium text-gray-900 ${done ? "line-through" : ""}`}>
                    {issue.title}
                  </p>
                </div>
                {!done && (
                  <p className="text-xs text-gray-500 leading-relaxed">{issue.description}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {doneCount > 0 && doneCount === total && (
        <div className="px-6 py-4 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          Tous les problèmes traités — le prochain audit ira chercher de nouveaux axes d&apos;optimisation.
        </div>
      )}
    </div>
  );
}
