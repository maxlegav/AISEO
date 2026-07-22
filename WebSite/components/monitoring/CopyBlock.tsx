import { useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * A monospace code block with a copy-to-clipboard button. Used for the
 * technical GEO deliverables (llms.txt, robots.txt patch, FAQ JSON-LD).
 */
export default function CopyBlock({
  code,
  label,
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-950">
      {label && (
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <span className="font-mono text-[11px] text-gray-400">{label}</span>
        </div>
      )}
      <button
        onClick={copy}
        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-gray-200 transition-colors hover:bg-white/20"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" /> Copié
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" /> Copier
          </>
        )}
      </button>
      <pre className="max-h-72 overflow-auto p-3 pr-16 text-[12px] leading-relaxed text-gray-100">
        <code className="whitespace-pre-wrap break-words font-mono">{code}</code>
      </pre>
    </div>
  );
}
