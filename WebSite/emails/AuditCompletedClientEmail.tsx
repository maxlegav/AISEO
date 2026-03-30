import * as React from "react";
import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Preview, Button,
} from "@react-email/components";

interface AuditCompletedClientEmailProps {
  userName: string;
  businessName: string;
  geoScore: number;
  auditUrl: string;
  language?: "en" | "fr";
}

const AuditCompletedClientEmail: React.FC<AuditCompletedClientEmailProps> = ({
  userName,
  businessName,
  geoScore,
  auditUrl,
  language = "fr",
}) => {
  const scoreLabel =
    geoScore >= 70 ? (language === "fr" ? "Bonne visibilité" : "Good visibility")
    : geoScore >= 40 ? (language === "fr" ? "Visibilité modérée" : "Moderate visibility")
    : (language === "fr" ? "Visibilité critique" : "Critical visibility");

  const scoreColor = geoScore >= 70 ? "#10B981" : geoScore >= 40 ? "#F59E0B" : "#EF4444";

  const c = language === "fr"
    ? {
        preview: `Votre audit GEO pour ${businessName} est prêt`,
        title: "Votre rapport GEO est prêt !",
        greeting: `Bonjour ${userName},`,
        intro: `Nous avons terminé l'audit de visibilité IA pour **${businessName}**. Vos résultats sont maintenant disponibles dans votre tableau de bord.`,
        scoreLabel: "Votre GEO Health Score",
        ctaText: "Voir mon rapport complet →",
        whatNext: "Ce que vous trouverez dans votre rapport :",
        f1: "Plan d'action priorisé avec les corrections les plus impactantes",
        f2: "Analyse de visibilité sur 4 moteurs IA (ChatGPT, Claude, Perplexity, DeepSeek)",
        f3: "Snippets prêts à déployer (llms.txt, schema FAQ, HTML GEO)",
        f4: "Comparaison avec vos concurrents",
        support: "Des questions ? Répondez directement à cet email.",
        sig: "L'équipe ShowYourBrand",
      }
    : {
        preview: `Your GEO audit for ${businessName} is ready`,
        title: "Your GEO report is ready!",
        greeting: `Hello ${userName},`,
        intro: `We've completed the AI visibility audit for **${businessName}**. Your results are now available in your dashboard.`,
        scoreLabel: "Your GEO Health Score",
        ctaText: "View my full report →",
        whatNext: "What you'll find in your report:",
        f1: "Prioritized action plan with the highest-impact fixes",
        f2: "Visibility analysis across 4 AI engines (ChatGPT, Claude, Perplexity, DeepSeek)",
        f3: "Ready-to-deploy snippets (llms.txt, FAQ schema, GEO HTML)",
        f4: "Competitor comparison",
        support: "Questions? Just reply to this email.",
        sig: "The ShowYourBrand Team",
      };

  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBanner}>
            <Text style={brandName}>ShowYourBrand</Text>
            <Text style={brandTagline}>Generative Engine Optimization</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={contentTitle}>{c.title}</Heading>
            <Text style={greeting}>{c.greeting}</Text>
            <Text style={paragraph}>{c.intro}</Text>

            {/* Score card */}
            <Section style={scoreCard}>
              <Text style={scoreLabelStyle}>{c.scoreLabel}</Text>
              <Text style={{ ...scoreValue, color: scoreColor }}>{geoScore}/100</Text>
              <Text style={{ ...scoreBadge, color: scoreColor, borderColor: scoreColor }}>
                {scoreLabel}
              </Text>
            </Section>

            <Text style={sectionTitle}>{c.whatNext}</Text>
            <Section style={featureList}>
              {[c.f1, c.f2, c.f3, c.f4].map((f, i) => (
                <Text key={i} style={featureItem}>
                  <span style={featureNumber}>{String(i + 1).padStart(2, "0")}</span> {f}
                </Text>
              ))}
            </Section>

            <Section style={ctaSection}>
              <Button href={auditUrl} style={ctaButton}>
                {c.ctaText}
              </Button>
            </Section>

            <Text style={paragraph}>{c.support}</Text>
            <Text style={signature}>
              {language === "fr" ? "Cordialement," : "Best regards,"}
              <br />
              <strong>{c.sig}</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerBrand}>ShowYourBrand</Text>
            <Text style={footerText}>
              {language === "fr"
                ? "Rendez votre marque visible dans les moteurs de recherche IA"
                : "Make your brand visible in AI search engines"}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AuditCompletedClientEmail;

// ─── Styles ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f8f8f8",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "32px auto",
  borderRadius: "16px",
  overflow: "hidden" as const,
  maxWidth: "600px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
};

const headerBanner = {
  background: "linear-gradient(135deg, #ddd6fe 0%, #fce7f3 55%, #fed7aa 100%)",
  padding: "36px 32px 28px",
  textAlign: "center" as const,
};

const brandName = {
  color: "#1E293B",
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "28px",
  margin: "0 0 4px",
};

const brandTagline = {
  color: "#7c3aed",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0",
};

const contentSection = { padding: "32px 36px 8px" };

const contentTitle = {
  color: "#1E293B",
  fontSize: "26px",
  fontWeight: "700",
  lineHeight: "34px",
  margin: "0 0 16px",
};

const greeting = {
  color: "#1E293B",
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const paragraph = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
};

const scoreCard = {
  backgroundColor: "#fafafa",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const scoreLabelStyle = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  margin: "0 0 8px",
};

const scoreValue = {
  fontSize: "48px",
  fontWeight: "800",
  lineHeight: "1",
  margin: "0 0 8px",
};

const scoreBadge = {
  display: "inline-block",
  fontSize: "12px",
  fontWeight: "600",
  border: "1px solid",
  borderRadius: "20px",
  padding: "3px 12px",
  margin: "0",
};

const sectionTitle = {
  color: "#1E293B",
  fontSize: "15px",
  fontWeight: "600",
  margin: "4px 0 12px",
};

const featureList = {
  backgroundColor: "#f5f3ff",
  padding: "16px 20px",
  borderRadius: "10px",
  border: "1px solid #ddd6fe",
  margin: "0 0 24px",
};

const featureItem = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: "26px",
  margin: "0",
};

const featureNumber = {
  color: "#7c3aed",
  fontWeight: "700" as const,
  marginRight: "8px",
};

const ctaSection = { textAlign: "center" as const, margin: "28px 0" };

const ctaButton = {
  backgroundColor: "#7C3AED",
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "50px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
  display: "inline-block",
};

const signature = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "24px 0 28px",
};

const divider = { borderColor: "#f3f4f6", margin: "0" };

const footer = {
  padding: "20px 36px",
  textAlign: "center" as const,
  backgroundColor: "#fafafa",
  borderTop: "3px solid #ddd6fe",
};

const footerBrand = {
  color: "#1E293B",
  fontSize: "13px",
  fontWeight: "700",
  margin: "0 0 4px",
};

const footerText = {
  color: "#9ca3af",
  fontSize: "11px",
  lineHeight: "16px",
  margin: "0",
};
