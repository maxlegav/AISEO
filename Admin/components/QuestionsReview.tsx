import { useState, useMemo } from "react";
import toast from "react-hot-toast";

interface GeneratedPrompt {
  id: string;
  level: number;
  category: string;
  question: string;
  enabled?: boolean;
}

interface QuestionsReviewProps {
  auditId: string;
  questions: GeneratedPrompt[];
  onApprove: () => void;
  onReject: () => void;
  onQuestionsUpdated: () => void;
}

export default function QuestionsReview({
  auditId,
  questions: initialQuestions,
  onApprove,
  onReject,
  onQuestionsUpdated,
}: QuestionsReviewProps) {
  const [questions, setQuestions] = useState<GeneratedPrompt[]>(
    initialQuestions.map((q) => ({ ...q, enabled: q.enabled !== false }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Group stats
  const stats = useMemo(() => {
    const byLevel: Record<number, { total: number; enabled: number }> = {};
    const byCategory: Record<string, { total: number; enabled: number }> = {};

    questions.forEach((q) => {
      if (!byLevel[q.level]) byLevel[q.level] = { total: 0, enabled: 0 };
      byLevel[q.level].total++;
      if (q.enabled) byLevel[q.level].enabled++;

      if (!byCategory[q.category]) byCategory[q.category] = { total: 0, enabled: 0 };
      byCategory[q.category].total++;
      if (q.enabled) byCategory[q.category].enabled++;
    });

    return {
      total: questions.length,
      enabled: questions.filter((q) => q.enabled).length,
      byLevel,
      byCategory,
    };
  }, [questions]);

  const categories = useMemo(
    () => Array.from(new Set(questions.map((q) => q.category))).sort(),
    [questions]
  );

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filterLevel !== null && q.level !== filterLevel) return false;
      if (filterCategory !== null && q.category !== filterCategory) return false;
      return true;
    });
  }, [questions, filterLevel, filterCategory]);

  const toggleQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, enabled: !q.enabled } : q))
    );
    setHasChanges(true);
  };

  const toggleAll = (enabled: boolean) => {
    setQuestions((prev) => prev.map((q) => ({ ...q, enabled })));
    setHasChanges(true);
  };

  const startEdit = (q: GeneratedPrompt) => {
    setEditingId(q.id);
    setEditText(q.question);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setQuestions((prev) =>
      prev.map((q) => (q.id === editingId ? { ...q, question: editText } : q))
    );
    setEditingId(null);
    setEditText("");
    setHasChanges(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const updates = questions.map((q) => ({
        id: q.id,
        question: q.question,
        enabled: q.enabled,
      }));

      const res = await fetch("/api/audits/update-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, questions: updates }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Questions saved");
        setHasChanges(false);
        onQuestionsUpdated();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">
            Generated Questions ({stats.enabled}/{stats.total} enabled)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => toggleAll(true)}
              className="text-xs px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="text-xs px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Level pills */}
        <div className="flex gap-2 flex-wrap mb-2">
          <span className="text-xs text-gray-400 self-center">Level:</span>
          <button
            onClick={() => setFilterLevel(null)}
            className={`text-xs px-2 py-1 rounded ${
              filterLevel === null ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            All
          </button>
          {Object.entries(stats.byLevel)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([level, data]) => (
              <button
                key={level}
                onClick={() => setFilterLevel(Number(level))}
                className={`text-xs px-2 py-1 rounded ${
                  filterLevel === Number(level)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                L{level} ({data.enabled}/{data.total})
              </button>
            ))}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-gray-400 self-center">Category:</span>
          <button
            onClick={() => setFilterCategory(null)}
            className={`text-xs px-2 py-1 rounded ${
              filterCategory === null ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-xs px-2 py-1 rounded capitalize ${
                filterCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {cat} ({stats.byCategory[cat]?.enabled}/{stats.byCategory[cat]?.total})
            </button>
          ))}
        </div>
      </div>

      {/* Questions table */}
      <div className="space-y-1">
        {filteredQuestions.map((q) => (
          <div
            key={q.id}
            className={`bg-gray-800 rounded-lg p-3 flex items-start gap-3 transition-opacity ${
              !q.enabled ? "opacity-50" : ""
            }`}
          >
            {/* Toggle */}
            <button
              onClick={() => toggleQuestion(q.id)}
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                q.enabled
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-500 text-transparent"
              }`}
            >
              {q.enabled && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                  L{q.level}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 capitalize">
                  {q.category}
                </span>
              </div>
              {editingId === q.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="text-xs px-2 py-1 bg-green-700 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <p
                  className="text-sm text-white cursor-pointer hover:text-blue-300"
                  onClick={() => startEdit(q)}
                  title="Click to edit"
                >
                  {q.question}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 -mx-6 -mb-6 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-400">
          {stats.enabled} questions enabled out of {stats.total}
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={saveChanges}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
          <button
            onClick={onReject}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-medium transition-colors"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            disabled={hasChanges}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-medium transition-colors disabled:opacity-50"
            title={hasChanges ? "Save changes before approving" : ""}
          >
            Approve Questions
          </button>
        </div>
      </div>
    </div>
  );
}
