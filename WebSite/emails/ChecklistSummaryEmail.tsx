import * as React from "react";
import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Preview, Button,
} from "@react-email/components";

interface ChecklistIssue {
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  done: boolean;
}

interface Props {
  userName: string;
  businessName: string;
  geoScore: number;
  doneItems: ChecklistIssue[];
  pendingItems: ChecklistIssue[];
  auditUrl: string;
  language?: "en" | "fr";
}

const severityLabel: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
};

const ChecklistSummaryEmail: React.FC<Props> = ({
  userName,
  businessName,
  geoScore,
  doneItems,
  pendingItems,
  auditUrl,
  language = "fr",
}) => {
  const c = language === "fr"
    ? {
        preview: `Bilan de vos actions GEO — ${businessName}`,
        title: "Bilan de vos actions GEO",
        greeting: `Bonjour ${userName},`,
        intro: `Il y a 15 jours, vous avez reçu votre audit GEO pour **${businessName}** (score : ${geoScore}/100). Voici un résumé de ce que vous avez accompli — et ce qu'il reste à faire.`,
        doneTitle: "✅ Actions effectuées",
        noDone: "Aucune action cochée pour le moment.",
        pendingTitle: "⏳ Actions encore à faire",
        noPending: "Bravo ! Vous avez traité tous les problèmes détectés.",
        ctaText: "Revoir mon plan d'action →",
        nextAudit: "🔄 Votre prochain audit mensuel se lancera automatiquement dans quelques jours — les nouvelles recommandations tiendront compte de ce que vous avez déjà traité.",
        footer: "Vous recevez cet email car vous êtes abonné au plan Pro ShowYourBrand.",
      }
    : {
        preview: `GEO Action Progress Summary — ${businessName}`,
        title: "GEO Action Progress Summary",
        greeting: `Hello ${userName},`,
        intro: `15 days ago, you received your GEO audit for **${businessName}** (score: ${geoScore}/100). Here's a summary of what you've accomplished — and what's still pending.`,
        doneTitle: "✅ Completed actions",
        noDone: "No actions checked yet.",
        pendingTitle: "⏳ Actions still pending",
        noPending: "Great work! You've addressed all detected issues.",
        ctaText: "Review my action plan →",
        nextAudit: "🔄 Your next monthly audit will launch automatically in a few days — new recommendations will take into account what you've already fixed.",
        footer: "You're receiving this because you're subscribed to the ShowYourBrand Pro plan.",
      };

  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ backgroundColor: "#f8f9fa", fontFamily: "sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb" }}>
          {/* Header */}
          <Section style={{ backgroundColor: "#7c3aed", padding: "32px 40px" }}>
            <Heading style={{ color: "#ffffff", margin: 0, fontSize: 22, fontWeight: 700 }}>
              ShowYourBrand
            </Heading>
            <Text style={{ color: "#c4b5fd", margin: "4px 0 0", fontSize: 13 }}>
              {c.title}
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: "32px 40px" }}>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: "24px" }}>
              {c.greeting}
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: "24px" }}>
              {c.intro}
            </Text>

            {/* Score badge */}
            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <span style={{
                display: "inline-block",
                backgroundColor: geoScore >= 70 ? "#d1fae5" : geoScore >= 40 ? "#fef3c7" : "#fee2e2",
                color: geoScore >= 70 ? "#065f46" : geoScore >= 40 ? "#92400e" : "#991b1b",
                borderRadius: 50,
                padding: "8px 24px",
                fontWeight: 700,
                fontSize: 18,
              }}>
                GEO Score : {geoScore}/100
              </span>
            </div>

            {/* Done items */}
            <Text style={{ fontWeight: 700, color: "#065f46", fontSize: 14, marginBottom: 8 }}>
              {c.doneTitle} ({doneItems.length})
            </Text>
            {doneItems.length === 0 ? (
              <Text style={{ color: "#9ca3af", fontSize: 13, fontStyle: "italic" }}>{c.noDone}</Text>
            ) : (
              <div style={{ backgroundColor: "#f0fdf4", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                {doneItems.map((item, i) => (
                  <Text key={i} style={{ margin: "4px 0", fontSize: 13, color: "#374151", textDecoration: "line-through" }}>
                    {severityLabel[item.severity]} {item.title}
                  </Text>
                ))}
              </div>
            )}

            {/* Pending items */}
            <Text style={{ fontWeight: 700, color: "#92400e", fontSize: 14, marginBottom: 8 }}>
              {c.pendingTitle} ({pendingItems.length})
            </Text>
            {pendingItems.length === 0 ? (
              <Text style={{ color: "#065f46", fontSize: 13, fontStyle: "italic" }}>{c.noPending}</Text>
            ) : (
              <div style={{ backgroundColor: "#fffbeb", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                {pendingItems.map((item, i) => (
                  <Text key={i} style={{ margin: "4px 0", fontSize: 13, color: "#374151" }}>
                    {severityLabel[item.severity]} {item.title}
                  </Text>
                ))}
              </div>
            )}

            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <Button
                href={auditUrl}
                style={{ backgroundColor: "#7c3aed", color: "#ffffff", padding: "14px 32px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-block" }}
              >
                {c.ctaText}
              </Button>
            </div>

            <Text style={{ backgroundColor: "#eff6ff", borderRadius: 8, padding: "12px 16px", color: "#1e40af", fontSize: 13, lineHeight: "20px" }}>
              {c.nextAudit}
            </Text>
          </Section>

          <Hr style={{ borderColor: "#e5e7eb" }} />
          <Section style={{ padding: "16px 40px" }}>
            <Text style={{ color: "#9ca3af", fontSize: 12 }}>{c.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ChecklistSummaryEmail;
