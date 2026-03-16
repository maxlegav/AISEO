import { useState } from "react";
import {
  MessageSquare, FileSearch, BookOpen, Target,
  Check, X, AlertTriangle, ChevronDown, ChevronUp,
  Code2, Link2,
} from "lucide-react";
import type {
  PromptResult, HtmlScan, CitationStats,
  CategoryScore, LevelScore,
} from "./auditTypes";
import {
  CATEGORY_META, LEVEL_COLORS, LEVEL_TEXT, LEVEL_LABELS,
  ENGINE_ABBR, pct, scoreTextClass,
  getBool, getString, getNumber,
} from "./auditHelpers";

// ─── Engine dot ───────────────────────────────────────────────────────────────

function EngineDot({ result, engine }: { result: { mentioned: boolean; quality: number; position: number; error: string | null } | undefined; engine: string }) {
  const abbr = ENGINE_ABBR[engine] ?? engine.slice(0, 3).toUpperCase();
  if (!result) return null;

  let dotClass = "bg-gray-200";
  if (result.error) dotClass = "bg-gray-300";
  else if (!result.mentioned) dotClass = "bg-red-200";
  else if (result.quality >= 3) dotClass = "bg-emerald-500";
  else if (result.quality >= 2) dotClass = "bg-emerald-300";
  else dotClass = "bg-yellow-400";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
      <span className="text-[9px] text-gray-400 font-mono">{abbr}</span>
    </div>
  );
}

// ─── Check row ────────────────────────────────────────────────────────────────

function CheckRow({ label, pass, info }: { label: string; pass: boolean | undefined; info?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {info && <span className="text-xs text-gray-400">{info}</span>}
        {pass === true  && <Check className="w-4 h-4 text-emerald-500" />}
        {pass === false && <X className="w-4 h-4 text-red-400" />}
        {pass === undefined && <span className="text-xs text-gray-300">—</span>}
      </div>
    </div>
  );
}

// ─── ═══════════════════════════════════════════════════════════ ──────────────
// ─── TAB: PROMPTS ─────────────────────────────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════ ──────────────

