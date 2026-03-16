import {
  Clock,
  Cog,
  MessageSquareText,
  Brain,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

export type AuditStatus =
  | "pending"
  | "generating"
  | "processing" // legacy → generating or auditing (depends on context)
  | "questions_review"
  | "awaiting_prompt_approval" // backend equivalent of questions_review
  | "auditing"
  | "audit_review"
  | "review_pending" // legacy → audit_review
  | "completed"
  | "rejected"
  | "failed";

interface Step {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { key: "pending", label: "Pending", icon: <Clock size={18} /> },
  { key: "generating", label: "Generating", icon: <Cog size={18} /> },
  { key: "questions_review", label: "Questions Review", icon: <MessageSquareText size={18} /> },
  { key: "auditing", label: "Auditing", icon: <Brain size={18} /> },
  { key: "audit_review", label: "Audit Review", icon: <ClipboardCheck size={18} /> },
  { key: "completed", label: "Completed", icon: <CheckCircle2 size={18} /> },
];

/** Map legacy/special statuses to their step index */
function getStepIndex(status: AuditStatus): number {
  const mapping: Record<string, number> = {
    pending: 0,
    generating: 1,
    processing: 1, // legacy (context-dependent, but stepper defaults to Phase 1)
    questions_review: 2,
    awaiting_prompt_approval: 2, // backend equivalent
    auditing: 3,
    audit_review: 4,
    review_pending: 4, // legacy
    completed: 5,
  };
  return mapping[status] ?? -1;
}

interface AuditStepperProps {
  status: AuditStatus;
}

export default function AuditStepper({ status }: AuditStepperProps) {
  const isTerminal = status === "rejected" || status === "failed";
  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full">
      {/* Terminal status banner */}
      {isTerminal && (
        <div
          className={`mb-3 px-4 py-2 rounded text-sm font-medium ${
            status === "rejected"
              ? "bg-orange-900/40 text-orange-300 border border-orange-700"
              : "bg-red-900/40 text-red-300 border border-red-700"
          }`}
        >
          {status === "rejected" ? "Audit Rejected" : "Audit Failed"}
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isCompleted = !isTerminal && i < currentIndex;
          const isFuture = !isActive && !isCompleted;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900"
                      : isCompleted
                      ? "bg-green-600 text-white"
                      : isTerminal && i > currentIndex
                      ? "bg-gray-700 text-gray-500"
                      : isFuture
                      ? "bg-gray-700 text-gray-400"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : step.icon}
                </div>
                <span
                  className={`text-xs whitespace-nowrap ${
                    isActive
                      ? "text-blue-400 font-semibold"
                      : isCompleted
                      ? "text-green-400"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-20px] ${
                    isCompleted ? "bg-green-600" : "bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Normalized display status (maps legacy/backend statuses) */
export function normalizeStatus(status: string, hasPrompts?: boolean): AuditStatus {
  if (status === "processing") {
    return hasPrompts ? "auditing" : "generating";
  }
  if (status === "awaiting_prompt_approval") return "questions_review";
  if (status === "review_pending") return "audit_review";
  return status as AuditStatus;
}

/** Human-readable label */
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    generating: "Generating",
    processing: "Generating",
    questions_review: "Questions Review",
    awaiting_prompt_approval: "Questions Review",
    auditing: "Auditing",
    audit_review: "Audit Review",
    review_pending: "Audit Review",
    completed: "Completed",
    rejected: "Rejected",
    failed: "Failed",
  };
  return labels[status] || status;
}

/** Status color for badges */
export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-gray-500",
    generating: "bg-blue-500",
    processing: "bg-blue-500",
    questions_review: "bg-amber-500",
    awaiting_prompt_approval: "bg-amber-500",
    auditing: "bg-indigo-500",
    audit_review: "bg-yellow-500",
    review_pending: "bg-yellow-500",
    completed: "bg-green-500",
    rejected: "bg-orange-500",
    failed: "bg-red-500",
  };
  return colors[status] || "bg-gray-600";
}
