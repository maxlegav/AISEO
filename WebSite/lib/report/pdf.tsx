/**
 * Server-side PDF export of a project report.
 *
 * Deliberately *not* a screenshot of the web report: `window.print()` already
 * covers that, and a rasterised page is heavy and ugly at any zoom. This draws a
 * real vector PDF with @react-pdf/renderer, so it stays sharp, selectable and
 * small enough to email to a client — which is the point of the agency plan.
 *
 * It carries the same `ReportBranding` as the web report (agency logo/colour on
 * the Agence plan, SYB otherwise), so both exports stay consistent.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Project } from "@/lib/mock/monitoring";
import { LLMS, LLM_ORDER } from "@/lib/mock/monitoring";
import type { ReportBranding } from "@/lib/monitoring/branding";

const GREY = "#6b7280";
const LIGHT = "#e5e7eb";
const INK = "#111827";

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, fontSize: 10, color: INK },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 16, color: "#ffffff", fontWeight: 700 },
  headerSub: { fontSize: 9, color: "#ffffff", opacity: 0.85, marginTop: 3 },
  headerRight: { fontSize: 9, color: "#ffffff", opacity: 0.85, textAlign: "right" },

  section: { marginBottom: 18 },
  h2: { fontSize: 12, fontWeight: 700, marginBottom: 8 },
  muted: { color: GREY, fontSize: 9 },

  scoreRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  scoreBox: {
    width: 96,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 16,
  },
  scoreValue: { fontSize: 26, fontWeight: 700, color: "#ffffff" },
  scoreUnit: { fontSize: 8, color: "#ffffff", opacity: 0.85 },

  row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  label: { width: 110, fontSize: 9 },
  barTrack: { flex: 1, height: 6, backgroundColor: LIGHT, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  value: { width: 34, fontSize: 9, textAlign: "right" },

  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LIGHT, paddingBottom: 4, marginBottom: 4 },
  thText: { fontSize: 8, color: GREY, textTransform: "uppercase" },
  td: { flexDirection: "row", paddingVertical: 3 },

  action: {
    borderLeftWidth: 2,
    paddingLeft: 8,
    marginBottom: 8,
  },
  actionTitle: { fontSize: 10, fontWeight: 700, marginBottom: 2 },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: LIGHT,
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: GREY },
});

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

interface ReportPdfProps {
  project: Project;
  branding: ReportBranding;
  generatedAt: string;
}

function ReportPdf({ project, branding, generatedAt }: ReportPdfProps) {
  const accent = branding.primaryColor;
  const competitors = [...project.competitorTable].sort((a, b) => b.global - a.global);
  const actions = (project.actionPlan ?? []).slice(0, 6);
  const sources = project.sources.slice(0, 8);

  return (
    <Document
      title={`Rapport GEO — ${project.brandName}`}
      author={branding.name}
      subject={`Visibilité de ${project.brandName} dans les réponses des IA`}
    >
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { backgroundColor: accent }]}>
          <View>
            <Text style={styles.headerTitle}>Rapport de visibilité IA</Text>
            <Text style={styles.headerSub}>
              {project.brandName} · {project.websiteUrl}
            </Text>
          </View>
          <View>
            <Text style={styles.headerRight}>{branding.name}</Text>
            <Text style={styles.headerRight}>{generatedAt}</Text>
          </View>
        </View>

        {/* --- score ------------------------------------------------------ */}
        <View style={styles.section}>
          <Text style={styles.h2}>Score global</Text>
          <View style={styles.scoreRow}>
            <View style={[styles.scoreBox, { backgroundColor: accent }]}>
              <Text style={styles.scoreValue}>{project.globalScore}</Text>
              <Text style={styles.scoreUnit}>/ 100</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ marginBottom: 4 }}>
                {project.globalDelta > 0
                  ? `En hausse de ${project.globalDelta} points sur 7 jours.`
                  : project.globalDelta < 0
                    ? `En baisse de ${Math.abs(project.globalDelta)} points sur 7 jours.`
                    : "Stable sur 7 jours."}
              </Text>
              <Text style={styles.muted}>
                Part des {project.prompts} questions suivies où {project.brandName} est
                cité, pondérée par l&apos;usage de chaque moteur. Suivi{" "}
                {project.frequency.toLowerCase()} sur {project.llmScores.length} moteurs.
              </Text>
            </View>
          </View>
        </View>

        {/* --- per engine ------------------------------------------------- */}
        <View style={styles.section}>
          <Text style={styles.h2}>Présence par moteur</Text>
          {LLM_ORDER.filter((id) => project.llmScores.some((s) => s.llm === id)).map((id) => {
            const score = project.llmScores.find((s) => s.llm === id);
            if (!score) return null;
            return (
              <View key={id} style={styles.row}>
                <Text style={styles.label}>{LLMS[id].name}</Text>
                <Bar value={score.presenceRate} color={LLMS[id].color} />
                <Text style={styles.value}>{score.presenceRate}%</Text>
              </View>
            );
          })}
        </View>

        {/* --- competitors ------------------------------------------------ */}
        <View style={styles.section}>
          <Text style={styles.h2}>Vous face à vos concurrents</Text>
          <View style={styles.th}>
            <Text style={[styles.thText, { flex: 1 }]}>Marque</Text>
            <Text style={[styles.thText, { width: 60, textAlign: "right" }]}>Score</Text>
            <Text style={[styles.thText, { width: 60, textAlign: "right" }]}>7 jours</Text>
          </View>
          {competitors.map((c) => (
            <View key={c.name} style={styles.td}>
              <Text style={{ flex: 1, fontWeight: c.isYou ? 700 : 400 }}>
                {c.name}
                {c.isYou ? " (vous)" : ""}
              </Text>
              <Text style={{ width: 60, textAlign: "right" }}>{c.global}</Text>
              <Text style={{ width: 60, textAlign: "right", color: GREY }}>
                {c.trend > 0 ? `+${c.trend}` : c.trend}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {project.brandName} · Rapport de visibilité IA
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>

      {/* --- actions + sources -------------------------------------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.h2}>Plan d&apos;action</Text>
          {actions.length === 0 ? (
            <Text style={styles.muted}>
              Aucune action prioritaire identifiée sur cette période.
            </Text>
          ) : (
            actions.map((a) => (
              <View key={a.id} style={[styles.action, { borderLeftColor: accent }]}>
                <Text style={styles.actionTitle}>{a.title}</Text>
                <Text style={styles.muted}>{a.detail}</Text>
                <Text style={[styles.muted, { marginTop: 2 }]}>
                  Impact estimé {a.impact} pts · effort {a.effort.toLowerCase()} ·{" "}
                  {a.engines.map((e) => LLMS[e].name).join(", ")}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Sources citées par les moteurs</Text>
          {sources.length === 0 ? (
            <Text style={styles.muted}>Aucune source citée sur cette période.</Text>
          ) : (
            <>
              <View style={styles.th}>
                <Text style={[styles.thText, { flex: 1 }]}>Domaine</Text>
                <Text style={[styles.thText, { width: 70, textAlign: "right" }]}>Citations</Text>
                <Text style={[styles.thText, { width: 80, textAlign: "right" }]}>Vous cite</Text>
              </View>
              {sources.map((s) => (
                <View key={s.url} style={styles.td}>
                  <Text style={{ flex: 1 }}>{s.domain}</Text>
                  <Text style={{ width: 70, textAlign: "right" }}>{s.citations}</Text>
                  <Text style={{ width: 80, textAlign: "right", color: GREY }}>
                    {s.citesBrand ? "oui" : "non"}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {branding.whiteLabel ? branding.name : "Généré par ShowYourBrand"}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

/** Render the report to a PDF buffer, ready to stream as an attachment. */
export function renderReportPdf(props: ReportPdfProps): Promise<Buffer> {
  return renderToBuffer(<ReportPdf {...props} />);
}

/** `rapport-geo-bioburger-2026-07-28.pdf` */
export function reportFileName(brandName: string, date = new Date()): string {
  const slug = brandName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `rapport-geo-${slug || "projet"}-${date.toISOString().slice(0, 10)}.pdf`;
}