function PromptsTab({ promptResults, engines }: { promptResults: PromptResult[]; engines: string[] }) {
  const [promptFilter, setPromptFilter] = useState<string>("all");
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);

  const categories = Array.from(new Set(promptResults.map((p) => p.category))).sort();
  const filtered = promptFilter === "all" ? promptResults : promptResults.filter((p) => p.category === promptFilter);

  if (promptResults.length === 0) return <p className="text-sm text-gray-400">No prompt data available.</p>;

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button
          onClick={() => setPromptFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            promptFilter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({promptResults.length})
        </button>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = promptResults.filter((p) => p.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setPromptFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                promptFilter === cat
                  ? "bg-gray-900 text-white"
                  : meta ? `${meta.pill} hover:opacity-80` : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {meta?.label ?? cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Engine legend */}
      {engines.length > 0 && (
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <span className="text-[11px] text-gray-400 font-medium">Legend:</span>
          {[
            { cls: "bg-emerald-500", label: "high quality" },
            { cls: "bg-yellow-400", label: "low quality" },
            { cls: "bg-red-200", label: "not mentioned" },
            { cls: "bg-gray-300", label: "error" },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${cls}`} />
              <span className="text-[11px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Prompt rows */}
      <div className="divide-y divide-gray-50">
        {filtered.map((p) => {
          const mentionPct = Math.round(p.mentionRate * 100);
          const meta = CATEGORY_META[p.category];
          const isExpanded = expandedPrompt === p.promptId;

          return (
            <div key={p.promptId}>
              <button
                className="w-full flex items-center gap-3 py-3 hover:bg-gray-50/50 rounded-lg px-2 transition-colors text-left"
                onClick={() => setExpandedPrompt(isExpanded ? null : p.promptId)}
              >
                <span className="text-[11px] text-gray-400 font-mono w-6 shrink-0 text-right">{p.promptId}</span>
                {meta && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${meta.pill}`}>
                    {meta.label.slice(0, 4)}
                  </span>
                )}
                <span className={`text-[10px] font-bold shrink-0 ${LEVEL_TEXT[p.level - 1] ?? "text-gray-400"}`}>
                  L{p.level}
                </span>
                <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{p.question}</span>
                <span className={`text-xs font-bold tabular-nums shrink-0 ${
                  mentionPct >= 75 ? "text-emerald-600" : mentionPct >= 25 ? "text-orange-500" : "text-red-500"
                }`}>
                  {mentionPct}%
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {engines.map((e) => (
                    <EngineDot key={e} engine={e} result={p.engines[e]} />
                  ))}
                </div>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
              </button>

              {isExpanded && (
                <div className="mx-2 mb-3 bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Raw AI responses:</p>
                  {engines.map((e) => {
                    const eng = p.engines[e];
                    if (!eng) return null;
                    return (
                      <div key={e} className="text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-700 capitalize">{e}</span>
                          {eng.error ? (
                            <span className="text-red-500">Error: {eng.error}</span>
                          ) : eng.mentioned ? (
                            <span className="text-emerald-600">
                              Mentioned · quality {eng.quality}/3 · rank {eng.position}
                              {eng.responseTime > 0 && ` · ${eng.responseTime}ms`}
                            </span>
                          ) : (
                            <span className="text-red-400">Not mentioned</span>
                          )}
                        </div>
                        {eng.rawResponse && (
                          <p className="text-gray-500 leading-relaxed line-clamp-4 pl-3 border-l-2 border-gray-200">
                            {eng.rawResponse.slice(0, 400)}{eng.rawResponse.length > 400 ? "…" : ""}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ═══════════════════════════════════════════════════════════ ──────────────
// ─── TAB: HTML SCAN ───────────────────────────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════ ──────────────

function HtmlScanTab({ htmlScan }: { htmlScan: HtmlScan }) {
  const [subTab, setSubTab] = useState<"overview" | "keywords" | "technical">("overview");

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-50 rounded-xl p-1 w-fit">
        {(["overview", "keywords", "technical"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
              subTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {subTab === "overview" && (
        <div className="space-y-6">

          {/* Meta tags */}
          {htmlScan.metaTags && Object.keys(htmlScan.metaTags).length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Meta Tags</p>
              <div className="space-y-2">
                {Object.entries(htmlScan.metaTags).map(([key, val]) => {
                  if (typeof val !== "string" && typeof val !== "number") return null;
                  return (
                    <div key={key} className="flex items-start gap-3 text-sm">
                      <span className="text-gray-400 font-mono text-xs w-32 shrink-0 pt-0.5">{key}</span>
                      <span className="text-gray-700 break-all">{String(val).slice(0, 200)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schema.org */}
          {htmlScan.schemaOrg && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Schema.org / Structured Data</p>
              {(() => {
                const types = htmlScan.schemaOrg?.["types"];
                const count = htmlScan.schemaOrg?.["count"];
                const hasSchema = Array.isArray(types) ? types.length > 0 : (typeof count === "number" ? count > 0 : false);
                return (
                  <div className="flex items-center gap-3">
                    {hasSchema ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />}
                    <div>
                      {Array.isArray(types) && types.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(types as string[]).map((type) => (
                            <span key={type} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-mono">{type}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-orange-600">
                          {hasSchema ? "Structured data detected" : "No structured data found — add Schema.org markup"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Heading structure */}
          {htmlScan.headingStructure && Object.keys(htmlScan.headingStructure).length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Heading Structure</p>
              <div className="flex items-center gap-4 flex-wrap">
                {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((tag) => {
                  const val = getNumber(htmlScan.headingStructure, tag);
                  if (val == null) return null;
                  return (
                    <div key={tag} className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-gray-500 uppercase">{tag}</span>
                      <span className={`text-sm font-bold ${tag === "h1" && val !== 1 ? "text-orange-500" : "text-gray-700"}`}>{val}</span>
                    </div>
                  );
                })}
                {(() => {
                  const h1 = getNumber(htmlScan.headingStructure, "h1");
                  if (h1 != null && h1 !== 1) {
                    return (
                      <span className="text-xs text-orange-500 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {h1 === 0 ? "Missing H1" : `${h1} H1 tags (should be 1)`}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* Image alt text */}
          {htmlScan.imageAltText && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Image Alt Text</p>
              {(() => {
                const total = getNumber(htmlScan.imageAltText, "total");
                const withAlt = getNumber(htmlScan.imageAltText, "withAlt") ?? getNumber(htmlScan.imageAltText, "with_alt");
                const withoutAlt = getNumber(htmlScan.imageAltText, "withoutAlt") ?? getNumber(htmlScan.imageAltText, "without_alt");
                const totalVal = total ?? (withAlt ?? 0) + (withoutAlt ?? 0);
                const pctAlt = totalVal > 0 ? Math.round(((withAlt ?? 0) / totalVal) * 100) : 0;
                return (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-700">{withAlt ?? 0} with alt</span>
                    </div>
                    {withoutAlt != null && withoutAlt > 0 && (
                      <div className="flex items-center gap-1.5">
                        <X className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-700">{withoutAlt} missing alt</span>
                      </div>
                    )}
                    <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pctAlt}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${pctAlt >= 80 ? "text-emerald-600" : "text-orange-500"}`}>{pctAlt}%</span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* AI Bot Accessibility */}
          {htmlScan.aiBotAccessibility && Object.keys(htmlScan.aiBotAccessibility).length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">AI Bot Accessibility</p>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(htmlScan.aiBotAccessibility).map(([bot, accessible]) => (
                  <div key={bot} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    accessible === true ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : accessible === false ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}>
                    {accessible === true ? <Check className="w-3.5 h-3.5" /> : accessible === false ? <X className="w-3.5 h-3.5" /> : null}
                    {bot}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keywords */}
      {subTab === "keywords" && (
        <div>
          {htmlScan.keywords && htmlScan.keywords.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">Top {htmlScan.keywords.length} keywords by TF-IDF frequency.</p>
              <div className="flex items-start gap-2 flex-wrap mb-6">
                {htmlScan.keywords.map((kw, i) => {
                  const maxCount = htmlScan.keywords?.[0]?.count ?? 1;
                  const relSize = 0.7 + (kw.count / maxCount) * 0.8;
                  return (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium"
                      style={{ fontSize: `${Math.max(11, Math.min(18, relSize * 14))}px` }}
                      title={`Count: ${kw.count}${kw.tfidf != null ? ` | TF-IDF: ${kw.tfidf.toFixed(3)}` : ""}`}
                    >
                      {kw.word}
                    </span>
                  );
                })}
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold">Keyword</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Count</th>
                      {htmlScan.keywords[0]?.tfidf != null && (
                        <th className="text-right px-4 py-2.5 font-semibold">TF-IDF</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {htmlScan.keywords.map((kw, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 text-gray-800">{kw.word}</td>
                        <td className="px-4 py-2 text-right text-gray-600 tabular-nums">{kw.count}</td>
                        {kw.tfidf != null && (
                          <td className="px-4 py-2 text-right text-gray-500 tabular-nums font-mono text-xs">
                            {kw.tfidf.toFixed(4)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">No keyword data available.</p>
          )}
        </div>
      )}

      {/* Technical */}
      {subTab === "technical" && (
        <div className="grid sm:grid-cols-2 gap-6">

          {/* robots.txt */}
          {htmlScan.robotsTxtAnalysis && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">robots.txt</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                <CheckRow label="robots.txt found" pass={getBool(htmlScan.robotsTxtAnalysis, "found")} />
                <CheckRow
                  label="AI bots allowed"
                  pass={(() => {
                    const blocked = htmlScan.robotsTxtAnalysis?.["aiBotsBlocked"];
                    if (Array.isArray(blocked)) return blocked.length === 0;
                    return getBool(htmlScan.robotsTxtAnalysis, "aiBotsAllowed");
                  })()}
                />
                {(() => {
                  const blocked = htmlScan.robotsTxtAnalysis?.["aiBotsBlocked"];
                  if (Array.isArray(blocked) && blocked.length > 0) {
                    return (
                      <div className="pt-2">
                        <p className="text-xs text-red-500 font-medium mb-1">Blocked AI bots:</p>
                        <div className="flex flex-wrap gap-1">
                          {(blocked as string[]).map((b) => (
                            <span key={b} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded font-mono">{b}</span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* Sitemap */}
          {htmlScan.sitemapAnalysis && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sitemap</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                <CheckRow label="sitemap.xml found" pass={getBool(htmlScan.sitemapAnalysis, "found")} />
                <CheckRow
                  label="Valid format"
                  pass={getBool(htmlScan.sitemapAnalysis, "valid")}
                  info={getNumber(htmlScan.sitemapAnalysis, "urlCount") != null ? `${getNumber(htmlScan.sitemapAnalysis, "urlCount")} URLs` : undefined}
                />
              </div>
            </div>
          )}

          {/* llms.txt check */}
          {htmlScan.llmsTxtAnalysis && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                llms.txt <span className="text-orange-500 ml-1">⚡ GEO key</span>
              </p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                <CheckRow label="llms.txt present" pass={getBool(htmlScan.llmsTxtAnalysis, "found")} />
                {getBool(htmlScan.llmsTxtAnalysis, "found") === false && (
                  <p className="text-xs text-orange-500 pt-2">Adding llms.txt significantly improves AI engine visibility.</p>
                )}
                {getString(htmlScan.llmsTxtAnalysis, "content") && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Content preview:</p>
                    <pre className="text-xs text-gray-600 bg-white rounded-lg p-2 overflow-auto max-h-32 leading-relaxed">
                      {getString(htmlScan.llmsTxtAnalysis, "content")?.slice(0, 300)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legal pages */}
          {htmlScan.legalPages && Object.keys(htmlScan.legalPages).length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legal Pages</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                {Object.entries(htmlScan.legalPages).map(([page, found]) => (
                  <CheckRow
                    key={page}
                    label={page.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}
                    pass={typeof found === "boolean" ? found : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* W3C Validation */}
          {htmlScan.w3cValidation && (
            <div className="sm:col-span-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> W3C HTML Validation
              </p>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-8 mb-4 flex-wrap">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{htmlScan.w3cValidation.totalMessages ?? 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{htmlScan.w3cValidation.errors ?? 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Errors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">{htmlScan.w3cValidation.warnings ?? 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Warnings</p>
                  </div>
                </div>
                {htmlScan.w3cValidation.errorDetails && htmlScan.w3cValidation.errorDetails.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium mb-1.5">First 10 errors:</p>
                    <div className="space-y-1 max-h-40 overflow-auto">
                      {htmlScan.w3cValidation.errorDetails.slice(0, 10).map((detail, i) => (
                        <p key={i} className="text-xs text-gray-600 font-mono leading-snug truncate" title={detail}>
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Link Check */}
          {htmlScan.linkCheck && (
            <div className="sm:col-span-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" /> Link Check
              </p>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-8 mb-4 flex-wrap">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{htmlScan.linkCheck.total ?? 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Checked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{htmlScan.linkCheck.successful ?? 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">OK</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{htmlScan.linkCheck.failed ?? 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Failed</p>
                  </div>
                  {(htmlScan.linkCheck.timeouts ?? 0) > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{htmlScan.linkCheck.timeouts}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Timeouts</p>
                    </div>
                  )}
                </div>
                {htmlScan.linkCheck.brokenLinks && Object.keys(htmlScan.linkCheck.brokenLinks).length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium mb-1.5">Broken links:</p>
                    <div className="space-y-1 max-h-48 overflow-auto">
                      {Object.entries(htmlScan.linkCheck.brokenLinks).flatMap(([, links]) =>
                        links.map((link, i) => (
                          <div key={`${link.url}-${i}`} className="flex items-start gap-2">
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                              {link.status.code}
                            </span>
                            <span className="text-xs text-gray-600 font-mono truncate" title={link.url}>{link.url}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scan errors */}
          {htmlScan.scanErrors && htmlScan.scanErrors.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Scan Errors</p>
              <div className="space-y-1">
                {htmlScan.scanErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {err}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ═══════════════════════════════════════════════════════════ ──────────────
// ─── TAB: CITATIONS ───────────────────────────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════ ──────────────

function CitationsTab({ citationStats }: { citationStats: CitationStats }) {
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-5 text-center">
          <p className={`text-3xl font-bold ${citationStats.totalCitations > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {citationStats.totalCitations}
          </p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Total Citations</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5 text-center">
          <p className={`text-3xl font-bold ${citationStats.uniqueUrls > 0 ? "text-blue-600" : "text-gray-400"}`}>
            {citationStats.uniqueUrls}
          </p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Unique URLs cited</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5 text-center">
          <p className={`text-3xl font-bold ${citationStats.targetCitationRate > 0 ? "text-purple-600" : "text-gray-400"}`}>
            {Math.round(citationStats.targetCitationRate * 100)}%
          </p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Citation Rate</p>
        </div>
      </div>

      {citationStats.topDomains.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Cited Domains</p>
          <div className="flex flex-wrap gap-1.5">
            {citationStats.topDomains.map((d) => (
              <span key={d} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-mono">{d}</span>
            ))}
          </div>
        </div>
      )}

      {Object.keys(citationStats.byEngine).length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">By AI Engine</p>
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Engine</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Citations</th>
                  <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(citationStats.byEngine).map(([engine, data]) => (
                  <tr key={engine} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-gray-700 capitalize">{engine.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{data.totalCitations}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">{Math.round(data.targetCitationRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ═══════════════════════════════════════════════════════════ ──────────────
// ─── TAB: PERFORMANCE ─────────────────────────────────────────────────────────
// ─── ═══════════════════════════════════════════════════════════ ──────────────

function PerformanceTab({
  categoryScores,
  levelScores,
}: {
  categoryScores: Record<string, CategoryScore>;
  levelScores: Record<string, LevelScore>;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Category Scores */}
      {Object.keys(categoryScores).length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">By Query Category</p>
          {Object.entries(categoryScores)
            .sort(([, a], [, b]) => b.score - a.score)
            .map(([cat, data]) => {
              const meta = CATEGORY_META[cat] ?? { label: cat, bar: "bg-gray-400", pill: "bg-gray-50 text-gray-700" };
              const scorePct = pct(data.score);
              const mentionPct = pct(data.avgMentionRate);
              return (
                <div key={cat} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.pill}`}>{meta.label}</span>
                      <span className="text-[11px] text-gray-400">{data.promptCount} prompts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-400">{mentionPct}% mentioned</span>
                      <span className={`text-sm font-bold tabular-nums ${scoreTextClass(scorePct)}`}>{scorePct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${meta.bar} rounded-full`} style={{ width: `${scorePct}%` }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Level Scores */}
      {Object.keys(levelScores).length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">By Specificity Level</p>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            L1 = broad queries, L5 = cited by name only. Lower discovery level = broader visibility.
          </p>
          {[1, 2, 3, 4, 5].map((l) => {
            const key = `level${l}`;
            const data = levelScores[key];
            if (!data) return null;
            const barClass = LEVEL_COLORS[l - 1];
            const textClass = LEVEL_TEXT[l - 1];
            const scorePct = pct(data.score);
            const mentionPct = pct(data.avgMentionRate);
            return (
              <div key={key} className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold tabular-nums ${textClass}`}>L{l}</span>
                    <span className="text-sm text-gray-600">{LEVEL_LABELS[l]}</span>
                    <span className="text-[11px] text-gray-400">{data.promptCount} prompts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">{mentionPct}% mentioned</span>
                    <span className={`text-sm font-bold tabular-nums ${textClass}`}>{scorePct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barClass} rounded-full`} style={{ width: `${scorePct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = "prompts" | "html" | "citations" | "performance";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeepDiveProps {
  promptResults: PromptResult[];
  htmlScan: HtmlScan | null;
  citationStats: CitationStats | null;
  categoryScores: Record<string, CategoryScore>;
  levelScores: Record<string, LevelScore>;
  engines: string[];
  htmlScore: number | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DeepDive({
  promptResults, htmlScan, citationStats,
  categoryScores, levelScores, engines, htmlScore,
}: DeepDiveProps) {
  const [activeTab, setActiveTab] = useState<TabId>("prompts");

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: string }[] = [
    {
      id: "prompts",
      label: "AI Prompts",
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      count: promptResults.length > 0 ? `${promptResults.length}` : undefined,
    },
    {
      id: "html",
      label: "HTML Scan",
      icon: <FileSearch className="w-3.5 h-3.5" />,
      count: htmlScore != null ? `${Math.round(htmlScore)}%` : undefined,
    },
    {
      id: "citations",
      label: "Citations",
      icon: <BookOpen className="w-3.5 h-3.5" />,
      count: citationStats ? `${citationStats.totalCitations}` : undefined,
    },
    {
      id: "performance",
      label: "Performance",
      icon: <Target className="w-3.5 h-3.5" />,
    },
  ];

  const hasAnyContent =
    promptResults.length > 0 ||
    htmlScan != null ||
    citationStats != null ||
    Object.keys(categoryScores).length > 0;

  if (!hasAnyContent) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div>
          <h2 className="text-xl font-heading font-semibold text-gray-900">Deep Dive</h2>
          <p className="text-sm text-gray-500 mt-0.5">Full audit data for technical review</p>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-t-lg border-b-2 -mb-px transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900 bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count != null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "prompts" && <PromptsTab promptResults={promptResults} engines={engines} />}
          {activeTab === "html" && htmlScan && <HtmlScanTab htmlScan={htmlScan} />}
          {activeTab === "html" && !htmlScan && <p className="text-sm text-gray-400">No HTML scan data available.</p>}
          {activeTab === "citations" && citationStats && <CitationsTab citationStats={citationStats} />}
          {activeTab === "citations" && !citationStats && <p className="text-sm text-gray-400">No citation data available.</p>}
          {activeTab === "performance" && <PerformanceTab categoryScores={categoryScores} levelScores={levelScores} />}
        </div>
      </div>
    </div>
  );
}
