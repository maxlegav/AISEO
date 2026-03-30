import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Preview,
  Button,
} from "@react-email/components";

interface AuditStartedClientEmailProps {
  userName: string;
  businessName: string;
  businessUrl: string;
  language?: "en" | "fr";
}

const AuditStartedClientEmail: React.FC<AuditStartedClientEmailProps> = ({
  userName,
  businessName,
  businessUrl,
  language = "fr",
}) => {
  const baseUrl =
    process.env.NEXTAUTH_URL || "https://showyourbrand.app";

  const c =
    language === "fr"
      ? {
          preview: `Votre audit GEO a démarré pour ${businessName}`,
          title: "Votre audit GEO est en cours !",
          greeting: `Bonjour ${userName},`,
          intro: `Nous avons bien reçu votre demande d'audit GEO pour **${businessName}** (${businessUrl}).`,
          whatHappens: "Que se passe-t-il maintenant ?",
          step1: "Génération des 100 prompts IA adaptés à votre secteur",
          step2: "Validation des prompts par notre équipe",
          step3:
            "Exécution sur 4 moteurs IA : ChatGPT, Claude, Perplexity, DeepSeek",
          step4:
            "Analyse des résultats et génération de votre rapport personnalisé",
          eta: "Vous recevrez un email dès que votre rapport est prêt. Ce processus peut prendre quelques heures.",
          ctaText: "Suivre mon audit →",
          support:
            "Des questions ? Répondez directement à cet email, nous lisons tout.",
          sig: "L'équipe ShowYourBrand",
        }
      : {
          preview: `Your GEO audit has started for ${businessName}`,
          title: "Your GEO audit is underway!",
          greeting: `Hello ${userName},`,
          intro: `We've received your GEO audit request for **${businessName}** (${businessUrl}).`,
          whatHappens: "What happens next?",
          step1: "Generation of 100 AI prompts tailored to your industry",
          step2: "Prompt review by our team",
          step3:
            "Execution across 4 AI engines: ChatGPT, Claude, Perplexity, DeepSeek",
          step4: "Analysis of results and generation of your personalized report",
          eta: "You'll receive an email as soon as your report is ready. This process may take a few hours.",
          ctaText: "Track my audit →",
          support: "Questions? Just reply to this email — we read every message.",
          sig: "The ShowYourBrand Team",
        };

  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerBanner}>
            <Text style={brandName}>ShowYourBrand</Text>
            <Text style={brandTagline}>Generative Engine Optimization</Text>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={contentTitle}>{c.title}</Heading>
            <Text style={greeting}>{c.greeting}</Text>
            <Text style={paragraph}>{c.intro}</Text>

            {/* Business info card */}
            <Section style={infoCard}>
              <Text style={infoLabel}>
                {language === "fr" ? "Site audité" : "Site being audited"}
              </Text>
              <Text style={infoValue}>{businessName}</Text>
              <Text style={infoUrl}>{businessUrl}</Text>
            </Section>

            {/* Steps */}
            <Text style={sectionTitle}>{c.whatHappens}</Text>
            <Section style={stepList}>
              {[c.step1, c.step2, c.step3, c.step4].map((step, i) => (
                <Text key={i} style={stepItem}>
                  <span
                    style={
                      i === 0 ? stepNumberActive : stepNumber
                    }
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>{" "}
                  {step}
                </Text>
              ))}
            </Section>

            <Text style={etaText}>{c.eta}</Text>

            <Section style={ctaSection}>
              <Button href={`${baseUrl}/dashboard`} style={ctaButton}>
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

export default AuditStartedClientEmail;

// ─── Styles ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f8f8f8",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
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

const infoCard = {
  backgroundColor: "#f5f3ff",
  border: "1px solid #ddd6fe",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const infoLabel = {
  color: "#7c3aed",
  fontSize: "10px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  margin: "0 0 4px",
};

const infoValue = {
  color: "#1E293B",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 2px",
};

const infoUrl = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0",
};

const sectionTitle = {
  color: "#1E293B",
  fontSize: "15px",
  fontWeight: "600",
  margin: "4px 0 12px",
};

const stepList = {
  backgroundColor: "#fafafa",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px 20px",
  margin: "0 0 16px",
};

const stepItem = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: "28px",
  margin: "0",
};

const stepNumber = {
  color: "#9ca3af",
  fontWeight: "700" as const,
  marginRight: "8px",
  fontSize: "11px",
};

const stepNumberActive = {
  color: "#7c3aed",
  fontWeight: "700" as const,
  marginRight: "8px",
  fontSize: "11px",
};

const etaText = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  fontStyle: "italic" as const,
  margin: "0 0 24px",
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
