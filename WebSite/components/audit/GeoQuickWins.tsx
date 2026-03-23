import { useState } from "react";
import { Copy, Check, Zap } from "lucide-react";

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied
          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
          : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200"
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GeoQuickWinsProps {
  llmsTxtContent: string | null;
  llmHijackPrompt: string | null;
  faqSchemaContent?: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GeoQuickWins({ llmsTxtContent, llmHijackPrompt, faqSchemaContent }: GeoQuickWinsProps) {
  if (!llmsTxtContent && !llmHijackPrompt && !faqSchemaContent) return null;

  return (
    <div id="quick-wins" className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
          <Zap className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900">GEO Quick Wins</h2>
          <p className="text-sm text-gray-500 mt-0.5">Copy and deploy these immediately — no developer required</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">

        {/* llms.txt */}
        {llmsTxtContent && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">llms.txt</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Upload to your website root — tells AI engines about your business
                </p>
              </div>
              <CopyButton text={llmsTxtContent} />
            </div>
            <pre className="text-xs text-gray-700 p-5 overflow-auto max-h-56 overscroll-contain leading-relaxed whitespace-pre-wrap font-mono">
              {llmsTxtContent}
            </pre>
          </div>
        )}

        {/* HTML GEO snippet */}
        {llmHijackPrompt && (
          <div className="rounded-2xl overflow-hidden border border-gray-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 bg-gray-900">
              <div>
                <p className="text-sm font-semibold text-white">GEO HTML Snippet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Add to your <code className="text-orange-400">&lt;head&gt;</code> — structured context for LLMs
                </p>
              </div>
              <CopyButton text={llmHijackPrompt} />
            </div>
            <pre className="text-xs text-green-300 bg-gray-900 p-5 overflow-auto max-h-56 overscroll-contain leading-relaxed whitespace-pre-wrap font-mono">
              {llmHijackPrompt}
            </pre>
          </div>
        )}

        {/* FAQ Schema */}
        {faqSchemaContent && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">FAQ Schema</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Add to your page <code className="text-orange-500">&lt;head&gt;</code> — answers all uncited questions
                </p>
              </div>
              <CopyButton text={faqSchemaContent} />
            </div>
            <pre className="text-xs text-gray-700 p-5 overflow-auto max-h-64 overscroll-contain leading-relaxed whitespace-pre-wrap font-mono">
              {faqSchemaContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
